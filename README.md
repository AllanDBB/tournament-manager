# Tournament Manager - Taller Docker con Kafka

## Estudiantes
- Allan Bolaños Barrientos
- Alejandro Umaña Miranda
- Brian Ramirez Arias
- Santiago Valverde Alvarez

## Descripción
Sistema de gestión de torneos con arquitectura de microservicios que incluye:
- Frontend: Angular 17 (puerto 80)
- Backend API: Node.js/Express (puerto 3000)
- Base de datos: MongoDB (puerto 27017)
- Mensajería: Apache Kafka + Zookeeper
- Worker: Kafka consumer en Node.js

---

## PARTE 1: Levantar los Componentes

### Prerequisitos
- Docker Desktop instalado y ejecutándose
- MongoDB Shell (mongosh) instalado localmente
- Postman (para testing)

### Paso 1: Crear la Red Docker
```bash
docker network create tournament_net
```

### Paso 2: Levantar el Frontend (UI)
```bash
cd tournament-manager-ui
docker compose up --build -d
```
Acceso: http://localhost:80

### Paso 3: Levantar Kafka + Zookeeper + Worker
```bash
cd ../kafka-worker
docker compose up --build -d
```
Esto levanta:
- Zookeeper (puerto 2181)
- Kafka (puerto 9092)
- Kafka Worker (consumer)

### Paso 4: Levantar API + MongoDB
```bash
cd ../tournament-manager-api
docker compose up --build -d
```
API: http://localhost:3000
MongoDB: localhost:27017

### Paso 5: Verificar que Todo Está Corriendo
```bash
docker ps
```
Deberías ver 6 contenedores activos:
- angular_app
- tournament-designer-api
- tournament-designer-db
- zookeeper
- kafka
- kafka-worker

---

## PARTE 2: Testing según los Requisitos de la Tarea

### Test 1: Verificar Conexión a MongoDB desde tu Computadora

Abrir terminal y conectarse con mongosh:
```bash
mongosh mongodb://localhost:27017/tournament_designer
```

Ejecutar los siguientes comandos:
```javascript
show collections
db.tournaments.find().pretty()
exit
```

**Resultado esperado:** Deberías ver la base de datos y colecciones (puede estar vacía si no has insertado datos aún).

---

### Test 2: Registrar un Torneo usando Postman

#### Paso 2.1: Importar la Colección
1. Abrir Postman
2. Importar el archivo: `docs/Tournament.postman_collection.json`
3. Verás 3 requests disponibles

#### Paso 2.2: Ejecutar "Register Tournament"
1. Seleccionar el request "Register Tournament"
2. Verificar que la URL es: `http://localhost:3000/register`
3. El body ya viene configurado:
```json
{
  "title": "Torneo de Verano",
  "type": "elimination",
  "roster": [
    { "id": 1, "name": "Ana Perez", "weight": 60, "age": 25 },
    { "id": 2, "name": "Juan López", "weight": 75, "age": 28 }
  ]
}
```
4. Click en "Send"

**Resultado esperado:**
```json
{
  "message": "Tournament registered and enqueued to Kafka",
  "tournament": { ... }
}
```

#### Paso 2.3: Ejecutar "Fetch Tournaments"
1. Seleccionar el request "Fetch Tournaments"
2. URL: `http://localhost:3000/fetch-tournaments`
3. Click en "Send"

**Resultado esperado:** Deberías ver el torneo que acabas de registrar en el response.

#### Paso 2.4: Verificar en MongoDB
Volver a mongosh y ejecutar:
```bash
mongosh mongodb://localhost:27017/tournament_designer
```
```javascript
db.tournaments.find().pretty()
```

**Resultado esperado:** Deberías ver el torneo guardado en MongoDB con todos sus datos.

---

### Test 3: Verificar que el Job Desencoló el Mensaje de Kafka

Abrir una nueva terminal y ejecutar:
```bash
docker logs kafka-worker-kafka-worker-1 -f
```

**Resultado esperado:** Deberías ver un mensaje como:
```
Received message: {
  value: '{"title":"Torneo de Verano","type":"elimination","roster":[{"id":88,"name":"Ana ","weight":60,"age":25,"_id":"6915446221822014b056e751"}],"_id":"6915446221822014b056e750","createdAt":"2025-11-13T02:37:22.059Z","updatedAt":"2025-11-13T02:37:22.059Z","__v":0}',
  partition: 0,
  offset: '14'
}
```

**Esto demuestra que:**
1. El endpoint POST /register insertó el torneo en MongoDB
2. El endpoint POST /register encoló el mensaje en Kafka
3. El Job de Node.js (kafka-worker) desencoló el mensaje
4. El Job imprimió el mensaje en consola

---

## Resumen de Funcionalidades Implementadas

### Ya existente del taller anterior:
- Contenedores Docker para UI y API
- Conexión a MongoDB
- Endpoints básicos de CRUD

### Nuevo (lo que se implementó en esta tarea):
- Kafka Infrastructure: Zookeeper + Kafka
- Endpoint POST /register: Inserta en MongoDB Y encola en Kafka
- Kafka Worker: Job en Node.js que desencola e imprime mensajes

---

## Endpoints de la API

La colección de Postman incluye estos 3 endpoints:

1. **Create Tournament** - `POST /upload-data`
   - Carga masiva de torneos (array)

2. **Fetch Tournaments** - `GET /fetch-tournaments`
   - Obtiene todos los torneos

3. **Register Tournament** - `POST /register` (NUEVO)
   - Registra un torneo individual
   - Inserta en MongoDB Y encola en Kafka

---

## Comandos Útiles

### Ver logs de contenedores
```bash
docker logs angular_app
docker logs tournament-designer-api
docker logs kafka-worker-kafka-worker-1 -f
docker logs kafka
```

### Detener todos los servicios
```bash
cd tournament-manager-ui && docker compose down
cd ../kafka-worker && docker compose down
cd ../tournament-manager-api && docker compose down
```

### Limpiar todo (incluyendo volúmenes)
```bash
cd tournament-manager-ui && docker compose down -v
cd ../kafka-worker && docker compose down -v
cd ../tournament-manager-api && docker compose down -v
docker network rm tournament_net
```

---

## Notas Técnicas

- Se usan imágenes `bitnamilegacy/kafka:3.6` y `bitnamilegacy/zookeeper:3.7` porque las versiones recientes de Bitnami no están disponibles en el repositorio público
- Todos los contenedores se comunican a través de la red Docker `tournament_net`
- El Worker de Kafka está configurado para el topic `tournament-events`
