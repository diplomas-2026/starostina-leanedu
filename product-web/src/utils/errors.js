export function extractError(error, fallback = 'Произошла ошибка') {
  return error?.response?.data?.message || error?.message || fallback;
}
