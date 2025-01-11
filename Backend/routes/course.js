const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid'); // For generating unique course codes
const Course = require('../models/Course'); // Import Course model
const User = require('../models/User'); // Import User model
const verifyToken = require('../middleware/auth');

// Add Course Route
router.post('/add', verifyToken, async (req, res) => {
    const { subject, highschool, grade, type, section, group } = req.body;

    console.log('Received Payload:', { subject, highschool, grade, type, section, group }); // Debug log

    if (!subject || !grade || !type) {
        console.error('Missing required fields:', { subject, grade, type }); // Debug log
        return res.status(400).json({ message: 'All required fields must be filled.' });
    }

    if (type === 'groupe_d_etude' && (!section || !group)) {
        console.error('Missing fields for Groupe d\'Étude:', { section, group }); // Debug log
        return res.status(400).json({ message: 'Section and group are required for Groupe d\'Étude.' });
    }
    if (type === 'classe_de_lycee' && (!subject || !grade || !highschool || !section)) {
        console.error('Missing required fields for Classe de Lycée:', { subject, grade, highschool, section });
        return res.status(400).json({ message: 'All required fields must be filled for Classe de Lycée.' });
    }
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found.' });

       const course = new Course({
    subject,
    grade,
    type,
    highschool: type === 'classe_de_lycee' ? highschool : undefined,
    section: type === 'classe_de_lycee' || type === 'groupe_d_etude' ? section : undefined,
    group: type === 'groupe_d_etude' ? group : undefined,
    courseCode: uuidv4().split('-')[0],
    users: [{ userId: req.user.id, username: user.username, role: 'teacher' }],
});


        await course.save();
        res.status(201).json({ message: 'Course added successfully!', course });
    } catch (error) {
        console.error('Error adding course:', error); // Debug log
        res.status(500).json({ message: 'Failed to add course.' });
    }
});


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
// Fetch Joined Courses (Exclude Groupe d'Étude)
router.get('/my-courses', verifyToken, async (req, res) => {
    try {
        const courses = await Course.find({
            'users.userId': req.user.id,
            type: 'classe_de_lycee',
        }).select('subject courseCode highschool grade section users');

      
        const enrichedCourses = courses.map((course) => ({
            ...course.toObject(),
            teacher: course.users.find((user) => user.role === 'teacher')?.username || 'Unknown',
        }));

        res.status(200).json(enrichedCourses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch courses.' });
    }
});


// Fetch Students in Teacher's Class
router.get('/students', verifyToken, async (req, res) => {
    try {
        const courses = await Course.find({ 'users.userId': req.user.id, 'users.role': 'teacher' })
            .populate('users.userId', 'username email');

        const data = courses.map(course => ({
            courseName: course.subject,
            courseCode: course.courseCode,
            highschool: course.highschool || 'Non spécifié',
            section: course.section || 'Non spécifié',
            grade: course.grade || 'Non spécifié',
            teacher: course.users.find(user => user.role === 'teacher')?.username || 'Non spécifié',
            students: course.users
                .filter(user => user.role === 'student')
                .map(student => ({
                    username: student.userId?.username,
                    email: student.userId?.email,
                })),
        }));

        res.status(200).json({ data });
    } catch (error) {
        console.error('Failed to fetch students:', error);
        res.status(500).json({ message: 'Failed to fetch students.' });
    }
});

// Fetch Joined Groupe d'Étude Courses
router.get('/my-study-groups', verifyToken, async (req, res) => {
    try {
        const studyGroups = await Course.find({
            'users.userId': req.user.id,
            type: 'groupe_d_etude',
        }).select('subject courseCode section group grade users');

       
        const enrichedStudyGroups = studyGroups.map((course) => ({
            ...course.toObject(),
            teacher: course.users.find((user) => user.role === 'teacher')?.username || 'Unknown',
        }));

        res.status(200).json(enrichedStudyGroups);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch Groupe d\'Étude courses.' });
    }
});


module.exports = router;
