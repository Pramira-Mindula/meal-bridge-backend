import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "./Configs/db.js";
import authRoutes from './Routes/authRoutes.js'
import donationRoutes from './Routes/donationRoutes.js'
import cloudinary from "./Utils/cloudinary.js";
import requestRoutes from './Routes/requestRoutes.js'
import deliveryRoutes from './Routes/deliveryRoutes.js'
import recipientRoutes from './Routes/recipientRoutes.js'
import donorRoutes from './Routes/donorRoutes.js'
import volunteerRoutes from './Routes/volunteerRoutes.js'
import adminRoutes from './Routes/adminRoutes.js'

dotenv.config();

const app = express();

 
connectDB();


 
app.use(cors());

app.use(express.json());

 
app.get("/", (req, res) => {
    res.json({
        message: "Food Sharing Backend API is running!"
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/foodrequests", requestRoutes);
app.use("/api/delivery", deliveryRoutes);
app.use("/api/recipients", recipientRoutes);
app.use("/api/donors", donorRoutes);
app.use("/api/volunteers", volunteerRoutes);
app.use("/api/admin", adminRoutes);
 
const PORT = process.env.PORT || 5003;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});