import { Alert, Badge, Button, Card, Group, Loader, Modal, Stack, Text, TextInput, Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { lectureApi } from '../api/services';
import LectureEditor from '../components/LectureEditor';
import { useAuth } from '../context/AuthContext';
import { extractError } from '../utils/errors';
import { publishStatusLabel } from '../utils/labels';

export default function LecturesPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [createOpened, setCreateOpened] = useState(false);
  const [form, setForm] = useState({
    title: '',
    summary: '',
    content: '<p>Введите текст лекции...</p>',
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await lectureApi.list();
      setItems(data);
    } catch (err) {
      setError(extractError(err, 'Не удалось загрузить лекции'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateLecture = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await lectureApi.create(form);
      setMessage('Лекция создана в статусе черновика');
      setCreateOpened(false);
      setForm({
        title: '',
        summary: '',
        content: '<p>Введите текст лекции...</p>',
      });
      await loadData();
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
            <Button variant="light" onClick={loadData}>Обновить</Button>
          </Group>
        )}
      </Group>

      {message && <Alert color="green">{message}</Alert>}
      {loading && <Loader color="teal" />}
      {error && <Alert color="red">{error}</Alert>}
      {items.map((lecture) => (
        <Card key={lecture.id} withBorder radius="md" shadow="sm">
          <Group justify="space-between" align="start">
            <Stack gap={4}>
              <Text fw={700}>{lecture.title}</Text>
              <Text size="sm" c="dimmed">{lecture.summary}</Text>
              <Badge size="sm" variant="light">
                {publishStatusLabel(lecture.published)}
              </Badge>
            </Stack>
            <Button component={Link} to={`/lectures/${lecture.id}`} variant="light">Открыть</Button>
          </Group>
        </Card>
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
