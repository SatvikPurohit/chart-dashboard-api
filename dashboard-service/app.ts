import express from "express";
import helmet from "helmet";
import cors from "cors";

import chartRoutes from "./routes/dashboard-route.js";

interface AppBootstrap {
  app: express.Application;
}

const appConfig = async (): Promise<AppBootstrap> => {
  const app = express();

  app.use(helmet()); // security headers
  app.use(cors()); // frontend requests
  app.use(express.json()); // json body should be js object

  app.use("/charts", chartRoutes);

  app.use(
    (
      error: any,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      console.error("System Failure Logged: ", error);
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
    },
  );

  //   Health
  app.get("/heath", (req, res, next) => {
    res.send(200).json({
      status: "UP",
      service: "chart-dashboard-api",
    });
  });

  return { app };
};

export default appConfig;
