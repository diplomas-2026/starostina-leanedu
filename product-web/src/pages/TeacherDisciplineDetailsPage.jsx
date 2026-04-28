import { Alert, Button, Card, Group, Loader, Stack, Text, Title } from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { lectureApi, teacherApi, testApi } from '../api/services';
import ListControls from '../components/ListControls';
import NavigationCard from '../components/NavigationCard';
import { extractError } from '../utils/errors';

export default function TeacherDisciplineDetailsPage() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const [discipline, setDiscipline] = useState(null);
  const [groups, setGroups] = useState([]);
  const [tests, setTests] = useState([]);
  const [lectures, setLectures] = useState([]);
  const [lecturesSearch, setLecturesSearch] = useState('');
  const [testsSearch, setTestsSearch] = useState('');
  const [groupsSearch, setGroupsSearch] = useState('');
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

  const visibleLectures = useMemo(() => lectures
    .filter((lecture) => `${lecture.title} ${lecture.summary}`.toLowerCase().includes(lecturesSearch.trim().toLowerCase()))
    .sort((a, b) => a.title.localeCompare(b.title, 'ru')), [lectures, lecturesSearch]);
  const visibleTests = useMemo(() => tests
    .filter((test) => `${test.title} ${test.description}`.toLowerCase().includes(testsSearch.trim().toLowerCase()))
    .sort((a, b) => a.title.localeCompare(b.title, 'ru')), [tests, testsSearch]);
  const visibleGroups = useMemo(() => groups
    .filter((group) => `${group.code} ${group.name}`.toLowerCase().includes(groupsSearch.trim().toLowerCase()))
    .sort((a, b) => a.code.localeCompare(b.code, 'ru')), [groups, groupsSearch]);

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
              <ListControls
                search={lecturesSearch}
                onSearchChange={setLecturesSearch}
                searchPlaceholder="Поиск по лекциям"
              />
              {visibleLectures.length === 0 ? (
                <Alert color="yellow">Лекций по этой дисциплине пока нет.</Alert>
              ) : (
                visibleLectures.map((lecture) => (
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
              <ListControls
                search={testsSearch}
                onSearchChange={setTestsSearch}
                searchPlaceholder="Поиск по тестам"
              />
              {visibleTests.length === 0 ? (
                <Alert color="yellow">Тестов по этой дисциплине пока нет.</Alert>
              ) : (
                visibleTests.map((test) => (
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
              <ListControls
                search={groupsSearch}
                onSearchChange={setGroupsSearch}
                searchPlaceholder="Поиск по группам"
              />
              {visibleGroups.length === 0 ? (
                <Alert color="yellow">По этой дисциплине пока нет назначенных групп.</Alert>
              ) : (
                visibleGroups.map((group) => (
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
