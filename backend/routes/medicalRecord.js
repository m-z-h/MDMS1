const express = require('express');
const MedicalRecord = require('../models/MedicalRecord');
const PatientAssignment = require('../models/PatientAssignment');
const auth = require('../middleware/auth');
const { checkAccess, checkPatientAccess } = require('../middleware/roleAccess');
const { encryptData, decryptData } = require('../utils/abe');
const { generateMedicalRecordPDF } = require('../utils/pdfGenerator');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Create medical record (doctor only)
router.post('/', auth(['doctor']), checkPatientAccess, async (req, res) => {
  const { patientId, data, recordType } = req.body;

  try {
    if (!data || !recordType) {
      return res.status(400).json({ message: 'Data and record type are required' });
    }

    // Encrypt the data
    const { encryptedData, iv } = encryptData(data);

    const record = new MedicalRecord({
      patientId: req.patient._id,
      encryptedData,
      iv,
      recordType,
      hospital: req.patient.hospital,
      department: req.patient.department,
      createdBy: req.user.id
    });

    await record.save();
    res.status(201).json({ message: 'Medical record created successfully' });
  } catch (error) {
    console.error('Create medical record error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get medical records for a patient
router.get('/patient/:patientId', auth(['doctor', 'nurse', 'patient']), checkPatientAccess, async (req, res) => {
  try {
    let records = await MedicalRecord.find({ patientId: req.patient._id })
      .sort({ createdAt: -1 });

    // For nurses, check if they are assigned to this patient
    if (req.user.role === 'nurse') {
      const assignment = await PatientAssignment.findOne({
        nurseId: req.user.id,
        patientId: req.patient._id,
        active: true
      });

      if (!assignment) {
        return res.status(403).json({ message: 'Access denied: Patient not assigned to you' });
      }
    }

    // Decrypt and filter records based on role
    const decryptedRecords = records.map(record => {
      try {
        if (!record.encryptedData || !record.iv) {
          console.error('Missing data:', { id: record._id, hasEncryptedData: !!record.encryptedData, hasIV: !!record.iv });
          return {
            _id: record._id,
            error: 'Record data is corrupted'
          };
        }

        const decryptedData = decryptData(record.encryptedData, record.iv);
        
        // Filter data based on role and record type
        let filteredData = decryptedData;

        if (req.user.role === 'patient') {
          // Patients can see basic info and download reports
          filteredData = {
            type: record.recordType,
            timestamp: record.createdAt,
            summary: decryptedData.summary || 'Record available',
            instructions: decryptedData.instructions,
            medications: decryptedData.medications,
            reportUrl: decryptedData.reportUrl
          };
        } else if (req.user.role === 'nurse') {
          // Nurses can see vitals and care instructions
          if (record.recordType === 'vitals') {
            filteredData = decryptedData;
          } else {
            filteredData = {
              type: record.recordType,
              timestamp: record.createdAt,
              summary: decryptedData.summary,
              vitals: decryptedData.vitals,
              instructions: decryptedData.instructions,
              medications: decryptedData.medications
            };
          }
        }
        // Doctors can see everything (no filtering needed)

        return {
          _id: record._id,
          patientId: record.patientId,
          recordType: record.recordType,
          hospital: record.hospital,
          department: record.department,
          createdAt: record.createdAt,
          createdBy: record.createdBy,
          data: filteredData
        };
      } catch (err) {
        console.error('Decryption error for record', record._id, ':', err.message);
        return {
          _id: record._id,
          error: `Failed to decrypt record: ${err.message}`
        };
      }
    });

    res.json(decryptedRecords);
  } catch (error) {
    console.error('Get medical records error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update vitals (nurse only)
router.post('/vitals/:patientId', auth(['nurse']), checkPatientAccess, async (req, res) => {
  try {
    const { vitals } = req.body;
    if (!vitals) {
      return res.status(400).json({ message: 'Vitals data is required' });
    }

    // Check if nurse is assigned to this patient
    const assignment = await PatientAssignment.findOne({
      nurseId: req.user.id,
      patientId: req.patient._id,
      active: true
    });

    if (!assignment) {
      return res.status(403).json({ message: 'Access denied: Patient not assigned to you' });
    }

    // Create a new medical record for vitals
    const data = {
      type: 'vitals',
      vitals,
      timestamp: new Date()
    };

    // Encrypt the vitals data
    const { encryptedData, iv } = encryptData(data);

    const record = new MedicalRecord({
      patientId: req.patient._id,
      encryptedData,
      iv,
      recordType: 'vitals',
      hospital: req.patient.hospital,
      department: req.patient.department,
      createdBy: req.user.id
    });

    await record.save();
    res.status(201).json({ message: 'Vitals updated successfully' });
  } catch (error) {
    console.error('Update vitals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Download medical record PDF
router.get('/download/:recordId', auth(['doctor', 'nurse', 'patient']), async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.recordId)
      .populate('patientId', 'name email department hospital');

    if (!record) {
      return res.status(404).json({ message: 'Medical record not found' });
    }

    // Check access permissions
    if (req.user.role === 'patient' && record.patientId._id.toString() !== req.user.patientId) {
      return res.status(403).json({ message: 'Access denied: Not your medical record' });
    }

    if ((req.user.role === 'doctor' || req.user.role === 'nurse') && 
        record.department !== req.user.department) {
      return res.status(403).json({ message: 'Access denied: Record not in your department' });
    }

    // For nurses, check if they are assigned to this patient
    if (req.user.role === 'nurse') {
      const assignment = await PatientAssignment.findOne({
        nurseId: req.user.id,
        patientId: record.patientId._id,
        active: true
      });

      if (!assignment) {
        return res.status(403).json({ message: 'Access denied: Patient not assigned to you' });
      }
    }

    // Decrypt the record data
    const decryptedData = decryptData(record.encryptedData, record.iv);

    // Generate PDF
    const pdfDir = path.join(__dirname, '..', 'pdfs');
    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }

    const filename = `medical_record_${record._id}_${Date.now()}.pdf`;
    const pdfPath = path.join(pdfDir, filename);

    await generateMedicalRecordPDF(record, decryptedData, pdfPath);

    // Send the file
    res.download(pdfPath, filename, (err) => {
      if (err) {
        console.error('Download error:', err);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Error downloading file' });
        }
      }
      // Delete the file after sending
      fs.unlink(pdfPath, (unlinkErr) => {
        if (unlinkErr) console.error('Error deleting PDF:', unlinkErr);
      });
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Edit medical record (doctors only)
router.put('/:recordId', auth(['doctor']), async (req, res) => {
  try {
    const { data } = req.body;
    if (!data) {
      return res.status(400).json({ message: 'Record data is required' });
    }

    const record = await MedicalRecord.findById(req.params.recordId)
      .populate('patientId', 'department hospital');

    if (!record) {
      return res.status(404).json({ message: 'Medical record not found' });
    }

    if (record.department !== req.user.department) {
      return res.status(403).json({ message: 'Access denied: Record not in your department' });
    }

    // Encrypt the updated data
    const { encryptedData, iv } = encryptData(data);

    record.encryptedData = encryptedData;
    record.iv = iv;
    record.updatedAt = Date.now();
    record.updatedBy = req.user.id;

    await record.save();
    res.json({ message: 'Medical record updated successfully' });
  } catch (error) {
    console.error('Update medical record error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;