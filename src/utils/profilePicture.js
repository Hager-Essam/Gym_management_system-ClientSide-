export function getProfilePictureUrl(storedPicture) {
  if (!storedPicture) return '';
  if (storedPicture.startsWith('data:')) return storedPicture;

  const apiBaseUrl = (
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
  ).replace(/\/$/, '');
  const pictureUrl = storedPicture.startsWith('http')
    ? new URL(storedPicture)
    : null;
  const picturePath = pictureUrl?.pathname || (
    storedPicture.startsWith('/') ? storedPicture : `/${storedPicture}`
  );
  const isApiUpload =
    picturePath.startsWith('/uploads/') &&
    (!pictureUrl || pictureUrl.origin === new URL(apiBaseUrl).origin);

  if (import.meta.env.DEV && isApiUpload) {
    return `${picturePath}${pictureUrl?.search || ''}`;
  }

  return pictureUrl ? storedPicture : `${apiBaseUrl}${picturePath}`;
}
