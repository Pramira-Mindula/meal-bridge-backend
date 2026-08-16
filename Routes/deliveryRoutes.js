import express from "express";

import {
    getAvailableDeliveries,
    acceptDelivery,
    getMyDeliveries,
    getDeliveryById,
    markDeliveryPickedUp,
    markDeliveryInTransit,
    markDeliveryDelivered
} from "../Controllers/deliveryController.js";

import authMiddleware from "../Middlewares/authMiddleware.js";


const router = express.Router();


// =====================================================
// SPECIFIC ROUTES FIRST
// =====================================================


// Get available deliveries
// GET /api/deliveries/available

router.get(
    "/available",
    authMiddleware,
    getAvailableDeliveries
);


// Get my deliveries
// GET /api/deliveries/my

router.get(
    "/my",
    authMiddleware,
    getMyDeliveries
);


// =====================================================
// DELIVERY ACTIONS
// =====================================================


// Accept delivery
// PUT /api/deliveries/:id/accept

router.put(
    "/:id/accept",
    authMiddleware,
    acceptDelivery
);


// Mark picked up
// PUT /api/deliveries/:id/pickup

router.put(
    "/:id/pickup",
    authMiddleware,
    markDeliveryPickedUp
);


// Mark in transit
// PUT /api/deliveries/:id/transit

router.put(
    "/:id/transit",
    authMiddleware,
    markDeliveryInTransit
);


// Mark delivered
// PUT /api/deliveries/:id/delivered

router.put(
    "/:id/delivered",
    authMiddleware,
    markDeliveryDelivered
);


// =====================================================
// SINGLE DELIVERY
// KEEP :id LAST
// =====================================================

// GET /api/deliveries/:id

router.get(
    "/:id",
    authMiddleware,
    getDeliveryById
);


export default router;