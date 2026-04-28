import { Alert, Button, Card, Group, Stack, TextInput, Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { authApi } from '../api/services';
import AppUserAvatar from '../components/AppUserAvatar';
import { useAuth } from '../context/AuthContext';
import { extractError } from '../utils/errors';

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const [form, setForm] = useState({ fullName: '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    setForm({
      fullName: user?.fullName || '',
    });
  }, [user?.fullName]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await authApi.updateProfile({
        fullName: form.fullName,
      });
      await refresh();
      setMessage('Профиль обновлён');
    } catch (err) {
      setError(extractError(err, 'Не удалось сохранить профиль'));
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async () => {
    if (!avatarFile) {
      setError('Выберите файл изображения');
      return;
    }
    setAvatarSaving(true);
    setError('');
    setMessage('');
    try {
      await authApi.uploadAvatar(avatarFile);
      await refresh();
      setAvatarFile(null);
      setMessage('Фото профиля обновлено');
    } catch (err) {
      setError(extractError(err, 'Не удалось загрузить фото'));
    } finally {
      setAvatarSaving(false);
    }
  };

  const removeAvatar = async () => {
    setAvatarSaving(true);
    setError('');
    setMessage('');
    try {
      await authApi.removeAvatar();
      await refresh();
      setAvatarFile(null);
      setMessage('Фото профиля удалено');
    } catch (err) {
      setError(extractError(err, 'Не удалось удалить фото'));
    } finally {
      setAvatarSaving(false);
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
              <AppUserAvatar user={{ fullName: form.fullName, avatarUrl: user?.avatarUrl }} size={72} />
            </Group>
            <TextInput
              label="ФИО"
              value={form.fullName}
              onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
              required
            />
            <input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] || null)} />
            <Group>
              <Button type="button" variant="light" onClick={uploadAvatar} loading={avatarSaving}>
                Загрузить фото
              </Button>
              <Button type="button" variant="outline" color="red" onClick={removeAvatar} loading={avatarSaving}>
                Удалить фото
              </Button>
            </Group>
            <Button type="submit" loading={saving}>Сохранить</Button>
          </Stack>
        </form>
      </Card>
    </Stack>
  );
}
