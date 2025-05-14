const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  patientId: { 
    type: String, 
    unique: true,
    required: true,
    default: function() {
      return 'PENDING_' + new mongoose.Types.ObjectId().toString();
    }
  },
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

// Hospital code mapping
const hospitalCodes = {
  'Manipal Hospital': 'MA',
  'Genesis Hospital': 'GE',
  'Fortis Hospital': 'FO',
  'Apollo Hospital': 'AP',
  'Ruby General Hospital': 'RU'
};

// Department code mapping
const departmentCodes = {
  'ortho': 'OR',
  'cardio': 'CA',
  'neuro': 'NE',
  'onco': 'ON',
  'general': 'GE'
};

// Generate patient ID
patientSchema.statics.generatePatientId = async function(department, hospital) {
  const deptCode = departmentCodes[department];
  const hospCode = hospitalCodes[hospital];
  
  if (!deptCode || !hospCode) {
    throw new Error('Invalid department or hospital code');
  }

  // Find the latest patient with the same department and hospital
  const latestPatient = await this.findOne({
    department,
    hospital,
    patientId: { $not: /^PENDING_/ } // Exclude temporary IDs
  }).sort({ patientId: -1 });

  let number = 1;
  if (latestPatient && latestPatient.patientId) {
    // Extract the number from the existing ID and increment
    const currentNumber = parseInt(latestPatient.patientId.slice(-3));
    if (!isNaN(currentNumber)) {
      number = currentNumber + 1;
    }
  }

  // Format: [DEPT][HOSP][NUMBER] (e.g., NEMA001)
  return `${deptCode}${hospCode}${number.toString().padStart(3, '0')}`;
};

// Pre-save middleware to generate patient ID
patientSchema.pre('save', async function() {
  try {
    // Only generate a new ID if we have a temporary one
    if (this.patientId && this.patientId.startsWith('PENDING_')) {
      if (!this.department || !this.hospital) {
        throw new Error('Department and hospital are required for patient ID generation');
      }
      const generatedId = await this.constructor.generatePatientId(this.department, this.hospital);
      this.patientId = generatedId;
    }
  } catch (error) {
    throw new Error(`Failed to generate patient ID: ${error.message}`);
  }
});

module.exports = mongoose.model('Patient', patientSchema);