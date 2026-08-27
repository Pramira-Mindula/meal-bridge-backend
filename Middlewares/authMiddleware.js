import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
    try {

        // Get Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Authentication token is required"
            });
        }


        // Extract token
        const token = authHeader.split(" ")[1];


        // Verify token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );


        // Attach decoded user to request
        req.user = decoded;


        next();
//catch any errors during token verification
    } catch (error) {

        console.error("Auth Middleware Error:", error);

        return res.status(401).json({
            success: false,
            message: "Invalid or expired authentication token"
        });
    }
};


export default authMiddleware;