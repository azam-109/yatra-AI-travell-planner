import crypto from "node:crypto";
import Chat from "../models/Chat.js";
import Trip from "../models/Trip.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// POST /api/trips — called by TripFormPage before graph runs
export const createTripFromForm = asyncHandler(async (req, res) => {
  const {
    origin, destination,
    departureDate, returnDate, durationDays,
    budget, budgetTier, travelers, travelStyle,
    interests, hotelType, flightClass,
    preferredAirlines, hotelRating, dietary, specialRequirements
  } = req.body;

  if (!destination) throw new ApiError(400, "destination is required");
  if (!origin)      throw new ApiError(400, "origin is required");

  // 1. Create the Chat session first
  const chat = await Chat.create({
    userId: req.user._id,
    title:  `${origin} → ${destination}`
  });

  const budgetNumber = Number(budget);

  // 2. Create the Trip record with full tripSpec
  //    finalResponse is empty — agents fill it in later via socket
  const trip = await Trip.create({
    userId:      req.user._id,
    chatId:      chat._id,
    destination,
    budget:Number.isFinite(budgetNumber) && budgetNumber > 0
    ? `₹${budgetNumber.toLocaleString("en-IN")}`
    : "Flexible",
    tripSpec: {
      origin,
      destination,
      departureDate:       departureDate       || undefined,
      returnDate:          returnDate           || undefined,
      durationDays:        durationDays         ? Number(durationDays)  : undefined,
      budget:              budget               ? Number(budget)        : undefined,
      budgetTier:          budgetTier           || "mid-range",
      travelers:           travelers            ? Number(travelers)     : 1,
      travelStyle:         travelStyle          || "solo",
      interests:           Array.isArray(interests) ? interests : [],
      hotelType:           hotelType            || undefined,
      flightClass:         flightClass          || "economy",
      preferredAirlines:   Array.isArray(preferredAirlines) ? preferredAirlines : [],
      hotelRating:         hotelRating          ? Number(hotelRating)   : undefined,
      dietary:             dietary              || undefined,
      specialRequirements: specialRequirements  || undefined
    }
  });

  // 3. Link the chat back to the trip
  await Chat.findByIdAndUpdate(chat._id, { tripId: trip._id });

  res.status(201).json({ trip, chatId: chat._id });
});

// GET /api/trips
export const listTrips = asyncHandler(async (req, res) => {
  const trips = await Trip.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.json({ trips });
});

// GET /api/trips/:id
export const getTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.findOne({ _id: req.params.id, userId: req.user._id });
  if (!trip) throw new ApiError(404, "Trip not found");
  res.json({ trip });
});

// DELETE /api/trips/:id
export const deleteTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!trip) throw new ApiError(404, "Trip not found");
  res.status(204).send();
});

// POST /api/trips/:id/share
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

// GET /api/trips/shared/:shareId
export const getSharedTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.findOne({ shareId: req.params.shareId });
  if (!trip) throw new ApiError(404, "Shared trip not found");
  res.json({ trip });
});