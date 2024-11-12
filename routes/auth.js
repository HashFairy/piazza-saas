const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = require('../models/User');
const dotenv = require('dotenv')
const {registerValidation,loginValidation} = require('../validations/validation')
dotenv.config();

// Register User

router.post('/register',
    async (req, res) => {
        try {
            // validate user input
            const {error} = registerValidation(req.body);
            if (error)
                return res.status(400).json({message: error.details[0].message});

            // Check if user already exists
            const existingUser = await User.findOne({ email: req.body.email});
            if(existingUser) return res.status(400).json({message: 'User already exists'});

            // hash the password
            const hashedPassword = await bcrypt.hash(req.body.password, 10);

            // Create a new user
            const newUser = new User({
                name: req.body.name,
                email: req.body.email,
                password: hashedPassword,
            });

            // Save user to the database
            const savedUser = await newUser.save();
            res.status(201).json({ message: 'User registered successfully', userId: savedUser._id});
        }catch (err) {
            res.status(500).json({ message:'Error occurred when registering user', error: err.message})
        }
    });
    // Login User
    router.post('/login', async (req, res) => {
        try {
            // Validate user input
            const {error} = loginValidation(req.body);
            if (error) return res.status(400).json({message: error.details[0].message});

            //check if user exist
            const user = await User.findOne({email: req.body.email})
            if (error) return res.status(400).json({message: 'Invalid Credentials'});

            // Validate password
            const isMatch = await bcrypt.compare(req.body.password, user.password);
            if (!isMatch) return res.status(400).json({message: 'Invalid credentials'});


            //Generate JWT token
            const token = jwt.sign({userId: user._id}, process.env.TOKEN_SECRET, {expiresIn: '1h'});
            res.json({token});
        } catch (err) {
            res.status(500).json({message: 'server error', error: err.message});
        }

        // Google OAuth
        router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

        router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/' }), (req, res) => {
            res.send('Successfully logged in with Google!');
        });

        // Facebook OAuth

        router.get('/facebook', passport.authenticate('facebook', {scope: ['email']}));

        router.get('/facebook/callback', passport.authenticate('facebook', {failureRedirect: '/'}), (req, res) => {
            res.send('Successfully logged in with Facebook!')

        });
    })
        module.exports = router;