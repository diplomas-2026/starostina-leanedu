import { Alert, Button, Card, Group, Loader, MultiSelect, NumberInput, Select, Stack, Table, Text, TextInput, Title } from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { teacherApi, testApi } from '../api/services';
import { extractError } from '../utils/errors';

export default function CreateTestPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    title: '',
    description: '',
    subjectId: '',
    groupIds: [],
    dueAtLocal: '',
    timeLimitMin: 20,
    attemptsLimit: 1,
    minScore3: 5,
    minScore4: 7,
    minScore5: 9,
  });
  const [subjects, setSubjects] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSubjects = async () => {
      setLoadingSubjects(true);
      setError('');
      try {
        const { data } = await teacherApi.disciplines();
        const options = data.map((subject) => ({
          value: String(subject.id),
          label: `${subject.code} — ${subject.name}`,
        }));
        setSubjects(options);
        if (options.length > 0) {
          const subjectIdFromQuery = searchParams.get('subjectId');
          const selected = subjectIdFromQuery && options.some((item) => item.value === subjectIdFromQuery)
            ? subjectIdFromQuery
            : options[0].value;
          setForm((prev) => ({ ...prev, subjectId: selected }));
        }
      } catch (err) {
        setError(extractError(err, 'Не удалось загрузить дисциплины преподавателя'));
      } finally {
        setLoadingSubjects(false);
      }
    };
    loadSubjects();
  }, [searchParams]);

  useEffect(() => {
    if (!form.subjectId) {
      setGroups([]);
      setForm((prev) => ({ ...prev, groupIds: [] }));
      return;
    }
    const loadGroups = async () => {
      setLoadingGroups(true);
      setError('');
      try {
        const { data } = await teacherApi.groups(form.subjectId);
        const options = data.map((group) => ({
          value: String(group.id),
          label: `${group.code} — ${group.name}`,
        }));
        setGroups(options);
        setForm((prev) => ({
          ...prev,
          groupIds: prev.groupIds.filter((id) => options.some((option) => option.value === id)),
        }));
      } catch (err) {
        setError(extractError(err, 'Не удалось загрузить группы по выбранной дисциплине'));
      } finally {
        setLoadingGroups(false);
      }
    };
    loadGroups();
  }, [form.subjectId]);

  const disciplineName = useMemo(
    () => subjects.find((item) => item.value === form.subjectId)?.label || '—',
    [subjects, form.subjectId],
  );

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.subjectId) {
      setError('Выберите дисциплину');
      return;
    }
    if (form.groupIds.length === 0) {
      setError('Выберите хотя бы одну группу');
      return;
    }
    if (!form.dueAtLocal) {
      setError('Укажите дедлайн');
      return;
    }

    setSaving(true);
    try {
      await testApi.create({
        title: form.title,
        description: form.description,
        subjectId: Number(form.subjectId),
        groupIds: form.groupIds.map(Number),
        dueAt: new Date(form.dueAtLocal).toISOString(),
        timeLimitMin: Number(form.timeLimitMin),
        attemptsLimit: Number(form.attemptsLimit),
        minScore3: Number(form.minScore3),
        minScore4: Number(form.minScore4),
        minScore5: Number(form.minScore5),
      });
      navigate('/tests');
    } catch (err) {
      setError(extractError(err, 'Не удалось создать тест'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Создание теста</Title>
        <Button component={Link} to="/tests" variant="light">К списку тестов</Button>
      </Group>

      {error && <Alert color="red">{error}</Alert>}

      <Card withBorder>
        {loadingSubjects ? (
          <Loader color="teal" />
        ) : (
          <Stack gap={8}>
            <Title order={4}>Мои дисциплины</Title>
            {subjects.length === 0 ? (
              <Alert color="yellow">У вас пока нет назначенных дисциплин. Обратитесь к администратору.</Alert>
            ) : (
              <Table>
                <Table.Tbody>
                  {subjects.map((item) => (
                    <Table.Tr key={item.value}>
                      <Table.Td>{item.label}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Stack>
        )}
      </Card>

      <Card withBorder>
        <form onSubmit={submit}>
          <Stack>
            <TextInput label="Название теста" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <TextInput label="Описание" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />

            <Select
              label="Дисциплина"
              data={subjects}
              value={form.subjectId}
              onChange={(value) => setForm({ ...form, subjectId: value || '' })}
              searchable
              nothingFoundMessage="Дисциплины не найдены"
              required
            />

            <MultiSelect
              label="Группы получатели"
              data={groups}
              value={form.groupIds}
              onChange={(value) => setForm({ ...form, groupIds: value })}
              searchable
              nothingFoundMessage={loadingGroups ? 'Загрузка...' : 'Группы не найдены'}
              disabled={!form.subjectId || loadingGroups}
              required
            />

            <TextInput
              type="datetime-local"
              label="Дедлайн выполнения"
              value={form.dueAtLocal}
              onChange={(e) => setForm({ ...form, dueAtLocal: e.target.value })}
              required
            />

            <Group grow>
              <NumberInput label="Лимит времени (мин)" min={1} value={form.timeLimitMin} onChange={(v) => setForm({ ...form, timeLimitMin: Number(v) || 1 })} required />
              <NumberInput label="Макс. попыток" min={1} value={form.attemptsLimit} onChange={(v) => setForm({ ...form, attemptsLimit: Number(v) || 1 })} required />
            </Group>

            <Group grow>
              <NumberInput label="Порог на 3" min={0} value={form.minScore3} onChange={(v) => setForm({ ...form, minScore3: Number(v) || 0 })} required />
              <NumberInput label="Порог на 4" min={0} value={form.minScore4} onChange={(v) => setForm({ ...form, minScore4: Number(v) || 0 })} required />
              <NumberInput label="Порог на 5" min={0} value={form.minScore5} onChange={(v) => setForm({ ...form, minScore5: Number(v) || 0 })} required />
            </Group>

            <Alert color="blue">
              Тест будет создан по дисциплине: <b>{disciplineName}</b> и назначен выбранным группам с единым дедлайном.
            </Alert>

            <Button type="submit" loading={saving}>Создать тест</Button>
          </Stack>
        </form>
      </Card>
    </Stack>
  );
}
