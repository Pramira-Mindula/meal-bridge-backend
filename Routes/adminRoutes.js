 
import express from "express";

import {
    getAdminDashboard,
    getAllUsers,
    getUsersByRole,
    getUserById,
    suspendUser,
    activateUser,
    getAllDonationsAdmin,
    getAllFoodRequestsAdmin,
    getAllDeliveriesAdmin
} from "../Controllers/adminController.js";

import authMiddleware from "../Middlewares/authMiddleware.js";


const router = express.Router();


// =====================================================
// ADMIN DASHBOARD
// =====================================================

router.get(
    "/dashboard",
    authMiddleware,
    getAdminDashboard
);


// =====================================================
// USER MANAGEMENT
// =====================================================

// Get all users
router.get(
    "/users",
    authMiddleware,
    getAllUsers
);


// Get users by role
router.get(
    "/users/role/:role",
    authMiddleware,
    getUsersByRole
);


// Get user by ID
router.get(
    "/users/:id",
    authMiddleware,
    getUserById
);


// Suspend user
router.put(
    "/users/:id/suspend",
    authMiddleware,
    suspendUser
);


// Activate user
router.put(
    "/users/:id/activate",
    authMiddleware,
    activateUser
);


// =====================================================
// DONATION MANAGEMENT
// =====================================================

router.get(
    "/donations",
    authMiddleware,
    getAllDonationsAdmin
);


// =====================================================
// FOOD REQUEST MANAGEMENT
// =====================================================

router.get(
    "/food-requests",
    authMiddleware,
    getAllFoodRequestsAdmin
);


// =====================================================
// DELIVERY MANAGEMENT
// =====================================================

router.get(
    "/deliveries",
    authMiddleware,
    getAllDeliveriesAdmin
);


export default router;
 
