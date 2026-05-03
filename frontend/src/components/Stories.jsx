import { useContext, useEffect, useState, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import axios from 'axios';
import { FaPlus, FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { getMediaUrl } from '../utils/media';
import StoryViewer from './StoryViewer';

const Stories = () => {
  const { user, backendUrl } = useContext(AuthContext);
  const { isDarkMode } = useContext(ThemeContext);

  const [groupedStories, setGroupedStories] = useState([]);
  const [viewedStories, setViewedStories] = useState(new Set());
  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [storyImage, setStoryImage] = useState(null);
  const [storyImagePreview, setStoryImagePreview] = useState(null);
  const [storyMediaDuration, setStoryMediaDuration] = useState(null);
  const [storyText, setStoryText] = useState('');
  const [uploading, setUploading] = useState(false);

  const isExpired = (createdAt) =>
    (new Date() - new Date(createdAt)) / (1000 * 60 * 60) > 24;

  const fetchStories = useCallback(async () => {
    try {
      const token =
        localStorage.getItem('token') ||
        document.cookie.split('token=')[1]?.split(';')[0];

      const { data } = await axios.get(`${backendUrl}/api/stories/get-stories`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        const map = {};
        data.stories.forEach((story) => {
          if (isExpired(story.createdAt)) return;
          const storyUserId = story.user?._id;
          if (!storyUserId) return;

          if (!map[storyUserId]) {
            map[storyUserId] = { user: story.user, stories: [] };
          }

          map[storyUserId].stories.push(story);
        });

        setGroupedStories(Object.values(map));
      }
    } catch (error) {
      console.log('Error:', error);
    }
  }, [backendUrl]);

  useEffect(() => {
    const savedStories = localStorage.getItem('viewedStories');
    if (savedStories) {
      setViewedStories(new Set(JSON.parse(savedStories)));
    }

    fetchStories();
  }, [fetchStories, user?._id]);

  useEffect(() => {
    localStorage.setItem('viewedStories', JSON.stringify([...viewedStories]));
  }, [viewedStories]);

  useEffect(() => {
    if (viewerOpen) {
      document.documentElement.dataset.storyViewerOpen = 'true';
      window.dispatchEvent(new Event('pause-feed-videos'));
    } else {
      delete document.documentElement.dataset.storyViewerOpen;
    }

    return () => {
      delete document.documentElement.dataset.storyViewerOpen;
    };
  }, [viewerOpen]);

  const handleStoryViewed = useCallback((storyId) => {
    const storyKey = String(storyId);
    setViewedStories((prev) => {
      if (prev.has(storyKey)) return prev;
      const next = new Set(prev);
      next.add(storyKey);
      return next;
    });
  }, []);

  const openViewer = (groupIndex) => {
    setActiveGroupIndex(groupIndex);
    setViewerOpen(true);
  };

  const handleImageChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type.startsWith('video/')) {
        const duration = await new Promise((resolve, reject) => {
          const previewUrl = URL.createObjectURL(file);
          const video = document.createElement('video');
          video.preload = 'metadata';
          video.onloadedmetadata = () => {
            const value = video.duration;
            URL.revokeObjectURL(previewUrl);
            resolve(value);
          };
          video.onerror = () => {
            URL.revokeObjectURL(previewUrl);
            reject(new Error('Failed to read video duration'));
          };
          video.src = previewUrl;
        }).catch(() => null);

        if (!duration) {
          toast.error('Could not read video file');
          return;
        }

        if (duration > 60) {
          toast.error('Story video must be 60 seconds or less');
          return;
        }

        setStoryMediaDuration(duration);
      } else {
        setStoryMediaDuration(null);
      }

      setStoryImage(file);
      setStoryImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCreateStory = async (event) => {
    event.preventDefault();
    if (!storyImage) {
      toast.error('Select image');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', storyImage);
      formData.append('text', storyText);
      if (storyMediaDuration) {
        formData.append('duration', String(storyMediaDuration));
      }

      const { data } = await axios.post(
        `${backendUrl}/api/stories/create`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      if (data.success) {
        toast.success('Story created');
        setShowCreateModal(false);
        setStoryImage(null);
        setStoryImagePreview(null);
        setStoryMediaDuration(null);
        setStoryText('');
        fetchStories();
      }
    } catch {
      toast.error('Failed to create');
    } finally {
      setUploading(false);
    }
  };

  const userId = String(user?._id);
  const allGroupsForCarousel = groupedStories.filter(
    (group) => String(group.user?._id) !== userId
  );

  return (
    <>
      <div
        className="mx-auto h-28 w-full max-w-full overflow-x-auto px-4 pb-2 pt-4 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="flex gap-4">
          {allGroupsForCarousel.map((group) => {
            const realIndex = allGroupsForCarousel.findIndex(
              (entry) => String(entry.user?._id) === String(group.user?._id)
            );
            const allViewed = group.stories.every((story) =>
              viewedStories.has(String(story._id))
            );

            return (
              <button
                key={group.user?._id}
                onClick={() => openViewer(realIndex)}
                title={group.user?.username}
                className="flex shrink-0 flex-col items-center gap-1.5 focus:outline-none"
              >
                <div
                  className={`h-16 w-16 rounded-full p-0.5 ${
                    allViewed
                      ? isDarkMode
                        ? 'bg-gray-600'
                        : 'bg-gray-300'
                      : 'bg-linear-to-tr from-yellow-400 via-pink-500 to-purple-600'
                  }`}
                >
                  <div
                    className={`h-full w-full rounded-full p-0.5 ${
                      isDarkMode ? 'bg-gray-900' : 'bg-white'
                    }`}
                  >
                    {group.user?.avatar ? (
                      <img
                        src={getMediaUrl(group.user.avatar, backendUrl)}
                        alt={group.user?.username}
                        className={`h-full w-full rounded-full object-cover ${
                          allViewed ? 'opacity-60' : ''
                        }`}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-linear-to-br from-blue-400 to-purple-600">
                        <span className="text-lg font-bold text-white">
                          {group.user?.username?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <span
                  className={`w-16 truncate text-center text-[11px] font-medium ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  {group.user?.username}
                </span>
              </button>
            );
          })}

          {allGroupsForCarousel.length === 0 && (
            <div
              className={`flex flex-1 items-center justify-center py-4 text-center ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`}
            >
              <p className="text-sm">No stories yet</p>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div
            className={`w-full max-w-md rounded-2xl p-6 shadow-2xl ${
              isDarkMode ? 'border border-gray-800 bg-gray-900' : 'bg-white'
            }`}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2
                className={`text-xl font-bold ${
                  isDarkMode ? 'text-white' : 'text-black'
                }`}
              >
                Create Story
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setStoryImage(null);
                  setStoryImagePreview(null);
                  setStoryMediaDuration(null);
                }}
                className={`rounded-full p-2 transition ${
                  isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                }`}
              >
                <FaTimes
                  className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}
                />
              </button>
            </div>

            <form onSubmit={handleCreateStory} className="space-y-4">
              <div>
                {storyImagePreview ? (
                  <div className="relative overflow-hidden rounded-xl">
                    {storyImage?.type?.startsWith('video/') ? (
                      <video
                        src={storyImagePreview}
                        className="h-72 w-full bg-black object-contain"
                        muted
                        playsInline
                        controls
                      />
                    ) : (
                      <img
                        src={storyImagePreview}
                        alt="Preview"
                        className="h-72 w-full object-cover"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setStoryImage(null);
                        setStoryImagePreview(null);
                        setStoryMediaDuration(null);
                      }}
                      className="absolute right-2 top-2 rounded-full bg-black/60 p-2 text-white transition hover:bg-black/80"
                    >
                      <FaTimes size={12} />
                    </button>
                  </div>
                ) : (
                  <label
                    className={`flex h-48 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition ${
                      isDarkMode
                        ? 'border-gray-600 hover:border-gray-400'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="file"
                      onChange={handleImageChange}
                      className="hidden"
                      accept="image/*,video/mp4,video/webm,video/quicktime"
                    />
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
                      <FaPlus className="text-lg text-blue-500" />
                    </div>
                    <p
                      className={`text-sm font-medium ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}
                    >
                      Click to upload photo
                    </p>
                    <p
                      className={`mt-1 text-xs ${
                        isDarkMode ? 'text-gray-500' : 'text-gray-400'
                      }`}
                    >
                      PNG, JPG, WEBP, MP4, WEBM, MOV
                    </p>
                  </label>
                )}
              </div>

              <textarea
                value={storyText}
                onChange={(event) => setStoryText(event.target.value)}
                placeholder="Add text to your story..."
                className={`w-full resize-none rounded-xl p-3 text-sm outline-none ${
                  isDarkMode
                    ? 'border border-gray-700 bg-gray-800 text-white placeholder-gray-500'
                    : 'border border-gray-200 bg-gray-50 text-black placeholder-gray-400'
                }`}
                rows="2"
              />

              <button
                type="submit"
                disabled={uploading || !storyImage}
                className="w-full rounded-xl bg-linear-to-r from-pink-500 to-purple-600 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
              >
                {uploading ? 'Uploading...' : 'Share to Story'}
              </button>
            </form>
          </div>
        </div>
      )}

      {viewerOpen && allGroupsForCarousel.length > 0 && (
        <StoryViewer
          groupedStories={allGroupsForCarousel}
          initialGroupIndex={Math.min(
            activeGroupIndex,
            allGroupsForCarousel.length - 1
          )}
          backendUrl={backendUrl}
          isDarkMode={isDarkMode}
          currentUserId={user?._id}
          showReplyBar
          onClose={() => setViewerOpen(false)}
          onStoryViewed={handleStoryViewed}
        />
      )}
    </>
  );
};

export default Stories;
