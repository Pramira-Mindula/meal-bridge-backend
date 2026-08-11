 
import bcrypt from "bcryptjs";
import User from "../Models/User.js";
import cloudinary from "../Utils/cloudinary.js";


 

const uploadToCloudinary = (fileBuffer) => {
    return new Promise((resolve, reject) => {

        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: "food-sharing/profile-images",
                resource_type: "image"
            },
            (error, result) => {

                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }

            }
        );

        uploadStream.end(fileBuffer);
    });
};

 

export const registerUser = async (req, res) => {

    try {

        const {
            fullName,
            email,
            password,
            phoneNumber,
            role,
            address,
            location
        } = req.body;


       
        if (!fullName || !email || !password || !role) {

            return res.status(400).json({
                success: false,
                message: "Full name, email, password and role are required"
            });

        }


         
        const existingUser = await User.findOne({ email });

        if (existingUser) {

            return res.status(409).json({
                success: false,
                message: "Email is already registered"
            });

        }

 

        const hashedPassword = await bcrypt.hash(password, 10);

 
        let profileImage = null;

        if (req.file) {

            const uploadResult = await uploadToCloudinary(
                req.file.buffer
            );

            profileImage = uploadResult.secure_url;

        }


      

        const user = await User.create({

            fullName,
            email,
            password: hashedPassword,
            phoneNumber,
            profileImage,
            role,
            address,
            location

        });


     

        const userResponse = {

            id: user._id,

            fullName: user.fullName,

            email: user.email,

            phoneNumber: user.phoneNumber,

            profileImage: user.profileImage,

            role: user.role,

            address: user.address,

            location: user.location,

            isActive: user.isActive

        };


        return res.status(201).json({

            success: true,

            message: "User registered successfully",

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

 

export const loginUser = async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;


     

        if (!email || !password) {

            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });

        }

 

        const user = await User.findOne({ email });

        if (!user) {

            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });

        }


       
        if (!user.isActive) {

            return res.status(403).json({
                success: false,
                message: "Your account has been deactivated"
            });

        }


    
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


 

        return res.status(200).json({

            success: true,

            message: "Login successful",

            user: {

                id: user._id,

                fullName: user.fullName,

                email: user.email,

                phoneNumber: user.phoneNumber,

                profileImage: user.profileImage,

                role: user.role,

                address: user.address,

                location: user.location

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
 
