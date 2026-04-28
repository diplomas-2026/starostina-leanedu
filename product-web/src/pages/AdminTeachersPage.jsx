import { Alert, Button, Card, Group, Loader, Select, Stack, Table, Tabs, Text, TextInput, Title } from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../api/services';
import AppUserAvatar from '../components/AppUserAvatar';
import ListControls from '../components/ListControls';
import { extractError } from '../utils/errors';

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [groupStudents, setGroupStudents] = useState([]);
  const [occupiedStudentIds, setOccupiedStudentIds] = useState([]);

  const [teacherForm, setTeacherForm] = useState({ email: '', fullName: '', password: '' });
  const [studentForm, setStudentForm] = useState({ email: '', fullName: '', password: '' });
  const [subjectForm, setSubjectForm] = useState({ code: '', name: '' });
  const [assignmentForm, setAssignmentForm] = useState({ teacherId: '', subjectId: '', groupId: '' });
  const [studentGroupForm, setStudentGroupForm] = useState({ groupId: '', studentId: '' });
  const [teachersSearch, setTeachersSearch] = useState('');
  const [studentsSearch, setStudentsSearch] = useState('');
  const [subjectsSearch, setSubjectsSearch] = useState('');
  const [assignmentsSearch, setAssignmentsSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const teacherOptions = useMemo(
    () => teachers.map((t) => ({ value: String(t.id), label: `${t.fullName} (${t.email})` })),
    [teachers],
  );
  const studentOptions = useMemo(() => {
    const occupied = new Set(occupiedStudentIds);
    return students
      .filter((s) => !occupied.has(s.id))
      .map((s) => ({ value: String(s.id), label: `${s.fullName} (${s.email})` }));
  }, [students, occupiedStudentIds]);
  const groupOptions = useMemo(
    () => groups.map((g) => ({ value: String(g.id), label: `${g.code} — ${g.name}` })),
    [groups],
  );
  const subjectOptions = useMemo(
    () => subjects.map((s) => ({ value: String(s.id), label: `${s.code} — ${s.name}` })),
    [subjects],
  );
  const visibleTeachers = useMemo(() => teachers
    .filter((teacher) => `${teacher.fullName} ${teacher.email}`.toLowerCase().includes(teachersSearch.trim().toLowerCase()))
    .sort((a, b) => a.fullName.localeCompare(b.fullName, 'ru')), [teachers, teachersSearch]);
  const visibleGroupStudents = useMemo(() => groupStudents
    .filter((student) => `${student.fullName} ${student.email} ${student.id}`.toLowerCase().includes(studentsSearch.trim().toLowerCase()))
    .sort((a, b) => a.fullName.localeCompare(b.fullName, 'ru')), [groupStudents, studentsSearch]);
  const visibleSubjects = useMemo(() => subjects
    .filter((subject) => `${subject.code} ${subject.name}`.toLowerCase().includes(subjectsSearch.trim().toLowerCase()))
    .sort((a, b) => a.code.localeCompare(b.code, 'ru')), [subjects, subjectsSearch]);
  const visibleAssignments = useMemo(() => assignments
    .filter((assignment) => `${assignment.teacherName} ${assignment.subjectName} ${assignment.groupCode} ${assignment.groupName}`.toLowerCase().includes(assignmentsSearch.trim().toLowerCase()))
    .sort((a, b) => a.teacherName.localeCompare(b.teacherName, 'ru')), [assignments, assignmentsSearch]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [teachersResp, studentsResp, groupsResp, subjectsResp, assignmentsResp] = await Promise.all([
        adminApi.users('TEACHER'),
        adminApi.users('STUDENT'),
        adminApi.groups(),
        adminApi.subjects(),
        adminApi.teachingAssignments(),
      ]);
      setTeachers(teachersResp.data);
      setStudents(studentsResp.data);
      setGroups(groupsResp.data);
      setSubjects(subjectsResp.data);
      setAssignments(assignmentsResp.data);

      const perGroupStudents = await Promise.all(
        groupsResp.data.map(async (group) => {
          const { data } = await adminApi.groupStudents(group.id);
          return data;
        }),
      );
      const occupiedIds = [...new Set(perGroupStudents.flat().map((student) => student.id))];
      setOccupiedStudentIds(occupiedIds);

      const firstGroupId = String(groupsResp.data[0]?.id || '');
      setAssignmentForm((prev) => ({
        teacherId: prev.teacherId || String(teachersResp.data[0]?.id || ''),
        subjectId: prev.subjectId || String(subjectsResp.data[0]?.id || ''),
        groupId: prev.groupId || firstGroupId,
      }));
      setStudentGroupForm((prev) => ({
        groupId: prev.groupId || firstGroupId,
        studentId: prev.studentId || String(studentsResp.data.find((s) => !occupiedIds.includes(s.id))?.id || ''),
      }));
      setSelectedGroupId((prev) => prev || firstGroupId);
    } catch (err) {
      setError(extractError(err, 'Не удалось загрузить данные администрирования'));
    } finally {
      setLoading(false);
    }
  };

  const loadGroupStudents = async (groupId) => {
    if (!groupId) {
      setGroupStudents([]);
      return;
    }
    try {
      const { data } = await adminApi.groupStudents(groupId);
      setGroupStudents(data);
    } catch (err) {
      setError(extractError(err, 'Не удалось загрузить студентов группы'));
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    loadGroupStudents(selectedGroupId);
  }, [selectedGroupId]);

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

  const editUser = async (user) => {
    const fullName = window.prompt('Введите ФИО', user.fullName);
    if (fullName === null) return;
    const email = window.prompt('Введите Email', user.email);
    if (email === null) return;
    const password = window.prompt('Новый пароль (можно оставить пустым, чтобы не менять)', '');
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await adminApi.updateUser(user.id, {
        fullName: fullName.trim(),
        email: email.trim(),
        password: password || null,
      });
      setMessage('Пользователь обновлен');
      await load();
    } catch (err) {
      setError(extractError(err, 'Не удалось обновить пользователя'));
    } finally {
      setSaving(false);
    }
  };

  const deactivateUser = async (user) => {
    const confirmed = window.confirm(`Деактивировать пользователя ${user.fullName}?`);
    if (!confirmed) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await adminApi.deactivateUser(user.id);
      setMessage('Пользователь деактивирован');
      await load();
    } catch (err) {
      setError(extractError(err, 'Не удалось деактивировать пользователя'));
    } finally {
      setSaving(false);
    }
  };

  const submitStudent = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await adminApi.createStudent(studentForm);
      setStudentForm({ email: '', fullName: '', password: '' });
      setMessage('Студент зарегистрирован');
      await load();
    } catch (err) {
      setError(extractError(err, 'Не удалось создать студента'));
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

  const editSubject = async (subject) => {
    const code = window.prompt('Код дисциплины', subject.code);
    if (code === null) return;
    const name = window.prompt('Название дисциплины', subject.name);
    if (name === null) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await adminApi.updateSubject(subject.id, { code: code.trim(), name: name.trim() });
      setMessage('Дисциплина обновлена');
      await load();
    } catch (err) {
      setError(extractError(err, 'Не удалось обновить дисциплину'));
    } finally {
      setSaving(false);
    }
  };

  const deleteSubject = async (subject) => {
    const confirmed = window.confirm(`Удалить дисциплину ${subject.code} — ${subject.name}?`);
    if (!confirmed) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await adminApi.deleteSubject(subject.id);
      setMessage('Дисциплина удалена');
      await load();
    } catch (err) {
      setError(extractError(err, 'Не удалось удалить дисциплину'));
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

  const deleteAssignment = async (assignment) => {
    const confirmed = window.confirm(`Удалить назначение: ${assignment.teacherName} / ${assignment.subjectName} / ${assignment.groupCode}?`);
    if (!confirmed) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await adminApi.deleteTeachingAssignment(assignment.id);
      setMessage('Назначение удалено');
      await load();
    } catch (err) {
      setError(extractError(err, 'Не удалось удалить назначение'));
    } finally {
      setSaving(false);
    }
  };

  const submitStudentGroup = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await adminApi.addStudentToGroup(studentGroupForm.groupId, studentGroupForm.studentId);
      setMessage('Студент добавлен в группу');
      await loadGroupStudents(studentGroupForm.groupId);
    } catch (err) {
      setError(extractError(err, 'Не удалось добавить студента в группу'));
    } finally {
      setSaving(false);
    }
  };

  const removeStudentFromGroup = async (student) => {
    if (!selectedGroupId) return;
    const confirmed = window.confirm(`Удалить студента ${student.fullName} из группы?`);
    if (!confirmed) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await adminApi.removeStudentFromGroup(selectedGroupId, student.id);
      setMessage('Студент удален из группы');
      await load();
      await loadGroupStudents(selectedGroupId);
    } catch (err) {
      setError(extractError(err, 'Не удалось удалить студента из группы'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack>
      <Title order={2}>Администрирование</Title>
      {error && <Alert color="red">{error}</Alert>}
      {message && <Alert color="green">{message}</Alert>}
      {loading && <Loader color="teal" />}

      <Tabs defaultValue="teachers">
        <Tabs.List>
          <Tabs.Tab value="teachers">Преподаватели</Tabs.Tab>
          <Tabs.Tab value="students">Студенты</Tabs.Tab>
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
            <ListControls
              search={teachersSearch}
              onSearchChange={setTeachersSearch}
              searchPlaceholder="ФИО или email преподавателя"
            />
            <Table striped>
              <Table.Thead>
                <Table.Tr><Table.Th>ФИО</Table.Th><Table.Th>Email</Table.Th><Table.Th>Статус</Table.Th><Table.Th>Действия</Table.Th></Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {visibleTeachers.map((teacher) => (
                  <Table.Tr key={teacher.id}>
                    <Table.Td>
                      <Group gap="sm">
                        <AppUserAvatar user={teacher} size={28} />
                        <Text>{teacher.fullName}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>{teacher.email}</Table.Td>
                    <Table.Td>{teacher.active ? 'Активен' : 'Деактивирован'}</Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Button size="xs" variant="light" onClick={() => editUser(teacher)} loading={saving} disabled={!teacher.active}>Редактировать</Button>
                        <Button size="xs" color="red" variant="light" onClick={() => deactivateUser(teacher)} loading={saving} disabled={!teacher.active}>Удалить</Button>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="students" pt="md">
          <Card withBorder>
            <form onSubmit={submitStudent}>
              <Stack>
                <TextInput label="ФИО" value={studentForm.fullName} onChange={(e) => setStudentForm({ ...studentForm, fullName: e.target.value })} required />
                <TextInput label="Email" value={studentForm.email} onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })} required />
                <TextInput label="Пароль" value={studentForm.password} onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })} required />
                <Button type="submit" loading={saving}>Зарегистрировать студента</Button>
              </Stack>
            </form>
          </Card>

          <Card withBorder mt="md">
            <form onSubmit={submitStudentGroup}>
              <Stack>
                <Title order={4}>Добавление студента в группу</Title>
                <Group grow>
                  <Select label="Группа" data={groupOptions} value={studentGroupForm.groupId} onChange={(v) => setStudentGroupForm({ ...studentGroupForm, groupId: v || '' })} searchable required />
                  <Select label="Студент" data={studentOptions} value={studentGroupForm.studentId} onChange={(v) => setStudentGroupForm({ ...studentGroupForm, studentId: v || '' })} searchable required />
                </Group>
                {studentOptions.length === 0 && (
                  <Alert color="blue">Все студенты уже распределены по группам.</Alert>
                )}
                <Button type="submit" loading={saving}>Добавить в группу</Button>
              </Stack>
            </form>
          </Card>

          <Card withBorder mt="md">
            <Group justify="space-between" mb="sm">
              <Text fw={600}>Студенты в группе</Text>
              <Select
                data={groupOptions}
                value={selectedGroupId}
                onChange={(value) => setSelectedGroupId(value || '')}
                placeholder="Выберите группу"
                w={320}
                searchable
              />
            </Group>
            <ListControls
              search={studentsSearch}
              onSearchChange={setStudentsSearch}
              searchPlaceholder="ID, ФИО или email студента"
            />
            <Table striped>
              <Table.Thead>
                <Table.Tr><Table.Th>ID</Table.Th><Table.Th>ФИО</Table.Th><Table.Th>Email</Table.Th><Table.Th>Статус</Table.Th><Table.Th>Действия</Table.Th></Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {visibleGroupStudents.map((student) => (
                  <Table.Tr key={student.id}>
                    <Table.Td>{student.id}</Table.Td>
                    <Table.Td>
                      <Group gap="sm">
                        <AppUserAvatar user={student} size={28} />
                        <Text component={Link} to={`/students/${student.id}`}>{student.fullName}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>{student.email}</Table.Td>
                    <Table.Td>{student.active ? 'Активен' : 'Деактивирован'}</Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Button size="xs" variant="light" onClick={() => editUser(student)} loading={saving} disabled={!student.active}>Редактировать</Button>
                        <Button size="xs" color="orange" variant="light" onClick={() => removeStudentFromGroup(student)} loading={saving} disabled={!student.active}>Убрать из группы</Button>
                        <Button size="xs" color="red" variant="light" onClick={() => deactivateUser(student)} loading={saving} disabled={!student.active}>Удалить</Button>
                      </Group>
                    </Table.Td>
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
            <ListControls
              search={subjectsSearch}
              onSearchChange={setSubjectsSearch}
              searchPlaceholder="Код или название дисциплины"
            />
            <Table striped>
              <Table.Thead>
                <Table.Tr><Table.Th>Код</Table.Th><Table.Th>Название</Table.Th><Table.Th>Действия</Table.Th></Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {visibleSubjects.map((subject) => (
                  <Table.Tr key={subject.id}>
                    <Table.Td>{subject.code}</Table.Td>
                    <Table.Td>{subject.name}</Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Button size="xs" variant="light" onClick={() => editSubject(subject)} loading={saving}>Редактировать</Button>
                        <Button size="xs" color="red" variant="light" onClick={() => deleteSubject(subject)} loading={saving}>Удалить</Button>
                      </Group>
                    </Table.Td>
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
                <Select label="Преподаватель" data={teacherOptions} value={assignmentForm.teacherId} onChange={(v) => setAssignmentForm({ ...assignmentForm, teacherId: v || '' })} searchable required />
                <Select label="Дисциплина" data={subjectOptions} value={assignmentForm.subjectId} onChange={(v) => setAssignmentForm({ ...assignmentForm, subjectId: v || '' })} searchable required />
                <Select label="Группа" data={groupOptions} value={assignmentForm.groupId} onChange={(v) => setAssignmentForm({ ...assignmentForm, groupId: v || '' })} searchable required />
                <Button type="submit" loading={saving}>Добавить назначение</Button>
              </Stack>
            </form>
          </Card>

          <Card withBorder mt="md">
            <Group justify="space-between" mb="sm">
              <Text fw={600}>Текущие назначения</Text>
              <Text size="sm" c="dimmed">Всего: {assignments.length}</Text>
            </Group>
            <ListControls
              search={assignmentsSearch}
              onSearchChange={setAssignmentsSearch}
              searchPlaceholder="Преподаватель, дисциплина или группа"
            />
            <Table striped>
              <Table.Thead>
                <Table.Tr><Table.Th>Преподаватель</Table.Th><Table.Th>Дисциплина</Table.Th><Table.Th>Группа</Table.Th><Table.Th>Действия</Table.Th></Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {visibleAssignments.map((assignment) => (
                  <Table.Tr key={assignment.id}>
                    <Table.Td>{assignment.teacherName}</Table.Td>
                    <Table.Td>{assignment.subjectName}</Table.Td>
                    <Table.Td>
                      <Text component={Link} to={`/groups/${assignment.groupId}`}>
                        {assignment.groupCode} — {assignment.groupName}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Button size="xs" color="red" variant="light" onClick={() => deleteAssignment(assignment)} loading={saving}>
                        Удалить
                      </Button>
                    </Table.Td>
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
