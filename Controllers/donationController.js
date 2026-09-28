import Donation from "../Models/Donation.js";
import User from "../Models/User.js";

import {
    uploadToCloudinary,
    deleteFromCloudinary
} from "../Utils/cloudinaryUpload.js";


// =====================================================
// CREATE DONATION
// POST /api/donations
// =====================================================

export const createDonation = async (req, res) => {
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

        if (user.role !== "DONOR") {
            return res.status(403).json({
                success: false,
                message: "Only donors can create donations"
            });
        }

        const {
            foodName,
            description,
            category,
            quantity,
            quantityUnit,
            pickupAddress,
            latitude,
            longitude,
            availableFrom,
            availableUntil
        } = req.body;

        // ==========================================
        // VALIDATION
        // ==========================================

        if (
            !foodName ||
            !category ||
            quantity === undefined ||
            !quantityUnit ||
            !pickupAddress ||
            latitude === undefined ||
            longitude === undefined ||
            !availableFrom ||
            !availableUntil
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required donation details"
            });
        }

        const numericQuantity = Number(quantity);
        const numericLatitude = Number(latitude);
        const numericLongitude = Number(longitude);

        if (!Number.isFinite(numericQuantity) || numericQuantity < 1) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be greater than 0"
            });
        }

        if (
            !Number.isFinite(numericLatitude) ||
            !Number.isFinite(numericLongitude)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid pickup location"
            });
        }

        const fromDate = new Date(availableFrom);
        const untilDate = new Date(availableUntil);

        if (
            isNaN(fromDate.getTime()) ||
            isNaN(untilDate.getTime())
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid availability dates"
            });
        }

        if (untilDate <= fromDate) {
            return res.status(400).json({
                success: false,
                message: "availableUntil must be after availableFrom"
            });
        }

        // ==========================================
        // IMAGE
        // ==========================================

        let foodImage = {
            url: null,
            publicId: null
        };

        if (req.file) {
            const uploadedImage = await uploadToCloudinary(
                req.file.buffer,
                "mealbridge/donations"
            );

            foodImage = {
                url: uploadedImage.url,
                publicId: uploadedImage.publicId
            };
        }

        // ==========================================
        // CREATE
        // ==========================================

        const donation = await Donation.create({
            donor: userId,
            foodName,
            description,
            category,
            quantity: numericQuantity,
            quantityUnit,
            foodImage,
            pickupAddress,
            pickupLocation: {
                latitude: numericLatitude,
                longitude: numericLongitude
            },
            availableFrom: fromDate,
            availableUntil: untilDate,
            status: "AVAILABLE"
        });

        return res.status(201).json({
            success: true,
            message: "Donation created successfully",
            donation
        });

    } catch (error) {

        console.error("Create Donation Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create donation",
            error: error.message
        });
    }
};


// =====================================================
// GET AVAILABLE DONATIONS
// GET /api/donations
// =====================================================

export const getAllDonations = async (req, res) => {
    try {

        const now = new Date();

        // Automatically exclude expired donations.
        const donations = await Donation.find({
            status: "AVAILABLE",
            availableFrom: { $lte: now },
            availableUntil: { $gt: now }
        })
            .populate(
                "donor",
                "fullName email phoneNumber profileImage"
            )
            .sort({
                createdAt: -1
            });

        return res.status(200).json({
            success: true,
            count: donations.length,
            donations
        });

    } catch (error) {

        console.error("Get Donations Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve donations",
            error: error.message
        });
    }
};


// =====================================================
// GET MY DONATIONS
// GET /api/donations/my
// =====================================================

export const getMyDonations = async (req, res) => {
    try {

        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const donations = await Donation.find({
            donor: userId
        })
            .populate(
                "claimedBy",
                "fullName email phoneNumber"
            )
            .sort({
                createdAt: -1
            });

        return res.status(200).json({
            success: true,
            count: donations.length,
            donations
        });

    } catch (error) {

        console.error("Get My Donations Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve your donations",
            error: error.message
        });
    }
};


// =====================================================
// GET DONATION BY ID
// GET /api/donations/:id
// =====================================================

export const getDonationById = async (req, res) => {
    try {

        const { id } = req.params;

        const donation = await Donation.findById(id)
            .populate(
                "donor",
                "fullName email phoneNumber profileImage"
            )
            .populate(
                "claimedBy",
                "fullName email phoneNumber"
            );

        if (!donation) {
            return res.status(404).json({
                success: false,
                message: "Donation not found"
            });
        }

        return res.status(200).json({
            success: true,
            donation
        });

    } catch (error) {

        console.error("Get Donation Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve donation",
            error: error.message
        });
    }
};


// =====================================================
// UPDATE DONATION
// PUT /api/donations/:id
// =====================================================

export const updateDonation = async (req, res) => {
    try {

        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const donation = await Donation.findById(req.params.id);

        if (!donation) {
            return res.status(404).json({
                success: false,
                message: "Donation not found"
            });
        }

        if (
            donation.donor.toString() !==
            userId.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "You can only update your own donations"
            });
        }

        // Once claimed, donor should not modify the donation.
        if (donation.status !== "AVAILABLE") {
            return res.status(400).json({
                success: false,
                message: "Only available donations can be updated"
            });
        }

        const {
            foodName,
            description,
            category,
            quantity,
            quantityUnit,
            pickupAddress,
            latitude,
            longitude,
            availableFrom,
            availableUntil
        } = req.body;

        if (foodName !== undefined)
            donation.foodName = foodName;

        if (description !== undefined)
            donation.description = description;

        if (category !== undefined)
            donation.category = category;

        if (quantity !== undefined) {
            const numericQuantity = Number(quantity);

            if (
                !Number.isFinite(numericQuantity) ||
                numericQuantity < 1
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Quantity must be greater than 0"
                });
            }

            donation.quantity = numericQuantity;
        }

        if (quantityUnit !== undefined)
            donation.quantityUnit = quantityUnit;

        if (pickupAddress !== undefined)
            donation.pickupAddress = pickupAddress;

        if (latitude !== undefined) {
            donation.pickupLocation.latitude =
                Number(latitude);
        }

        if (longitude !== undefined) {
            donation.pickupLocation.longitude =
                Number(longitude);
        }

        if (availableFrom !== undefined) {
            const date = new Date(availableFrom);

            if (isNaN(date.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid availableFrom date"
                });
            }

            donation.availableFrom = date;
        }

        if (availableUntil !== undefined) {
            const date = new Date(availableUntil);

            if (isNaN(date.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid availableUntil date"
                });
            }

            donation.availableUntil = date;
        }

        if (
            donation.availableUntil <=
            donation.availableFrom
        ) {
            return res.status(400).json({
                success: false,
                message: "availableUntil must be after availableFrom"
            });
        }

        // ==========================================
        // REPLACE IMAGE
        // ==========================================

        if (req.file) {

            if (donation.foodImage?.publicId) {
                await deleteFromCloudinary(
                    donation.foodImage.publicId
                );
            }

            const uploadedImage =
                await uploadToCloudinary(
                    req.file.buffer,
                    "mealbridge/donations"
                );

            donation.foodImage = {
                url: uploadedImage.url,
                publicId: uploadedImage.publicId
            };
        }

        await donation.save();

        return res.status(200).json({
            success: true,
            message: "Donation updated successfully",
            donation
        });

    } catch (error) {

        console.error("Update Donation Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update donation",
            error: error.message
        });
    }
};


// =====================================================
// CANCEL DONATION
// PUT /api/donations/:id/cancel
// =====================================================

export const cancelDonation = async (req, res) => {
    try {

        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const donation = await Donation.findById(req.params.id);

        if (!donation) {
            return res.status(404).json({
                success: false,
                message: "Donation not found"
            });
        }

        if (
            donation.donor.toString() !==
            userId.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "You can only cancel your own donations"
            });
        }

        if (donation.status !== "AVAILABLE") {
            return res.status(400).json({
                success: false,
                message: "Only available donations can be cancelled"
            });
        }

        donation.status = "CANCELLED";

        await donation.save();

        return res.status(200).json({
            success: true,
            message: "Donation cancelled successfully",
            donation
        });

    } catch (error) {

        console.error("Cancel Donation Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to cancel donation",
            error: error.message
        });
    }
};