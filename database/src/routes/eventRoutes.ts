import { Router } from "express";
import { validateEventBody } from "../middleware/validateEvent.js";
import { ingestEvent } from "../controllers/eventController.js";

const router = Router();

router.post("/", validateEventBody, ingestEvent);

export default router;
