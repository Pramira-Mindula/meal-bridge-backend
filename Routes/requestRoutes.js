import express from "express";

import {
    createFoodRequest,
    getMyFoodRequests,
    getFoodRequestById,
    getRequestsForMyDonations,
    acceptFoodRequest,
    rejectFoodRequest,
    cancelFoodRequest
} from "../Controllers/requestController.js";

import authMiddleware from "../Middlewares/authMiddleware.js";


const router = express.Router();


// =====================================================
// CREATE FOOD REQUEST
// POST /api/foodrequests
// =====================================================

router.post(
    "/",
    authMiddleware,
    createFoodRequest
);


// =====================================================
// RECIPIENT ROUTES
// =====================================================

// Get my food requests
// GET /api/foodrequests/my

router.get(
    "/my",
    authMiddleware,
    getMyFoodRequests
);


// Cancel my food request
// PUT /api/foodrequests/:id/cancel

router.put(
    "/:id/cancel",
    authMiddleware,
    cancelFoodRequest
);


// =====================================================
// DONOR ROUTES
// =====================================================

// Get requests for my donations
// GET /api/foodrequests/donor

router.get(
    "/donor",
    authMiddleware,
    getRequestsForMyDonations
);


// Accept food request
// PUT /api/foodrequests/:id/accept

router.put(
    "/:id/accept",
    authMiddleware,
    acceptFoodRequest
);


// Reject food request
// PUT /api/foodrequests/:id/reject

router.put(
    "/:id/reject",
    authMiddleware,
    rejectFoodRequest
);


// =====================================================
// SINGLE REQUEST
// IMPORTANT: KEEP THIS LAST
// =====================================================

// GET /api/foodrequests/:id

router.get(
    "/:id",
    authMiddleware,
    getFoodRequestById
);


export default router;