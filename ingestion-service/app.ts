import express from "express";
import helmet from "helmet";
import cors from "cors";
import { Producer } from "kafkajs";
//
import { kafka } from "../shared/kafka.js";
import { KafkaRequest } from "./types/kafka.js";
import { centralErrorHandler } from "./middleware/centralErrorHandler.js";
import eventRoutes from "./routes/eventRoutes.js";

interface AppBootstrap {
  app: express.Application;
  producer: Producer;
}

const appConfig = async (): Promise<AppBootstrap> => {
  const app = express();

  app.use(helmet()); // security headers
  app.use(cors()); // frontend requests

  app.use(
    express.json({
      limit: "100kb",
    }),
  ); // json body should be js object

  const producer = kafka.producer();
  await producer.connect();

  // Inject your Kafka producer securely into the Request stream context
  // it is saved inside req, that producer travels with the request to the next rooms.
  //
  // next() tells Express:
  // "I am done updating the tray. Send it down the conveyor belt to the actual route and controller."
  app.use(
    (req: KafkaRequest, res: express.Response, next: express.NextFunction) => {
      req.kafkaProducer = producer;
      next();
    },
  );

  //   Health
  app.get("/heath", (req, res, next) => {
    res.send(200).json({
      status: "UP",
      service: "chart-dashboard-api-ingestion-service",
    });
  });

  // integrate routes
  app.use("/events", eventRoutes);

  // Register global error barrier handling middleware
  app.use(centralErrorHandler);

  return { app, producer };
};

export default appConfig;
