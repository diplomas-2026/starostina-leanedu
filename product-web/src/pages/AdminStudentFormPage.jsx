import { Alert, Button, Card, Select, Stack, TextInput, Title } from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { adminApi } from '../api/services';
import { extractError } from '../utils/errors';

export default function AdminStudentFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = useMemo(() => Boolean(id), [id]);
  const [form, setForm] = useState({ fullName: '', email: '', password: '', groupId: '' });
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [{ data: groupsData }, { data: students }] = await Promise.all([
          adminApi.groups(),
          adminApi.users('STUDENT'),
        ]);
        const options = groupsData.map((item) => ({ value: String(item.id), label: `${item.code} — ${item.name}` }));
        setGroups(options);
        if (isEdit) {
          const student = students.find((item) => String(item.id) === String(id));
          if (!student) throw new Error('Студент не найден');
          setForm({ fullName: student.fullName, email: student.email, password: '', groupId: '' });
        }
      } catch (err) {
        setError(extractError(err, 'Не удалось загрузить форму студента'));
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
        await adminApi.updateUser(id, { fullName: form.fullName, email: form.email, password: form.password || null });
      } else {
        const { data } = await adminApi.createStudent({ fullName: form.fullName, email: form.email, password: form.password });
        if (form.groupId) {
          await adminApi.addStudentToGroup(form.groupId, data.id);
        }
      }
      navigate('/admin/students');
    } catch (err) {
      setError(extractError(err, 'Не удалось сохранить студента'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack>
      <Title order={2}>{isEdit ? 'Редактирование студента' : 'Добавление студента'}</Title>
      {error && <Alert color="red">{error}</Alert>}
      <Card withBorder>
        <form onSubmit={submit}>
          <Stack>
            <TextInput label="ФИО" value={form.fullName} onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.currentTarget.value }))} required disabled={loading} />
            <TextInput label="Email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.currentTarget.value }))} required disabled={loading} />
            <TextInput label={isEdit ? 'Новый пароль (опционально)' : 'Пароль'} value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.currentTarget.value }))} required={!isEdit} disabled={loading} />
            {!isEdit && <Select label="Группа (опционально)" data={groups} value={form.groupId} onChange={(v) => setForm((prev) => ({ ...prev, groupId: v || '' }))} searchable />}
            <Button type="submit" loading={saving} disabled={loading}>{isEdit ? 'Сохранить' : 'Создать'}</Button>
            <Button component={Link} to="/admin/students" variant="light">Назад</Button>
          </Stack>
        </form>
      </Card>
    </Stack>
  );
}
