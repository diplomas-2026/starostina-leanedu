import { Alert, Button, Card, Stack, TextInput, Title } from '@mantine/core';
import { useState } from 'react';
import { teacherApi } from '../api/services';
import { extractError } from '../utils/errors';

export default function TeacherStudentsPage() {
  const [form, setForm] = useState({ email: '', fullName: '', password: '' });
  const [groupId, setGroupId] = useState('1');
  const [studentId, setStudentId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const createStudent = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const { data } = await teacherApi.createStudent(form);
      setMessage(`Студент создан: ID ${data.id}`);
      setStudentId(String(data.id));
      setForm({ email: '', fullName: '', password: '' });
    } catch (err) {
      setError(extractError(err, 'Не удалось создать студента'));
    }
  };

  const bindToGroup = async () => {
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
          <TextInput label="ID группы" value={groupId} onChange={(e) => setGroupId(e.target.value)} />
          <TextInput label="ID студента" value={studentId} onChange={(e) => setStudentId(e.target.value)} />
          <Button onClick={bindToGroup}>Добавить в группу</Button>
        </Stack>
      </Card>
    </Stack>
  );
}
