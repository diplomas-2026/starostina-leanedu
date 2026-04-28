export const ROLE_LABELS = {
  ADMIN: 'Администратор',
  TEACHER: 'Преподаватель',
  STUDENT: 'Студент',
};

export const ATTEMPT_STATUS_LABELS = {
  IN_PROGRESS: 'В процессе',
  SUBMITTED: 'Отправлено',
  NOT_STARTED: 'Не приступал',
};

export const ROLE_BADGE_COLORS = {
  ADMIN: 'violet',
  TEACHER: 'blue',
  STUDENT: 'teal',
};

export const ATTEMPT_STATUS_BADGE_COLORS = {
  IN_PROGRESS: 'yellow',
  SUBMITTED: 'teal',
  NOT_STARTED: 'gray',
};

export const GRADEBOOK_STATUS_BADGE_COLORS = {
  'Оценено': 'teal',
  'В процессе': 'yellow',
  'Не выполнен': 'red',
  'Не приступал': 'gray',
};

export const GRADE_BADGE_COLORS = {
  2: 'red',
  3: 'yellow',
  4: 'blue',
  5: 'teal',
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

export function roleBadgeColor(role) {
  return ROLE_BADGE_COLORS[role] || 'gray';
}

export function attemptStatusBadgeColor(status) {
  return ATTEMPT_STATUS_BADGE_COLORS[status] || 'gray';
}

export function publishStatusBadgeColor(isPublished) {
  return isPublished ? 'teal' : 'gray';
}

export function gradebookStatusBadgeColor(status) {
  return GRADEBOOK_STATUS_BADGE_COLORS[status] || 'gray';
}

export function gradeBadgeColor(grade) {
  const numeric = Number(grade);
  if (!Number.isFinite(numeric)) return 'gray';
  if (Number.isInteger(numeric) && GRADE_BADGE_COLORS[numeric]) {
    return GRADE_BADGE_COLORS[numeric];
  }
  if (numeric < 3) return 'red';
  if (numeric < 4) return 'yellow';
  if (numeric < 4.5) return 'blue';
  return 'teal';
}
