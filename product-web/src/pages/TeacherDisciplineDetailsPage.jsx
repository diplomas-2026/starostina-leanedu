import { Alert, Button, Card, Group, Loader, Stack, Text, Title } from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { lectureApi, teacherApi, testApi } from '../api/services';
import NavigationCard from '../components/NavigationCard';
import { extractError } from '../utils/errors';

export default function TeacherDisciplineDetailsPage() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const [discipline, setDiscipline] = useState(null);
  const [groups, setGroups] = useState([]);
  const [tests, setTests] = useState([]);
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const subjectIdNum = useMemo(() => Number(subjectId), [subjectId]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [disciplinesResp, groupsResp, testsResp, lecturesResp] = await Promise.all([
          teacherApi.disciplines(),
          teacherApi.groups(subjectIdNum),
          testApi.list(),
          lectureApi.list(subjectIdNum),
        ]);

        const found = disciplinesResp.data.find((item) => item.id === subjectIdNum);
        if (!found) {
          setError('Дисциплина не найдена в ваших назначениях');
          setDiscipline(null);
          return;
        }

        setDiscipline(found);
        setGroups(groupsResp.data);
        setLectures(lecturesResp.data);

        const scopedTests = testsResp.data.filter((test) => test.subjectId === subjectIdNum);
        setTests(scopedTests);
      } catch (err) {
        setError(extractError(err, 'Не удалось загрузить данные дисциплины'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [subjectIdNum]);

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Дисциплина: {discipline?.name || '...'}</Title>
        <Group>
          <Button variant="light" onClick={() => navigate('/teacher/disciplines')}>К списку дисциплин</Button>
          <Button component={Link} to={`/tests/new?subjectId=${subjectIdNum}`}>Создать тест</Button>
        </Group>
      </Group>

      {loading && <Loader color="teal" />}
      {error && <Alert color="red">{error}</Alert>}

      {!loading && discipline && (
        <>
          <Card withBorder>
            <Stack>
              <Text fw={700}>Лекции по дисциплине</Text>
              {lectures.length === 0 ? (
                <Alert color="yellow">Лекций по этой дисциплине пока нет.</Alert>
              ) : (
                lectures.map((lecture) => (
                  <NavigationCard
                    key={lecture.id}
                    to={`/lectures/${lecture.id}`}
                    title={lecture.title}
                    subtitle={lecture.summary}
                    meta={lecture.published ? 'Опубликовано' : 'Черновик'}
                  />
                ))
              )}
            </Stack>
          </Card>

          <Card withBorder>
            <Stack>
              <Text fw={700}>Тесты по дисциплине</Text>
              {tests.length === 0 ? (
                <Alert color="yellow">Тестов по этой дисциплине пока нет.</Alert>
              ) : (
                tests.map((test) => (
                  <NavigationCard
                    key={test.id}
                    to={`/tests/${test.id}`}
                    title={test.title}
                    subtitle={test.description}
                    meta={`Пороги: 3/${test.minScore3}, 4/${test.minScore4}, 5/${test.minScore5}`}
                  />
                ))
              )}
            </Stack>
          </Card>

          <Card withBorder>
            <Stack>
              <Text fw={700}>Группы по дисциплине</Text>
              {groups.length === 0 ? (
                <Alert color="yellow">По этой дисциплине пока нет назначенных групп.</Alert>
              ) : (
                groups.map((group) => (
                  <NavigationCard
                    key={group.id}
                    to={`/groups/${group.id}`}
                    title={`${group.code} — ${group.name}`}
                    subtitle={`Курс: ${group.courseYear}`}
                    meta="Открыть карточку группы"
                  />
                ))
              )}
            </Stack>
          </Card>
        </>
      )}
    </Stack>
  );
}
