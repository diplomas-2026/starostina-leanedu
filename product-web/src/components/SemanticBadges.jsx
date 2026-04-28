import { Badge } from '@mantine/core';
import {
  attemptStatusBadgeColor,
  attemptStatusLabel,
  gradeBadgeColor,
  gradebookStatusBadgeColor,
  publishStatusBadgeColor,
  publishStatusLabel,
  roleBadgeColor,
  roleLabel,
} from '../utils/labels';

export function RoleBadge({ role, size = 'sm' }) {
  return (
    <Badge size={size} color={roleBadgeColor(role)} variant="light" radius="sm">
      {roleLabel(role)}
    </Badge>
  );
}

export function AttemptStatusBadge({ status, size = 'sm' }) {
  return (
    <Badge size={size} color={attemptStatusBadgeColor(status)} variant="light" radius="sm">
      {attemptStatusLabel(status)}
    </Badge>
  );
}

export function PublishStatusBadge({ published, size = 'sm' }) {
  return (
    <Badge size={size} color={publishStatusBadgeColor(published)} variant="light" radius="sm">
      {publishStatusLabel(published)}
    </Badge>
  );
}

export function GradebookStatusBadge({ status, size = 'sm' }) {
  return (
    <Badge size={size} color={gradebookStatusBadgeColor(status)} variant="light" radius="sm">
      {status}
    </Badge>
  );
}

export function GradeBadge({ grade, size = 'sm', prefix = 'Оценка' }) {
  if (grade === null || grade === undefined || grade === '') return null;
  return (
    <Badge size={size} color={gradeBadgeColor(grade)} variant="light" radius="sm">
      {prefix}: {grade}
    </Badge>
  );
}
