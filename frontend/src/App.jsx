import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import DepartmentsPage from './pages/DepartmentsPage';
import DoctorsPage from './pages/DoctorsPage';
import BookPage from './pages/BookPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PatientDashboard from './pages/PatientDashboard';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<HomePage scrollSection="about" />} />
              <Route path="/services" element={<HomePage scrollSection="services" />} />
              <Route path="/contact" element={<HomePage scrollSection="contact" />} />
              <Route path="/departments" element={<DepartmentsPage />} />
              <Route path="/doctors" element={<DoctorsPage />} />
              <Route path="/book" element={<BookPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/patient" element={<PatientDashboard />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
