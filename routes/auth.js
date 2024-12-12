const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('../models/User');
const { registerValidation, loginValidation } = require('../validations/validation');

dotenv.config();


// Register User
router.post('/register', async (req, res) => {
    try {

        const { error } = registerValidation(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });


        let user = await User.findOne({ email: req.body.email });
        if (user) {

            if (!user.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(req.body.password, salt);
                user.name = req.body.name || user.name; // Update name if provided
                await user.save();
                return res.status(200).json({ message: 'Password set successfully', user });
            } else {
                return res.status(400).json({ message: 'User already exists' });
            }
        } else {

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(req.body.password, salt);
            const newUser = new User({
                name: req.body.name,
                email: req.body.email,
                password: hashedPassword
            });
            const savedUser = await newUser.save();
            res.status(201).json({ message: 'User registered successfully', user: savedUser });
        }
    } catch (err) {
        res.status(500).json({ message: 'Error occurred when registering user', error: err.message });
    }
});

// Login User
router.post('/login', async (req, res) => {
    try {

        const { error } = loginValidation(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });


        const user = await User.findOne({ email: req.body.email });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });


        const isMatch = await bcrypt.compare(req.body.password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        // Generate JWT token
        const token = jwt.sign({ userId: user._id }, process.env.TOKEN_SECRET, { expiresIn: '4h' });
        res.json({ message: 'Login successful', token, user: { id: user._id, name: user.name, email: user.email } });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Start Google OAuth login process
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false

}));


// Google OAuth redirect
router.get('/google/redirect', passport.authenticate('google', { session: false, failureRedirect: '/' }), (req, res) => {
    const { user } = req;

    const token = jwt.sign({ userId: user._id }, process.env.TOKEN_SECRET, { expiresIn: '4h' });
    res.json({ message: 'Successfully logged in with Google!', token, user });
});


module.exports = router;