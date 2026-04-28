import { Alert, Button, Card, Stack, TextInput, Title } from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { adminApi } from '../api/services';
import { extractError } from '../utils/errors';

export default function AdminSubjectFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = useMemo(() => Boolean(id), [id]);
  const [form, setForm] = useState({ code: '', name: '' });
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await adminApi.subjects();
        const item = data.find((row) => String(row.id) === String(id));
        if (!item) throw new Error('Дисциплина не найдена');
        setForm({ code: item.code, name: item.name });
      } catch (err) {
        setError(extractError(err, 'Не удалось загрузить дисциплину'));
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
        await adminApi.updateSubject(id, form);
      } else {
        await adminApi.createSubject(form);
      }
      navigate('/admin/subjects');
    } catch (err) {
      setError(extractError(err, 'Не удалось сохранить дисциплину'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack>
      <Title order={2}>{isEdit ? 'Редактирование дисциплины' : 'Добавление дисциплины'}</Title>
      {error && <Alert color="red">{error}</Alert>}
      <Card withBorder>
        <form onSubmit={submit}>
          <Stack>
            <TextInput label="Код" value={form.code} onChange={(e) => setForm((prev) => ({ ...prev, code: e.currentTarget.value }))} required disabled={loading} />
            <TextInput label="Название" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.currentTarget.value }))} required disabled={loading} />
            <Button type="submit" loading={saving} disabled={loading}>{isEdit ? 'Сохранить' : 'Создать'}</Button>
            <Button component={Link} to="/admin/subjects" variant="light">Назад</Button>
          </Stack>
        </form>
      </Card>
    </Stack>
  );
}
