import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LecturesPage from './pages/LecturesPage';
import LectureDetailsPage from './pages/LectureDetailsPage';
import TestsPage from './pages/TestsPage';
import CreateTestPage from './pages/CreateTestPage';
import TestDetailsPage from './pages/TestDetailsPage';
import TestQuestionEditorPage from './pages/TestQuestionEditorPage';
import StudentTestAttemptPage from './pages/StudentTestAttemptPage';
import StudentDisciplinesPage from './pages/StudentDisciplinesPage';
import StudentDisciplineDetailsPage from './pages/StudentDisciplineDetailsPage';
import StudentGradebookPage from './pages/StudentGradebookPage';
import MyResultsPage from './pages/MyResultsPage';
import AdminTeachersListPage from './pages/AdminTeachersListPage';
import AdminTeacherFormPage from './pages/AdminTeacherFormPage';
import AdminStudentsListPage from './pages/AdminStudentsListPage';
import AdminStudentFormPage from './pages/AdminStudentFormPage';
import AdminSubjectsListPage from './pages/AdminSubjectsListPage';
import AdminSubjectFormPage from './pages/AdminSubjectFormPage';
import AdminAssignmentsPage from './pages/AdminAssignmentsPage';
import AdminGroupsListPage from './pages/AdminGroupsListPage';
import AdminGroupFormPage from './pages/AdminGroupFormPage';
import TeacherGroupsPage from './pages/TeacherGroupsPage';
import GradebookPage from './pages/GradebookPage';
import TeacherDisciplinesPage from './pages/TeacherDisciplinesPage';
import TeacherDisciplineDetailsPage from './pages/TeacherDisciplineDetailsPage';
import ProfilePage from './pages/ProfilePage';
import StudentDetailsPage from './pages/StudentDetailsPage';
import GroupDetailsPage from './pages/GroupDetailsPage';

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
          <Route path="/tests/:id/take" element={<StudentTestAttemptPage />} />
          <Route path="/my-results" element={<MyResultsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/students/:id" element={<StudentDetailsPage />} />
          <Route path="/groups/:id" element={<GroupDetailsPage />} />
          <Route path="/student/disciplines" element={<StudentDisciplinesPage />} />
          <Route path="/student/disciplines/:subjectId" element={<StudentDisciplineDetailsPage />} />
          <Route path="/student/gradebook" element={<StudentGradebookPage />} />

          <Route element={<ProtectedRoute roles={['TEACHER']} />}>
            <Route path="/tests/new" element={<CreateTestPage />} />
            <Route path="/tests/:id" element={<TestDetailsPage />} />
            <Route path="/tests/:id/questions" element={<TestQuestionEditorPage />} />
            <Route path="/teacher/disciplines" element={<TeacherDisciplinesPage />} />
            <Route path="/teacher/disciplines/:subjectId" element={<TeacherDisciplineDetailsPage />} />
            <Route path="/gradebook" element={<GradebookPage />} />
            <Route path="/teacher/groups" element={<TeacherGroupsPage />} />
          </Route>

          <Route element={<ProtectedRoute roles={['ADMIN']} />}>
            <Route path="/admin/teachers" element={<AdminTeachersListPage />} />
            <Route path="/admin/teachers/new" element={<AdminTeacherFormPage />} />
            <Route path="/admin/teachers/:id/edit" element={<AdminTeacherFormPage />} />
            <Route path="/admin/students" element={<AdminStudentsListPage />} />
            <Route path="/admin/students/new" element={<AdminStudentFormPage />} />
            <Route path="/admin/students/:id/edit" element={<AdminStudentFormPage />} />
            <Route path="/admin/subjects" element={<AdminSubjectsListPage />} />
            <Route path="/admin/subjects/new" element={<AdminSubjectFormPage />} />
            <Route path="/admin/subjects/:id/edit" element={<AdminSubjectFormPage />} />
            <Route path="/admin/assignments" element={<AdminAssignmentsPage />} />
            <Route path="/admin/groups" element={<AdminGroupsListPage />} />
            <Route path="/admin/groups/new" element={<AdminGroupFormPage />} />
            <Route path="/admin/groups/:id/edit" element={<AdminGroupFormPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
