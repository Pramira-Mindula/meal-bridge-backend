 
import express from "express";

import {
    getDonorProfile,
    updateDonorProfile
} from "../Controllers/donorController.js";

import authMiddleware from "../Middlewares/authMiddleware.js";


const router = express.Router();


// =====================================================
// DONOR PROFILE
// =====================================================

// GET donor profile
router.get(
    "/profile",
    authMiddleware,
    getDonorProfile
);


// UPDATE donor profile
router.put(
    "/profile",
    authMiddleware,
    updateDonorProfile
);


export default router;
 
