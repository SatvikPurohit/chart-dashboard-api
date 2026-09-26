// The Ingestion Side (What Kafka Handles)
// Kafka is an exclusive writing highway.
// When thousands of users click around our website, our Express API instantly shoots those logs to Kafka (analytics.raw).
// Kafka safely absorbs those millions of clicks, buffers them, and passes them down to our for example Traffic Worker.
// The Traffic Worker calculates the time-buckets and writes them cleanly into Postgres.
//
// Kafka’s Job: It acts as a safety shield for writes.
// It ensures that a sudden flood of millions of clicks will never crash our Postgres database because
// the worker or Consumer processes them at a controlled speed.
//
// Kafka prevents our database from crashing when too many people are generating data (Writing).
import { Kafka } from "kafkajs";

export const kafka = new Kafka({
  clientId: process.env.SERVICE_NAME ?? "pulse-metrics",

  brokers: [process.env.KAFKA_BROKER ?? "localhost:9092"],

  retry: {
    initialRetryTime: 300,
    retries: 8,
  },
});
