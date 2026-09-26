import express, { Router } from "express";
import {
  getErrorChart,
  getPerformanceChart,
  getTrafficChartData,
} from "../controllers/dashboard-chart-controller.js";

const router: Router = express.Router();

// Maps /charts/traffic straight to our clean controller function
// final argument is always controller
router.get("/traffic", getTrafficChartData);
router.get("/errors", getErrorChart); // GET /charts/errors
router.get("/performance", getPerformanceChart); // GET /charts/performance

export default router;
