const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

function generatePatientPDF(patient, credentials, hospital, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      // Title
      doc.fontSize(20).text('Patient Registration Form', { align: 'center' });
      doc.moveDown();

      // Patient Details
      doc.fontSize(14).text('Patient Details', { underline: true });
      doc.fontSize(12).text(`Patient ID: ${patient._id}`);
      doc.text(`Name: ${patient.name}`);
      doc.text(`Email: ${patient.email}`);
      doc.text(`Date of Birth: ${new Date(patient.dob).toLocaleDateString()}`);
      doc.text(`Gender: ${patient.gender}`);
      doc.text(`Contact: ${patient.contact}`);
      doc.text(`Hospital: ${hospital}`);
      doc.text(`Department: ${patient.department}`);
      doc.text(`Registration Date: ${new Date(patient.createdAt).toLocaleDateString()}`);
      doc.text(`Registration Time: ${new Date(patient.createdAt).toLocaleTimeString()}`);
      doc.moveDown();

      // Login Credentials
      doc.fontSize(14).text('Login Credentials', { underline: true });
      doc.fontSize(12).text(`Email: ${credentials.email}`);
      doc.text(`Password: ${credentials.password}`);
      doc.moveDown();

      // Doctor Prescriptions
      doc.fontSize(14).text('Doctor Prescriptions', { underline: true });
      doc.fontSize(12).text(' ');
      doc.rect(doc.x, doc.y, 500, 100).stroke(); // Blank space for prescriptions
      doc.moveDown();

      // Note
      doc.fontSize(10).text(
        'Note: This PDF contains sensitive login credentials. Store securely and share only with authorized personnel.',
        { align: 'center' }
      );

      doc.end();
      stream.on('finish', () => resolve(outputPath));
      stream.on('error', (err) => reject(err));
    } catch (error) {
      reject(error);
    }
  });
}

const generateMedicalRecordPDF = async (record, decryptedData, outputPath) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const stream = fs.createWriteStream(outputPath);

      doc.pipe(stream);

      // Header
      doc.fontSize(20).text('Medical Record', { align: 'center' });
      doc.moveDown();

      // Patient Information
      doc.fontSize(14).text('Patient Information', { underline: true });
      doc.fontSize(12)
        .text(`Name: ${record.patientId.name}`)
        .text(`Hospital: ${record.hospital}`)
        .text(`Department: ${record.department}`)
        .text(`Record Type: ${record.recordType}`)
        .text(`Date: ${moment(record.createdAt).format('MMMM Do YYYY, h:mm:ss a')}`);
      doc.moveDown();

      // Record Details
      doc.fontSize(14).text('Record Details', { underline: true });
      doc.fontSize(12);

      // Format based on record type
      switch (record.recordType) {
        case 'vitals':
          if (decryptedData.vitals) {
            doc.text('Vital Signs:')
              .text(`Blood Pressure: ${decryptedData.vitals.bp || 'N/A'}`)
              .text(`Heart Rate: ${decryptedData.vitals.heartRate || 'N/A'} bpm`)
              .text(`Temperature: ${decryptedData.vitals.temperature || 'N/A'} °C`)
              .text(`Respiratory Rate: ${decryptedData.vitals.respiratoryRate || 'N/A'} /min`)
              .text(`Oxygen Saturation: ${decryptedData.vitals.oxygenSaturation || 'N/A'}%`);
          }
          break;

        case 'diagnosis':
          doc.text('Diagnosis:')
            .text(decryptedData.diagnosis || 'N/A')
            .moveDown()
            .text('Symptoms:')
            .text(decryptedData.symptoms || 'N/A')
            .moveDown()
            .text('Notes:')
            .text(decryptedData.notes || 'N/A');
          break;

        case 'prescription':
          doc.text('Medications:');
          if (Array.isArray(decryptedData.medications)) {
            decryptedData.medications.forEach(med => {
              doc.text(`- ${med.name}: ${med.dosage} ${med.frequency}`);
            });
          }
          doc.moveDown()
            .text('Instructions:')
            .text(decryptedData.instructions || 'N/A');
          break;

        case 'lab':
          doc.text('Lab Results:');
          if (Array.isArray(decryptedData.results)) {
            decryptedData.results.forEach(result => {
              doc.text(`${result.test}: ${result.value} ${result.unit || ''}`);
            });
          }
          doc.moveDown()
            .text('Comments:')
            .text(decryptedData.comments || 'N/A');
          break;

        default:
          Object.entries(decryptedData).forEach(([key, value]) => {
            if (typeof value === 'object') {
              doc.text(`${key}:`);
              Object.entries(value).forEach(([subKey, subValue]) => {
                doc.text(`  ${subKey}: ${subValue}`);
              });
            } else {
              doc.text(`${key}: ${value}`);
            }
          });
      }

      // Footer
      doc.moveDown()
        .fontSize(10)
        .text('This is a confidential medical record.', { align: 'center' })
        .text(`Generated on ${moment().format('MMMM Do YYYY, h:mm:ss a')}`, { align: 'center' });

      // Finalize PDF
      doc.end();

      stream.on('finish', () => {
        resolve();
      });

      stream.on('error', (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generatePatientPDF,
  generateMedicalRecordPDF
};