import { Router } from "express";
import { updateProfile } from "../controllers/profileController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.put("/", protect, updateProfile);

export default router;
