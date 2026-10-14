import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "./Configs/db.js";
import authRoutes from "./Routes/authRoutes.js";
import donationRoutes from "./Routes/donationRoutes.js";
import requestRoutes from "./Routes/requestRoutes.js";
import deliveryRoutes from "./Routes/deliveryRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.json({
        message: "Food Sharing Backend API is running!"
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/foodrequests", requestRoutes);
app.use("/api/delivery", deliveryRoutes);
app.use("/api/deliveries", deliveryRoutes);

const PORT = process.env.PORT || 5003;

try {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
} catch (error) {
    console.error(`Server startup failed: ${error.message}`);
    process.exitCode = 1;
}