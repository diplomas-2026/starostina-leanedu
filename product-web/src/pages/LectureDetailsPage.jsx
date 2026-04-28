import { Alert, Badge, Button, Group, Loader, Stack, Text, Textarea, Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { aiApi, lectureApi } from '../api/services';
import AiLimitsCard from '../components/AiLimitsCard';
import { useAuth } from '../context/AuthContext';
import { extractError } from '../utils/errors';
import { publishStatusLabel } from '../utils/labels';

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
      const [lectureResp, limitsResp] = await Promise.all([lectureApi.get(id), aiApi.limits()]);
      setLecture(lectureResp.data);
      setLimits(limitsResp.data);
    } catch (err) {
      setError(extractError(err, 'Не удалось загрузить лекцию'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    setSuccess('');
    setGeneratedTestId(null);
    if (!teacherPrompt.trim()) {
      setError('Введите требования к генерации для LLM');
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
          <Badge mt={8} variant="light">
            {publishStatusLabel(lecture?.published)}
          </Badge>
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

      <AiLimitsCard limits={limits} />
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

      <div
        className="lecture-view-content"
        dangerouslySetInnerHTML={{ __html: lecture?.content || '' }}
      />
    </Stack>
  );
}
