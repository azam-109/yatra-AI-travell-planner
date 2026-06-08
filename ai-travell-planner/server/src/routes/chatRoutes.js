import { Router } from "express";
import { createPlan, getChat, listChats } from "../controllers/chatController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", protect, listChats);
router.get("/:id", protect, getChat);
router.post("/plan", protect, createPlan);

export default router;
