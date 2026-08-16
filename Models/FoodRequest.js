import mongoose from "mongoose";

const foodRequestSchema = new mongoose.Schema(
    {
        
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

      
        donation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Donation",
            required: true
        },

       
        quantityRequested: {
            type: Number,
            required: true,
            min: 1
        },

      
        message: {
            type: String,
            trim: true,
            maxlength: 500
        },
 
        status: {
            type: String,
            enum: [
                "PENDING",
                "ACCEPTED",
                "REJECTED",
                "CANCELLED",
                "COMPLETED"
            ],
            default: "PENDING"
        },

 
        respondedAt: {
            type: Date,
            default: null
        },

        completedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);


 
foodRequestSchema.index({
    recipient: 1
});

foodRequestSchema.index({
    donation: 1
});

foodRequestSchema.index({
    status: 1
});


const FoodRequest = mongoose.model(
    "FoodRequest",
    foodRequestSchema
);

export default FoodRequest;