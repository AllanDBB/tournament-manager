### Iniciar una red para los contenedores de docker:

```bash
docker network create tournament_net
```

### Iniciar la build de los contenedores. (Encender en este orden)
UI:
```bash
cd ./tournament-manager-ui
docker compose up --build -d
```

KAFKA:
```bash
cd ./kafka-worker
docker compose up --build -d
```

API:
```bash
cd ./tournament-manager-api
docker compose up --build -d
```


### Comprobar conexión a Mongo
```
docker exec -it tournament-designer-db mongosh
show databases
use tournament_designer
show collections
```

### Cargar data con postman 
Importe el `docs\Tournament.postman_collection.json` en postman; luego ejecute el query de Post "Create Tournament".
Puede verificarlo al usar el query de Get, "Fetch Tournaments".


### Registrar torneo con Kafka

Además de insertar directo en Mongo, puedes encolar un torneo en Kafka usando el endpoint /register.

En Postman, crea una nueva petición:
```bash
POST http://localhost:3000/register
```

En el Body, raw → JSON y envía un torneo con este formato:
```json
{
  "title": "Torneo de Verano",
  "type": "elimination",
  "roster": [
    { "id": 1, "name": "Jugador 1", "weight": 70, "age": 25 },
    { "id": 2, "name": "Jugador 2", "weight": 80, "age": 28 }
  ]
}

```



### Contenedores

- **zookeeper:3.7**: Zookeeper es un servicio necesario para Kafka. Se encarga de la configuración, coordinación y estado de los brokers y topics de Kafka.

- **bitnami/kafka:latest**: Este es el broker de Kafka, el sistema de colas de mensajes. La imagen de Bitnami es una versión popular y fácil de usar de Kafka para Docker.

- **kafka-worker-kafka-worker**: Es tu worker en Node.js (consumidor). Lee los mensajes de Kafka y los imprime en la consola.

- **tournament-manager-api-api**: Tu API en Node.js, que produce mensajes para Kafka y gestiona los torneos en MongoDB.**

- **mongo:6.0**: La base de datos MongoDB donde se almacenan los torneos.

- **tournament-manager-ui-angular-app**: La aplicación Angular para la interfaz de usuario.
