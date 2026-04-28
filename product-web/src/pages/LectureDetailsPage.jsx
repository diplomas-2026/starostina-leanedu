import { Alert, Button, Group, Loader, Stack, Text, Textarea, Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { aiApi, lectureApi } from '../api/services';
import AiLimitsCard from '../components/AiLimitsCard';
import NavigationCard from '../components/NavigationCard';
import { PublishStatusBadge } from '../components/SemanticBadges';
import { useAuth } from '../context/AuthContext';
import { extractError } from '../utils/errors';

export default function LectureDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [lecture, setLecture] = useState(null);
  const [limits, setLimits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [generatedTestId, setGeneratedTestId] = useState(null);
  const [teacherPrompt, setTeacherPrompt] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const lectureResp = await lectureApi.get(id);
      setLecture(lectureResp.data);
      if (user?.role === 'TEACHER') {
        const limitsResp = await aiApi.limits();
        setLimits(limitsResp.data);
      } else {
        setLimits(null);
      }
    } catch (err) {
      setError(extractError(err, 'Не удалось загрузить лекцию'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id, user?.role]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    setSuccess('');
    setGeneratedTestId(null);
    if (!teacherPrompt.trim()) {
      setError('Введите требования к генерации для LLM');
      setGenerating(false);
      return;
    }
    try {
      const { data } = await aiApi.generateFromLecture(id, teacherPrompt.trim());
      setGeneratedTestId(data);
      setSuccess(`Черновик теста создан. ID теста: ${data}`);
      const limitsResp = await aiApi.limits();
      setLimits(limitsResp.data);
    } catch (err) {
      setError(extractError(err, 'Не удалось выполнить генерацию'));
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    setError('');
    setSuccess('');
    try {
      await lectureApi.publish(id);
      setSuccess('Лекция опубликована');
      await loadData();
    } catch (err) {
      setError(extractError(err, 'Не удалось опубликовать лекцию'));
    } finally {
      setPublishing(false);
    }
  };

  if (loading) return <Loader color="teal" />;

  return (
    <Stack>
      <Group justify="space-between" align="start">
        <div>
          <Title order={2}>{lecture?.title}</Title>
          <Text c="dimmed">{lecture?.summary}</Text>
          <PublishStatusBadge published={lecture?.published} />
        </div>
        {user?.role === 'TEACHER' && (
          <Group>
            {!lecture?.published && (
              <Button variant="outline" onClick={handlePublish} loading={publishing}>
                Опубликовать
              </Button>
            )}
            <Button onClick={handleGenerate} loading={generating} disabled={limits?.remaining === 0}>
              Сгенерировать тест
            </Button>
          </Group>
        )}
      </Group>

      {user?.role === 'TEACHER' && <AiLimitsCard limits={limits} />}
      {user?.role === 'TEACHER' && (
        <Stack>
          <Alert color="blue">
            Генерация через LLM: опишите требования к тесту (стиль, сложность, акценты), затем нажмите <b>Сгенерировать тест</b>.
          </Alert>
          <Textarea
            label="Инструкция для LLM"
            placeholder="Например: сгенерируй вопросы базового уровня, с акцентом на 5S и виды потерь..."
            minRows={3}
            value={teacherPrompt}
            onChange={(e) => setTeacherPrompt(e.currentTarget.value)}
          />
        </Stack>
      )}

      {error && <Alert color="red">{error}</Alert>}
      {success && <Alert color="green">{success}</Alert>}
      {generatedTestId && (
        <Button component={Link} to={`/tests/${generatedTestId}`} variant="light">
          Открыть сгенерированный тест
        </Button>
      )}

      <Stack>
        <Title order={4}>Тесты по этой лекции</Title>
        {lecture?.tests?.length ? (
          lecture.tests.map((test) => (
            <NavigationCard
              key={test.id}
              to={user?.role === 'STUDENT' ? `/tests/${test.id}/take` : `/tests/${test.id}`}
              title={test.title}
              subtitle={test.description}
              meta={test.published ? 'Опубликован' : 'Черновик'}
            />
          ))
        ) : (
          <Alert color="yellow">Для этой лекции пока нет тестов.</Alert>
        )}
      </Stack>

      <div
        className="lecture-view-content"
        dangerouslySetInnerHTML={{ __html: lecture?.content || '' }}
      />
    </Stack>
  );
}
