import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "./Configs/db.js";

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


 
const PORT = process.env.PORT || 5003;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});