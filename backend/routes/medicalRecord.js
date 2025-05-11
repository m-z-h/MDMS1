const express = require('express');
const MedicalRecord = require('../models/MedicalRecord');
const Patient = require('../models/Patient');
const auth = require('../middleware/auth');
const { encryptData, decryptData } = require('../utils/abe');
const router = express.Router();

// Create medical record (doctor or nurse)
router.post('/', auth(['doctor', 'nurse']), async (req, res) => {
  const { patientId, data } = req.body;

  try {
    if (!patientId || !data) {
      return res.status(400).json({ message: 'Patient ID and data are required' });
    }

    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    if (patient.department !== req.user.department) {
      return res.status(403).json({ message: 'Unauthorized: Patient not in your department' });
    }

    const encryptedData = encryptData(data, process.env.ENCRYPTION_KEY);

    const record = new MedicalRecord({
      patientId,
      data: encryptedData,
      createdBy: req.user.id,
      hospital: patient.hospital,
      department: patient.department
    });

    await record.save();
    res.status(201).json({ message: 'Medical record created' });
  } catch (error) {
    console.error('Create medical record error:', error.message, error.stack);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get medical records by patient ID (doctor or patient)
router.get('/patient/:patientId', auth(['doctor', 'patient']), async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.patientId);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    if (req.user.role === 'patient' && patient.email !== req.user.email) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (req.user.role === 'doctor' && patient.department !== req.user.department) {
      return res.status(403).json({ message: 'Unauthorized: Patient not in your department' });
    }

    const records = await MedicalRecord.find({ patientId: req.params.patientId });
    const decryptedRecords = records.map(record => ({
      ...record._doc,
      data: decryptData(record.data, process.env.ENCRYPTION_KEY)
    }));

    res.json(decryptedRecords);
  } catch (error) {
    console.error('Get medical records error:', error.message, error.stack);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update medical record (doctor only)
router.put('/:id', auth(['doctor']), async (req, res) => {
  const { data } = req.body;

  try {
    if (!data) {
      return res.status(400).json({ message: 'Data is required' });
    }

    const record = await MedicalRecord.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Medical record not found' });

    const patient = await Patient.findById(record.patientId);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    if (patient.department !== req.user.department) {
      return res.status(403).json({ message: 'Unauthorized: Patient not in your department' });
    }

    record.data = encryptData(data, process.env.ENCRYPTION_KEY);
    record.updatedAt = new Date();
    await record.save();

    res.json({ message: 'Medical record updated' });
  } catch (error) {
    console.error('Update medical record error:', error.message, error.stack);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;