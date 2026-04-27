import { Button, Group, Paper, Stack } from '@mantine/core';
import { useEffect, useRef } from 'react';

const TOOLBAR = [
  { label: 'B', command: 'bold' },
  { label: 'I', command: 'italic' },
  { label: 'U', command: 'underline' },
  { label: '• Список', command: 'insertUnorderedList' },
  { label: '1. Список', command: 'insertOrderedList' },
  { label: 'H2', command: 'formatBlock', value: 'h2' },
  { label: 'H3', command: 'formatBlock', value: 'h3' },
  { label: 'Абзац', command: 'formatBlock', value: 'p' },
];

export default function LectureEditor({ value, onChange }) {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const runCommand = (command, commandValue) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, commandValue);
    onChange(editorRef.current.innerHTML);
  };

  return (
    <Stack gap="xs">
      <Group gap="xs" wrap="wrap">
        {TOOLBAR.map((item) => (
          <Button
            key={item.label}
            size="xs"
            variant="light"
            onClick={() => runCommand(item.command, item.value)}
          >
            {item.label}
          </Button>
        ))}
      </Group>

      <Paper
        withBorder
        p="md"
        style={{
          minHeight: 240,
          lineHeight: 1.55,
          borderRadius: 8,
        }}
      >
        <div
          ref={editorRef}
          contentEditable
          className="lecture-editor-content"
          onInput={() => onChange(editorRef.current?.innerHTML || '')}
          style={{ minHeight: 200, outline: 'none' }}
          suppressContentEditableWarning
        />
      </Paper>
    </Stack>
  );
}
