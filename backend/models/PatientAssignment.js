const mongoose = require('mongoose');

const patientAssignmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  nurseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  department: {
    type: String,
    enum: ['ortho', 'cardio', 'neuro', 'onco', 'general'],
    required: true
  },
  hospital: {
    type: String,
    enum: ['Manipal Hospital', 'Genesis Hospital', 'Fortis Hospital', 'Apollo Hospital', 'Ruby General Hospital'],
    required: true
  },
  assignedAt: {
    type: Date,
    default: Date.now
  },
  active: {
    type: Boolean,
    default: true
  }
});

// Index for efficient queries
patientAssignmentSchema.index({ patientId: 1, active: 1 });
patientAssignmentSchema.index({ nurseId: 1, active: 1 });
patientAssignmentSchema.index({ department: 1, hospital: 1 });

module.exports = mongoose.model('PatientAssignment', patientAssignmentSchema); 