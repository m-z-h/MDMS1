const API_BASE_URL = 'https://mdms-backend.vercel.app';

export const API_ENDPOINTS = {
  auth: `${API_BASE_URL}/api/auth`,
  patient: `${API_BASE_URL}/api/patient`,
  medicalRecord: `${API_BASE_URL}/api/medical-record`,
  assignment: `${API_BASE_URL}/api/assignment`
};

export default API_ENDPOINTS; 