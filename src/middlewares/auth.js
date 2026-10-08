import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

export const authMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization?.match(/^Bearer (\S+)$/i)?.[1];
        if (!token) return res.status(401).json({ message: "Authentication required" });

        if (!process.env.JWT_SECRET) return res.status(503).json({ message: 'Authentication is not configured' });
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!mongoose.isValidObjectId(decoded.id)) return res.status(401).json({ message: 'Invalid token' });
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

