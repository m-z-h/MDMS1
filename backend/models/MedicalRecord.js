const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  encryptedData: { type: String, required: true }, // Encrypted data in hex format
  iv: { type: String, required: true }, // IV in hex format
  recordType: { 
    type: String, 
    enum: ['vitals', 'diagnosis', 'prescription', 'lab', 'general'],
    required: true 
  },
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
  createdAt: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedAt: { type: Date },
  editHistory: [{
    modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    modifiedAt: { type: Date },
    recordType: { type: String },
    summary: { type: String }
  }]
});

// Virtual for decrypted data (not stored in DB)
medicalRecordSchema.virtual('data').get(function() {
  if (this._decryptedData) {
    return this._decryptedData;
  }
  return null;
});

medicalRecordSchema.virtual('data').set(function(value) {
  this._decryptedData = value;
});

// Pre-save middleware to track updates
medicalRecordSchema.pre('save', function(next) {
  if (this.isModified('encryptedData') && !this.isNew) {
    this.editHistory = this.editHistory || [];
    this.editHistory.push({
      modifiedBy: this.updatedBy,
      modifiedAt: this.updatedAt || new Date(),
      recordType: this.recordType,
      summary: 'Record updated'
    });
  }
  next();
});

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);