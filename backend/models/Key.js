const mongoose = require('mongoose');

const keySchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  hospital: { type: String, required: true },
  department: { type: String, required: true },
  key: { type: String, required: true }, // Base64 AES key
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Key', keySchema);