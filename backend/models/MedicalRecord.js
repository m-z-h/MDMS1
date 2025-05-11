const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  data: { type: String, required: true }, // Encrypted JSON string
  iv: { type: String, required: true }, // Base64 IV
  hospital: { type: String, enum: ['hospital1', 'hospital2', 'hospital3', 'hospital4', 'hospital5'], required: true },
  department: { type: String, enum: ['ortho', 'cardio', 'neuro', 'onco', 'general'], required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);