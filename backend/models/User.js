const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function (value) {
        if (this.role === 'doctor' || this.role === 'nurse') {
          return /^[a-zA-Z0-9._%+-]+@(manipalhospital|genesishospital|fortishospital|apollohospital|rubyhospital)\.com$/.test(value);
        }
        return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);
      },
      message: 'Invalid email format or hospital domain for doctor/nurse'
    }
  },
  password: { type: String, required: true },
  role: { type: String, enum: ['doctor', 'nurse', 'patient'], required: true },
  hospital: { 
    type: String, 
    enum: ['Manipal Hospital', 'Genesis Hospital', 'Fortis Hospital', 'Apollo Hospital', 'Ruby General Hospital'], 
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