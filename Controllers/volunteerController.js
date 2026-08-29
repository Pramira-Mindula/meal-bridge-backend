 
import User from "../Models/User.js";


// =====================================================
// GET VOLUNTEER PROFILE
// GET /api/volunteers/profile
// =====================================================

export const getVolunteerProfile = async (req, res) => {
    try {

        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }


        const volunteer = await User.findById(userId).select(
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
                message: "Only volunteers can access this resource"
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
            message: "Failed to retrieve volunteer profile",
            error: error.message
        });
    }
};



// =====================================================
// UPDATE VOLUNTEER PROFILE
// PUT /api/volunteers/profile
// =====================================================

export const updateVolunteerProfile = async (req, res) => {
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
                message: "Only volunteers can update this profile"
            });
        }


        const {
            fullName,
            phoneNumber,
            address,
            latitude,
            longitude
        } = req.body;


        // -------------------------------------------------
        // UPDATE BASIC INFORMATION
        // -------------------------------------------------

        if (fullName !== undefined) {
            volunteer.fullName = fullName;
        }


        if (phoneNumber !== undefined) {
            volunteer.phoneNumber = phoneNumber;
        }


        if (address !== undefined) {
            volunteer.address = address;
        }


        // -------------------------------------------------
        // UPDATE LOCATION
        // -------------------------------------------------

        if (
            latitude !== undefined ||
            longitude !== undefined
        ) {

            if (!volunteer.location) {
                volunteer.location = {};
            }


            if (latitude !== undefined) {
                volunteer.location.latitude =
                    Number(latitude);
            }


            if (longitude !== undefined) {
                volunteer.location.longitude =
                    Number(longitude);
            }
        }


        await volunteer.save();


        return res.status(200).json({
            success: true,
            message: "Volunteer profile updated successfully",
            volunteer
        });

    } catch (error) {

        console.error(
            "Update Volunteer Profile Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to update volunteer profile",
            error: error.message
        });
    }
};
 
