import mongoose from "mongoose";

const donationSchema = new mongoose.Schema(
    {
      
        donor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

     
        foodName: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            trim: true
        },

        category: {
            type: String,
            required: true,
            enum: [
                "COOKED_FOOD",
                "PACKAGED_FOOD",
                "FRUITS",
                "VEGETABLES",
                "BAKERY",
                "BEVERAGES",
                "OTHER"
            ]
        },

        quantity: {
            type: Number,
            required: true,
            min: 1
        },

        quantityUnit: {
            type: String,
            required: true,
            enum: [
                "PORTIONS",
                "KG",
                "LITERS",
                "PACKETS",
                "ITEMS"
            ]
        },

  
        foodImage: {
            url: {
                type: String,
                default: null
            },

            publicId: {
                type: String,
                default: null
            }
        },

  
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

    
        availableFrom: {
            type: Date,
            required: true
        },

        availableUntil: {
            type: Date,
            required: true
        },

  
        status: {
            type: String,
            enum: [
                "AVAILABLE",
                "RESERVED",
                "CLAIMED",
                "COMPLETED",
                "CANCELLED",
                "EXPIRED"
            ],
            default: "AVAILABLE"
        },

      
        claimedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        claimedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);


// checking default statuses
donationSchema.statics.getDefaultStatus = function() {
    return "AVAILABLE";
};

//UI integration purposes
// Formats donation data for a Reusable Donation Card component
donationSchema.methods.toDonationCardFormat = function() {
    return {
        title: this.foodName,
        category: this.category,
        expiresAt: this.availableUntil // Facilitates date filtering display
    };
};

// UI utility: Check if the donation has already expired
donationSchema.methods.isExpired = function() {
    return new Date() > this.availableUntil;
};

// UI utility: Check if the donation can be cancelled
donationSchema.methods.canBeCancelled = function() {
    return this.status === "AVAILABLE" || this.status === "RESERVED";
};

// virtual property for UI component rendering
donationSchema.virtual('isUrgent').get(function() {
    // Stub implementation
    return false; 
});

const Donation = mongoose.model("Donation", donationSchema);

// Exporting Donation model for use in controllers
export default Donation;