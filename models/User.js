const mongoose = require('mongoose');

// Database schema for users supporting both local and Google authentication
const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,

    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,

    },
    googleId: {
        type: String,

    }
});

module.exports = mongoose.model('User', UserSchema);

