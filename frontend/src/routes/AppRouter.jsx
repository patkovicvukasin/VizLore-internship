import { Routes, Route } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';
import RegisterPage from '../pages/RegisterPage';
import LoginPage    from '../pages/LoginPage';
import UploadPage   from '../pages/UploadPage';
import PrivateRoute from '../components/PrivateRoute';

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login"    element={<LoginPage />} />
      <Route
        path="/upload"
        element={
          <PrivateRoute>
            <UploadPage />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}
