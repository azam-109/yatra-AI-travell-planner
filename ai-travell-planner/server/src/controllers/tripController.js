import crypto from "node:crypto";
import Trip from "../models/Trip.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listTrips = asyncHandler(async (req, res) => {
  const trips = await Trip.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.json({ trips });
});

export const getTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.findOne({ _id: req.params.id, userId: req.user._id });
  if (!trip) throw new ApiError(404, "Trip not found");
  res.json({ trip });
});

export const deleteTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!trip) throw new ApiError(404, "Trip not found");
  res.status(204).send();
});

export const shareTrip = asyncHandler(async (req, res) => {
  const shareId = crypto.randomBytes(10).toString("hex");
  const trip = await Trip.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { shareId },
    { new: true }
  );
  if (!trip) throw new ApiError(404, "Trip not found");
  res.json({ shareUrl: `/share/${shareId}`, trip });
});

export const getSharedTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.findOne({ shareId: req.params.shareId });
  if (!trip) throw new ApiError(404, "Shared trip not found");
  res.json({ trip });
});
