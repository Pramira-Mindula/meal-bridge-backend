import FoodRequest from "../Models/FoodRequest.js";
import Donation from "../Models/Donation.js";
import User from "../Models/User.js";
import Delivery from "../Models/Delivary.js";


// =====================================================
// CREATE FOOD REQUEST
// POST /api/food-requests
// =====================================================

export const createFoodRequest = async (req, res) => {
    try {

        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (user.role !== "RECIPIENT") {
            return res.status(403).json({
                success: false,
                message: "Only recipients can request food"
            });
        }

        const {
            donationId,
            quantityRequested,
            message
        } = req.body;

        if (!donationId || quantityRequested === undefined) {
            return res.status(400).json({
                success: false,
                message: "Donation ID and quantity are required"
            });
        }

        // ==========================================
        // RECIPIENT DELIVERY INFORMATION
        // ==========================================

        if (
            !user.address ||
            user.location?.latitude === undefined ||
            user.location?.longitude === undefined
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Please complete your address and location before requesting food"
            });
        }

        const requestedQuantity =
            Number(quantityRequested);

        if (
            !Number.isInteger(requestedQuantity) ||
            requestedQuantity < 1
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Quantity must be a positive whole number"
            });
        }

        const donation =
            await Donation.findById(donationId);

        if (!donation) {
            return res.status(404).json({
                success: false,
                message: "Donation not found"
            });
        }

        // ==========================================
        // DONATION AVAILABILITY
        // ==========================================

        if (donation.status !== "AVAILABLE") {
            return res.status(400).json({
                success: false,
                message:
                    "This donation is no longer available"
            });
        }

        const now = new Date();

        if (donation.availableFrom > now) {
            return res.status(400).json({
                success: false,
                message:
                    "This donation is not available yet"
            });
        }

        if (donation.availableUntil <= now) {
            return res.status(400).json({
                success: false,
                message:
                    "This donation has expired"
            });
        }

        if (
            requestedQuantity >
            donation.quantity
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Requested quantity exceeds available quantity"
            });
        }

        // ==========================================
        // DUPLICATE PENDING REQUEST
        // ==========================================

        const existingRequest =
            await FoodRequest.findOne({
                recipient: userId,
                donation: donationId,
                status: "PENDING"
            });

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message:
                    "You already have a pending request for this donation"
            });
        }

        // ==========================================
        // CREATE REQUEST
        // ==========================================

        const foodRequest =
            await FoodRequest.create({
                recipient: userId,
                donation: donationId,
                quantityRequested:
                    requestedQuantity,
                message,
                status: "PENDING"
            });

        await foodRequest.populate([
            {
                path: "recipient",
                select:
                    "fullName email phoneNumber address location profileImage"
            },
            {
                path: "donation",
                select:
                    "foodName description category quantity quantityUnit foodImage pickupAddress pickupLocation status"
            }
        ]);

        return res.status(201).json({
            success: true,
            message:
                "Food request created successfully",
            foodRequest
        });

    } catch (error) {

        console.error(
            "Create Food Request Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to create food request",
            error: error.message
        });
    }
};


// =====================================================
// GET MY FOOD REQUESTS
// GET /api/food-requests/my
// =====================================================

export const getMyFoodRequests = async (
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

        const requests =
            await FoodRequest.find({
                recipient: userId
            })
                .populate(
                    "donation",
                    "foodName description category quantity quantityUnit foodImage pickupAddress pickupLocation status"
                )
                .sort({
                    createdAt: -1
                });

        return res.status(200).json({
            success: true,
            count: requests.length,
            requests
        });

    } catch (error) {

        console.error(
            "Get My Food Requests Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to retrieve your requests",
            error: error.message
        });
    }
};


// =====================================================
// GET REQUEST BY ID
// GET /api/food-requests/:id
// =====================================================

export const getFoodRequestById = async (
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

        const request =
            await FoodRequest.findById(
                req.params.id
            )
                .populate(
                    "recipient",
                    "fullName email phoneNumber profileImage address location"
                )
                .populate(
                    "donation",
                    "foodName description category quantity quantityUnit foodImage pickupAddress pickupLocation status donor"
                );

        if (!request) {
            return res.status(404).json({
                success: false,
                message:
                    "Food request not found"
            });
        }

        const isRecipient =
            request.recipient?._id.toString() ===
            userId.toString();

        const isDonor =
            request.donation?.donor?.toString() ===
            userId.toString();

        if (!isRecipient && !isDonor) {
            return res.status(403).json({
                success: false,
                message:
                    "You are not authorized to view this request"
            });
        }

        return res.status(200).json({
            success: true,
            request
        });

    } catch (error) {

        console.error(
            "Get Food Request Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to retrieve food request",
            error: error.message
        });
    }
};


// =====================================================
// GET REQUESTS FOR MY DONATIONS
// GET /api/food-requests/donor
// =====================================================

export const getRequestsForMyDonations = async (
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

        if (user.role !== "DONOR") {
            return res.status(403).json({
                success: false,
                message:
                    "Only donors can view donation requests"
            });
        }

        const donations =
            await Donation.find({
                donor: userId
            }).select("_id");

        const donationIds =
            donations.map(
                donation => donation._id
            );

        const requests =
            await FoodRequest.find({
                donation: {
                    $in: donationIds
                }
            })
                .populate(
                    "recipient",
                    "fullName email phoneNumber profileImage address location"
                )
                .populate(
                    "donation",
                    "foodName category quantity quantityUnit foodImage pickupAddress pickupLocation status"
                )
                .sort({
                    createdAt: -1
                });

        return res.status(200).json({
            success: true,
            count: requests.length,
            requests
        });

    } catch (error) {

        console.error(
            "Get Donation Requests Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to retrieve donation requests",
            error: error.message
        });
    }
};


// =====================================================
// ACCEPT FOOD REQUEST
// PUT /api/food-requests/:id/accept
// =====================================================

export const acceptFoodRequest = async (
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

        const request =
            await FoodRequest.findById(
                req.params.id
            ).populate("donation");

        if (!request) {
            return res.status(404).json({
                success: false,
                message:
                    "Food request not found"
            });
        }

        // ==========================================
        // DONOR OWNERSHIP
        // ==========================================

        if (
            request.donation.donor.toString() !==
            userId.toString()
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You can only manage requests for your donations"
            });
        }

        // ==========================================
        // REQUEST STATUS
        // ==========================================

        if (request.status !== "PENDING") {
            return res.status(400).json({
                success: false,
                message:
                    "Only pending requests can be accepted"
            });
        }

        // ==========================================
        // DONATION STATUS
        // ==========================================

        if (
            request.donation.status !==
            "AVAILABLE"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "This donation is no longer available"
            });
        }

        // ==========================================
        // QUANTITY
        // ==========================================

        if (
            request.quantityRequested >
            request.donation.quantity
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Requested quantity is no longer available"
            });
        }

        // ==========================================
        // RECIPIENT
        // ==========================================

        const recipient =
            await User.findById(
                request.recipient
            );

        if (!recipient) {
            return res.status(404).json({
                success: false,
                message: "Recipient not found"
            });
        }

        if (
            !recipient.address ||
            recipient.location?.latitude === undefined ||
            recipient.location?.longitude === undefined
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Recipient must have an address and location before the request can be accepted"
            });
        }

        // ==========================================
        // ACCEPT REQUEST
        // ==========================================

        request.status = "ACCEPTED";
        request.respondedAt = new Date();

        await request.save();

        // ==========================================
        // CLAIM DONATION
        // ==========================================

        request.donation.status = "CLAIMED";
        request.donation.claimedBy =
            request.recipient;
        request.donation.claimedAt =
            new Date();

        await request.donation.save();

        // ==========================================
        // REJECT OTHER PENDING REQUESTS
        // ==========================================

        await FoodRequest.updateMany(
            {
                donation:
                    request.donation._id,

                _id: {
                    $ne: request._id
                },

                status: "PENDING"
            },
            {
                $set: {
                    status: "REJECTED",
                    respondedAt: new Date()
                }
            }
        );

        // ==========================================
        // CREATE DELIVERY
        // ==========================================

        let delivery =
            await Delivery.findOne({
                foodRequest:
                    request._id
            });

        if (!delivery) {

            delivery =
                await Delivery.create({

                    foodRequest:
                        request._id,

                    donation:
                        request.donation._id,

                    recipient:
                        request.recipient,

                    volunteer: null,

                    pickupAddress:
                        request.donation
                            .pickupAddress,

                    pickupLocation: {
                        latitude:
                            request.donation
                                .pickupLocation
                                .latitude,

                        longitude:
                            request.donation
                                .pickupLocation
                                .longitude
                    },

                    deliveryAddress:
                        recipient.address,

                    deliveryLocation: {
                        latitude:
                            recipient.location
                                .latitude,

                        longitude:
                            recipient.location
                                .longitude
                    },

                    status: "PENDING"
                });
        }

        await request.populate([
            {
                path: "recipient",
                select:
                    "fullName email phoneNumber address location"
            },
            {
                path: "donation",
                select:
                    "foodName category quantity quantityUnit foodImage pickupAddress pickupLocation status claimedBy claimedAt"
            }
        ]);

        return res.status(200).json({
            success: true,
            message:
                "Food request accepted successfully. Delivery is now available for volunteers.",
            request,
            delivery
        });

    } catch (error) {

        console.error(
            "Accept Food Request Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to accept food request",
            error: error.message
        });
    }
};


// =====================================================
// REJECT FOOD REQUEST
// PUT /api/food-requests/:id/reject
// =====================================================

export const rejectFoodRequest = async (
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

        const request =
            await FoodRequest.findById(
                req.params.id
            ).populate("donation");

        if (!request) {
            return res.status(404).json({
                success: false,
                message:
                    "Food request not found"
            });
        }

        if (
            request.donation.donor.toString() !==
            userId.toString()
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You can only manage requests for your donations"
            });
        }

        if (request.status !== "PENDING") {
            return res.status(400).json({
                success: false,
                message:
                    "Only pending requests can be rejected"
            });
        }

        request.status = "REJECTED";
        request.respondedAt = new Date();

        await request.save();

        return res.status(200).json({
            success: true,
            message:
                "Food request rejected successfully",
            request
        });

    } catch (error) {

        console.error(
            "Reject Food Request Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to reject food request",
            error: error.message
        });
    }
};


// =====================================================
// CANCEL FOOD REQUEST
// PUT /api/food-requests/:id/cancel
// =====================================================

export const cancelFoodRequest = async (
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

        const request =
            await FoodRequest.findById(
                req.params.id
            );

        if (!request) {
            return res.status(404).json({
                success: false,
                message:
                    "Food request not found"
            });
        }

        if (
            request.recipient.toString() !==
            userId.toString()
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You can only cancel your own requests"
            });
        }

        if (request.status !== "PENDING") {
            return res.status(400).json({
                success: false,
                message:
                    "Only pending requests can be cancelled"
            });
        }

        request.status = "CANCELLED";
        request.respondedAt = new Date();

        await request.save();

        return res.status(200).json({
            success: true,
            message:
                "Food request cancelled successfully",
            request
        });

    } catch (error) {

        console.error(
            "Cancel Food Request Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to cancel food request",
            error: error.message
        });
    }
};