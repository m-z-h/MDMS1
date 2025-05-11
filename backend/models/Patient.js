const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Please use a valid email']
  },
  dob: { type: Date, required: true },
  gender: { type: String, enum: ['male', 'female', 'other'], required: true },
  contact: { type: String, required: true },
  hospital: { 
    type: String, 
    enum: ['Manipal Hospital', 'Genesis Hospital', 'Fortis Hospital', 'Apollo Hospital', 'Ruby General Hospital'], 
    required: true 
  },
  department: { 
    type: String, 
    enum: ['ortho', 'cardio', 'neuro', 'onco', 'general'], 
    required: true 
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Patient', patientSchema);