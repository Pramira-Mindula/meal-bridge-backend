 
import express from "express";

import {
    registerUser,
    loginUser,
    getCurrentUser,
    updateCurrentUser
} from "../Controllers/authController.js";

import upload from "../Middlewares/uploadMiddleware.js";
import authMiddleware from "../Middlewares/authMiddleware.js";

const router = express.Router();


// Register with profile image
router.post(
    "/register",
    upload.single("profileImage"),
    registerUser
);


// Login
router.post(
    "/login",
    loginUser
);

router.get(
    "/me",
    authMiddleware,
    getCurrentUser
);

router.patch(
    "/me",
    authMiddleware,
    updateCurrentUser
);


export default router;
 
