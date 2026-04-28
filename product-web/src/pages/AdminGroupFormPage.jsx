import { Alert, Button, Card, Select, Stack, TextInput, Title } from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { adminApi } from '../api/services';
import { extractError } from '../utils/errors';

export default function AdminGroupFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = useMemo(() => Boolean(id), [id]);
  const [form, setForm] = useState({ code: '', name: '', courseYear: '1' });
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await adminApi.groups();
        const item = data.find((row) => String(row.id) === String(id));
        if (!item) throw new Error('Группа не найдена');
        setForm({ code: item.code, name: item.name, courseYear: String(item.courseYear) });
      } catch (err) {
        setError(extractError(err, 'Не удалось загрузить группу'));
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
      const payload = { ...form, courseYear: Number(form.courseYear) };
      if (isEdit) {
        await adminApi.updateGroup(id, payload);
      } else {
        await adminApi.createGroup(payload);
      }
      navigate('/admin/groups');
    } catch (err) {
      setError(extractError(err, 'Не удалось сохранить группу'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack>
      <Title order={2}>{isEdit ? 'Редактирование группы' : 'Добавление группы'}</Title>
      {error && <Alert color="red">{error}</Alert>}
      <Card withBorder>
        <form onSubmit={submit}>
          <Stack>
            <TextInput label="Код" value={form.code} onChange={(e) => setForm((prev) => ({ ...prev, code: e.currentTarget.value }))} required disabled={loading} />
            <TextInput label="Название" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.currentTarget.value }))} required disabled={loading} />
            <Select
              label="Курс"
              data={[{ value: '1', label: '1' }, { value: '2', label: '2' }, { value: '3', label: '3' }, { value: '4', label: '4' }]}
              value={form.courseYear}
              onChange={(v) => setForm((prev) => ({ ...prev, courseYear: v || '1' }))}
            />
            <Button type="submit" loading={saving} disabled={loading}>{isEdit ? 'Сохранить' : 'Создать'}</Button>
            <Button component={Link} to="/admin/groups" variant="light">Назад</Button>
          </Stack>
        </form>
      </Card>
    </Stack>
  );
}
