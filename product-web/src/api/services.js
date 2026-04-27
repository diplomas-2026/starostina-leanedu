import api from './client';

export const authApi = {
  login: (payload) => api.post('/api/auth/login', payload),
  me: () => api.get('/api/auth/me'),
};

export const lectureApi = {
  list: () => api.get('/api/lectures'),
  get: (id) => api.get(`/api/lectures/${id}`),
  create: (payload) => api.post('/api/lectures', payload),
  publish: (id) => api.patch(`/api/lectures/${id}/publish`),
};

export const testApi = {
  list: () => api.get('/api/tests'),
  create: (payload) => api.post('/api/tests', payload),
  publish: (id) => api.patch(`/api/tests/${id}/publish`),
  addQuestion: (id, payload) => api.post(`/api/tests/${id}/questions`, payload),
  assign: (id, payload) => api.post(`/api/tests/${id}/assignments`, payload),
  startAttempt: (id) => api.post(`/api/tests/${id}/attempts/start`),
  submitAttempt: (attemptId, payload) => api.post(`/api/tests/attempts/${attemptId}/submit`, payload),
  myAttempts: () => api.get('/api/tests/attempts/my'),
};

export const teacherApi = {
  createStudent: (payload) => api.post('/api/teacher/students', payload),
  students: () => api.get('/api/teacher/students'),
  groups: () => api.get('/api/teacher/groups'),
  addStudentToGroup: (groupId, studentId) => api.post(`/api/teacher/groups/${groupId}/students/${studentId}`),
};

export const adminApi = {
  createTeacher: (payload) => api.post('/api/admin/teachers', payload),
  users: (role) => api.get('/api/admin/users', { params: role ? { role } : {} }),
};

export const aiApi = {
  limits: () => api.get('/api/ai/limits'),
  generateFromLecture: (lectureId) => api.post(`/api/ai/generate-test-from-lecture/${lectureId}`),
};

export const gradebookApi = {
  all: () => api.get('/api/gradebook'),
};
