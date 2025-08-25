
import { Kafka } from 'kafkajs';
import express from "express";
import mongoose, { model, Schema } from "mongoose";

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tournament_designer';


// Configure Kafka producer
const kafka = new Kafka({
  clientId: 'tournament-api',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
});
const producer = kafka.producer();
const KAFKA_TOPIC = 'tournament-events';
producer.connect().catch(console.error);

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Authorization');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Pass to next layer of middleware
    next();
});

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ Conectado a MongoDB"))
  .catch((err) => console.error("❌ Error conectando a MongoDB:", err));


const tournamentSchema = new Schema(
  {
    title: { type: String, required: true },
    type: { type: String, required: true },
    roster: [{
      id: { type: Number, required: true },
      name: { type: String, required: true },
      weight: { type: Number, required: true },
      age: { type: Number, required: true },
    }]
  },
  { timestamps: true }
);

const Tournament = model("Tournament", tournamentSchema);

app.post('/upload-data', async (req, res) => {
  const data = req.body;
  // Here you would handle the data upload logic
  console.log("Data received:", data);

  await Tournament.insertMany(req.body);
  res.status(201).json({ message: `Inserted ${req.body.length} tournaments!` });
});

app.get('/fetch-tournaments', async (req, res) => {
  const tournaments = await Tournament.find();
  res.status(200).json(tournaments);
});

app.get("/", (req, res) => {
  res.json({ message: "Tournament Designer API is running!" });
});


// Connect Kafka producer when app starts
app.post('/register', async (req, res) => {
  try {
    // Insert tournament in MongoDB
    const tournament = await Tournament.create(req.body);

    // Send tournament to Kafka
    await producer.send({
      topic: KAFKA_TOPIC,
      messages: [
        { value: JSON.stringify(tournament) }
      ]
    });

    res.status(201).json({ message: 'Tournament registered and enqueued to Kafka', tournament });
  } catch (error) {
    console.error('Error in /register:', error);
    res.status(500).json({ error: 'Failed to register tournament or enqueue to Kafka' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
