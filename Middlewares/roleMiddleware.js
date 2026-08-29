// ============================================================
// roleMiddleware.js
//
// Factory middleware that checks req.user.role against the
// allowed roles list.  Must run AFTER authMiddleware so that
// req.user is already populated.
//
// Usage:
//   router.get("/path", authMiddleware, requireRole("VOLUNTEER"), handler);
//   router.get("/path", authMiddleware, requireRole("ADMIN", "VOLUNTEER"), handler);
// ============================================================

const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        const role = req.user?.role;

        if (!role) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        if (!allowedRoles.includes(role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required role: ${allowedRoles.join(" or ")}`
            });
        }

        next();
    };
};

export default requireRole;
