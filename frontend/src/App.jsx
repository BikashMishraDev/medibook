import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Doctors from './pages/Doctors';
import DoctorDetails from './pages/DoctorDetails';
import BookAppointment from './pages/BookAppointment';
import Appointments from './pages/Appointments';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/doctors" element={<Doctors />} />
      <Route path="/doctors/:id" element={<DoctorDetails />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/book/:doctorId"
        element={<ProtectedRoute><BookAppointment /></ProtectedRoute>}
      />
      <Route
        path="/appointments"
        element={<ProtectedRoute><Appointments /></ProtectedRoute>}
      />
      <Route
        path="/admin"
        element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>}
      />
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
