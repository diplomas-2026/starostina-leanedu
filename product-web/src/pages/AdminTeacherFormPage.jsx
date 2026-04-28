import { Alert, Button, Card, Stack, TextInput, Title } from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { adminApi } from '../api/services';
import { extractError } from '../utils/errors';

export default function AdminTeacherFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = useMemo(() => Boolean(id), [id]);
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await adminApi.users('TEACHER');
        const teacher = data.find((item) => String(item.id) === String(id));
        if (!teacher) throw new Error('Преподаватель не найден');
        setForm({ fullName: teacher.fullName, email: teacher.email, password: '' });
      } catch (err) {
        setError(extractError(err, 'Не удалось загрузить преподавателя'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isEdit]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (isEdit) {
        await adminApi.updateUser(id, { ...form, password: form.password || null });
      } else {
        await adminApi.createTeacher(form);
      }
      navigate('/admin/teachers');
    } catch (err) {
      setError(extractError(err, 'Не удалось сохранить преподавателя'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack>
      <Title order={2}>{isEdit ? 'Редактирование преподавателя' : 'Добавление преподавателя'}</Title>
      {error && <Alert color="red">{error}</Alert>}
      <Card withBorder>
        <form onSubmit={submit}>
          <Stack>
            <TextInput label="ФИО" value={form.fullName} onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.currentTarget.value }))} required disabled={loading} />
            <TextInput label="Email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.currentTarget.value }))} required disabled={loading} />
            <TextInput label={isEdit ? 'Новый пароль (опционально)' : 'Пароль'} value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.currentTarget.value }))} required={!isEdit} disabled={loading} />
            <Button type="submit" loading={saving} disabled={loading}>{isEdit ? 'Сохранить' : 'Создать'}</Button>
            <Button component={Link} to="/admin/teachers" variant="light">Назад</Button>
          </Stack>
        </form>
      </Card>
    </Stack>
  );
}
