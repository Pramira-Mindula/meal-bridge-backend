import FoodRequest from "../Models/FoodRequest.js";
import Donation from "../Models/Donation.js";
import User from "../Models/User.js";

 
export const createFoodRequest = async (req, res) => {
    try {

        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }


       
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }


        if (user.role !== "RECIPIENT") {
            return res.status(403).json({
                success: false,
                message: "Only recipients can request food"
            });
        }

 
        const {
            donationId,
            quantityRequested,
            message
        } = req.body;


        if (!donationId || !quantityRequested) {
            return res.status(400).json({
                success: false,
                message: "Donation ID and quantity are required"
            });
        }

 
        const donation = await Donation.findById(
            donationId
        );

        if (!donation) {
            return res.status(404).json({
                success: false,
                message: "Donation not found"
            });
        }

 
        if (donation.status !== "AVAILABLE") {
            return res.status(400).json({
                success: false,
                message: "This donation is no longer available"
            });
        }


     
        if (
            donation.availableUntil &&
            new Date(donation.availableUntil) <= new Date()
        ) {
            return res.status(400).json({
                success: false,
                message: "This donation has expired"
            });
        }

 

        const requestedQuantity = Number(
            quantityRequested
        );

        if (
            !Number.isInteger(requestedQuantity) ||
            requestedQuantity < 1
        ) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be a positive whole number"
            });
        }


        if (requestedQuantity > donation.quantity) {
            return res.status(400).json({
                success: false,
                message: "Requested quantity exceeds available quantity"
            });
        }

 
        const existingRequest =
            await FoodRequest.findOne({
                recipient: userId,
                donation: donationId,
                status: "PENDING"
            });


        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message: "You already have a pending request for this donation"
            });
        }

 
        const foodRequest = await FoodRequest.create({

            recipient: userId,

            donation: donationId,

            quantityRequested:
                requestedQuantity,

            message,

            status: "PENDING"
        });

 
        await foodRequest.populate([
            {
                path: "recipient",
                select: "fullName email phoneNumber profileImage"
            },
            {
                path: "donation",
                select:
                    "foodName description category quantity quantityUnit foodImage pickupAddress pickupLocation status"
            }
        ]);


        return res.status(201).json({
            success: true,
            message: "Food request created successfully",
            foodRequest
        });

    } catch (error) {

        console.error(
            "Create Food Request Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to create food request",
            error: error.message
        });
    }
};



 

export const getMyFoodRequests = async (req, res) => {
    try {

        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }


        const requests = await FoodRequest.find({
            recipient: userId
        })
            .populate(
                "donation",
                "foodName description category quantity quantityUnit foodImage pickupAddress pickupLocation status"
            )
            .populate(
                "recipient",
                "fullName email phoneNumber"
            )
            .sort({
                createdAt: -1
            });


        return res.status(200).json({
            success: true,
            count: requests.length,
            requests
        });

    } catch (error) {

        console.error(
            "Get My Food Requests Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve your requests",
            error: error.message
        });
    }
};



 
export const getFoodRequestById = async (req, res) => {
    try {

        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }


        const { id } = req.params;


        const request = await FoodRequest.findById(id)
            .populate(
                "recipient",
                "fullName email phoneNumber profileImage"
            )
            .populate(
                "donation",
                "foodName description category quantity quantityUnit foodImage pickupAddress pickupLocation status donor"
            );


        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Food request not found"
            });
        }


     

        const isRecipient =
            request.recipient._id.toString() ===
            userId.toString();


        const donationOwner =
            request.donation?.donor?.toString() ===
            userId.toString();


        if (!isRecipient && !donationOwner) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to view this request"
            });
        }


        return res.status(200).json({
            success: true,
            request
        });

    } catch (error) {

        console.error(
            "Get Food Request Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve food request",
            error: error.message
        });
    }
};



 

export const getRequestsForMyDonations = async (
    req,
    res
) => {
    try {

        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }


        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }


        if (user.role !== "DONOR") {
            return res.status(403).json({
                success: false,
                message: "Only donors can view donation requests"
            });
        }

 

        const donations = await Donation.find({
            donor: userId
        }).select("_id");


        const donationIds =
            donations.map(
                donation => donation._id
            );


      

        const requests =
            await FoodRequest.find({
                donation: {
                    $in: donationIds
                }
            })
                .populate(
                    "recipient",
                    "fullName email phoneNumber profileImage"
                )
                .populate(
                    "donation",
                    "foodName category quantity quantityUnit foodImage pickupAddress pickupLocation status"
                )
                .sort({
                    createdAt: -1
                });


        return res.status(200).json({
            success: true,
            count: requests.length,
            requests
        });

    } catch (error) {

        console.error(
            "Get Donation Requests Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve donation requests",
            error: error.message
        });
    }
};



 

export const acceptFoodRequest = async (
    req,
    res
) => {
    try {

        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }


        const { id } = req.params;


        const request =
            await FoodRequest.findById(id)
                .populate("donation");


        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Food request not found"
            });
        }


       

        if (
            request.donation.donor.toString() !==
            userId.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "You can only manage requests for your donations"
            });
        }

 

        if (request.status !== "PENDING") {
            return res.status(400).json({
                success: false,
                message: "Only pending requests can be accepted"
            });
        }


         

        if (request.donation.status !== "AVAILABLE") {
            return res.status(400).json({
                success: false,
                message: "This donation is no longer available"
            });
        }

 

        if (
            request.quantityRequested >
            request.donation.quantity
        ) {
            return res.status(400).json({
                success: false,
                message: "Requested quantity is no longer available"
            });
        }

 

        request.status = "ACCEPTED";
        request.respondedAt = new Date();

        await request.save();


  

        request.donation.status = "CLAIMED";

        request.donation.claimedBy =
            request.recipient;

        request.donation.claimedAt =
            new Date();

        await request.donation.save();


     

        await FoodRequest.updateMany(
            {
                donation: request.donation._id,
                _id: {
                    $ne: request._id
                },
                status: "PENDING"
            },
            {
                $set: {
                    status: "REJECTED",
                    respondedAt: new Date()
                }
            }
        );


        await request.populate([
            {
                path: "recipient",
                select: "fullName email phoneNumber"
            },
            {
                path: "donation",
                select:
                    "foodName category quantity quantityUnit foodImage pickupAddress pickupLocation status claimedBy claimedAt"
            }
        ]);


        return res.status(200).json({
            success: true,
            message: "Food request accepted successfully",
            request
        });

    } catch (error) {

        console.error(
            "Accept Food Request Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to accept food request",
            error: error.message
        });
    }
};



 
export const rejectFoodRequest = async (
    req,
    res
) => {
    try {

        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }


        const { id } = req.params;


        const request =
            await FoodRequest.findById(id)
                .populate("donation");


        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Food request not found"
            });
        }


     
        if (
            request.donation.donor.toString() !==
            userId.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "You can only manage requests for your donations"
            });
        }


        if (request.status !== "PENDING") {
            return res.status(400).json({
                success: false,
                message: "Only pending requests can be rejected"
            });
        }


        request.status = "REJECTED";
        request.respondedAt = new Date();

        await request.save();


        return res.status(200).json({
            success: true,
            message: "Food request rejected successfully",
            request
        });

    } catch (error) {

        console.error(
            "Reject Food Request Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to reject food request",
            error: error.message
        });
    }
};


 
export const cancelFoodRequest = async (
    req,
    res
) => {
    try {

        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }


        const { id } = req.params;


        const request =
            await FoodRequest.findById(id);


        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Food request not found"
            });
        }

 

        if (
            request.recipient.toString() !==
            userId.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "You can only cancel your own requests"
            });
        }


        if (request.status !== "PENDING") {
            return res.status(400).json({
                success: false,
                message: "Only pending requests can be cancelled"
            });
        }


        request.status = "CANCELLED";

        await request.save();


        return res.status(200).json({
            success: true,
            message: "Food request cancelled successfully",
            request
        });

    } catch (error) {

        console.error(
            "Cancel Food Request Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to cancel food request",
            error: error.message
        });
    }
};