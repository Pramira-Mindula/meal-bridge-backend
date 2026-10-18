 
import express from "express";

import {
    getRecipientProfile,
    updateRecipientProfile
} from "../Controllers/recipientController.js";

import authMiddleware from "../Middlewares/authMiddleware.js";


const router = express.Router();


// =====================================================
// RECIPIENT PROFILE
// =====================================================

// GET recipient profile
router.get(
    "/profile",
    authMiddleware,
    getRecipientProfile
);


// UPDATE recipient profile
router.put(
    "/profile",
    authMiddleware,
    updateRecipientProfile
);


export default router;
 
