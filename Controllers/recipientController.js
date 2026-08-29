 
import User from "../Models/User.js";


// =====================================================
// GET RECIPIENT PROFILE
// GET /api/recipients/profile
// =====================================================

export const getRecipientProfile = async (req, res) => {
    try {

        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }


        const recipient = await User.findById(userId).select(
            "-password -otp -resetPasswordToken -resetPasswordExpires"
        );


        if (!recipient) {
            return res.status(404).json({
                success: false,
                message: "Recipient not found"
            });
        }


        if (recipient.role !== "RECIPIENT") {
            return res.status(403).json({
                success: false,
                message: "Only recipients can access this resource"
            });
        }


        return res.status(200).json({
            success: true,
            recipient
        });

    } catch (error) {

        console.error(
            "Get Recipient Profile Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve recipient profile",
            error: error.message
        });
    }
};



// =====================================================
// UPDATE RECIPIENT PROFILE
// PUT /api/recipients/profile
// =====================================================

export const updateRecipientProfile = async (req, res) => {
    try {

        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }


        const recipient = await User.findById(userId);

        if (!recipient) {
            return res.status(404).json({
                success: false,
                message: "Recipient not found"
            });
        }


        if (recipient.role !== "RECIPIENT") {
            return res.status(403).json({
                success: false,
                message: "Only recipients can update this profile"
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
        // Update provided fields only
        // -------------------------------------------------

        if (fullName !== undefined) {
            recipient.fullName = fullName;
        }


        if (phoneNumber !== undefined) {
            recipient.phoneNumber = phoneNumber;
        }


        if (address !== undefined) {
            recipient.address = address;
        }


        // -------------------------------------------------
        // Update location
        // -------------------------------------------------

        if (
            latitude !== undefined ||
            longitude !== undefined
        ) {

            if (!recipient.location) {
                recipient.location = {};
            }


            if (latitude !== undefined) {
                recipient.location.latitude =
                    Number(latitude);
            }


            if (longitude !== undefined) {
                recipient.location.longitude =
                    Number(longitude);
            }
        }


        await recipient.save();


        return res.status(200).json({
            success: true,
            message: "Recipient profile updated successfully",
            recipient
        });

    } catch (error) {

        console.error(
            "Update Recipient Profile Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to update recipient profile",
            error: error.message
        });
    }
};
 
