import { Alert, Button, Card, Group, Loader, Stack, Text, TextInput, Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { adminApi } from '../api/services';
import { extractError } from '../utils/errors';

export default function AdminTeachersPage() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ email: '', fullName: '', password: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.users('TEACHER');
      setUsers(data);
    } catch (err) {
      setError(extractError(err, 'Не удалось загрузить преподавателей'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await adminApi.createTeacher(form);
      setForm({ email: '', fullName: '', password: '' });
      await load();
    } catch (err) {
      setError(extractError(err, 'Не удалось создать преподавателя'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack>
      <Title order={2}>Управление преподавателями</Title>
      {error && <Alert color="red">{error}</Alert>}
      <Card withBorder>
        <form onSubmit={submit}>
          <Stack>
            <TextInput label="ФИО" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
            <TextInput label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <TextInput label="Пароль" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            <Button type="submit" loading={saving}>Зарегистрировать преподавателя</Button>
          </Stack>
        </form>
      </Card>

      {loading && <Loader />}
      {users.map((user) => (
        <Card key={user.id} withBorder>
          <Group justify="space-between">
            <Text>{user.fullName}</Text>
            <Text size="sm" c="dimmed">{user.email}</Text>
          </Group>
        </Card>
      ))}
    </Stack>
  );
}
