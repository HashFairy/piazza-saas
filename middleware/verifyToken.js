const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

/*

Middleware function that authenticates incoming requests by checking for a valid JWT token
This authentication allows verified users to access to protected routes if the token is valid.

*/
dotenv.config();

const auth = (req, res, next) => {
    console.log("Authenticating request...");


    const authHeader = req.header('Authorization');
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7).trim();
    }

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    console.log("Token found. Verifying...");

    try {
        req.user = jwt.verify(token, process.env.TOKEN_SECRET);
        next();

    } catch (err) {
        console.error("Invalid token. Authentication failed:", err.message);
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' });
        }
        res.status(400).json({ message: 'Invalid token' });
    }
};

module.exports = auth;

