import { Alert, Button, Card, Group, Stack, TextInput, Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { authApi } from '../api/services';
import AppUserAvatar from '../components/AppUserAvatar';
import { useAuth } from '../context/AuthContext';
import { extractError } from '../utils/errors';

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const [form, setForm] = useState({ fullName: '', avatarUrl: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    setForm({
      fullName: user?.fullName || '',
      avatarUrl: user?.avatarUrl || '',
    });
  }, [user?.fullName, user?.avatarUrl]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await authApi.updateProfile({
        fullName: form.fullName,
        avatarUrl: form.avatarUrl || null,
      });
      await refresh();
      setMessage('Профиль обновлён');
    } catch (err) {
      setError(extractError(err, 'Не удалось сохранить профиль'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack>
      <Title order={2}>Профиль</Title>
      {error && <Alert color="red">{error}</Alert>}
      {message && <Alert color="green">{message}</Alert>}

      <Card withBorder>
        <form onSubmit={submit}>
          <Stack>
            <Group>
              <AppUserAvatar user={{ fullName: form.fullName, avatarUrl: form.avatarUrl }} size={72} />
            </Group>
            <TextInput
              label="ФИО"
              value={form.fullName}
              onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
              required
            />
            <TextInput
              label="URL фотографии"
              placeholder="https://..."
              value={form.avatarUrl}
              onChange={(e) => setForm((prev) => ({ ...prev, avatarUrl: e.target.value }))}
            />
            <Button type="submit" loading={saving}>Сохранить</Button>
          </Stack>
        </form>
      </Card>
    </Stack>
  );
}
