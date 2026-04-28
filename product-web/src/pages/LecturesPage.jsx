import { Alert, Button, Group, Loader, Modal, Select, Stack, Text, TextInput, Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { lectureApi, teacherApi } from '../api/services';
import NavigationCard from '../components/NavigationCard';
import LectureEditor from '../components/LectureEditor';
import { useAuth } from '../context/AuthContext';
import { extractError } from '../utils/errors';
import { publishStatusLabel } from '../utils/labels';

export default function LecturesPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [disciplines, setDisciplines] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingDisciplines, setLoadingDisciplines] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createOpened, setCreateOpened] = useState(false);
  const [form, setForm] = useState({
    title: '',
    summary: '',
    content: '<p>Введите текст лекции...</p>',
    subjectId: '',
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadData = async (subjectIdParam = selectedSubjectId) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await lectureApi.list(subjectIdParam || undefined);
      setItems(data);
    } catch (err) {
      setError(extractError(err, 'Не удалось загрузить лекции'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadDisciplines = async () => {
      if (user?.role !== 'TEACHER') {
        return;
      }
      setLoadingDisciplines(true);
      try {
        const { data } = await teacherApi.disciplines();
        const options = data.map((subject) => ({
          value: String(subject.id),
          label: `${subject.code} — ${subject.name}`,
        }));
        setDisciplines(options);
        const querySubjectId = searchParams.get('subjectId');
        const selected = querySubjectId && options.some((item) => item.value === querySubjectId)
          ? querySubjectId
          : options[0]?.value || '';
        setSelectedSubjectId(selected);
        setForm((prev) => ({ ...prev, subjectId: selected }));
        await loadData(selected);
      } catch (err) {
        setError(extractError(err, 'Не удалось загрузить дисциплины преподавателя'));
      } finally {
        setLoadingDisciplines(false);
      }
    };

    if (user?.role === 'TEACHER') {
      loadDisciplines();
      return;
    }
    loadData('');
  }, []);

  useEffect(() => {
    if (user?.role !== 'TEACHER') {
      return;
    }
    if (!selectedSubjectId) {
      setItems([]);
      return;
    }
    loadData(selectedSubjectId);
  }, [selectedSubjectId]);

  const handleCreateLecture = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await lectureApi.create({
        ...form,
        subjectId: Number(form.subjectId),
      });
      setMessage('Лекция создана в статусе черновика');
      setCreateOpened(false);
      setForm({
        title: '',
        summary: '',
        content: '<p>Введите текст лекции...</p>',
        subjectId: selectedSubjectId,
      });
      await loadData(selectedSubjectId);
    } catch (err) {
      setError(extractError(err, 'Не удалось создать лекцию'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Лекции</Title>
        {user?.role === 'TEACHER' && (
          <Group>
            <Button onClick={() => setCreateOpened(true)}>Создать лекцию</Button>
            <Button variant="light" onClick={() => loadData(selectedSubjectId)}>Обновить</Button>
          </Group>
        )}
      </Group>

      {message && <Alert color="green">{message}</Alert>}
      {(loading || loadingDisciplines) && <Loader color="teal" />}
      {error && <Alert color="red">{error}</Alert>}

      {user?.role === 'TEACHER' && (
        <Card withBorder>
          <Select
            label="Дисциплина"
            data={disciplines}
            value={selectedSubjectId}
            onChange={(value) => {
              const next = value || '';
              setSelectedSubjectId(next);
              setForm((prev) => ({ ...prev, subjectId: next }));
            }}
            searchable
            nothingFoundMessage="Дисциплины не найдены"
          />
        </Card>
      )}
      {items.map((lecture) => (
        <NavigationCard
          key={lecture.id}
          to={`/lectures/${lecture.id}`}
          title={lecture.title}
          subtitle={lecture.summary}
          meta={`Дисциплина: ${lecture.subjectName || '—'} · ${publishStatusLabel(lecture.published)}`}
        />
      ))}

      <Modal
        opened={createOpened}
        onClose={() => setCreateOpened(false)}
        title="Создание новой лекции"
        size="xl"
        centered
      >
        <form onSubmit={handleCreateLecture}>
          <Stack>
            <TextInput
              label="Название лекции"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              required
            />
            <TextInput
              label="Краткое описание"
              value={form.summary}
              onChange={(e) => setForm((prev) => ({ ...prev, summary: e.target.value }))}
              required
            />
            <Select
              label="Дисциплина"
              data={disciplines}
              value={form.subjectId}
              onChange={(value) => setForm((prev) => ({ ...prev, subjectId: value || '' }))}
              searchable
              nothingFoundMessage="Дисциплины не найдены"
              required
            />

            <div>
              <Text size="sm" fw={500} mb={6}>Содержание лекции</Text>
              <LectureEditor
                value={form.content}
                onChange={(html) => setForm((prev) => ({ ...prev, content: html }))}
              />
            </div>

            <Button type="submit" loading={saving}>
              Сохранить лекцию
            </Button>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
