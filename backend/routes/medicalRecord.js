const express = require('express');
const MedicalRecord = require('../models/MedicalRecord');
const Patient = require('../models/Patient');
const auth = require('../middleware/auth');
const { encryptData, decryptData } = require('../utils/abe');
const router = express.Router();

// Create medical record (doctor or nurse)
router.post('/', auth(['doctor', 'nurse']), async (req, res) => {
  const { patientId, data, hospital, department } = req.body;

  try {
    if (!patientId || !data) {
      return res.status(400).json({ message: 'Patient ID and data are required' });
    }

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    if (patient.department !== req.user.department) {
      return res.status(403).json({ message: 'Unauthorized: Patient not in your department' });
    }

    // Encrypt sensitive data (e.g., vitals, prescriptions)
    const encryptedData = encryptData(JSON.stringify(data), {
      role: req.user.role,
      hospital,
      department
    });

    const record = new MedicalRecord({
      patientId,
      data: encryptedData,
      hospital,
      department,
      createdBy: req.user.id
    });

    await record.save();
    res.status(201).json({ message: 'Medical record created successfully' });
  } catch (error) {
    console.error('Create medical record error:', error.message, error.stack);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get medical records for a patient (doctor or patient)
router.get('/patient/:patientId', auth(['doctor', 'patient']), async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    if (req.user.role === 'patient' && patient.email !== req.user.email) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (req.user.role === 'doctor' && patient.department !== req.user.department) {
      return res.status(403).json({ message: 'Unauthorized: Patient not in your department' });
    }

    const records = await MedicalRecord.find({ patientId: req.params.patientId });

    // Decrypt data for authorized users
    const decryptedRecords = records.map(record => {
      try {
        const decryptedData = decryptData(record.data, {
          role: req.user.role,
          hospital: record.hospital,
          department: record.department
        });
        return {
          ...record._doc,
          data: JSON.parse(decryptedData)
        };
      } catch (err) {
        console.error('Decryption error:', err.message);
        return { ...record._doc, data: null, error: 'Failed to decrypt data' };
      }
    });

    res.json(decryptedRecords);
  } catch (error) {
    console.error('Get medical records error:', error.message, error.stack);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;