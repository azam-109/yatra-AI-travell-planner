import { Router } from "express";
import {
  createTripFromForm,
  deleteTrip,
  getSharedTrip,
  getTrip,
  listTrips,
  shareTrip
} from "../controllers/tripController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/shared/:shareId", getSharedTrip);       // public
router.post("/",           protect, createTripFromForm); // ← NEW — form submission
router.get("/",            protect, listTrips);
router.get("/:id",         protect, getTrip);
router.delete("/:id",      protect, deleteTrip);
router.post("/:id/share",  protect, shareTrip);

export default router;