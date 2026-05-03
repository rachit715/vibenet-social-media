export const getMediaUrl = (path, backendUrl) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${backendUrl}/${path.replace(/^\/+/, '')}`;
};

export const isVideoMedia = (mediaOrUrl) => {
  if (!mediaOrUrl) return false;

  if (typeof mediaOrUrl === 'object' && mediaOrUrl.type) {
    return mediaOrUrl.type === 'video';
  }

  const url = typeof mediaOrUrl === 'string' ? mediaOrUrl : mediaOrUrl.url;
  if (!url) return false;

  return /\.(mp4|mov|webm)(\?|#|$)/i.test(url);
};

export const getPostMediaItems = (post) => {
  if (Array.isArray(post?.media) && post.media.length > 0) {
    return post.media.filter((item) => item?.url);
  }

  if (Array.isArray(post?.images) && post.images.length > 0) {
    return post.images.filter(Boolean).map((url) => ({ url, type: 'image' }));
  }

  if (post?.image) {
    return [{ url: post.image, type: isVideoMedia(post.image) ? 'video' : 'image' }];
  }

  return [];
};
