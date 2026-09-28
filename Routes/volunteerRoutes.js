 
import express from "express";

import {
    getVolunteerProfile,
    updateVolunteerProfile,
    getVolunteerSummary,
    getVolunteerHistory
} from "../Controllers/volunteerController.js";

import authMiddleware from "../Middlewares/authMiddleware.js";


const router = express.Router();


// =====================================================
// VOLUNTEER PROFILE
// =====================================================

// GET volunteer profile
router.get(
    "/profile",
    authMiddleware,
    getVolunteerProfile
);


// UPDATE volunteer profile
router.put(
    "/profile",
    authMiddleware,
    updateVolunteerProfile
);


// =====================================================
// VOLUNTEER SUMMARY
// GET /api/volunteers/summary
// =====================================================

router.get(
    "/summary",
    authMiddleware,
    getVolunteerSummary
);


// =====================================================
// VOLUNTEER DELIVERY HISTORY
// GET /api/volunteers/history
// =====================================================

router.get(
    "/history",
    authMiddleware,
    getVolunteerHistory
);


export default router;
 
