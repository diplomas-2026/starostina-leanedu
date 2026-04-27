import { Alert, Button, Card, Loader, Select, Stack, TextInput, Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { teacherApi } from '../api/services';
import { extractError } from '../utils/errors';

export default function TeacherStudentsPage() {
  const [form, setForm] = useState({ email: '', fullName: '', password: '' });
  const [groupId, setGroupId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadOptions = async () => {
    setLoadingOptions(true);
    setError('');
    try {
      const [groupsResp, studentsResp] = await Promise.all([
        teacherApi.groups(),
        teacherApi.students(),
      ]);

      const groupOptions = groupsResp.data.map((group) => ({
        value: String(group.id),
        label: `${group.code} — ${group.name}`,
      }));
      const studentOptions = studentsResp.data.map((student) => ({
        value: String(student.id),
        label: `${student.fullName} (${student.email})`,
      }));

      setGroups(groupOptions);
      setStudents(studentOptions);

      if (!groupId && groupOptions.length > 0) {
        setGroupId(groupOptions[0].value);
      }
      if (!studentId && studentOptions.length > 0) {
        setStudentId(studentOptions[0].value);
      }
    } catch (err) {
      setError(extractError(err, 'Не удалось загрузить список групп и студентов'));
    } finally {
      setLoadingOptions(false);
    }
  };

  useEffect(() => {
    loadOptions();
  }, []);

  const createStudent = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const { data } = await teacherApi.createStudent(form);
      setMessage(`Студент создан: ${data.fullName}`);
      setStudentId(String(data.id));
      setForm({ email: '', fullName: '', password: '' });
      await loadOptions();
    } catch (err) {
      setError(extractError(err, 'Не удалось создать студента'));
    }
  };

  const bindToGroup = async () => {
    if (!groupId || !studentId) {
      setError('Выберите группу и студента из списка');
      return;
    }
    setError('');
    setMessage('');
    try {
      await teacherApi.addStudentToGroup(groupId, studentId);
      setMessage('Студент добавлен в группу');
    } catch (err) {
      setError(extractError(err, 'Не удалось добавить студента в группу'));
    }
  };

  return (
    <Stack>
      <Title order={2}>Управление студентами</Title>
      {error && <Alert color="red">{error}</Alert>}
      {message && <Alert color="green">{message}</Alert>}

      <Card withBorder>
        <form onSubmit={createStudent}>
          <Stack>
            <TextInput label="ФИО" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
            <TextInput label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <TextInput label="Пароль" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            <Button type="submit">Создать студента</Button>
          </Stack>
        </form>
      </Card>

      <Card withBorder>
        <Stack>
          {loadingOptions ? (
            <Loader color="teal" />
          ) : (
            <>
              <Select
                label="Группа"
                placeholder="Выберите группу"
                data={groups}
                value={groupId}
                onChange={(value) => setGroupId(value || '')}
                searchable
                nothingFoundMessage="Группы не найдены"
              />
              <Select
                label="Студент"
                placeholder="Выберите студента"
                data={students}
                value={studentId}
                onChange={(value) => setStudentId(value || '')}
                searchable
                nothingFoundMessage="Студенты не найдены"
              />
              <Button onClick={bindToGroup}>Добавить в группу</Button>
            </>
          )}
        </Stack>
      </Card>
    </Stack>
  );
}
