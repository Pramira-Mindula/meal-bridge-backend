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
    url: {
        type: String,
        default: null
    },

    publicId: {
        type: String,
        default: null
    }
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

        city: {
            type: String,
            trim: true
        },

        postalCode: {
            type: String,
            trim: true
        },

        householdMembersCount: {
            type: Number,
            min: 1,
            default: 1
        },

        preferredLanguage: {
            type: String,
            enum: ["en", "si", "ta"],
            default: "en"
        },

        dietaryPreferences: {
            type: [String],
            default: []
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