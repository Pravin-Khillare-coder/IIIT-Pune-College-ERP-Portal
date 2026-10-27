import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';

import { LandingPage } from './pages/LandingPage';
import { NewAdmissionPage } from './pages/NewAdmissionPage';

import { StudentLogin } from './pages/login/StudentLogin';
import { StaffLogin } from './pages/login/StaffLogin';
import { WardenLogin } from './pages/login/WardenLogin';
import { AdvisorLogin } from './pages/login/AdvisorLogin';
import { AdminLogin } from './pages/login/AdminLogin';

import { StudentDashboard } from './pages/dashboard/StudentDashboard';
import { StaffDashboard } from './pages/dashboard/StaffDashboard';
import { WardenDashboard } from './pages/dashboard/WardenDashboard';
import { AdvisorDashboard } from './pages/dashboard/AdvisorDashboard';
import { AdminDashboard } from './pages/dashboard/AdminDashboard';

import { RegistrationForm } from './pages/registration/RegistrationForm';
import { PrintRegistrationSlip } from './pages/registration/PrintRegistrationSlip';
import { ViewRegistrationDetail } from './pages/registration/ViewRegistrationDetail';
import { PaymentVerificationPage } from './pages/admin/PaymentVerificationPage';

export const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Landing & Info Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/new-admission-info" element={<NewAdmissionPage />} />

          {/* 5 Distinct Role Login Routes */}
          <Route path="/login/student" element={<StudentLogin />} />
          <Route path="/login/hostel-staff" element={<StaffLogin />} />
          <Route path="/login/warden" element={<WardenLogin />} />
          <Route path="/login/faculty-advisor" element={<AdvisorLogin />} />
          <Route path="/login/admin" element={<AdminLogin />} />

          {/* Role Protected Dashboard Routes */}
          <Route
            path="/dashboard/student"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/staff"
            element={
              <ProtectedRoute allowedRoles={['HOSTEL_STAFF']}>
                <StaffDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/warden"
            element={
              <ProtectedRoute allowedRoles={['HOSTEL_WARDEN']}>
                <WardenDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/advisor"
            element={
              <ProtectedRoute allowedRoles={['FACULTY_ADVISOR']}>
                <AdvisorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Registration Form Route */}
          <Route
            path="/registration/form"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <RegistrationForm />
              </ProtectedRoute>
            }
          />

          {/* Printable Registration Slip Route */}
          <Route
            path="/registration/print/:id"
            element={
              <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN', 'FACULTY_ADVISOR', 'HOSTEL_WARDEN', 'HOSTEL_STAFF']}>
                <PrintRegistrationSlip />
              </ProtectedRoute>
            }
          />

          {/* View Registration Detail Route */}
          <Route
            path="/registration/view/:id"
            element={
              <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN', 'FACULTY_ADVISOR', 'HOSTEL_WARDEN', 'HOSTEL_STAFF']}>
                <ViewRegistrationDetail />
              </ProtectedRoute>
            }
          />

          {/* Admin Payment Receipt Verification Route */}
          <Route
            path="/admin/payments"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <PaymentVerificationPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback Catch-all Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
