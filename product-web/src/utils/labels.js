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
