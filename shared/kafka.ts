import { Kafka } from "kafkajs";

export const kafka = new Kafka({
  clientId: process.env.SERVICE_NAME ?? "pulse-metrics",

  brokers: [process.env.KAFKA_BROKER ?? "localhost:9092"],

  retry: {
    initialRetryTime: 300,
    retries: 8,
  },
});
