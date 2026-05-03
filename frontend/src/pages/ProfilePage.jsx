import { useContext, useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import { PostContext } from '../context/PostsContext';
import { ThemeContext } from '../context/ThemeContext';
import SideBar from '../components/SideBar';
import StoryViewer from '../components/StoryViewer';
import CommentItem from '../components/CommentItem';
import ExpandableText from '../components/ExpandableText';
import { IoMdClose } from 'react-icons/io';
import {
  FaShare,
  FaHeart,
  FaRegHeart,
  FaCommentDots,
  FaBookmark,
  FaTag,
  FaPlus,
  FaTimes,
  FaVolumeMute,
  FaVolumeUp,
} from 'react-icons/fa';
import { MdDelete, MdGridOn } from 'react-icons/md';
import { getMediaUrl, isVideoMedia, getPostMediaItems } from '../utils/media';
import useHorizontalWheelHistoryBlock from '../hooks/useHorizontalWheelHistoryBlock';
import useGlobalVideoMute from '../hooks/useGlobalVideoMute';

// ─── User List Modal ───────────────────────────────────────────────────────────
const UserListModal = ({ title, users, onClose, onNavigate, backendUrl, isDarkMode }) => (
  <div
    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    onClick={(e) => e.target === e.currentTarget && onClose()}
  >
    <div
      className={`w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl ${
        isDarkMode ? 'bg-[#1a1a1a] border border-gray-800' : 'bg-white border border-gray-100'
      }`}
    >
      {/* Modal Header */}
      <div
        className={`px-5 py-4 flex items-center justify-between border-b ${
          isDarkMode ? 'border-gray-800' : 'border-gray-100'
        }`}
      >
        <h2 className={`font-bold text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {title}
        </h2>
        <button
          onClick={onClose}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition ${
            isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
          }`}
        >
          <IoMdClose size={18} />
        </button>
      </div>

      {/* User List */}
      <div className="max-h-80 overflow-y-auto">
        {users && users.length > 0 ? (
          users.map((u, idx) => (
            <div
              key={idx}
              className={`px-4 py-3 flex items-center gap-3 cursor-pointer transition ${
                isDarkMode ? 'hover:bg-gray-800/60' : 'hover:bg-gray-50'
              }`}
              onClick={() => { onNavigate(u._id); onClose(); }}
            >
              {/* Avatar */}
              <div className="w-11 h-11 rounded-full overflow-hidden shrink-0">
                {u?.avatar ? (
                  <img src={getMediaUrl(u.avatar, backendUrl)} alt={u.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-linear-to-br from-blue-400 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{u?.username?.charAt(0)?.toUpperCase()}</span>
                  </div>
                )}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {u.username}
                </p>
                <p className={`text-xs truncate ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  {u.email}
                </p>
              </div>
              {/* View button */}
              <button className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition shrink-0">
                View
              </button>
            </div>
          ))
        ) : (
          <div className="py-12 text-center">
            <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              {title === 'Followers' ? 'No followers yet' : 'Not following anyone yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  </div>
);

// ─── ProfilePage ───────────────────────────────────────────────────────────────
const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, backendUrl, fetchCurrentUserDetails } = useContext(AuthContext);
  const { userPosts, fetchPostsofLoginUser, fetchAllPosts, deleteComment } = useContext(PostContext);
  const { isDarkMode } = useContext(ThemeContext);

  const smallButton = `inline-flex items-center justify-center rounded-full px-4 py-1.5 text-sm font-semibold transition`;
  const statsButton = `flex flex-col items-center sm:items-start transition ${isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-700'}`;

  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [selectedPhotoImageIndex, setSelectedPhotoImageIndex] = useState(0);
  const [selectedPhotoMuted, setSelectedPhotoMuted] = useGlobalVideoMute();
  const [isPointerOverSelectedPhoto, setIsPointerOverSelectedPhoto] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [activeTab, setActiveTab] = useState('posts');
  const [profileUser, setProfileUser] = useState(null);
  const [userStories, setUserStories] = useState([]);
  const [viewedStories, setViewedStories] = useState(() => {
    const saved = localStorage.getItem('viewedStories');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [viewingStory, setViewingStory] = useState(false);
  const [showCreateStoryModal, setShowCreateStoryModal] = useState(false);
  const [storyImage, setStoryImage] = useState(null);
  const [storyImagePreview, setStoryImagePreview] = useState(null);
  const [storyMediaDuration, setStoryMediaDuration] = useState(null);
  const [storyText, setStoryText] = useState('');
  const [uploading, setUploading] = useState(false);
  const selectedPhotoWheelDelta = useRef(0);
  const selectedPhotoWheelLockUntil = useRef(0);
  const selectedPhotoWheelResetTimeout = useRef(null);
  const selectedPhotoVideoRef = useRef(null);
  const selectedPhotoMedia = getPostMediaItems(selectedPhoto);

  useHorizontalWheelHistoryBlock(
    isPointerOverSelectedPhoto && Boolean(selectedPhotoMedia.length > 1)
  );

  useEffect(() => {
    if (!selectedPhoto) return undefined;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [selectedPhoto]);

  const likePost = async (postId) => {
    try {
      const token = localStorage.getItem('token') || document.cookie.split('token=')[1]?.split(';')[0];
      const { data } = await axios.put(
        `${backendUrl}/api/posts/post/${postId}/like`, {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        setSelectedPhoto((prev) => {
          if (!prev || prev._id !== postId) return prev;
          const userId = String(user?._id || '');
          const likes = Array.isArray(prev.likes) ? prev.likes.map((id) => String(id)) : [];
          const alreadyLiked = likes.includes(userId);
          return {
            ...prev,
            likes: alreadyLiked
              ? likes.filter((id) => id !== userId)
              : [...likes, userId],
          };
        });
        toast.success(data.message);
        fetchAllPosts();
        fetchPostsofLoginUser();
      }
    } catch { toast.error('Failed to like post'); }
  };

  const deletePost = async (postId) => {
    try {
      const token = localStorage.getItem('token') || document.cookie.split('token=')[1]?.split(';')[0];
      const { data } = await axios.delete(`${backendUrl}/api/posts/post/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        toast.success(data.message);
        fetchAllPosts();
        fetchPostsofLoginUser();
      }
    } catch { toast.error('Failed to delete post'); }
  };

  const addComment = async (postId, text) => {
    if (!text.trim()) return;
    try {
      const token = localStorage.getItem('token') || document.cookie.split('token=')[1]?.split(';')[0];
      const { data } = await axios.post(
        `${backendUrl}/api/posts/post/${postId}/comments`,
        { text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        toast.success('Comment added');
        fetchAllPosts();
        fetchPostsofLoginUser();
        return true;
      }
    } catch { toast.error('Failed to add comment'); }
    return false;
  };

  const handleSubmit = (e, id) => {
    e.preventDefault();
    if (commentText?.trim()) {
      void addComment(id, commentText).then((success) => {
        if (success) setCommentText('');
      });
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    const success = await deleteComment(postId, commentId);
    if (!success) return;
    setSelectedPhoto((prev) =>
      prev
        ? {
            ...prev,
            comments: prev.comments?.filter(
              (comment) => String(comment._id) !== String(commentId)
            ),
          }
        : prev
    );
  };

  const handleSelectedPhotoWheel = (e) => {
    if (selectedPhotoMedia.length <= 1) return;

    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || Math.abs(e.deltaX) < 10) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    if (Date.now() < selectedPhotoWheelLockUntil.current) return;

    selectedPhotoWheelDelta.current += e.deltaX;

    if (selectedPhotoWheelResetTimeout.current) {
      clearTimeout(selectedPhotoWheelResetTimeout.current);
    }
    selectedPhotoWheelResetTimeout.current = setTimeout(() => {
      selectedPhotoWheelDelta.current = 0;
    }, 120);

    if (Math.abs(selectedPhotoWheelDelta.current) < 80) return;

    if (selectedPhotoWheelDelta.current > 0) {
      setSelectedPhotoImageIndex((prev) =>
        Math.min(prev + 1, selectedPhotoMedia.length - 1)
      );
    } else {
      setSelectedPhotoImageIndex((prev) => Math.max(prev - 1, 0));
    }

    selectedPhotoWheelDelta.current = 0;
    selectedPhotoWheelLockUntil.current = Date.now() + 280;
  };

  const closeSelectedPhoto = () => {
    if (selectedPhotoVideoRef.current) {
      selectedPhotoVideoRef.current.pause();
    }
    setSelectedPhoto(null);
  };

  const toggleSelectedPhotoPlayback = () => {
    const video = selectedPhotoVideoRef.current;
    if (!video) return;

    if (video.paused) {
      void video.play().catch(() => {});
    } else {
      video.pause();
    }
  };

  const selectedPhotoPostIndex = selectedPhoto
    ? userPosts.findIndex((post) => String(post._id) === String(selectedPhoto._id))
    : -1;

  const openAdjacentPost = (direction) => {
    if (selectedPhotoPostIndex < 0) return;
    const nextPost = userPosts[selectedPhotoPostIndex + direction];
    if (!nextPost) return;
    closeSelectedPhoto();
    setSelectedPhoto(nextPost);
    setSelectedPhotoImageIndex(0);
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
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

  const handleCreateStory = async (e) => {
    e.preventDefault();
    if (!storyImage) { toast.error('Select image'); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', storyImage);
      formData.append('text', storyText);
      if (storyMediaDuration) {
        formData.append('duration', String(storyMediaDuration));
      }
      const { data } = await axios.post(`${backendUrl}/api/stories/create`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (data.success) {
        toast.success('Story created');
        setShowCreateStoryModal(false);
        setStoryImage(null);
        setStoryImagePreview(null);
        setStoryMediaDuration(null);
        setStoryText('');
      } else {
        toast.error(data.message || 'Failed to create story');
      }
    } catch (error) {
      toast.error('Failed to create story');
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/user/profile/${user?._id}`);
        if (data.success) setProfileUser(data.user);
      } catch (error) { console.log('Error fetching profile details:', error); }
    };
    const loadStories = async () => {
      try {
        const token = localStorage.getItem('token') || document.cookie.split('token=')[1]?.split(';')[0];
        const { data } = await axios.get(`${backendUrl}/api/stories/my-stories`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (data.success) setUserStories(data.stories);
      } catch (error) { console.log('Error fetching stories:', error); }
    };
    if (user?._id) {
      fetchPostsofLoginUser();
      fetchCurrentUserDetails();
      void loadProfile();
      void loadStories();
    }
  }, [backendUrl, fetchCurrentUserDetails, fetchPostsofLoginUser, user?._id]);

  useEffect(() => {
    localStorage.setItem('viewedStories', JSON.stringify([...viewedStories]));
  }, [viewedStories]);

  const displayUser = profileUser || user;
  const hasStory = userStories.length > 0;
  const hasViewedStory = hasStory && userStories.every((story) => viewedStories.has(String(story._id)));

  const handleStoryViewed = useCallback((storyId) => {
    const storyKey = String(storyId);
    setViewedStories((prev) => {
      if (prev.has(storyKey)) return prev;
      const next = new Set(prev);
      next.add(storyKey);
      return next;
    });
  }, []);

  const handleStoryDeleted = useCallback((deletedStory) => {
    setUserStories((prev) =>
      prev.filter((story) => String(story._id) !== String(deletedStory._id))
    );
    setViewedStories((prev) => {
      const next = new Set(prev);
      next.delete(String(deletedStory._id));
      return next;
    });
  }, []);

  useEffect(() => {
    if (viewingStory && userStories.length === 0) {
      setViewingStory(false);
    }
  }, [userStories.length, viewingStory]);

  const stats = useMemo(() => ({
    posts: userPosts.length,
    followers: displayUser?.followers?.length || 0,
    following: displayUser?.following?.length || 0,
  }), [displayUser?.followers, displayUser?.following, userPosts.length]);

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-black'}`}>
      <div className="flex flex-col md:flex-row">
        <div className="hidden md:block md:w-64 shrink-0"><SideBar /></div>

        <div className="flex-1 w-full pb-10 overflow-y-auto">

          {/* ── Profile Header ── */}
          <div className={`mx-auto max-w-4xl ${isDarkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-100'} border-b px-4 md:px-8 pt-8 md:pt-10 pb-6`}>
            <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start sm:justify-center sm:gap-12 md:gap-16">

              {/* Avatar + Story ring */}
              <div className="shrink-0 flex flex-col items-center gap-3">
                <button
                  onClick={() => hasStory && setViewingStory(true)}
                  className={`block rounded-full p-0.5 transition ${
                    hasStory
                      ? hasViewedStory
                        ? 'bg-gray-500 cursor-pointer'
                        : 'bg-linear-to-tr from-yellow-400 via-pink-500 to-purple-600 cursor-pointer hover:opacity-90'
                      : 'bg-transparent cursor-default'
                  }`}
                >
                  <div className={`rounded-full p-0.5 ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
                    {displayUser?.avatar ? (
                      <img
                        src={getMediaUrl(displayUser.avatar, backendUrl)}
                        alt={displayUser.username}
                        className="w-28 h-28 md:w-40 md:h-40 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-28 h-28 md:w-40 md:h-40 rounded-full bg-linear-to-br from-blue-400 to-purple-600 flex items-center justify-center">
                        <span className="text-5xl text-white font-bold">
                          {displayUser?.username?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                </button>
                {/* ✅ Add Story button — blue */}
                <button
                  onClick={() => setShowCreateStoryModal(true)}
                  className="px-4 py-1.5 rounded-full text-sm font-semibold bg-blue-500 hover:bg-blue-600 text-white transition"
                >
                  + Add Story
                </button>
              </div>

              {/* Info */}
              <div className="flex-1 max-w-xl text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center sm:items-center gap-3 mb-5">
                  <h1 className="text-2xl md:text-3xl font-light">{displayUser?.username}</h1>
                  {/* ✅ Post button — blue */}
                  <button
                    onClick={() => navigate('/create-post')}
                    className="px-4 py-1.5 rounded-full text-sm font-semibold bg-blue-500 hover:bg-blue-600 text-white transition"
                  >
                    + Post
                  </button>
                </div>

                {/* Stats */}
                <div className="flex justify-center sm:justify-start gap-8 mb-5">
                  <div className={statsButton}>
                    <p className="text-xl font-bold">{stats.posts}</p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>posts</p>
                  </div>
                  <button className={statsButton} onClick={() => setShowFollowersModal(true)}>
                    <p className="text-xl font-bold">{stats.followers}</p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>followers</p>
                  </button>
                  <button className={statsButton} onClick={() => setShowFollowingModal(true)}>
                    <p className="text-xl font-bold">{stats.following}</p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>following</p>
                  </button>
                </div>

                {/* Bio */}
                <div className="max-w-xl space-y-1">
                  <p className="font-semibold text-sm">{displayUser?.username}</p>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {displayUser?.email}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Tabs ── */}
          <div className={`mx-auto max-w-4xl border-b ${isDarkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-100'}`}>
            <div className="flex justify-center gap-0">
              {[
                { key: 'posts', icon: <MdGridOn size={14} />, label: 'Posts' },
                { key: 'saved', icon: <FaBookmark size={12} />, label: 'Saved' },
                { key: 'tagged', icon: <FaTag size={12} />, label: 'Tagged' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-8 py-3.5 text-xs font-semibold tracking-widest uppercase border-t-2 transition ${
                    activeTab === tab.key
                      ? `border-blue-500 ${isDarkMode ? 'text-white' : 'text-black'}`
                      : `border-transparent ${isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Posts Grid ── */}
          <div className="mx-auto max-w-6xl px-0 pt-1">
            {userPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className={`w-20 h-20 rounded-full border-2 flex items-center justify-center ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <MdGridOn size={32} className={isDarkMode ? 'text-gray-600' : 'text-gray-300'} />
                </div>
                <p className={`font-semibold text-lg ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>No Posts Yet</p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Start sharing photos</p>
                <button
                  onClick={() => navigate('/create-post')}
                  className="mt-2 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition"
                >
                  Share your first post
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-0 md:grid-cols-4">
                {userPosts.map((post, index) => {
                  const mediaItems = getPostMediaItems(post);
                  const firstMedia = mediaItems[0];

                  return (
                    <div
                      key={index}
                      className="relative aspect-square cursor-pointer overflow-hidden bg-black group"
                      onClick={() => {
                        setSelectedPhoto(post);
                        setSelectedPhotoImageIndex(0);
                      }}
                    >
                      {firstMedia && (
                        <>
                          {isVideoMedia(firstMedia) ? (
                            <video
                              src={getMediaUrl(firstMedia.url, backendUrl)}
                              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                              muted
                              playsInline
                              preload="metadata"
                            />
                          ) : (
                            <img
                              src={getMediaUrl(firstMedia.url, backendUrl)}
                              alt="Post"
                              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                            />
                          )}
                          {mediaItems.length > 1 && (
                            <div className="absolute right-2 top-2 text-white text-sm font-semibold drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
                              {mediaItems.length}
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center gap-5 bg-black/35 opacity-0 transition duration-200 group-hover:opacity-100">
                            <span className="text-white font-bold text-sm flex items-center gap-1.5">
                              <FaHeart /> {post.likes?.length || 0}
                            </span>
                            <span className="text-white font-bold text-sm flex items-center gap-1.5">
                              <FaCommentDots /> {post.comments?.length || 0}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Story Viewer ── */}
      {viewingStory && userStories.length > 0 && (
        <StoryViewer
          stories={userStories}
          user={displayUser}
          backendUrl={backendUrl}
          isDarkMode={isDarkMode}
          currentUserId={user?._id}
          onClose={() => setViewingStory(false)}
          onStoryViewed={handleStoryViewed}
          onStoryDeleted={handleStoryDeleted}
        />
      )}

      {/* ── Post Modal ── */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeSelectedPhoto(); }}
        >
          {selectedPhotoPostIndex > 0 && (
            <button
              type="button"
              onClick={() => openAdjacentPost(-1)}
              className="absolute left-4 top-1/2 z-50 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-2xl text-black shadow-lg transition hover:bg-white dark:bg-[#262626] dark:text-white"
            >
              ‹
            </button>
          )}
          {selectedPhotoPostIndex < userPosts.length - 1 && (
            <button
              type="button"
              onClick={() => openAdjacentPost(1)}
              className="absolute right-4 top-1/2 z-50 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-2xl text-black shadow-lg transition hover:bg-white dark:bg-[#262626] dark:text-white"
            >
              ›
            </button>
          )}
          <div className="w-full max-w-5xl h-[90vh] flex rounded-xl overflow-hidden shadow-2xl">
            {/* Image */}
            <div
              className="flex-1 bg-black flex items-center justify-center relative"
              onWheelCapture={handleSelectedPhotoWheel}
              onMouseEnter={() => setIsPointerOverSelectedPhoto(true)}
              onMouseLeave={() => setIsPointerOverSelectedPhoto(false)}
              style={{ overscrollBehaviorX: 'contain' }}
            >
              {isVideoMedia(selectedPhotoMedia[selectedPhotoImageIndex]) ? (
                <video
                  ref={selectedPhotoVideoRef}
                  src={getMediaUrl(selectedPhotoMedia[selectedPhotoImageIndex]?.url, backendUrl)}
                  className="max-w-full max-h-full object-contain"
                  style={{ overscrollBehaviorX: 'contain' }}
                  autoPlay
                  loop
                  playsInline
                  muted={selectedPhotoMuted}
                  preload="metadata"
                  onClick={toggleSelectedPhotoPlayback}
                  onWheel={handleSelectedPhotoWheel}
                />
              ) : (
                <img
                  src={getMediaUrl(selectedPhotoMedia[selectedPhotoImageIndex]?.url, backendUrl)}
                  alt="Post"
                  className="max-w-full max-h-full object-contain"
                  style={{ overscrollBehaviorX: 'contain' }}
                  onWheel={handleSelectedPhotoWheel}
                />
              )}
              {isVideoMedia(selectedPhotoMedia[selectedPhotoImageIndex]) && (
                <div className="absolute bottom-4 right-4 z-20">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedPhotoMuted((prev) => !prev);
                    }}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/50"
                  >
                    {selectedPhotoMuted ? <FaVolumeMute size={16} /> : <FaVolumeUp size={16} />}
                  </button>
                </div>
              )}
              {selectedPhotoMedia.length > 1 && (
                <>
                  {selectedPhotoImageIndex > 0 && (
                    <button
                      onClick={() => setSelectedPhotoImageIndex((prev) => prev - 1)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center text-xl hover:bg-black/70"
                    >
                      ‹
                    </button>
                  )}
                  {selectedPhotoImageIndex < selectedPhotoMedia.length - 1 && (
                    <button
                      onClick={() => setSelectedPhotoImageIndex((prev) => prev + 1)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center text-xl hover:bg-black/70"
                    >
                      ›
                    </button>
                  )}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                    {selectedPhotoMedia.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedPhotoImageIndex(i)}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                          i === selectedPhotoImageIndex ? 'bg-white scale-125' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
            {/* Details */}
            <div className={`w-full md:w-96 flex flex-col overflow-hidden ${isDarkMode ? 'bg-[#1a1a1a]' : 'bg-white'}`}>
              <div className={`px-4 py-3 flex items-center gap-3 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                <div className="w-9 h-9 rounded-full overflow-hidden shrink-0">
                  {user?.avatar ? (
                    <img src={getMediaUrl(user.avatar, backendUrl)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-linear-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                      {user?.username?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                </div>
                <p className={`text-sm font-semibold flex-1 ${isDarkMode ? 'text-white' : 'text-black'}`}>{user?.username}</p>
                <button
                  onClick={() => { deletePost(selectedPhoto._id); closeSelectedPhoto(); }}
                  className="text-red-500 hover:text-red-600 transition p-1"
                >
                  <MdDelete size={20} />
                </button>
                <button
                  onClick={closeSelectedPhoto}
                  className={`p-1 rounded-full transition ${isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                >
                  <IoMdClose size={20} />
                </button>
              </div>
              <div className="insta-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {selectedPhoto.text && (
                  <div className={`border-b pb-3 ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                    <p className={`text-sm whitespace-pre-wrap break-words ${isDarkMode ? 'text-white' : 'text-black'}`}>
                      <span className="font-semibold mr-2">{user?.username}</span>
                      <ExpandableText
                        text={selectedPhoto.text}
                        maxChars={260}
                        textClassName={isDarkMode ? 'text-gray-200' : 'text-gray-800'}
                        buttonClassName={isDarkMode ? 'text-gray-400' : 'text-gray-500'}
                        showLess
                      />
                    </p>
                  </div>
                )}
                {selectedPhoto.comments?.length === 0 && (
                  <p className={`text-sm text-center py-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>No comments yet</p>
                )}
                {selectedPhoto.comments?.map((comment) => (
                  <CommentItem
                    key={comment._id}
                    comment={comment}
                    backendUrl={backendUrl}
                    isDarkMode={isDarkMode}
                    canDelete={
                      String(comment.user?._id || '') === String(user?._id || '') ||
                      String(selectedPhoto.user?._id || '') === String(user?._id || '')
                    }
                    onDelete={() => handleDeleteComment(selectedPhoto._id, comment._id)}
                  />
                ))}
              </div>
              <div className={`border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-100'} px-4 py-3`}>
                <div className="flex items-center gap-4 mb-2">
                  <button onClick={() => likePost(selectedPhoto._id)} className="hover:opacity-60 transition">
                    {selectedPhoto.likes?.includes(user?._id) ? (
                      <FaHeart className="text-red-500 text-xl" />
                    ) : (
                      <FaRegHeart className={`text-xl ${isDarkMode ? 'text-white' : 'text-black'}`} />
                    )}
                  </button>
                  <FaCommentDots className={`text-xl ${isDarkMode ? 'text-white' : 'text-black'}`} />
                  <FaShare className={`text-xl ${isDarkMode ? 'text-white' : 'text-black'}`} />
                </div>
                <p className={`text-xs font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  {selectedPhoto.likes?.length || 0} likes
                </p>
                <form onSubmit={(e) => handleSubmit(e, selectedPhoto._id)} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    className={`flex-1 text-sm outline-none bg-transparent ${isDarkMode ? 'text-white placeholder-gray-500' : 'text-black placeholder-gray-400'}`}
                  />
                  <button type="submit" disabled={!commentText?.trim()} className="text-blue-500 font-semibold text-sm disabled:opacity-40 transition">
                    Post
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Followers Modal ── */}
      {showFollowersModal && (
        <UserListModal
          title="Followers"
          users={user?.followers}
          onClose={() => setShowFollowersModal(false)}
          onNavigate={(id) => navigate(`/profile/${id}`)}
          backendUrl={backendUrl}
          isDarkMode={isDarkMode}
        />
      )}

      {/* ── Following Modal ── */}
      {showFollowingModal && (
        <UserListModal
          title="Following"
          users={user?.following}
          onClose={() => setShowFollowingModal(false)}
          onNavigate={(id) => navigate(`/profile/${id}`)}
          backendUrl={backendUrl}
          isDarkMode={isDarkMode}
        />
      )}

      {/* ── Create Story Modal ── */}
      {showCreateStoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`rounded-2xl p-6 max-w-md w-full shadow-2xl ${isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-5">
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>Create Story</h2>
              <button
                onClick={() => { setShowCreateStoryModal(false); setStoryImage(null); setStoryImagePreview(null); setStoryMediaDuration(null); }}
                className={`p-2 rounded-full transition ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
              >
                <FaTimes className={isDarkMode ? 'text-gray-300' : 'text-gray-600'} />
              </button>
            </div>
            <form onSubmit={handleCreateStory} className="space-y-4">
              <div>
                {storyImagePreview ? (
                  <div className="relative rounded-xl overflow-hidden">
                    {storyImage?.type?.startsWith('video/') ? (
                      <video src={storyImagePreview} className="w-full h-72 bg-black object-contain" muted playsInline controls />
                    ) : (
                      <img src={storyImagePreview} alt="Preview" className="w-full h-72 object-cover" />
                    )}
                    <button
                      type="button"
                      onClick={() => { setStoryImage(null); setStoryImagePreview(null); setStoryMediaDuration(null); }}
                      className="absolute top-2 right-2 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition"
                    >
                      <FaTimes size={12} />
                    </button>
                  </div>
                ) : (
                  <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl h-48 cursor-pointer transition ${isDarkMode ? 'border-gray-600 hover:border-gray-400' : 'border-gray-300 hover:border-gray-400'}`}>
                    <input type="file" onChange={handleImageChange} className="hidden" accept="image/*,video/mp4,video/webm,video/quicktime" />
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-3">
                      <FaPlus className="text-blue-500 text-lg" />
                    </div>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Click to upload photo</p>
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>PNG, JPG, WEBP, MP4, WEBM, MOV</p>
                  </label>
                )}
              </div>
              <textarea
                value={storyText}
                onChange={(e) => setStoryText(e.target.value)}
                placeholder="Add text to your story..."
                className={`w-full p-3 rounded-xl outline-none resize-none text-sm ${isDarkMode ? 'bg-gray-800 text-white placeholder-gray-500 border border-gray-700' : 'bg-gray-50 text-black placeholder-gray-400 border border-gray-200'}`}
                rows="2"
              />
              <button
                type="submit"
                disabled={uploading || !storyImage}
                className="w-full bg-linear-to-r from-pink-500 to-purple-600 hover:opacity-90 disabled:opacity-40 text-white py-3 rounded-xl font-semibold transition"
              >
                {uploading ? 'Uploading...' : 'Share to Story'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
