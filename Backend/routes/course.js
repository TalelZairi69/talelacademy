const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid'); // For generating unique course codes
const Course = require('../models/Course'); // Import Course model
const User = require('../models/User'); // Import User model
const verifyToken = require('../middleware/auth');

// Add Course Route
// Add Course Route
router.post('/add', verifyToken, async (req, res) => {
    const { subject, highschool, grade } = req.body;

    if (!subject || !highschool || !grade) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        // Find the user creating the course
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Create a new course and add the creator to the users array as a teacher
        let course = new Course({
            subject,
            highschool,
            grade,
            courseCode: uuidv4().split('-')[0], // Generate a unique short code
            users: [{ userId: req.user.id, username: user.username, role: 'teacher' }], // Add the creator as the teacher
        });

        console.log('Generated courseCode:', course.courseCode);

        await course.save();
        res.status(201).json({ message: 'Course added successfully!', course });
    } catch (error) {
        if (error.code === 11000) {
            console.error('Duplicate key error:', error);

            try {
                const retryCourse = new Course({
                    subject,
                    highschool,
                    grade,
                    courseCode: uuidv4().split('-')[0], // Generate a new unique code
                    users: [{ userId: req.user.id, username: user.username, role: 'teacher' }], // Add the creator as the teacher
                });

                console.log('Retrying with new courseCode:', retryCourse.courseCode);

                await retryCourse.save();
                res.status(201).json({ message: 'Course added successfully after retry!', retryCourse });
            } catch (retryError) {
                console.error('Retry failed:', retryError);
                res.status(500).json({ message: 'Failed to add course after retrying. Please try again.' });
            }
        } else {
            console.error('Error:', error);
            res.status(500).json({ message: 'Failed to add course.' });
        }
    }
});


// Join Course Route
// Join Course Route
router.post('/join', verifyToken, async (req, res) => {
    const { courseCode } = req.body;

    if (!courseCode) {
        return res.status(400).json({ message: 'Course code is required.' });
    }

    try {
        const course = await Course.findOne({ courseCode });

        if (!course) {
            return res.status(404).json({ message: 'Course not found.' });
        }

        // Check if user is already in the course
        const userAlreadyInCourse = course.users.some(user => user.userId.toString() === req.user.id);

        if (!userAlreadyInCourse) {
            // Fetch the user's details
            const user = await User.findById(req.user.id);

            if (!user) {
                return res.status(404).json({ message: 'User not found.' });
            }

            // Add the user to the course with the role of "student"
            course.users.push({ userId: req.user.id, username: user.username, role: 'student' });
            await course.save();
        }

        res.status(200).json({ message: 'Successfully joined the course.', course });
    } catch (error) {
        console.error('Error while joining the course:', error);
        res.status(500).json({ message: 'Failed to join course.' });
    }
});

// Fetch Joined Courses
router.get('/my-courses', verifyToken, async (req, res) => {
    try {
        const courses = await Course.find({ 'users.userId': req.user.id }).select('subject courseCode highschool grade users');
        const enrichedCourses = courses.map(course => {
            // Find the teacher from the course's users array
            const teacher = course.users.find(user => user.role === 'teacher');
            return {
                ...course.toObject(),
                teacher: teacher ? teacher.username : 'Unknown', // Include teacher's username
            };
        });
        res.status(200).json(enrichedCourses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch courses.' });
    }
});


module.exports = router;
