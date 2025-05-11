const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function (value) {
        // Doctors and nurses must use hospital domain emails
        if (this.role === 'doctor' || this.role === 'nurse') {
          return /^[a-zA-Z0-9._%+-]+@(hospital1|hospital2|hospital3|hospital4|hospital5)\.com$/.test(value);
        }
        // Patients can use any valid email
        return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);
      },
      message: 'Invalid email format or hospital domain for doctor/nurse'
    }
  },
  password: { type: String, required: true },
  role: { type: String, enum: ['doctor', 'nurse', 'patient'], required: true },
  hospital: { 
    type: String, 
    enum: ['hospital1', 'hospital2', 'hospital3', 'hospital4', 'hospital5'], 
    required: function() { return this.role !== 'patient'; } 
  },
  department: { 
    type: String, 
    enum: ['ortho', 'cardio', 'neuro', 'onco', 'general'], 
    required: function() { return this.role !== 'patient'; } 
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);