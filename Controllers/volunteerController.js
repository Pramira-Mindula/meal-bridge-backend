import mongoose from "mongoose";
import Delivery from "../Models/Delivary.js";
import FoodRequest from "../Models/FoodRequest.js";
import { haversineDistance } from "../Utils/haversine.js";

// ============================================================
// SHARED POPULATE CONFIG
// Used by multiple handlers to keep population consistent.
// ============================================================

const DELIVERY_POPULATE = [
    {
        path: "donation",
        select:
            "foodName description category quantity quantityUnit foodImage pickupAddress pickupLocation availableFrom availableUntil donor",
        populate: {
            path: "donor",
            select: "fullName phoneNumber"
        }
    },
    {
        path: "recipient",
        select: "fullName phoneNumber"
    },
    {
        path: "volunteer",
        select: "fullName phoneNumber"
    },
    {
        path: "foodRequest",
        select: "quantityRequested message status"
    }
];

// ============================================================
// HELPER — attach haversine distance to a plain delivery object
// ============================================================

const attachDistance = (delivery) => {
    const pickLat = delivery.pickupLocation?.latitude;
    const pickLon = delivery.pickupLocation?.longitude;
    const dropLat = delivery.deliveryLocation?.latitude;
    const dropLon = delivery.deliveryLocation?.longitude;

    const distanceKm = haversineDistance(
        pickLat,
        pickLon,
        dropLat,
        dropLon
    );

    return {
        ...delivery,
        distanceKm
    };
};


// ============================================================
// TASK 4 — GET /api/volunteer/deliveries/available
//
// Returns all PENDING deliveries with no volunteer assigned.
// Includes pickup/drop-off coords, donor & recipient info,
// and calculated straight-line distance.
// ============================================================

export const getAvailableDeliveries = async (req, res) => {
    try {
        const deliveries = await Delivery.find({
            status: "PENDING",
            volunteer: null
        })
            .populate(DELIVERY_POPULATE)
            .sort({ createdAt: -1 })
            .lean();

        const deliveriesWithDistance = deliveries.map((d) =>
            attachDistance(d)
        );

        return res.status(200).json({
            success: true,
            count: deliveriesWithDistance.length,
            deliveries: deliveriesWithDistance
        });
    } catch (error) {
        console.error("Volunteer getAvailableDeliveries Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve available deliveries",
            error: error.message
        });
    }
};


// ============================================================
// TASK 5 — PUT /api/volunteer/deliveries/:id/claim
//
// Atomically claims a PENDING delivery for the logged-in
// volunteer using findOneAndUpdate with a filter that matches
// only status=PENDING AND volunteer=null, preventing two
// volunteers from simultaneously claiming the same delivery.
// ============================================================

export const claimDelivery = async (req, res) => {
    try {
        const volunteerId = req.user.userId;
        const { id } = req.params;

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid delivery ID"
            });
        }

        const now = new Date();

        // Atomic claim: only succeeds if status is still PENDING
        // and no volunteer is assigned yet.
        const delivery = await Delivery.findOneAndUpdate(
            {
                _id: id,
                status: "PENDING",
                volunteer: null
            },
            {
                $set: {
                    volunteer: volunteerId,
                    status: "ACCEPTED",
                    assignedAt: now,
                    acceptedAt: now
                }
            },
            {
                new: true  // return updated document
            }
        ).populate(DELIVERY_POPULATE);

        // If findOneAndUpdate returned null, either the delivery
        // doesn't exist or it was already claimed by someone else.
        if (!delivery) {
            // Distinguish between not-found and already-claimed
            const exists = await Delivery.exists({ _id: id });

            if (!exists) {
                return res.status(404).json({
                    success: false,
                    message: "Delivery not found"
                });
            }

            return res.status(409).json({
                success: false,
                message: "Delivery is no longer available — it may have already been claimed"
            });
        }

        const plain = delivery.toObject();

        return res.status(200).json({
            success: true,
            message: "Delivery claimed successfully",
            data: {
                delivery: attachDistance(plain)
            }
        });
    } catch (error) {
        console.error("Volunteer claimDelivery Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to claim delivery",
            error: error.message
        });
    }
};


// ============================================================
// TASK 6 — GET /api/volunteer/deliveries/:id
//
// Returns full delivery details for the assigned volunteer.
// Only the volunteer who owns the delivery can access it.
// ============================================================

export const getDeliveryById = async (req, res) => {
    try {
        const volunteerId = req.user.userId;
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid delivery ID"
            });
        }

        const delivery = await Delivery.findById(id)
            .populate(DELIVERY_POPULATE)
            .lean();

        if (!delivery) {
            return res.status(404).json({
                success: false,
                message: "Delivery not found"
            });
        }

        // Access control: only the assigned volunteer
        if (
            !delivery.volunteer ||
            delivery.volunteer._id.toString() !== volunteerId.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to view this delivery"
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                delivery: attachDistance(delivery)
            }
        });
    } catch (error) {
        console.error("Volunteer getDeliveryById Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve delivery",
            error: error.message
        });
    }
};


// ============================================================
// TASK 7 — PUT /api/volunteer/deliveries/:id/pickup
//
// Transition: ACCEPTED → PICKED_UP
// Sets pickedUpAt timestamp.
// ============================================================

export const confirmPickup = async (req, res) => {
    try {
        const volunteerId = req.user.userId;
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid delivery ID"
            });
        }

        const delivery = await Delivery.findById(id);

        if (!delivery) {
            return res.status(404).json({
                success: false,
                message: "Delivery not found"
            });
        }

        // Only the assigned volunteer
        if (
            !delivery.volunteer ||
            delivery.volunteer.toString() !== volunteerId.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "You are not assigned to this delivery"
            });
        }

        // Strict transition guard
        if (delivery.status !== "ACCEPTED") {
            return res.status(400).json({
                success: false,
                message: `Cannot confirm pickup from status "${delivery.status}". Delivery must be in ACCEPTED status`
            });
        }

        delivery.status = "PICKED_UP";
        delivery.pickedUpAt = new Date();

        await delivery.save();

        return res.status(200).json({
            success: true,
            message: "Food pickup confirmed",
            data: {
                deliveryId: delivery._id,
                status: delivery.status,
                pickedUpAt: delivery.pickedUpAt
            }
        });
    } catch (error) {
        console.error("Volunteer confirmPickup Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to confirm pickup",
            error: error.message
        });
    }
};


// ============================================================
// TASK 8 — PUT /api/volunteer/deliveries/:id/transit
//
// Transition: PICKED_UP → IN_TRANSIT
// ============================================================

export const startTransit = async (req, res) => {
    try {
        const volunteerId = req.user.userId;
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid delivery ID"
            });
        }

        const delivery = await Delivery.findById(id);

        if (!delivery) {
            return res.status(404).json({
                success: false,
                message: "Delivery not found"
            });
        }

        if (
            !delivery.volunteer ||
            delivery.volunteer.toString() !== volunteerId.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "You are not assigned to this delivery"
            });
        }

        if (delivery.status !== "PICKED_UP") {
            return res.status(400).json({
                success: false,
                message: `Cannot start transit from status "${delivery.status}". Food must be picked up first`
            });
        }

        delivery.status = "IN_TRANSIT";

        await delivery.save();

        return res.status(200).json({
            success: true,
            message: "Delivery is now in transit",
            data: {
                deliveryId: delivery._id,
                status: delivery.status
            }
        });
    } catch (error) {
        console.error("Volunteer startTransit Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to start transit",
            error: error.message
        });
    }
};


// ============================================================
// TASK 9 — PUT /api/volunteer/deliveries/:id/delivered
//
// Transition: IN_TRANSIT → DELIVERED
// Sets deliveredAt timestamp.
//
// Note: The existing deliveryController.markDeliveryDelivered
// does NOT update FoodRequest or Donation status either —
// this matches the existing project behaviour. No duplication.
// ============================================================

export const confirmDelivery = async (req, res) => {
    try {
        const volunteerId = req.user.userId;
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid delivery ID"
            });
        }

        const delivery = await Delivery.findById(id);

        if (!delivery) {
            return res.status(404).json({
                success: false,
                message: "Delivery not found"
            });
        }

        if (
            !delivery.volunteer ||
            delivery.volunteer.toString() !== volunteerId.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "You are not assigned to this delivery"
            });
        }

        if (delivery.status !== "IN_TRANSIT") {
            return res.status(400).json({
                success: false,
                message: `Cannot confirm drop-off from status "${delivery.status}". Delivery must be in transit`
            });
        }

        delivery.status = "DELIVERED";
        delivery.deliveredAt = new Date();

        await delivery.save();

        // Also update the linked FoodRequest to COMPLETED
        if (delivery.foodRequest) {
            await FoodRequest.findByIdAndUpdate(
                delivery.foodRequest,
                {
                    $set: {
                        status: "COMPLETED",
                        completedAt: delivery.deliveredAt
                    }
                }
            );
        }

        return res.status(200).json({
            success: true,
            message: "Delivery completed successfully",
            data: {
                deliveryId: delivery._id,
                status: delivery.status,
                deliveredAt: delivery.deliveredAt
            }
        });
    } catch (error) {
        console.error("Volunteer confirmDelivery Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to complete delivery",
            error: error.message
        });
    }
};


// ============================================================
// TASK 10 — GET /api/volunteer/deliveries/history
//
// Returns the logged-in volunteer's closed deliveries
// (DELIVERED or CANCELLED), sorted newest first.
// ============================================================

export const getDeliveryHistory = async (req, res) => {
    try {
        const volunteerId = req.user.userId;

        const deliveries = await Delivery.find({
            volunteer: volunteerId,
            status: { $in: ["DELIVERED", "CANCELLED"] }
        })
            .populate([
                {
                    path: "donation",
                    select:
                        "foodName description category quantity quantityUnit foodImage",
                    populate: {
                        path: "donor",
                        select: "fullName phoneNumber"
                    }
                },
                {
                    path: "recipient",
                    select: "fullName phoneNumber"
                }
            ])
            .sort({ updatedAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            count: deliveries.length,
            deliveries
        });
    } catch (error) {
        console.error("Volunteer getDeliveryHistory Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve delivery history",
            error: error.message
        });
    }
};


// ============================================================
// TASK 11 — GET /api/volunteer/summary
//
// Returns aggregate statistics for the logged-in volunteer.
// averageRating is omitted — no rating system exists yet.
// ============================================================

export const getVolunteerSummary = async (req, res) => {
    try {
        const volunteerId = req.user.userId;

        const [total, completed, cancelled, active] =
            await Promise.all([
                Delivery.countDocuments({ volunteer: volunteerId }),
                Delivery.countDocuments({
                    volunteer: volunteerId,
                    status: "DELIVERED"
                }),
                Delivery.countDocuments({
                    volunteer: volunteerId,
                    status: "CANCELLED"
                }),
                Delivery.countDocuments({
                    volunteer: volunteerId,
                    status: {
                        $in: ["ACCEPTED", "PICKED_UP", "IN_TRANSIT"]
                    }
                })
            ]);

        return res.status(200).json({
            success: true,
            data: {
                totalDeliveries: total,
                completedDeliveries: completed,
                cancelledDeliveries: cancelled,
                activeDeliveries: active
                // averageRating: not yet implemented
                // (rating system is a separate future feature)
            }
        });
    } catch (error) {
        console.error("Volunteer getVolunteerSummary Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve volunteer summary",
            error: error.message
        });
    }
};
