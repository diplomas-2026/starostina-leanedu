import { Card, Group, Progress, Stack, Text } from '@mantine/core';

export default function AiLimitsCard({ limits }) {
  if (!limits) return null;

  const usedPercent = Math.min(100, Math.round((limits.usedToday / limits.dailyLimit) * 100));

  return (
    <Card withBorder shadow="sm" radius="md" p="lg">
      <Stack gap="xs">
        <Text fw={700}>LLM лимит (GigaChat)</Text>
        <Group justify="space-between">
          <Text size="sm">Использовано: {limits.usedToday} / {limits.dailyLimit}</Text>
          <Text size="sm">Осталось: {limits.remaining}</Text>
        </Group>
        <Progress value={usedPercent} color={limits.remaining > 0 ? 'teal' : 'red'} />
        <Text size="xs" c="dimmed">
          Сброс лимита: {new Date(limits.resetsAt).toLocaleString('ru-RU', { timeZone: 'Europe/Samara' })} (Самара)
        </Text>
      </Stack>
    </Card>
  );
}
