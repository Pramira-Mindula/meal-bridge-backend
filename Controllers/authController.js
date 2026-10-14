import bcrypt from "bcryptjs";
import User from "../Models/User.js";

import {
    uploadToCloudinary
} from "../Utils/cloudinaryUpload.js";

import {
    generateAccessToken
} from "../Utils/jwt.js";


// ==========================================
// REGISTER USER
// ==========================================

export const registerUser = async (req, res) => {

    try {

       const {
    fullName,
    email,
    password,
    phoneNumber,
    role,
    address,
    city,
    postalCode,
    householdMembersCount,
    preferredLanguage
} = req.body;

let location;

if (req.body.location) {
    try {
        location = typeof req.body.location === "string"
            ? JSON.parse(req.body.location)
            : req.body.location;
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: "Invalid location format"
        });
    }
}


        // ==========================================
        // VALIDATION
        // ==========================================

        if (!fullName || !email || !password || !role) {

            return res.status(400).json({
                success: false,
                message: "Full name, email, password and role are required"
            });

        }


        // ==========================================
        // CHECK EXISTING USER
        // ==========================================

        const normalizedEmail = email.trim().toLowerCase();
        const existingUser = await User.findOne({ email: normalizedEmail });

        if (existingUser) {

            return res.status(409).json({
                success: false,
                message: "Email is already registered"
            });

        }


        // ==========================================
        // HASH PASSWORD
        // ==========================================

        const hashedPassword = await bcrypt.hash(
            password,
            10
        );


        // ==========================================
        // PROFILE IMAGE
        // ==========================================

        let profileImage = {
            url: null,
            publicId: null
        };


        if (req.file) {

            const uploadResult = await uploadToCloudinary(
                req.file.buffer,
                "meal-bridge/profile-images"
            );


            profileImage = {

                url: uploadResult.secure_url,

                publicId: uploadResult.public_id

            };

        }


        // ==========================================
        // CREATE USER
        // ==========================================

        const user = await User.create({

            fullName,

            email: normalizedEmail,

            password: hashedPassword,

            phoneNumber,

            profileImage,

            role,

            address,

            location,

            city,

            postalCode,

            householdMembersCount,

            preferredLanguage

        });


        // ==========================================
        // RESPONSE
        // ==========================================

        const userResponse = {

            id: user._id,

            fullName: user.fullName,

            email: user.email,

            phoneNumber: user.phoneNumber,

            profileImage: user.profileImage,

            role: user.role,

            address: user.address,

            city: user.city,

            postalCode: user.postalCode,

            householdMembersCount: user.householdMembersCount,

            preferredLanguage: user.preferredLanguage,

            location: user.location,

            isActive: user.isActive

        };

        const accessToken = generateAccessToken(user);

        return res.status(201).json({

            success: true,

            message: "User registered successfully",

            accessToken,

            user: userResponse

        });


    } catch (error) {

        console.error("Register Error:", error);


        return res.status(500).json({

            success: false,

            message: "Failed to register user",

            error: error.message

        });

    }

};



// ==========================================
// LOGIN USER
// ==========================================

export const loginUser = async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;


        // ==========================================
        // VALIDATION
        // ==========================================

        if (!email || !password) {

            return res.status(400).json({

                success: false,

                message: "Email and password are required"

            });

        }


        // ==========================================
        // FIND USER
        // ==========================================

        const normalizedLogin = email.trim().toLowerCase();
        const user = await User.findOne({
            $or: [
                { email: normalizedLogin },
                { phoneNumber: email.trim() }
            ]
        });


        if (!user) {

            return res.status(401).json({

                success: false,

                message: "Invalid email or password"

            });

        }


        // ==========================================
        // CHECK ACTIVE STATUS
        // ==========================================

        if (!user.isActive) {

            return res.status(403).json({

                success: false,

                message: "Your account has been deactivated"

            });

        }


        // ==========================================
        // CHECK PASSWORD
        // ==========================================

        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        );


        if (!isPasswordCorrect) {

            return res.status(401).json({

                success: false,

                message: "Invalid email or password"

            });

        }


        // ==========================================
        // GENERATE ACCESS TOKEN
        // ==========================================

        const accessToken = generateAccessToken(user);


        // ==========================================
        // LOGIN RESPONSE
        // ==========================================

        return res.status(200).json({

            success: true,

            message: "Login successful",

            accessToken,

            user: {

                id: user._id,

                fullName: user.fullName,

                email: user.email,

                phoneNumber: user.phoneNumber,

                profileImage: user.profileImage,

                role: user.role,

                address: user.address,

                city: user.city,

                postalCode: user.postalCode,

                householdMembersCount: user.householdMembersCount,

                preferredLanguage: user.preferredLanguage,

                location: user.location,

                isActive: user.isActive

            }

        });


    } catch (error) {

        console.error("Login Error:", error);


        return res.status(500).json({

            success: false,

            message: "Failed to login",

            error: error.message

        });

    }

};

export const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user?.userId).select("-password");
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
        console.error("Get Current User Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve user profile",
            error: error.message
        });
    }
};

export const updateCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user?.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const { fullName, email, phoneNumber, address, city, postalCode } = req.body;

        if (fullName !== undefined) user.fullName = fullName;
        if (email !== undefined) {
            const normalizedEmail = email.trim().toLowerCase();
            const existingUser = await User.findOne({
                email: normalizedEmail,
                _id: { $ne: user._id }
            });
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: "Email is already registered"
                });
            }
            user.email = normalizedEmail;
        }
        if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
        if (address !== undefined) user.address = address;
        if (city !== undefined) user.city = city;
        if (postalCode !== undefined) user.postalCode = postalCode;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                phoneNumber: user.phoneNumber,
                address: user.address,
                city: user.city,
                postalCode: user.postalCode,
                role: user.role,
                location: user.location,
                isActive: user.isActive
            }
        });
    } catch (error) {
        console.error("Update Current User Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update profile",
            error: error.message
        });
    }
};