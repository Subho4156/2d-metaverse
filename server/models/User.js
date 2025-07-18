const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    verified: { type: Boolean, default: false },
    otp: String,
    otpExpiry: Date,
    otpRequestedAt: Date, 
},{ timestamps : true });

module.exports = mongoose.model('User', userSchema);