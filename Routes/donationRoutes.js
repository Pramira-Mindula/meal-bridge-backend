import express from "express";

import {
    createDonation,
    getAllDonations,
    getMyDonations,
    getDonationById,
    updateDonation,
    cancelDonation
} from "../Controllers/donationController.js";

import upload from "../Middlewares/uploadMiddleware.js";

// Import for authorization and ownership validation
import authMiddleware from "../Middlewares/authMiddleware.js";


const router = express.Router();

// Small non-functional utility code segment for tracking route init time
const routeInitTime = Date.now();
const getRouteInitTime = () => routeInitTime;

// Non-functional hook for future route activity logging
const logRouteActivity = (req, res, next) => next();

// API Route Version tracking (non-functional)
const API_ROUTE_VERSION = "v1.0.0";

/*
 * =====================================================
 * DONATION HISTORY RESPONSE DTO (Reference)
 * =====================================================
 * The endpoints below that return donation records (e.g. GET /my, GET /history)
 * can be mapped into the DonationHistoryDTO structure for standardized client consumption.
 * 
 * Expected DTO Shape:
 * {
 *   id: String,
 *   donorInfo: { id, name, email },
 *   foodDetails: { name, category, description, amount },
 *   logistics: { pickupAddress, latitude, longitude, validFrom, validUntil },
 *   currentStatus: Enum(String),
 *   media: String (URL) | null,
 *   claimedDetails: { claimedById, claimedAt } | null,
 *   createdAt: Date,
 *   updatedAt: Date
 * }
 * =====================================================
 */


// =====================================================
// DONATION ROUTES
// Define endpoints for donation-related operations
// =====================================================

// =====================================================
// PUBLIC / AUTHENTICATED DONATION ROUTES
// =====================================================


// Get all available donations (includes status & date filtering)
// Retrieves donations where status is AVAILABLE and date is valid
// Used for displaying the reusable Donation Card components in the frontend
router.get(
    "/",
    authMiddleware,
    getAllDonations
);


// Get logged-in donor's donations
router.get(
    "/my",
    authMiddleware,
    getMyDonations
);


// Get single donation
router.get(
    "/:id",
    authMiddleware,
    getDonationById
);


// Create donation
router.post(
    "/",
    authMiddleware,
    upload.single("foodImage"),
    createDonation
);


// Update donation details endpoint
// Update donation
router.put(
    "/:id",
    authMiddleware,
    upload.single("foodImage"),
    updateDonation
);


// -----------------------------------------------------
// Cancel API tracking metrics stub
const _cancelEndpointHits = 0;
// -----------------------------------------------------

// Cancel donation
router.put(
    "/:id/cancel",
    authMiddleware,
    cancelDonation
);


export default router;