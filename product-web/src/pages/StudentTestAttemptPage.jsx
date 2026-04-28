import { Alert, Button, Card, Group, Loader, Radio, Stack, Text, Title } from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { testApi } from '../api/services';
import { extractError } from '../utils/errors';
import { attemptStatusLabel } from '../utils/labels';

function formatSeconds(seconds) {
  const safe = Math.max(0, seconds);
  const mm = String(Math.floor(safe / 60)).padStart(2, '0');
  const ss = String(safe % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function StudentTestAttemptPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [session, setSession] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timerTick, setTimerTick] = useState(0);

  const loadSession = async () => {
    setLoading(true);
    setError('');
    try {
      const attemptId = searchParams.get('attemptId');
      const { data } = attemptId ? await testApi.attemptSession(attemptId) : await testApi.startAttempt(id);
      setSession(data);
      setSuccess('');
    } catch (err) {
      setError(extractError(err, 'Не удалось открыть тест'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, [id, searchParams]);

  useEffect(() => {
    const intervalId = setInterval(() => setTimerTick((value) => value + 1), 1000);
    return () => clearInterval(intervalId);
  }, []);

  const secondsLeft = useMemo(() => {
    if (!session?.availableUntil || session.status !== 'IN_PROGRESS') return 0;
    const diff = Math.floor((new Date(session.availableUntil).getTime() - Date.now()) / 1000);
    return Math.max(0, diff);
  }, [session, timerTick]);

  const handleSubmit = async () => {
    if (!session) return;
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        answers: Object.entries(answers).map(([questionId, selectedOptionId]) => ({
          questionId: Number(questionId),
          selectedOptionId: Number(selectedOptionId),
        })),
      };
      const { data } = await testApi.submitAttempt(session.attemptId, payload);
      setSession((prev) => ({
        ...prev,
        status: data.status,
        score: data.score,
        maxScore: data.maxScore,
        grade: data.grade,
      }));
      setSuccess('Тест завершен и отправлен.');
    } catch (err) {
      setError(extractError(err, 'Не удалось завершить тест'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader color="teal" />;

  return (
    <Stack>
      <Title order={2}>{session?.testTitle || 'Прохождение теста'}</Title>
      {error && <Alert color="red">{error}</Alert>}
      {success && <Alert color="green">{success}</Alert>}

      {session && (
        <Card withBorder>
          <Group justify="space-between">
            <Text>Статус: {attemptStatusLabel(session.status)}</Text>
            {session.status === 'IN_PROGRESS' ? (
              <Text fw={700}>Осталось: {formatSeconds(secondsLeft)}</Text>
            ) : (
              <Text fw={700}>Результат: {session.score} / {session.maxScore}{session.grade ? ` · Оценка ${session.grade}` : ''}</Text>
            )}
          </Group>
          {session.availableUntil && session.status === 'IN_PROGRESS' && (
            <Text size="sm" c="dimmed" mt={6}>
              Доступно до: {formatDateTime(session.availableUntil)}
            </Text>
          )}
        </Card>
      )}

      {session?.status === 'IN_PROGRESS' && session.questions.map((question, idx) => (
        <Card key={question.id} withBorder>
          <Stack>
            <Text fw={600}>{idx + 1}. {question.text}</Text>
            <Text size="sm" c="dimmed">Баллы: {question.points}</Text>
            <Radio.Group
              value={answers[question.id] ? String(answers[question.id]) : ''}
              onChange={(value) => setAnswers((prev) => ({ ...prev, [question.id]: value }))}
            >
              <Stack gap="xs">
                {question.options.map((option) => (
                  <Radio key={option.id} value={String(option.id)} label={option.text} />
                ))}
              </Stack>
            </Radio.Group>
          </Stack>
        </Card>
      ))}

      {session?.status === 'IN_PROGRESS' && (
        <Button onClick={handleSubmit} loading={submitting} disabled={secondsLeft <= 0}>
          Завершить тест
        </Button>
      )}

      {session?.status === 'IN_PROGRESS' && secondsLeft <= 0 && (
        <Alert color="yellow">
          Время теста истекло. Нажмите «Завершить тест», чтобы отправить текущие ответы.
        </Alert>
      )}
    </Stack>
  );
}
