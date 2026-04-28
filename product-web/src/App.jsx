import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LecturesPage from './pages/LecturesPage';
import LectureDetailsPage from './pages/LectureDetailsPage';
import TestsPage from './pages/TestsPage';
import TestDetailsPage from './pages/TestDetailsPage';
import MyResultsPage from './pages/MyResultsPage';
import AdminTeachersPage from './pages/AdminTeachersPage';
import TeacherStudentsPage from './pages/TeacherStudentsPage';
import GradebookPage from './pages/GradebookPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/lectures" element={<LecturesPage />} />
          <Route path="/lectures/:id" element={<LectureDetailsPage />} />
          <Route path="/tests" element={<TestsPage />} />
          <Route path="/my-results" element={<MyResultsPage />} />

          <Route element={<ProtectedRoute roles={['TEACHER']} />}>
            <Route path="/tests/:id" element={<TestDetailsPage />} />
            <Route path="/gradebook" element={<GradebookPage />} />
            <Route path="/teacher/students" element={<TeacherStudentsPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={['ADMIN']} />}>
            <Route path="/admin/teachers" element={<AdminTeachersPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
