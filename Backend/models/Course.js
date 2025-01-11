const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const CourseSchema = new mongoose.Schema({
    subject: { type: String, required: true },
    highschool: { type: String },
    grade: { type: String, required: true },
    type: { type: String, enum: ['classe_de_lycee', 'groupe_d_etude'], required: true },
    section: { type: String }, // Add section here
    group: { type: String },   
    courseCode: { type: String, unique: true, required: true, default: () => uuidv4().split('-')[0] },
    users: [
        {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            username: { type: String, required: true },
            role: { type: String, required: true, enum: ['teacher', 'student'] },
        },
    ],
    createdAt: { type: Date, default: Date.now },
});



module.exports = mongoose.model('Course', CourseSchema);
