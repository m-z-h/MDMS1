import { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

function DoctorDashboard() {
  const { user, logoutUser } = useContext(AuthContext);
  const [patients, setPatients] = useState([]);
  const [error, setError] = useState('');
  const [patientId, setPatientId] = useState('');
  const [records, setRecords] = useState([]);
  const [editRecord, setEditRecord] = useState({ id: '', data: '' });
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/patient/hospital/${user.hospital}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setPatients(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch patients');
      }
    };
    fetchPatients();
  }, [user.hospital]);

  const handleRecordFetch = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.get(`http://localhost:5000/api/medical-record/patient/${patientId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setRecords(res.data);
      setError('');
      setSuccess('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch records');
      setRecords([]);
      setSuccess('');
    }
  };

  const handleRecordEdit = (record) => {
    setEditRecord({ id: record._id, data: JSON.stringify(record.data, null, 2) });
  };

  const handleRecordUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5000/api/medical-record/${editRecord.id}`, {
        data: JSON.parse(editRecord.data)
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setSuccess('Medical record updated successfully');
      setError('');
      setEditRecord({ id: '', data: '' });
      // Refresh records
      const res = await axios.get(`http://localhost:5000/api/medical-record/patient/${patientId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setRecords(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update record');
      setSuccess('');
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login');
    } catch (err) {
      setError(err);
    }
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
      <div className="bg-white p-6 rounded shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Patients in {user.hospital}</h2>
        <ul>
          {patients.map((patient) => (
            <li key={patient._id} className="mb-2">
              {patient.name} ({patient.email}) - Department: {patient.department}
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-white p-6 rounded shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">View/Edit Medical Records</h2>
        <form onSubmit={handleRecordFetch} className="mb-4">
          <div className="mb-4">
            <label className="block text-gray-700">Patient ID</label>
            <input
              type="text"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
            Fetch Records
          </button>
        </form>
        {records.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Medical Records</h3>
            {records.map((record) => (
              <div key={record._id} className="mb-4 p-4 border rounded">
                <pre>{JSON.stringify(record.data, null, 2)}</pre>
                <button
                  onClick={() => handleRecordEdit(record)}
                  className="mt-2 bg-green-500 text-white py-1 px-3 rounded hover:bg-green-600"
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
        )}
        {editRecord.id && (
          <form onSubmit={handleRecordUpdate} className="mt-4">
            <div className="mb-4">
              <label className="block text-gray-700">Edit Record Data (JSON)</label>
              <textarea
                value={editRecord.data}
                onChange={(e) => setEditRecord({ ...editRecord, data: e.target.value })}
                className="w-full px-3 py-2 border rounded h-40"
                required
              />
            </div>
            <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
              Update Record
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default DoctorDashboard;