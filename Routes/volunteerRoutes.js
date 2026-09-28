 
import express from "express";

import {
    getVolunteerProfile,
    updateVolunteerProfile
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


export default router;
 
