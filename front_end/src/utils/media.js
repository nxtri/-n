export const getMediaUrl = (path) => {
  if (!path) return '';

  const rawPath = String(path);
  if (/^(https?:)?\/\//i.test(rawPath) || rawPath.startsWith('data:') || rawPath.startsWith('blob:')) {
    return rawPath;
  }

  const apiUrl = import.meta.env.VITE_API_URL || '';
  const cleanPath = rawPath
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .replace(/^uploads\/+/, '');

  return `${apiUrl}/uploads/${cleanPath}`;
};
