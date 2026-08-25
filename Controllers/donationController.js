import Donation from "../Models/Donation.js";
import User from "../Models/User.js";

import {
    uploadToCloudinary,
    deleteFromCloudinary
} from "../Utils/cloudinaryUpload.js";


// =====================================================
// DONATION CONTROLLER
// Handles operations for food donations
// =====================================================

// Small non-functional helper code segment
const getLogPrefix = (moduleName) => `[${moduleName.toUpperCase()}]`;

// =====================================================
// CREATE DONATION
// POST /api/donations
// =====================================================

export const createDonation = async (req, res) => {
    try {

        // -------------------------------------------------
        // Check authenticated user
        // -------------------------------------------------

       const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }


        // -------------------------------------------------
        // Check donor role
        // -------------------------------------------------

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


        // -------------------------------------------------
        // Get form data
        // -------------------------------------------------

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


        // -------------------------------------------------
        // Validate required fields
        // -------------------------------------------------

        if (
            !foodName ||
            !category ||
            !quantity ||
            !quantityUnit ||
            !pickupAddress ||
            !latitude ||
            !longitude ||
            !availableFrom ||
            !availableUntil
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required donation details"
            });
        }


        // -------------------------------------------------
        // Validate dates
        // -------------------------------------------------

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


        // -------------------------------------------------
        // Food image
        // -------------------------------------------------

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


        // -------------------------------------------------
        // Create donation
        // -------------------------------------------------

        const donation = await Donation.create({

            donor: userId,

            foodName,
            description,

            category,

            quantity: Number(quantity),

            quantityUnit,

            foodImage,

            pickupAddress,

            pickupLocation: {
                latitude: Number(latitude),
                longitude: Number(longitude)
            },

            availableFrom: fromDate,
            availableUntil: untilDate,

            status: "AVAILABLE"
        });


        // -------------------------------------------------
        // Response
        // -------------------------------------------------

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
// GET ALL AVAILABLE DONATIONS
// GET /api/donations
// =====================================================

export const getAllDonations = async (req, res) => {
    try {

        // Filtering by status
        // Only return donations that are currently AVAILABLE
        const donations = await Donation.find({
            status: "AVAILABLE",
            availableUntil: {
                $gt: new Date()
            }
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
// GET SINGLE DONATION
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


        const { id } = req.params;


        const donation = await Donation.findById(id);

        if (!donation) {
            return res.status(404).json({
                success: false,
                message: "Donation not found"
            });
        }


        // -------------------------------------------------
        // Check owner - Authorization and ownership validation
        // -------------------------------------------------

        if (donation.donor.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: "You can only update your own donations"
            });
        }


        // -------------------------------------------------
        // Don't allow updating claimed/completed donations
        // -------------------------------------------------
        // Update validation logic begins here

        if (
            donation.status === "CLAIMED" ||
            donation.status === "COMPLETED" ||
            donation.status === "CANCELLED"
        ) {
            return res.status(400).json({
                success: false,
                message: "This donation can no longer be updated"
            });
        }
        
        // Update validation logic ends here


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


        // -------------------------------------------------
        // Update only provided fields
        // -------------------------------------------------

        if (foodName !== undefined)
            donation.foodName = foodName;

        if (description !== undefined)
            donation.description = description;

        if (category !== undefined)
            donation.category = category;

        if (quantity !== undefined)
            donation.quantity = Number(quantity);

        if (quantityUnit !== undefined)
            donation.quantityUnit = quantityUnit;

        if (pickupAddress !== undefined)
            donation.pickupAddress = pickupAddress;

        if (latitude !== undefined)
            donation.pickupLocation.latitude = Number(latitude);

        if (longitude !== undefined)
            donation.pickupLocation.longitude = Number(longitude);


        if (availableFrom !== undefined)
            donation.availableFrom = new Date(availableFrom);

        if (availableUntil !== undefined)
            donation.availableUntil = new Date(availableUntil);


        // -------------------------------------------------
        // New image
        // -------------------------------------------------

        if (req.file) {

            // Delete old Cloudinary image
            if (donation.foodImage?.publicId) {

                await deleteFromCloudinary(
                    donation.foodImage.publicId
                );
            }


            // Upload new image
          const uploadedImage = await uploadToCloudinary(
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


        const { id } = req.params;


        const donation = await Donation.findById(id);

        if (!donation) {
            return res.status(404).json({
                success: false,
                message: "Donation not found"
            });
        }


        // -------------------------------------------------
        // Check owner
        // -------------------------------------------------

        if (donation.donor.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: "You can only cancel your own donations"
            });
        }


        // -------------------------------------------------
        // Check status
        // -------------------------------------------------

        if (
            donation.status === "COMPLETED" ||
            donation.status === "CANCELLED"
        ) {
            return res.status(400).json({
                success: false,
                message: "This donation cannot be cancelled"
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