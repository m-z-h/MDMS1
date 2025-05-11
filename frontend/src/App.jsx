import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import NurseDashboard from './components/NurseDashboard';
import DoctorDashboard from './components/DoctorDashboard';
import PatientDashboard from './components/PatientDashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/nurse"
            element={
              <ProtectedRoute roles={['nurse']}>
                <NurseDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor"
            element={
              <ProtectedRoute roles={['doctor']}>
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient"
            element={
              <ProtectedRoute roles={['patient']}>
                <PatientDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Login />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;