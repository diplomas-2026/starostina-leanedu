import { Group, Select, TextInput } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';

export default function ListControls({
  search,
  onSearchChange,
  searchPlaceholder = 'Поиск',
  sortValue,
  onSortChange,
  sortOptions = [],
  filterValue,
  onFilterChange,
  filterOptions = [],
}) {
  return (
    <Group grow align="end">
      <TextInput
        label="Поиск"
        placeholder={searchPlaceholder}
        value={search}
        onChange={(e) => onSearchChange?.(e.currentTarget.value)}
        leftSection={<IconSearch size={16} />}
      />
      {filterOptions.length > 0 ? (
        <Select
          label="Фильтр"
          data={filterOptions}
          value={filterValue}
          onChange={(value) => onFilterChange?.(value || '')}
          allowDeselect={false}
        />
      ) : null}
      {sortOptions.length > 0 ? (
        <Select
          label="Сортировка"
          data={sortOptions}
          value={sortValue}
          onChange={(value) => onSortChange?.(value || '')}
          allowDeselect={false}
        />
      ) : null}
    </Group>
  );
}
