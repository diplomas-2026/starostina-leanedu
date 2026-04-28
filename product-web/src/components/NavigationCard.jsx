import { Card, Group, Stack, Text } from '@mantine/core';
import { IconChevronRight } from '@tabler/icons-react';
import { Link } from 'react-router-dom';

export default function NavigationCard({ to, title, subtitle, meta }) {
  return (
    <Card component={Link} to={to} withBorder radius="md" shadow="sm" style={{ textDecoration: 'none' }}>
      <Group justify="space-between" align="center">
        <Stack gap={4}>
          <Text fw={700} c="white">{title}</Text>
          {subtitle ? <Text size="sm" c="dimmed">{subtitle}</Text> : null}
          {meta ? <Text size="xs" c="dimmed">{meta}</Text> : null}
        </Stack>
        <IconChevronRight size={18} />
      </Group>
    </Card>
  );
}
