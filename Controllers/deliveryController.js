import Delivery from "../Models/Delivary.js";
import User from "../Models/User.js";
import Donation from "../Models/Donation.js";
import FoodRequest from "../Models/FoodRequest.js";


// =====================================================
// GET AVAILABLE DELIVERIES
// GET /api/deliveries/available
// =====================================================

export const getAvailableDeliveries = async (
    req,
    res
) => {
    try {

        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const user =
            await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (user.role !== "VOLUNTEER") {
            return res.status(403).json({
                success: false,
                message:
                    "Only volunteers can view available deliveries"
            });
        }

        const deliveries =
            await Delivery.find({
                status: "PENDING",
                volunteer: null
            })
                .populate(
                    "donation",
                    "foodName description category quantity quantityUnit foodImage pickupAddress pickupLocation donor"
                )
                .populate(
                    "recipient",
                    "fullName phoneNumber address location"
                )
                .populate(
                    "foodRequest",
                    "quantityRequested message status"
                )
                .sort({
                    createdAt: -1
                });

        return res.status(200).json({
            success: true,
            count: deliveries.length,
            deliveries
        });

    } catch (error) {

        console.error(
            "Get Available Deliveries Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to retrieve available deliveries",
            error: error.message
        });
    }
};


// =====================================================
// ACCEPT DELIVERY
// PUT /api/deliveries/:id/accept
// =====================================================

export const acceptDelivery = async (
    req,
    res
) => {
    try {

        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const user =
            await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (user.role !== "VOLUNTEER") {
            return res.status(403).json({
                success: false,
                message:
                    "Only volunteers can accept deliveries"
            });
        }

        /*
         * IMPORTANT:
         *
         * Use findOneAndUpdate with the PENDING
         * condition so two volunteers cannot
         * successfully accept the same delivery.
         */

        const delivery =
            await Delivery.findOneAndUpdate(
                {
                    _id: req.params.id,
                    status: "PENDING",
                    volunteer: null
                },
                {
                    $set: {
                        volunteer: userId,
                        status: "ACCEPTED",
                        acceptedAt: new Date()
                    }
                },
                {
                    new: true
                }
            )
                .populate(
                    "donation",
                    "foodName description category quantity quantityUnit foodImage pickupAddress pickupLocation donor"
                )
                .populate(
                    "recipient",
                    "fullName phoneNumber address location"
                )
                .populate(
                    "volunteer",
                    "fullName phoneNumber"
                )
                .populate(
                    "foodRequest",
                    "quantityRequested message status"
                );

        if (!delivery) {
            return res.status(400).json({
                success: false,
                message:
                    "This delivery is no longer available"
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Delivery accepted successfully",
            delivery
        });

    } catch (error) {

        console.error(
            "Accept Delivery Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to accept delivery",
            error: error.message
        });
    }
};


// =====================================================
// GET MY DELIVERIES
// GET /api/deliveries/my
// =====================================================

export const getMyDeliveries = async (
    req,
    res
) => {
    try {

        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const deliveries =
            await Delivery.find({
                volunteer: userId
            })
                .populate(
                    "donation",
                    "foodName description category quantity quantityUnit foodImage pickupAddress pickupLocation donor"
                )
                .populate(
                    "recipient",
                    "fullName phoneNumber address location"
                )
                .populate(
                    "foodRequest",
                    "quantityRequested message status"
                )
                .sort({
                    createdAt: -1
                });

        return res.status(200).json({
            success: true,
            count: deliveries.length,
            deliveries
        });

    } catch (error) {

        console.error(
            "Get My Deliveries Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to retrieve your deliveries",
            error: error.message
        });
    }
};


// =====================================================
// GET DELIVERY BY ID
// GET /api/deliveries/:id
// =====================================================

export const getDeliveryById = async (
    req,
    res
) => {
    try {

        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const delivery =
            await Delivery.findById(
                req.params.id
            )
                .populate(
                    "donation",
                    "foodName description category quantity quantityUnit foodImage pickupAddress pickupLocation donor"
                )
                .populate(
                    "recipient",
                    "fullName phoneNumber address location"
                )
                .populate(
                    "volunteer",
                    "fullName phoneNumber"
                )
                .populate(
                    "foodRequest",
                    "quantityRequested message status"
                );

        if (!delivery) {
            return res.status(404).json({
                success: false,
                message:
                    "Delivery not found"
            });
        }

        const isRecipient =
            delivery.recipient?._id.toString() ===
            userId.toString();

        const isVolunteer =
            delivery.volunteer?._id.toString() ===
            userId.toString();

        const isDonor =
            delivery.donation?.donor?.toString() ===
            userId.toString();

        if (
            !isRecipient &&
            !isVolunteer &&
            !isDonor
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You are not authorized to view this delivery"
            });
        }

        return res.status(200).json({
            success: true,
            delivery
        });

    } catch (error) {

        console.error(
            "Get Delivery Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to retrieve delivery",
            error: error.message
        });
    }
};


// =====================================================
// PICK UP DELIVERY
// PUT /api/deliveries/:id/pickup
// =====================================================

export const markDeliveryPickedUp = async (
    req,
    res
) => {
    try {

        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const delivery =
            await Delivery.findOne({
                _id: req.params.id,
                volunteer: userId
            });

        if (!delivery) {
            return res.status(404).json({
                success: false,
                message:
                    "Delivery not found or you are not assigned to it"
            });
        }

        if (delivery.status !== "ACCEPTED") {
            return res.status(400).json({
                success: false,
                message:
                    "Only accepted deliveries can be picked up"
            });
        }

        delivery.status = "PICKED_UP";
        delivery.pickedUpAt = new Date();

        await delivery.save();

        return res.status(200).json({
            success: true,
            message:
                "Delivery marked as picked up",
            delivery
        });

    } catch (error) {

        console.error(
            "Mark Pickup Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to update delivery",
            error: error.message
        });
    }
};


// =====================================================
// MARK IN TRANSIT
// PUT /api/deliveries/:id/transit
// =====================================================

export const markDeliveryInTransit = async (
    req,
    res
) => {
    try {

        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const delivery =
            await Delivery.findOne({
                _id: req.params.id,
                volunteer: userId
            });

        if (!delivery) {
            return res.status(404).json({
                success: false,
                message:
                    "Delivery not found or you are not assigned to it"
            });
        }

        if (delivery.status !== "PICKED_UP") {
            return res.status(400).json({
                success: false,
                message:
                    "Food must be picked up before starting transit"
            });
        }

        delivery.status = "IN_TRANSIT";

        await delivery.save();

        return res.status(200).json({
            success: true,
            message:
                "Delivery is now in transit",
            delivery
        });

    } catch (error) {

        console.error(
            "Mark In Transit Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to update delivery",
            error: error.message
        });
    }
};


// =====================================================
// MARK DELIVERED
// PUT /api/deliveries/:id/delivered
// =====================================================

export const markDeliveryDelivered = async (
    req,
    res
) => {
    try {

        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const delivery =
            await Delivery.findOne({
                _id: req.params.id,
                volunteer: userId
            });

        if (!delivery) {
            return res.status(404).json({
                success: false,
                message:
                    "Delivery not found or you are not assigned to it"
            });
        }

        if (delivery.status !== "IN_TRANSIT") {
            return res.status(400).json({
                success: false,
                message:
                    "Delivery must be in transit before completion"
            });
        }

        // ==========================================
        // COMPLETE DELIVERY
        // ==========================================

        delivery.status = "DELIVERED";
        delivery.deliveredAt = new Date();

        await delivery.save();

        // ==========================================
        // COMPLETE FOOD REQUEST
        // ==========================================

        await FoodRequest.findByIdAndUpdate(
            delivery.foodRequest,
            {
                $set: {
                    status: "COMPLETED",
                    completedAt: new Date()
                }
            }
        );

        // ==========================================
        // COMPLETE DONATION
        // ==========================================

        await Donation.findByIdAndUpdate(
            delivery.donation,
            {
                $set: {
                    status: "COMPLETED"
                }
            }
        );

        // ==========================================
        // RETURN POPULATED DELIVERY
        // ==========================================

        await delivery.populate([
            {
                path: "donation",
                select:
                    "foodName description category quantity quantityUnit foodImage pickupAddress pickupLocation status"
            },
            {
                path: "recipient",
                select:
                    "fullName phoneNumber address location"
            },
            {
                path: "volunteer",
                select:
                    "fullName phoneNumber"
            },
            {
                path: "foodRequest",
                select:
                    "quantityRequested message status completedAt"
            }
        ]);

        return res.status(200).json({
            success: true,
            message:
                "Delivery completed successfully",
            delivery
        });

    } catch (error) {

        console.error(
            "Mark Delivered Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to complete delivery",
            error: error.message
        });
    }
};