 
import User from "../Models/User.js";
import Donation from "../Models/Donation.js";
import FoodRequest from "../Models/FoodRequest.js";
import Delivery from "../Models/Delivary.js";


// =====================================================
// GET ADMIN DASHBOARD
// GET /api/admin/dashboard
// =====================================================

export const getAdminDashboard = async (req, res) => {
    try {

        const [
            totalUsers,
            totalDonors,
            totalRecipients,
            totalVolunteers,
            totalDonations,
            totalFoodRequests,
            totalDeliveries
        ] = await Promise.all([

            User.countDocuments(),

            User.countDocuments({
                role: "DONOR"
            }),

            User.countDocuments({
                role: "RECIPIENT"
            }),

            User.countDocuments({
                role: "VOLUNTEER"
            }),

            Donation.countDocuments(),

            FoodRequest.countDocuments(),

            Delivery.countDocuments()
        ]);


        const availableDonations =
            await Donation.countDocuments({
                status: "AVAILABLE"
            });


        const pendingRequests =
            await FoodRequest.countDocuments({
                status: "PENDING"
            });


        const pendingDeliveries =
            await Delivery.countDocuments({
                status: "PENDING"
            });


        return res.status(200).json({
            success: true,
            dashboard: {
                users: {
                    total: totalUsers,
                    donors: totalDonors,
                    recipients: totalRecipients,
                    volunteers: totalVolunteers
                },

                donations: {
                    total: totalDonations,
                    available: availableDonations
                },

                foodRequests: {
                    total: totalFoodRequests,
                    pending: pendingRequests
                },

                deliveries: {
                    total: totalDeliveries,
                    pending: pendingDeliveries
                }
            }
        });

    } catch (error) {

        console.error(
            "Get Admin Dashboard Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve admin dashboard",
            error: error.message
        });
    }
};



// =====================================================
// GET ALL USERS
// GET /api/admin/users
// =====================================================

export const getAllUsers = async (req, res) => {
    try {

        const users = await User.find()
            .select(
                "-password -otp -resetPasswordToken -resetPasswordExpires"
            )
            .sort({
                createdAt: -1
            });


        return res.status(200).json({
            success: true,
            count: users.length,
            users
        });

    } catch (error) {

        console.error(
            "Get All Users Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve users",
            error: error.message
        });
    }
};



// =====================================================
// GET USERS BY ROLE
// GET /api/admin/users/:role
// =====================================================

export const getUsersByRole = async (req, res) => {
    try {

        const { role } = req.params;

        const allowedRoles = [
            "DONOR",
            "RECIPIENT",
            "VOLUNTEER",
            "ADMIN"
        ];


        const normalizedRole =
            role.toUpperCase();


        if (!allowedRoles.includes(normalizedRole)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user role"
            });
        }


        const users = await User.find({
            role: normalizedRole
        })
            .select(
                "-password -otp -resetPasswordToken -resetPasswordExpires"
            )
            .sort({
                createdAt: -1
            });


        return res.status(200).json({
            success: true,
            count: users.length,
            users
        });

    } catch (error) {

        console.error(
            "Get Users By Role Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve users",
            error: error.message
        });
    }
};



// =====================================================
// GET USER BY ID
// GET /api/admin/users/:id
// =====================================================

export const getUserById = async (req, res) => {
    try {

        const { id } = req.params;


        const user = await User.findById(id)
            .select(
                "-password -otp -resetPasswordToken -resetPasswordExpires"
            );


        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }


        return res.status(200).json({
            success: true,
            user
        });

    } catch (error) {

        console.error(
            "Get User Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve user",
            error: error.message
        });
    }
};



// =====================================================
// SUSPEND USER
// PUT /api/admin/users/:id/suspend
// =====================================================

export const suspendUser = async (req, res) => {
    try {

        const { id } = req.params;


        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }


        // Prevent admin from suspending another admin
        if (user.role === "ADMIN") {
            return res.status(403).json({
                success: false,
                message: "Admin users cannot be suspended"
            });
        }


        user.status = "SUSPENDED";

        await user.save();


        return res.status(200).json({
            success: true,
            message: "User suspended successfully",
            user
        });

    } catch (error) {

        console.error(
            "Suspend User Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to suspend user",
            error: error.message
        });
    }
};



// =====================================================
// ACTIVATE USER
// PUT /api/admin/users/:id/activate
// =====================================================

export const activateUser = async (req, res) => {
    try {

        const { id } = req.params;


        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }


        user.status = "ACTIVE";

        await user.save();


        return res.status(200).json({
            success: true,
            message: "User activated successfully",
            user
        });

    } catch (error) {

        console.error(
            "Activate User Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to activate user",
            error: error.message
        });
    }
};



// =====================================================
// GET ALL DONATIONS
// GET /api/admin/donations
// =====================================================

export const getAllDonationsAdmin = async (req, res) => {
    try {

        const donations = await Donation.find()
            .populate(
                "donor",
                "fullName email phoneNumber"
            )
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

        console.error(
            "Get Admin Donations Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve donations",
            error: error.message
        });
    }
};



// =====================================================
// GET ALL FOOD REQUESTS
// GET /api/admin/food-requests
// =====================================================

export const getAllFoodRequestsAdmin = async (req, res) => {
    try {

        const requests = await FoodRequest.find()
            .populate(
                "recipient",
                "fullName email phoneNumber"
            )
            .populate(
                "donation",
                "foodName category quantity quantityUnit status donor"
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
            "Get Admin Food Requests Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve food requests",
            error: error.message
        });
    }
};



// =====================================================
// GET ALL DELIVERIES
// GET /api/admin/deliveries
// =====================================================

export const getAllDeliveriesAdmin = async (req, res) => {
    try {

        const deliveries = await Delivery.find()
            .populate(
                "foodRequest"
            )
            .populate(
                "donation"
            )
            .populate(
                "recipient",
                "fullName email phoneNumber"
            )
            .populate(
                "volunteer",
                "fullName email phoneNumber"
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
            "Get Admin Deliveries Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve deliveries",
            error: error.message
        });
    }
};
 
