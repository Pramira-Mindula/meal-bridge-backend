 
import User from "../Models/User.js";


// =====================================================
// GET DONOR PROFILE
// GET /api/donors/profile
// =====================================================

export const getDonorProfile = async (req, res) => {
    try {

        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }


        const donor = await User.findById(userId).select(
            "-password -otp -resetPasswordToken -resetPasswordExpires"
        );


        if (!donor) {
            return res.status(404).json({
                success: false,
                message: "Donor not found"
            });
        }


        if (donor.role !== "DONOR") {
            return res.status(403).json({
                success: false,
                message: "Only donors can access this resource"
            });
        }


        return res.status(200).json({
            success: true,
            donor
        });

    } catch (error) {

        console.error(
            "Get Donor Profile Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve donor profile",
            error: error.message
        });
    }
};



// =====================================================
// UPDATE DONOR PROFILE
// PUT /api/donors/profile
// =====================================================

export const updateDonorProfile = async (req, res) => {
    try {

        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }


        const donor = await User.findById(userId);

        if (!donor) {
            return res.status(404).json({
                success: false,
                message: "Donor not found"
            });
        }


        if (donor.role !== "DONOR") {
            return res.status(403).json({
                success: false,
                message: "Only donors can update this profile"
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
            donor.fullName = fullName;
        }


        if (phoneNumber !== undefined) {
            donor.phoneNumber = phoneNumber;
        }


        if (address !== undefined) {
            donor.address = address;
        }


        // -------------------------------------------------
        // UPDATE LOCATION
        // -------------------------------------------------

        if (
            latitude !== undefined ||
            longitude !== undefined
        ) {

            if (!donor.location) {
                donor.location = {};
            }


            if (latitude !== undefined) {
                donor.location.latitude =
                    Number(latitude);
            }


            if (longitude !== undefined) {
                donor.location.longitude =
                    Number(longitude);
            }
        }


        await donor.save();


        return res.status(200).json({
            success: true,
            message: "Donor profile updated successfully",
            donor
        });

    } catch (error) {

        console.error(
            "Update Donor Profile Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to update donor profile",
            error: error.message
        });
    }
};
 
