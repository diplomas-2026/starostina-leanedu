import { Alert, Badge, Button, Card, Checkbox, Group, Loader, List, NumberInput, Stack, Text, TextInput, Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { testApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { extractError } from '../utils/errors';
import { publishStatusLabel } from '../utils/labels';

export default function TestDetailsPage() {
  const { user } = useAuth();
  const { id } = useParams();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingQuestion, setSavingQuestion] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [questionForm, setQuestionForm] = useState({
    text: '',
    points: 1,
    options: [
      { text: '', correct: true },
      { text: '', correct: false },
    ],
  });

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await testApi.get(id);
      setTest(data);
    } catch (err) {
      setError(extractError(err, 'Не удалось загрузить тест'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const setOption = (index, next) => {
    setQuestionForm((prev) => ({
      ...prev,
      options: prev.options.map((option, idx) => (idx === index ? { ...option, ...next } : option)),
    }));
  };

  const addOption = () => {
    setQuestionForm((prev) => ({
      ...prev,
      options: [...prev.options, { text: '', correct: false }],
    }));
  };

  const removeOption = (index) => {
    setQuestionForm((prev) => ({
      ...prev,
      options: prev.options.filter((_, idx) => idx !== index),
    }));
  };

  const submitQuestion = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const options = questionForm.options.filter((option) => option.text.trim().length > 0);
    if (options.length < 2) {
      setError('Добавьте минимум 2 варианта ответа');
      return;
    }
    if (!options.some((option) => option.correct)) {
      setError('Нужно отметить минимум один правильный вариант');
      return;
    }

    setSavingQuestion(true);
    try {
      await testApi.addQuestion(id, {
        text: questionForm.text,
        points: Number(questionForm.points),
        options: options.map((option) => ({ text: option.text.trim(), correct: option.correct })),
      });
      setQuestionForm({
        text: '',
        points: 1,
        options: [
          { text: '', correct: true },
          { text: '', correct: false },
        ],
      });
      setMessage('Вопрос добавлен');
      await load();
    } catch (err) {
      setError(extractError(err, 'Не удалось добавить вопрос'));
    } finally {
      setSavingQuestion(false);
    }
  };

  if (loading) {
    return <Loader color="teal" />;
  }

  if (!test) {
    return <Alert color="red">Тест не найден</Alert>;
  }

  return (
    <Stack>
      <Group justify="space-between" align="start">
        <Stack gap={4}>
          <Title order={2}>{test.title}</Title>
          <Text c="dimmed">{test.description}</Text>
          <Text size="sm" c="dimmed">Дисциплина: {test.subjectName || 'Не указана'}</Text>
          <Text size="sm" c="dimmed">Время: {test.timeLimitMin} мин · Попыток: {test.attemptsLimit}</Text>
          <Text size="sm" c="dimmed">
            Пороги: 3 от {test.minScore3}, 4 от {test.minScore4}, 5 от {test.minScore5}
          </Text>
        </Stack>
        <Badge variant="light">{publishStatusLabel(test.published)}</Badge>
      </Group>

      {error && <Alert color="red">{error}</Alert>}
      {message && <Alert color="green">{message}</Alert>}

      {user?.role === 'TEACHER' && (
        <Card withBorder>
          <Title order={4} mb="sm">Добавить вопрос</Title>
          <form onSubmit={submitQuestion}>
            <Stack>
              <TextInput
                label="Текст вопроса"
                value={questionForm.text}
                onChange={(e) => setQuestionForm((prev) => ({ ...prev, text: e.target.value }))}
                required
              />
              <NumberInput
                label="Баллы за вопрос"
                min={1}
                value={questionForm.points}
                onChange={(value) => setQuestionForm((prev) => ({ ...prev, points: Number(value) || 1 }))}
                required
              />
              <Title order={5}>Варианты ответа</Title>
              {questionForm.options.map((option, index) => (
                <Group key={index} align="end">
                  <TextInput
                    style={{ flex: 1 }}
                    label={`Вариант ${index + 1}`}
                    value={option.text}
                    onChange={(e) => setOption(index, { text: e.target.value })}
                    required
                  />
                  <Checkbox
                    label="Правильный"
                    checked={option.correct}
                    onChange={(e) => setOption(index, { correct: e.currentTarget.checked })}
                  />
                  <Button
                    variant="light"
                    color="red"
                    onClick={() => removeOption(index)}
                    disabled={questionForm.options.length <= 2}
                  >
                    Удалить
                  </Button>
                </Group>
              ))}
              <Group>
                <Button type="button" variant="light" onClick={addOption}>Добавить вариант</Button>
                <Button type="submit" loading={savingQuestion}>Сохранить вопрос</Button>
              </Group>
            </Stack>
          </form>
        </Card>
      )}

      <Card withBorder>
        <Title order={4} mb="sm">Назначение теста</Title>
        {test.assignments?.length ? (
          <List spacing={6}>
            {test.assignments.map((assignment) => (
              <List.Item key={assignment.assignmentId}>
                {assignment.groupCode} — {assignment.groupName}, дедлайн:{' '}
                {new Date(assignment.dueAt).toLocaleString('ru-RU', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </List.Item>
            ))}
          </List>
        ) : (
          <Alert color="yellow">Тест пока не назначен ни одной группе.</Alert>
        )}
      </Card>

      <Title order={4}>Вопросы</Title>
      {test.questions.length === 0 && (
        <Alert color="yellow">В тесте пока нет вопросов.</Alert>
      )}

      {test.questions.map((question, index) => (
        <Card key={question.id} withBorder>
          <Stack gap={8}>
            <Text fw={600}>{index + 1}. {question.text}</Text>
            <Text size="sm" c="dimmed">Баллы за вопрос: {question.points}</Text>
            <List spacing={6}>
              {question.options.map((option) => (
                <List.Item key={option.id}>
                  <Group gap="xs">
                    <Text>{option.text}</Text>
                    {option.correct ? <Badge size="xs" color="teal" variant="light">Правильный</Badge> : null}
                  </Group>
                </List.Item>
              ))}
            </List>
          </Stack>
        </Card>
      ))}
    </Stack>
  );
}
