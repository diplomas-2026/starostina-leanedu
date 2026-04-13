export const ROLE_LABELS = {
  ADMIN: 'Администратор',
  TEACHER: 'Преподаватель',
  STUDENT: 'Студент',
};

export const ATTEMPT_STATUS_LABELS = {
  IN_PROGRESS: 'В процессе',
  SUBMITTED: 'Отправлено',
};

export function roleLabel(role) {
  return ROLE_LABELS[role] || role || '-';
}

export function attemptStatusLabel(status) {
  return ATTEMPT_STATUS_LABELS[status] || status || '-';
}

export function publishStatusLabel(isPublished) {
  return isPublished ? 'Опубликован' : 'Черновик';
}
