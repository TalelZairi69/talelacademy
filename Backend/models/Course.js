const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const CourseSchema = new mongoose.Schema({
    subject: { type: String, required: true },
    highschool: { type: String, required: true },
    grade: { type: String, required: true },
    courseCode: {
        type: String,
        unique: true,
        required: true,
        default: () => uuidv4().split('-')[0],
    },
    users: [
        {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            username: { type: String, required: true },
            role: { type: String, required: true, enum: ['teacher', 'student'] }, // Add role field
        },
    ],
    createdAt: { type: Date, default: Date.now },
});


module.exports = mongoose.model('Course', CourseSchema);
