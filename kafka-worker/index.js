import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'tournament-worker',
  brokers: ['kafka:9092'] 
});

const topic = 'tournament-events';
const consumer = kafka.consumer({ groupId: 'tournament-group' });

async function run() {
  await consumer.connect();
  await consumer.subscribe({ topic, fromBeginning: true });

  console.log(`Listening to topic: ${topic}`);

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log({
        value: message.value.toString(),
        partition,
        offset: message.offset
      });
    },
  });
}

run().catch(console.error);
