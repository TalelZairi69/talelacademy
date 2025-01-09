const mongoose = require('mongoose'); // Ensure mongoose is imported
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: ['student', 'teacher', 'parent'], default: 'student' },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', UserSchema);
