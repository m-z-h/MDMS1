import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

function PatientDashboard() {
  const { user, logoutUser } = useContext(AuthContext);
  const [records, setRecords] = useState([]);
  const [patientDetails, setPatientDetails] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !user.email) {
        setError('User information not available');
        return;
      }

      try {
        // First get patient details using email
        const patientRes = await axios.get(`${API_ENDPOINTS.patient}/by-email/${user.email}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setPatientDetails(patientRes.data);

        // Then fetch medical records using the patient ID from the response
        if (patientRes.data._id) {
          const recordsRes = await axios.get(`${API_ENDPOINTS.medicalRecord}/patient/${patientRes.data._id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          });
          setRecords(recordsRes.data);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.response?.data?.message || 'Failed to fetch data');
      }
    };
    fetchData();
  }, [user]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login');
    } catch (err) {
      setError(err);
    }
  };

  const handleDownloadPDF = async () => {
    try {
            const response = await axios.get(        `${API_ENDPOINTS.patient}/pdf/${patientDetails._id}`,        {          headers: {             Authorization: `Bearer ${localStorage.getItem('token')}`           },          responseType: 'blob'        }
      );
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `patient-${patientDetails.patientId}.pdf`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      setError('Failed to download PDF');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Patient Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      
      {/* Patient Details Section */}
      {patientDetails && (
        <div className="bg-white p-6 rounded shadow-md mb-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold">Personal Information</h2>
            <button
              onClick={handleDownloadPDF}
              className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
            >
              Download PDF Report
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="mb-2"><strong>Patient ID:</strong> {patientDetails.patientId}</p>
              <p className="mb-2"><strong>Name:</strong> {patientDetails.name}</p>
              <p className="mb-2"><strong>Email:</strong> {patientDetails.email}</p>
              <p className="mb-2"><strong>Date of Birth:</strong> {formatDate(patientDetails.dob)}</p>
            </div>
            <div>
              <p className="mb-2"><strong>Contact:</strong> {patientDetails.contact}</p>
              <p className="mb-2"><strong>Gender:</strong> {patientDetails.gender}</p>
              <p className="mb-2"><strong>Department:</strong> {patientDetails.department}</p>
              <p className="mb-2"><strong>Hospital:</strong> {patientDetails.hospital}</p>
            </div>
          </div>
        </div>
      )}

      {/* Medical Records Section */}
      <div className="bg-white p-6 rounded shadow-md">
        <h2 className="text-xl font-semibold mb-4">Medical Records</h2>
        {records.length === 0 && <p>No records available.</p>}
        <div className="space-y-4">
          {records.map(record => (
            <div key={record._id} className="p-4 border rounded">
              <p className="mb-2"><strong>Date:</strong> {formatDate(record.createdAt)}</p>
              {record.data?.type === 'vitals' ? (
                <div>
                  <p className="font-semibold mb-2">Vitals:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(record.data.vitals).map(([key, value]) => (
                      <p key={key}><strong>{key}:</strong> {value}</p>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {record.data?.vitals && (
                    <div className="mb-2">
                      <p className="font-semibold">Vitals:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(record.data.vitals).map(([key, value]) => (
                          <p key={key}><strong>{key}:</strong> {value}</p>
                        ))}
                      </div>
                    </div>
                  )}
                  {record.data?.diagnosis && (
                    <p className="mb-2"><strong>Diagnosis:</strong> {record.data.diagnosis}</p>
                  )}
                  {record.data?.treatment && (
                    <p className="mb-2"><strong>Treatment:</strong> {record.data.treatment}</p>
                  )}
                  {record.data?.prescription && (
                    <p className="mb-2"><strong>Prescription:</strong> {record.data.prescription}</p>
                  )}
                </>
              )}
              {record.data?.labReports && (
                <div className="mt-2">
                  <p className="font-semibold">Lab Reports:</p>
                  {record.data.labReports.map((report, index) => (
                    <div key={index} className="ml-4 mt-2">
                      <p><strong>Test:</strong> {report.test}</p>
                      <p><strong>Result:</strong> {report.result}</p>
                      <p><strong>Range:</strong> {report.range}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PatientDashboard;