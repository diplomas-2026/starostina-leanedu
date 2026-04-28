import api from './client';

export const authApi = {
  login: (payload) => api.post('/api/auth/login', payload),
  me: () => api.get('/api/auth/me'),
  updateProfile: (payload) => api.put('/api/auth/me/profile', payload),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/auth/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  removeAvatar: () => api.delete('/api/auth/me/avatar'),
};

export const lectureApi = {
  list: (subjectId) => api.get('/api/lectures', { params: subjectId ? { subjectId } : {} }),
  get: (id) => api.get(`/api/lectures/${id}`),
  create: (payload) => api.post('/api/lectures', payload),
  publish: (id) => api.patch(`/api/lectures/${id}/publish`),
};

export const testApi = {
  list: () => api.get('/api/tests'),
  get: (id) => api.get(`/api/tests/${id}`),
  create: (payload) => api.post('/api/tests', payload),
  publish: (id) => api.patch(`/api/tests/${id}/publish`),
  addQuestion: (id, payload) => api.post(`/api/tests/${id}/questions`, payload),
  assign: (id, payload) => api.post(`/api/tests/${id}/assignments`, payload),
  removeAssignment: (id, assignmentId) => api.delete(`/api/tests/${id}/assignments/${assignmentId}`),
  startAttempt: (id) => api.post(`/api/tests/${id}/attempts/start`),
  attemptSession: (attemptId) => api.get(`/api/tests/attempts/${attemptId}/session`),
  submitAttempt: (attemptId, payload) => api.post(`/api/tests/attempts/${attemptId}/submit`, payload),
  myAttempts: () => api.get('/api/tests/attempts/my'),
};

export const teacherApi = {
  groups: (subjectId) => api.get('/api/teacher/groups', { params: subjectId ? { subjectId } : {} }),
  groupStudents: (groupId) => api.get(`/api/teacher/groups/${groupId}/students`),
  subjects: (groupId) => api.get('/api/teacher/subjects', { params: groupId ? { groupId } : {} }),
  disciplines: (groupId) => api.get('/api/teacher/disciplines', { params: groupId ? { groupId } : {} }),
  dashboardSummary: () => api.get('/api/teacher/dashboard-summary'),
};

export const adminApi = {
  createTeacher: (payload) => api.post('/api/admin/teachers', payload),
  createStudent: (payload) => api.post('/api/admin/students', payload),
  users: (role) => api.get('/api/admin/users', { params: role ? { role } : {} }),
  groups: () => api.get('/api/admin/groups'),
  groupStudents: (groupId) => api.get(`/api/admin/groups/${groupId}/students`),
  addStudentToGroup: (groupId, studentId) => api.post(`/api/admin/groups/${groupId}/students/${studentId}`),
  subjects: () => api.get('/api/admin/subjects'),
  createSubject: (payload) => api.post('/api/admin/subjects', payload),
  teachingAssignments: () => api.get('/api/admin/teaching-assignments'),
  createTeachingAssignment: (payload) => api.post('/api/admin/teaching-assignments', payload),
};

export const aiApi = {
  limits: () => api.get('/api/ai/limits'),
  generateFromLecture: (lectureId, teacherPrompt) => api.post(`/api/ai/generate-test-from-lecture/${lectureId}`, { teacherPrompt }),
  generateQuestionsForTest: (testId, teacherPrompt) => api.post(`/api/ai/generate-questions-for-test/${testId}`, { teacherPrompt }),
};

export const gradebookApi = {
  all: () => api.get('/api/gradebook'),
  groups: () => api.get('/api/gradebook/groups'),
  subjects: (groupId) => api.get('/api/gradebook/subjects', { params: { groupId } }),
  matrix: (groupId, subjectId) => api.get('/api/gradebook/matrix', { params: { groupId, subjectId } }),
};

export const studentApi = {
  summary: (studentId) => api.get(`/api/students/${studentId}/summary`),
  myDisciplines: () => api.get('/api/students/me/disciplines'),
  myDisciplineDetails: (subjectId) => api.get(`/api/students/me/disciplines/${subjectId}`),
  myGradebook: () => api.get('/api/students/me/gradebook'),
};

export const groupApi = {
  summary: (groupId) => api.get(`/api/groups/${groupId}/summary`),
};
