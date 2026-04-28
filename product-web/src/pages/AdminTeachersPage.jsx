import { Alert, Button, Card, Group, Loader, Select, Stack, Table, Tabs, Text, TextInput, Title } from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import { adminApi } from '../api/services';
import { extractError } from '../utils/errors';

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [teacherForm, setTeacherForm] = useState({ email: '', fullName: '', password: '' });
  const [subjectForm, setSubjectForm] = useState({ code: '', name: '' });
  const [assignmentForm, setAssignmentForm] = useState({ teacherId: '', subjectId: '', groupId: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const teacherOptions = useMemo(
    () => teachers.map((t) => ({ value: String(t.id), label: `${t.fullName} (${t.email})` })),
    [teachers],
  );
  const groupOptions = useMemo(
    () => groups.map((g) => ({ value: String(g.id), label: `${g.code} — ${g.name}` })),
    [groups],
  );
  const subjectOptions = useMemo(
    () => subjects.map((s) => ({ value: String(s.id), label: `${s.code} — ${s.name}` })),
    [subjects],
  );

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [teachersResp, groupsResp, subjectsResp, assignmentsResp] = await Promise.all([
        adminApi.users('TEACHER'),
        adminApi.groups(),
        adminApi.subjects(),
        adminApi.teachingAssignments(),
      ]);
      setTeachers(teachersResp.data);
      setGroups(groupsResp.data);
      setSubjects(subjectsResp.data);
      setAssignments(assignmentsResp.data);

      setAssignmentForm((prev) => ({
        teacherId: prev.teacherId || String(teachersResp.data[0]?.id || ''),
        subjectId: prev.subjectId || String(subjectsResp.data[0]?.id || ''),
        groupId: prev.groupId || String(groupsResp.data[0]?.id || ''),
      }));
    } catch (err) {
      setError(extractError(err, 'Не удалось загрузить данные администрирования'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submitTeacher = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await adminApi.createTeacher(teacherForm);
      setTeacherForm({ email: '', fullName: '', password: '' });
      setMessage('Преподаватель зарегистрирован');
      await load();
    } catch (err) {
      setError(extractError(err, 'Не удалось создать преподавателя'));
    } finally {
      setSaving(false);
    }
  };

  const submitSubject = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await adminApi.createSubject(subjectForm);
      setSubjectForm({ code: '', name: '' });
      setMessage('Дисциплина создана');
      await load();
    } catch (err) {
      setError(extractError(err, 'Не удалось создать дисциплину'));
    } finally {
      setSaving(false);
    }
  };

  const submitAssignment = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await adminApi.createTeachingAssignment({
        teacherId: Number(assignmentForm.teacherId),
        subjectId: Number(assignmentForm.subjectId),
        groupId: Number(assignmentForm.groupId),
      });
      setMessage('Назначение добавлено');
      await load();
    } catch (err) {
      setError(extractError(err, 'Не удалось создать назначение'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack>
      <Title order={2}>Администрирование преподавателей и дисциплин</Title>
      {error && <Alert color="red">{error}</Alert>}
      {message && <Alert color="green">{message}</Alert>}
      {loading && <Loader color="teal" />}

      <Tabs defaultValue="teachers">
        <Tabs.List>
          <Tabs.Tab value="teachers">Преподаватели</Tabs.Tab>
          <Tabs.Tab value="subjects">Дисциплины</Tabs.Tab>
          <Tabs.Tab value="assignments">Назначения</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="teachers" pt="md">
          <Card withBorder>
            <form onSubmit={submitTeacher}>
              <Stack>
                <TextInput label="ФИО" value={teacherForm.fullName} onChange={(e) => setTeacherForm({ ...teacherForm, fullName: e.target.value })} required />
                <TextInput label="Email" value={teacherForm.email} onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })} required />
                <TextInput label="Пароль" value={teacherForm.password} onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })} required />
                <Button type="submit" loading={saving}>Зарегистрировать преподавателя</Button>
              </Stack>
            </form>
          </Card>
          <Card withBorder mt="md">
            <Table striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>ФИО</Table.Th>
                  <Table.Th>Email</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {teachers.map((teacher) => (
                  <Table.Tr key={teacher.id}>
                    <Table.Td>{teacher.fullName}</Table.Td>
                    <Table.Td>{teacher.email}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="subjects" pt="md">
          <Card withBorder>
            <form onSubmit={submitSubject}>
              <Stack>
                <TextInput label="Код дисциплины" value={subjectForm.code} onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })} required />
                <TextInput label="Название дисциплины" value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} required />
                <Button type="submit" loading={saving}>Создать дисциплину</Button>
              </Stack>
            </form>
          </Card>
          <Card withBorder mt="md">
            <Table striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Код</Table.Th>
                  <Table.Th>Название</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {subjects.map((subject) => (
                  <Table.Tr key={subject.id}>
                    <Table.Td>{subject.code}</Table.Td>
                    <Table.Td>{subject.name}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="assignments" pt="md">
          <Card withBorder>
            <form onSubmit={submitAssignment}>
              <Stack>
                <Select
                  label="Преподаватель"
                  data={teacherOptions}
                  value={assignmentForm.teacherId}
                  onChange={(value) => setAssignmentForm({ ...assignmentForm, teacherId: value || '' })}
                  searchable
                  nothingFoundMessage="Преподаватели не найдены"
                  required
                />
                <Select
                  label="Дисциплина"
                  data={subjectOptions}
                  value={assignmentForm.subjectId}
                  onChange={(value) => setAssignmentForm({ ...assignmentForm, subjectId: value || '' })}
                  searchable
                  nothingFoundMessage="Дисциплины не найдены"
                  required
                />
                <Select
                  label="Группа"
                  data={groupOptions}
                  value={assignmentForm.groupId}
                  onChange={(value) => setAssignmentForm({ ...assignmentForm, groupId: value || '' })}
                  searchable
                  nothingFoundMessage="Группы не найдены"
                  required
                />
                <Button type="submit" loading={saving}>Добавить назначение</Button>
              </Stack>
            </form>
          </Card>

          <Card withBorder mt="md">
            <Group justify="space-between" mb="sm">
              <Text fw={600}>Текущие назначения</Text>
              <Text size="sm" c="dimmed">Всего: {assignments.length}</Text>
            </Group>
            <Table striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Преподаватель</Table.Th>
                  <Table.Th>Дисциплина</Table.Th>
                  <Table.Th>Группа</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {assignments.map((assignment) => (
                  <Table.Tr key={assignment.id}>
                    <Table.Td>{assignment.teacherName}</Table.Td>
                    <Table.Td>{assignment.subjectName}</Table.Td>
                    <Table.Td>{assignment.groupCode} — {assignment.groupName}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Card>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
