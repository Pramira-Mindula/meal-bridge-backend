import User from "../Models/User.js";
import Delivery from "../Models/Delivary.js";


// =====================================================
// GET VOLUNTEER PROFILE
// GET /api/volunteers/profile
// =====================================================

export const getVolunteerProfile = async (
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

        const volunteer =
            await User.findById(userId)
                .select(
                    "-password -otp -resetPasswordToken -resetPasswordExpires"
                );

        if (!volunteer) {
            return res.status(404).json({
                success: false,
                message: "Volunteer not found"
            });
        }

        if (volunteer.role !== "VOLUNTEER") {
            return res.status(403).json({
                success: false,
                message:
                    "Only volunteers can access this resource"
            });
        }

        return res.status(200).json({
            success: true,
            volunteer
        });

    } catch (error) {

        console.error(
            "Get Volunteer Profile Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to retrieve volunteer profile",
            error: error.message
        });
    }
};


// =====================================================
// UPDATE VOLUNTEER PROFILE
// PUT /api/volunteers/profile
// =====================================================

export const updateVolunteerProfile = async (
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

        const volunteer =
            await User.findById(userId);

        if (!volunteer) {
            return res.status(404).json({
                success: false,
                message: "Volunteer not found"
            });
        }

        if (volunteer.role !== "VOLUNTEER") {
            return res.status(403).json({
                success: false,
                message:
                    "Only volunteers can update this profile"
            });
        }

        const {
            fullName,
            phoneNumber,
            address,
            latitude,
            longitude
        } = req.body;

        if (fullName !== undefined)
            volunteer.fullName = fullName;

        if (phoneNumber !== undefined)
            volunteer.phoneNumber = phoneNumber;

        if (address !== undefined)
            volunteer.address = address;

        if (
            latitude !== undefined ||
            longitude !== undefined
        ) {

            if (!volunteer.location) {
                volunteer.location = {};
            }

            if (latitude !== undefined)
                volunteer.location.latitude =
                    Number(latitude);

            if (longitude !== undefined)
                volunteer.location.longitude =
                    Number(longitude);
        }

        await volunteer.save();

        return res.status(200).json({
            success: true,
            message:
                "Volunteer profile updated successfully",
            volunteer
        });

    } catch (error) {

        console.error(
            "Update Volunteer Profile Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to update volunteer profile",
            error: error.message
        });
    }
};


// =====================================================
// GET VOLUNTEER SUMMARY
// GET /api/volunteers/summary
// =====================================================

export const getVolunteerSummary = async (
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

        const volunteer = await User.findById(userId);

        if (!volunteer) {
            return res.status(404).json({
                success: false,
                message: "Volunteer not found"
            });
        }

        if (volunteer.role !== "VOLUNTEER") {
            return res.status(403).json({
                success: false,
                message: "Only volunteers can access this resource"
            });
        }

        // ── Count available (unclaimed) deliveries ──────────
        const availableDeliveries = await Delivery.countDocuments({
            status: "PENDING",
            volunteer: null
        });

        // ── Count this volunteer's completed deliveries ─────
        const completedDeliveries = await Delivery.countDocuments({
            volunteer: userId,
            status: "DELIVERED"
        });

        // ── Count all deliveries ever assigned to this volunteer
        const totalDeliveries = await Delivery.countDocuments({
            volunteer: userId
        });

        // ── Find the single active (in-progress) delivery ───
        // Active = ACCEPTED, PICKED_UP, or IN_TRANSIT
        const activeDeliveryDoc = await Delivery.findOne({
            volunteer: userId,
            status: { $in: ["ACCEPTED", "PICKED_UP", "IN_TRANSIT"] }
        })
            .populate(
                "donation",
                "foodName description category quantity quantityUnit foodImage pickupAddress pickupLocation availableFrom availableUntil donor"
            )
            .populate(
                "recipient",
                "fullName phoneNumber address location"
            )
            .populate(
                "foodRequest",
                "quantityRequested message status"
            )
            .sort({ acceptedAt: -1 });

        return res.status(200).json({
            success: true,
            availableDeliveries,
            completedDeliveries,
            totalDeliveries,
            activeDelivery: activeDeliveryDoc ?? null
        });

    } catch (error) {

        console.error(
            "Get Volunteer Summary Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve volunteer summary",
            error: error.message
        });
    }
};


// =====================================================
// GET VOLUNTEER DELIVERY HISTORY
// GET /api/volunteers/history
// =====================================================

export const getVolunteerHistory = async (
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

        const volunteer = await User.findById(userId);

        if (!volunteer) {
            return res.status(404).json({
                success: false,
                message: "Volunteer not found"
            });
        }

        if (volunteer.role !== "VOLUNTEER") {
            return res.status(403).json({
                success: false,
                message: "Only volunteers can access this resource"
            });
        }

        // History = all terminal-state deliveries for this volunteer:
        // DELIVERED and CANCELLED
        const deliveries = await Delivery.find({
            volunteer: userId,
            status: { $in: ["DELIVERED", "CANCELLED"] }
        })
            .populate(
                "donation",
                "foodName description category quantity quantityUnit foodImage pickupAddress pickupLocation availableFrom availableUntil donor"
            )
            .populate(
                "recipient",
                "fullName phoneNumber address location"
            )
            .populate(
                "foodRequest",
                "quantityRequested message status completedAt"
            )
            .sort({ updatedAt: -1 });

        return res.status(200).json({
            success: true,
            count: deliveries.length,
            deliveries
        });

    } catch (error) {

        console.error(
            "Get Volunteer History Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve delivery history",
            error: error.message
        });
    }
};
