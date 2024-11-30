
const express = require('express');
const router = express.Router();
require('jsonwebtoken');
const Post = require('../models/Post');
const User = require('../models/User');
const dotenv = require('dotenv');
const auth = require('../middleware/verifyToken');

dotenv.config();

// Create Post
router.post('/', auth, async (req, res) => {

    const { title, topic, message, expirationTime } = req.body;

    try {
        const user = await User.findById(req.user.userId);
        const post = new Post({
            title,
            topic,
            message,
            expirationTime: Date.now() + expirationTime * 1000,
            readableExpirationTime: new Date(Date.now() + expirationTime * 1000).toISOString(),
            owner: req.user.userId,
            ownerName: user.name,
            timestamp: Date.now(),
            status: 'Live',
            likes: 0,
            dislikes: 0,
            comments: []
        });


        await post.save();
        res.status(201).json(post);
    } catch (err) {
        console.error("Error occurred while creating post:", err.message);
        res.status(400).json({ message: 'Error creating post', error: err.message });
    }
});

// Like a Post
router.post('/:postId/like', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }


        if (post.expirationTime <= Date.now()) {
            return res.status(400).json({ message: 'Post has expired and cannot be liked' });
        }



        if (!message || message.trim() === '') {
            return res.status(400).json({ message: 'Comment message is required.' });
        }


        post.comments.push({ user: req.user.userId, message });
        await post.save();


        if (post.owner.toString() === req.user.userId) {
            return res.status(400).json({ message: 'You cannot like your own post.' });
        }

        post.likes += 1;
        await post.save();

        res.status(200).json({ message: 'Post liked successfully', likes: post.likes });
    } catch (err) {
        console.error("Error occurred while liking post:", err.message);
        res.status(500).json({ message: 'Error occurred while liking post', error: err.message });
    }
});



// Dislike a Post
router.post('/:postId/dislike', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }


        if (post.expirationTime <= Date.now()) {
            return res.status(400).json({ message: 'Post has expired and cannot be disliked' });
        }

        post.dislikes += 1;
        await post.save();

        res.status(200).json({ message: 'Post disliked successfully', dislikes: post.dislikes });
    } catch (err) {
        console.error("Error occurred while disliking post:", err.message);
        res.status(500).json({ message: 'Error occurred while disliking post', error: err.message });
    }
});

// Comment on a Post
router.post('/:postId/comment', auth, async (req, res) => {
    console.log("Received request to comment on post with ID:", req.params.postId);

    const { message } = req.body;

    try {
        const post = await Post.findById(req.params.postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Check if post has expired
        if (post.expirationTime <= Date.now()) {
            return res.status(400).json({ message: 'Post has expired and cannot be commented on' });
        }

        post.comments.push({ user: req.user.userId, message });
        await post.save();

        console.log("Comment added successfully to post with ID:", post._id);
        res.status(200).json({ message: 'Comment added successfully', comments: post.comments });
    } catch (err) {
        console.error("Error occurred while commenting on post:", err.message);
        res.status(500).json({ message: 'Error occurred while commenting on post', error: err.message });
    }
});

// Get Posts by Topic
router.get('/:topic', auth, async (req, res) => {
    console.log("Received request to fetch posts by topic:", req.params.topic);

    try {

        let posts = await Post.find({
            topic: req.params.topic,
            expirationTime: { $gt: Date.now() },
        }).populate('comments.user', 'name email');


        posts = posts.map(post => {
            if (post.expirationTime <= Date.now() && post.status === 'Live') {
                post.status = 'Expired';
                post.save();
            }
            return post;
        });
        res.json(posts);
    } catch (err) {
        console.error("Error occurred while fetching posts:", err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});


// Get Post by ID (including populated comments)
router.get('/post/:postId', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId)
            .populate('comments.user', 'name email');

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        res.status(200).json(post);
    } catch (err) {
        console.error("Error occurred while fetching post:", err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});



// Get Expired Posts by Topic
router.get('/:topic/expired', auth, async (req, res) => {
    try {

        let posts = await Post.find({
            topic: req.params.topic,
            expirationTime: { $lte: Date.now() },
        });


        posts = posts.map(post => {
            if (post.expirationTime <= Date.now() && post.status === 'Live') {
                post.status = 'Expired';
                post.save();
            }
            return post;
        });

        res.json(posts);
    } catch (err) {
        console.error("Error occurred while fetching expired posts:", err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Get Recently Expired Posts by Topic
router.get('/:topic/recent-expired', auth, async (req, res) => {
    const recentExpirationWindow = 24 * 60 * 60 * 1000;

    try {

        const posts = await Post.find({
            topic: req.params.topic,
            expirationTime: { $lte: Date.now(), $gt: Date.now() - recentExpirationWindow },
        });

        res.json(posts);
    } catch (err) {
        console.error("Error occurred while fetching recently expired posts:", err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Get Post with Highest Interest (Likes + Dislikes)
router.get('/:topic/highest-engagement', auth, async (req, res) => {

    try {
        const post = await Post.find({ topic: req.params.topic, expirationTime: { $gt: Date.now() } })
            .sort({ likes: -1, dislikes: -1 })
            .limit(1);

        if (!post || post.length === 0) {
            return res.status(404).json({ message: 'No posts found with highest engagement' });
        }

        res.status(200).json(post[0]);
    } catch (err) {
        console.error("Error occurred while fetching post with highest engagement:", err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;
