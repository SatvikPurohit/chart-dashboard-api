import express from "express";
import { getTrafficChartData } from "../controllers/dashboard-chart-controller.js";

const router = express.Router();

// Maps /charts/traffic straight to our clean controller function
// final argument is always controller
router.get("/traffic", getTrafficChartData);

export default router;
