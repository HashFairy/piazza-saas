const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    topic: {
        type: String,
        enum:
            ['Politics', 'Health', 'Sport','Tech'],
        required: true
    },
    message: {
        type: Date,
        required: true
    },
    timestamp:{
        type:Date,
        default: Date.now
    },
    expirationTime:{
        type:Date,
        required:true
    },
    status:{
        type:String,
        enum:
            ['Live', 'Expired'],
        default: 'Live'
    },

    owner:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', required: true
    },
    likes:{
        type:String,
        default: 0
    },
    dislikes:{
        type: Number,
        default: 0
    },
    comments:[{
        user: String,
        message:String,
        timestamp: Date,
    }],
});

module.exports = mongoose.model('Post', PostSchema)