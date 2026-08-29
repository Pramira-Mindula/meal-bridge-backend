import express from "express";

import authMiddleware from "../Middlewares/authMiddleware.js";
import requireRole from "../Middlewares/roleMiddleware.js";

import {
    getAvailableDeliveries,
    claimDelivery,
    getDeliveryById,
    confirmPickup,
    startTransit,
    confirmDelivery,
    getDeliveryHistory,
    getVolunteerSummary
} from "../Controllers/volunteerController.js";


const router = express.Router();

// All volunteer routes require a valid JWT + VOLUNTEER role.
// authMiddleware runs first (populates req.user),
// then requireRole("VOLUNTEER") checks req.user.role.

const protect = [authMiddleware, requireRole("VOLUNTEER")];


// ============================================================
// SPECIFIC / NAMED ROUTES — must come before /:id routes
// ============================================================

// GET /api/volunteer/deliveries/available
router.get("/deliveries/available", ...protect, getAvailableDeliveries);

// GET /api/volunteer/deliveries/history
router.get("/deliveries/history", ...protect, getDeliveryHistory);

// GET /api/volunteer/summary
router.get("/summary", ...protect, getVolunteerSummary);


// ============================================================
// PARAMETERISED ROUTES — keep :id after named routes
// ============================================================

// GET /api/volunteer/deliveries/:id
router.get("/deliveries/:id", ...protect, getDeliveryById);

// PUT /api/volunteer/deliveries/:id/claim
router.put("/deliveries/:id/claim", ...protect, claimDelivery);

// PUT /api/volunteer/deliveries/:id/pickup
router.put("/deliveries/:id/pickup", ...protect, confirmPickup);

// PUT /api/volunteer/deliveries/:id/transit
router.put("/deliveries/:id/transit", ...protect, startTransit);

// PUT /api/volunteer/deliveries/:id/delivered
router.put("/deliveries/:id/delivered", ...protect, confirmDelivery);


export default router;