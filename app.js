require('dotenv').config();

// Import dependencies
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const morgan = require('morgan');
const passport = require('passport');

// Import configuration files
const configurePassport = require('./config/passport');
const verifyToken = require('./middleware/verifyToken');

// Middleware setup
app.use(morgan('dev'));
app.use(express.json());


// Configure and initialize Passport
configurePassport(passport);
app.use(passport.initialize());

// Route imports
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');

// Route setup
app.use('/api/auth', authRoutes);
app.use('/api/posts', verifyToken, postRoutes);

// Home route
app.get('/', (req, res) => {
    res.send('We live, baby!');
});



// Connect to MongoDB
mongoose.connect(process.env.DB_CONNECTOR)
    .then(() => console.log('MongoDB connected...'))
    .catch(err => {
        console.error('Database connection error:', err);
        process.exit(1);
    });

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
