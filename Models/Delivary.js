import mongoose from "mongoose";

const deliverySchema = new mongoose.Schema(
    {
        // ==========================================
        // FOOD REQUEST
        // ==========================================

        foodRequest: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "FoodRequest",
            required: true,
            unique: true
        },


        // ==========================================
        // DONATION
        // ==========================================

        donation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Donation",
            required: true
        },


        // ==========================================
        // RECIPIENT
        // ==========================================

        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },


        // ==========================================
        // VOLUNTEER
        // ==========================================

        volunteer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },


        // ==========================================
        // PICKUP INFORMATION
        // ==========================================

        pickupAddress: {
            type: String,
            required: true,
            trim: true
        },

        pickupLocation: {
            latitude: {
                type: Number,
                required: true
            },

            longitude: {
                type: Number,
                required: true
            }
        },


        // ==========================================
        // DELIVERY INFORMATION
        // ==========================================

        deliveryAddress: {
            type: String,
            required: true,
            trim: true
        },

        deliveryLocation: {
            latitude: {
                type: Number,
                required: true
            },

            longitude: {
                type: Number,
                required: true
            }
        },


        // ==========================================
        // DELIVERY STATUS
        // ==========================================

        status: {
            type: String,
            enum: [
                "PENDING",
                "ASSIGNED",
                "ACCEPTED",
                "PICKED_UP",
                "IN_TRANSIT",
                "DELIVERED",
                "CANCELLED"
            ],
            default: "PENDING"
        },


        // ==========================================
        // TIMESTAMPS FOR DELIVERY PROGRESS
        // ==========================================

        assignedAt: {
            type: Date,
            default: null
        },

        acceptedAt: {
            type: Date,
            default: null
        },

        pickedUpAt: {
            type: Date,
            default: null
        },

        deliveredAt: {
            type: Date,
            default: null
        },

        cancelledAt: {
            type: Date,
            default: null
        },


        // ==========================================
        // OPTIONAL DELIVERY NOTES
        // ==========================================

        notes: {
            type: String,
            trim: true,
            maxlength: 500
        }
    },
    {
        timestamps: true
    }
);

 
deliverySchema.index({
    volunteer: 1
});

deliverySchema.index({
    recipient: 1
});

deliverySchema.index({
    status: 1
});


const Delivery = mongoose.model(
    "Delivery",
    deliverySchema
);

export default Delivery;