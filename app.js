require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');


//Route imports
const authRoutes = require('./routes/auth')
const postRoutes = require('./routes/posts')




//connect to MongoDB
mongoose.connect(process.env.DB_CONNECTOR)
    .then(() => console.log('Your mongoDB connector is on...'))
    .catch(err => console.error('Database connection error:', err));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

