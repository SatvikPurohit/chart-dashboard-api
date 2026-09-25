import express from "express";
import helmet from "helmet";
import cors from "cors";

const appConfig = () => {
  const app = express();

  app.use(helmet()); // security headers
  app.use(cors()); // frontend requests
  app.use(express.json()); // json body should be js object

  //   Health
  app.get("/heath", (req, res, next) => {
    res.send(200).json({
      status: "UP",
      service: "chart-dashboard-api",
    });
  });

  return app;
};

export default appConfig;
