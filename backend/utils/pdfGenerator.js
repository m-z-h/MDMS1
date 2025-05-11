const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

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

module.exports = { generatePatientPDF };