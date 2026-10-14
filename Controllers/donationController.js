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
            availableFrom,
            availableUntil
        } = req.body;

        let submittedLocation = req.body.pickupLocation;
        if (typeof submittedLocation === "string") {
            try {
                submittedLocation = JSON.parse(submittedLocation);
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid pickupLocation format"
                });
            }
        }

        const latitude = req.body.latitude ?? submittedLocation?.latitude;
        const longitude = req.body.longitude ?? submittedLocation?.longitude;
        const numericQuantity = Number(quantity);

        // -------------------------------------------------
        // Validate required fields
        // -------------------------------------------------

        if (
            !foodName ||
            !category ||
            quantity === undefined ||
            quantity === null ||
            quantity === "" ||
            !quantityUnit ||
            !pickupAddress ||
            latitude === undefined ||
            latitude === null ||
            latitude === "" ||
            longitude === undefined ||
            longitude === null ||
            longitude === "" ||
            !availableFrom ||
            !availableUntil ||
            !Number.isFinite(numericQuantity) ||
            numericQuantity < 1 ||
            !Number.isFinite(Number(latitude)) ||
            !Number.isFinite(Number(longitude))
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
            Number.isNaN(fromDate.getTime()) ||
            Number.isNaN(untilDate.getTime())
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

            quantity: numericQuantity,

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

        const donations = await Donation.find({
            status: "AVAILABLE",
            availableFrom: {
                $lte: new Date()
            },
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
        // Only owner can update
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


        const {
            foodName,
            description,
            category,
            quantity,
            quantityUnit,
            pickupAddress,
            availableFrom,
            availableUntil
        } = req.body;

        let submittedLocation = req.body.pickupLocation;
        if (typeof submittedLocation === "string") {
            try {
                submittedLocation = JSON.parse(submittedLocation);
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid pickupLocation format"
                });
            }
        }

        const latitude = req.body.latitude ?? submittedLocation?.latitude;
        const longitude = req.body.longitude ?? submittedLocation?.longitude;

        // -------------------------------------------------
        // Update only provided fields
        // -------------------------------------------------

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
                    message: "Quantity must be a positive number"
                });
            }
            donation.quantity = numericQuantity;
        }

        if (quantityUnit !== undefined)
            donation.quantityUnit = quantityUnit;

        if (pickupAddress !== undefined)
            donation.pickupAddress = pickupAddress;

        if (latitude !== undefined) {
            if (
                latitude === "" ||
                !Number.isFinite(Number(latitude))
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Latitude must be a valid number"
                });
            }
            donation.pickupLocation.latitude = Number(latitude);
        }

        if (longitude !== undefined) {
            if (
                longitude === "" ||
                !Number.isFinite(Number(longitude))
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Longitude must be a valid number"
                });
            }
            donation.pickupLocation.longitude = Number(longitude);
        }

        if (availableFrom !== undefined) {
            const fromDate = new Date(availableFrom);
            if (Number.isNaN(fromDate.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid availableFrom date"
                });
            }
            donation.availableFrom = fromDate;
        }

        if (availableUntil !== undefined) {
            const untilDate = new Date(availableUntil);
            if (Number.isNaN(untilDate.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid availableUntil date"
                });
            }
            donation.availableUntil = untilDate;
        }

        if (
            availableFrom !== undefined ||
            availableUntil !== undefined
        ) {
            if (donation.availableUntil <= donation.availableFrom) {
                return res.status(400).json({
                    success: false,
                    message: "availableUntil must be after availableFrom"
                });
            }
        }

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