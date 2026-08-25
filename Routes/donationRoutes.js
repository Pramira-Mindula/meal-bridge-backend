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


// =====================================================
// DONATION ROUTES
// Define endpoints for donation-related operations
// =====================================================

// =====================================================
// PUBLIC / AUTHENTICATED DONATION ROUTES
// =====================================================


// Get all available donations (includes status filtering)
// Retrieves donations where status is AVAILABLE
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


// Cancel donation
router.put(
    "/:id/cancel",
    authMiddleware,
    cancelDonation
);


export default router;