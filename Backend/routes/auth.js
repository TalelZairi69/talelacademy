const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Replace with the correct path to your User model
const verifyToken = require('../middleware/auth');
// Signup Route
// Signup Route
router.post('/signup', async (req, res) => {
    const { username, email, password, role, invitationCode } = req.body;

    if (!username || !email || !password || !role) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    if (role === 'teacher' && invitationCode !== process.env.TEACHER_INVITATION_CODE) {
        return res.status(400).json({ message: 'Invalid invitation code.' });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword, role });
        await newUser.save();

        res.status(201).json({ message: 'Signup successful!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password.' });
        }

        // Compare passwords
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password.' });
        }

        // Generate JWT (you can customize the payload as needed)
        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' } // Token expires in 1 hour
        );

        res.status(200).json({ message: 'Login successful!', token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
});
// Dashboard Route
router.get('/dashboard', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1]; // Extract token
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify token
        const user = await User.findById(decoded.id).select('username role'); // Fetch user by ID
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.json(user); // Return user details
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch user details.' });
    }
});
router.get('/dashboard', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('username role'); // Include the role
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch user details.' });
    }
});

module.exports = router;
