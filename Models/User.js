import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true,
            minlength: 6
        },

        phoneNumber: {
            type: String,
            trim: true
        },

        profileImage: {
            type: String,
            default: null
        },

        role: {
            type: String,
            required: true,
            enum: [
                "DONOR",
                "RECIPIENT",
                "VOLUNTEER",
                "ADMIN"
            ]
        },

        address: {
            type: String,
            trim: true
        },

        location: {
            latitude: {
                type: Number
            },

            longitude: {
                type: Number
            }
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

const User = mongoose.model("User", userSchema);

export default User;