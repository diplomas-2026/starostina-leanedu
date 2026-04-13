import { Alert, Button, Group, Loader, Stack, Text, Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { aiApi, lectureApi } from '../api/services';
import AiLimitsCard from '../components/AiLimitsCard';
import { useAuth } from '../context/AuthContext';
import { extractError } from '../utils/errors';

export default function LectureDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [lecture, setLecture] = useState(null);
  const [limits, setLimits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
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
    try {
      const { data } = await aiApi.generateFromLecture(id);
      setSuccess(`Черновик теста создан. ID теста: ${data}`);
      const limitsResp = await aiApi.limits();
      setLimits(limitsResp.data);
    } catch (err) {
      setError(extractError(err, 'Не удалось выполнить генерацию'));
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <Loader color="teal" />;

  return (
    <Stack>
      <Group justify="space-between" align="start">
        <div>
          <Title order={2}>{lecture?.title}</Title>
          <Text c="dimmed">{lecture?.summary}</Text>
        </div>
        {user?.role === 'TEACHER' && (
          <Button onClick={handleGenerate} loading={generating} disabled={limits?.remaining === 0}>
            Сгенерировать тест
          </Button>
        )}
      </Group>

      <AiLimitsCard limits={limits} />

      {error && <Alert color="red">{error}</Alert>}
      {success && <Alert color="green">{success}</Alert>}

      <Text style={{ whiteSpace: 'pre-wrap' }}>{lecture?.content}</Text>
    </Stack>
  );
}
