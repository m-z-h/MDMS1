import { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

function DoctorDashboard() {
  const { user, logoutUser } = useContext(AuthContext);
  const [patientId, setPatientId] = useState('');
  const [patientData, setPatientData] = useState(null);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [editForm, setEditForm] = useState({ name: '', email: '', dob: '', gender: '', contact: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [patients, setPatients] = useState([]);
  const navigate = useNavigate();

  // Fetch all patients in doctor's department
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/patient/hospital/${user.hospital}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setPatients(res.data);
      } catch (err) {
        console.error('Failed to fetch patients:', err);
      }
    };
    fetchPatients();
  }, [user.hospital]);

  const handleFetchPatient = async () => {
    try {
      // Fetch patient details
      const patientRes = await axios.get(`http://localhost:5000/api/patient/${patientId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setPatientData(patientRes.data);
      setEditForm({
        name: patientRes.data.name,
        email: patientRes.data.email,
        dob: patientRes.data.dob.split('T')[0],
        gender: patientRes.data.gender,
        contact: patientRes.data.contact,
      });

      // Fetch medical records
      const recordsRes = await axios.get(`http://localhost:5000/api/medical-record/patient/${patientId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setMedicalRecords(recordsRes.data);

      setError('');
      setSuccess('Patient details fetched successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch patient');
      setPatientData(null);
      setMedicalRecords([]);
      setSuccess('');
    }
  };

  const handleEditPatient = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`http://localhost:5000/api/patient/${patientId}`, editForm, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setPatientData(res.data.patient);
      setSuccess('Patient details updated successfully');
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update patient');
      setSuccess('');
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Logout failed');
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
        <h1 className="text-3xl font-bold">Doctor Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}
      {success && <p className="text-green-500 mb-4">{success}</p>}

      {/* Patient List */}
      <div className="bg-white p-6 rounded shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Your Patients</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {patients.map(patient => (
            <div 
              key={patient._id} 
              className="p-4 border rounded cursor-pointer hover:bg-gray-50"
              onClick={() => {
                setPatientId(patient._id);
                handleFetchPatient();
              }}
            >
              <p className="font-semibold">{patient.name}</p>
              <p className="text-sm text-gray-600">ID: {patient.patientId}</p>
              <p className="text-sm text-gray-600">Department: {patient.department}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Patient Search */}
      <div className="bg-white p-6 rounded shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Search Patient</h2>
        <div className="flex mb-4">
          <input
            type="text"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            placeholder="Enter Patient ID"
            className="w-full px-3 py-2 border rounded mr-2"
          />
          <button
            onClick={handleFetchPatient}
            className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
          >
            Search
          </button>
        </div>
      </div>

      {/* Patient Details and Records */}
      {patientData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Patient Details */}
          <div className="bg-white p-6 rounded shadow-md">
            <h2 className="text-xl font-semibold mb-4">Patient Details</h2>
            <div className="space-y-2">
              <p><strong>Patient ID:</strong> {patientData.patientId}</p>
              <p><strong>Name:</strong> {patientData.name}</p>
              <p><strong>Email:</strong> {patientData.email}</p>
              <p><strong>Date of Birth:</strong> {formatDate(patientData.dob)}</p>
              <p><strong>Gender:</strong> {patientData.gender}</p>
              <p><strong>Contact:</strong> {patientData.contact}</p>
              <p><strong>Hospital:</strong> {patientData.hospital}</p>
              <p><strong>Department:</strong> {patientData.department}</p>
            </div>

            <h3 className="text-lg font-semibold mt-6 mb-4">Edit Patient</h3>
            <form onSubmit={handleEditPatient}>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700">Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-gray-700">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-gray-700">Date of Birth</label>
                  <input
                    type="date"
                    value={editForm.dob}
                    onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-gray-700">Gender</label>
                  <select
                    value={editForm.gender}
                    onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700">Contact</label>
                  <input
                    type="text"
                    value={editForm.contact}
                    onChange={(e) => setEditForm({ ...editForm, contact: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
                  Update Patient
                </button>
              </div>
            </form>
          </div>

          {/* Medical Records */}
          <div className="bg-white p-6 rounded shadow-md">
            <h2 className="text-xl font-semibold mb-4">Medical Records</h2>
            <div className="space-y-4">
              {medicalRecords.length === 0 ? (
                <p>No medical records available.</p>
              ) : (
                medicalRecords.map((record, index) => (
                  <div key={record._id} className="border p-4 rounded">
                    <p className="font-semibold">Record #{index + 1}</p>
                    <p><strong>Date:</strong> {formatDate(record.createdAt)}</p>
                    {record.data?.type === 'vitals' ? (
                      <div>
                        <p className="font-semibold mt-2">Vitals:</p>
                        {Object.entries(record.data.vitals).map(([key, value]) => (
                          <p key={key}><strong>{key}:</strong> {value}</p>
                        ))}
                      </div>
                    ) : (
                      <>
                        {record.data?.diagnosis && (
                          <p><strong>Diagnosis:</strong> {record.data.diagnosis}</p>
                        )}
                        {record.data?.treatment && (
                          <p><strong>Treatment:</strong> {record.data.treatment}</p>
                        )}
                        {record.data?.prescription && (
                          <p><strong>Prescription:</strong> {record.data.prescription}</p>
                        )}
                        {record.data?.notes && (
                          <p><strong>Notes:</strong> {record.data.notes}</p>
                        )}
                      </>
                    )}
                    {record.data?.labReports && (
                      <div className="mt-2">
                        <p className="font-semibold">Lab Reports:</p>
                        {record.data.labReports.map((report, i) => (
                          <div key={i} className="ml-4">
                            <p><strong>Test:</strong> {report.test}</p>
                            <p><strong>Result:</strong> {report.result}</p>
                            <p><strong>Range:</strong> {report.range}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DoctorDashboard;