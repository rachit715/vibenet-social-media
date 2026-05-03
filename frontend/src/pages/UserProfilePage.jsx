import { useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { PostContext } from '../context/PostsContext';
import { ThemeContext } from '../context/ThemeContext';
import SideBar from '../components/SideBar';
import StoryViewer from '../components/StoryViewer';
import CommentItem from '../components/CommentItem';
import ExpandableText from '../components/ExpandableText';
import axios from 'axios';
import cookies from 'js-cookie';
import { toast } from 'react-toastify';
import { IoMdClose } from 'react-icons/io';
import { FaHeart, FaRegHeart, FaCommentDots, FaShare, FaVolumeMute, FaVolumeUp } from 'react-icons/fa';
import { MdDelete, MdGridOn } from 'react-icons/md';
import { getMediaUrl, getPostMediaItems, isVideoMedia } from '../utils/media';
import useHorizontalWheelHistoryBlock from '../hooks/useHorizontalWheelHistoryBlock';
import useGlobalVideoMute from '../hooks/useGlobalVideoMute';

// ─── User List Modal (same design as ProfilePage) ─────────────────────────────
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
      {/* Header */}
      <div className={`px-5 py-4 flex items-center justify-between border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
        <h2 className={`font-bold text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h2>
        <button
          onClick={onClose}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition ${isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
        >
          <IoMdClose size={18} />
        </button>
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto">
        {users && users.length > 0 ? (
          users.map((u, idx) => (
            <div
              key={idx}
              className={`px-4 py-3 flex items-center gap-3 cursor-pointer transition ${isDarkMode ? 'hover:bg-gray-800/60' : 'hover:bg-gray-50'}`}
              onClick={() => { onNavigate(u._id); onClose(); }}
            >
              <div className="w-11 h-11 rounded-full overflow-hidden shrink-0">
                {u?.avatar ? (
                  <img src={getMediaUrl(u.avatar, backendUrl)} alt={u.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-linear-to-br from-blue-400 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{u?.username?.charAt(0)?.toUpperCase()}</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{u.username}</p>
                <p className={`text-xs truncate ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{u.email}</p>
              </div>
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

// ─── UserProfilePage ───────────────────────────────────────────────────────────
const UserProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, backendUrl, fetchCurrentUserDetails } = useContext(AuthContext);
  const { likePosts, postsComments, deletePost, deleteComment } = useContext(PostContext);
  const themeContext = useContext(ThemeContext);
  const isDarkMode = themeContext?.isDarkMode ?? true;

  const statsButton = `flex flex-col items-center sm:items-start transition ${isDarkMode ? 'text-white hover:text-gray-300' : 'text-black hover:text-gray-700'}`;

  const [profileUser, setProfileUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [selectedPhotoImageIndex, setSelectedPhotoImageIndex] = useState(0);
  const [selectedPhotoMuted, setSelectedPhotoMuted] = useGlobalVideoMute();
  const [isPointerOverSelectedPhoto, setIsPointerOverSelectedPhoto] = useState(false);
  const [comments, setComments] = useState({});
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [userStories, setUserStories] = useState([]);
  const [viewedStories, setViewedStories] = useState(() => {
    const saved = localStorage.getItem('viewedStories');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [viewingStory, setViewingStory] = useState(false);
  const selectedPhotoWheelDelta = useRef(0);
  const selectedPhotoWheelLockUntil = useRef(0);
  const selectedPhotoWheelResetTimeout = useRef(null);
  const selectedPhotoVideoRef = useRef(null);
  const selectedPhotoMedia = getPostMediaItems(selectedPhoto);

  useEffect(() => {
    if (currentUser?._id && String(currentUser._id) === String(userId)) {
      navigate('/profile', { replace: true });
    }
  }, [currentUser?._id, navigate, userId]);

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

  const handleStoryViewed = useCallback((storyId) => {
    const storyKey = String(storyId);
    setViewedStories((prev) => {
      if (prev.has(storyKey)) return prev;
      const next = new Set(prev);
      next.add(storyKey);
      return next;
    });
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setError(null);
        const { data } = await axios.get(`${backendUrl}/api/user/profile/${userId}`);
        if (data.success) {
          setProfileUser(data.user);
          let isUserFollowed = false;
          if (currentUser?._id) {
            const currentUserId = String(currentUser._id);
            const profileId = String(userId);
            isUserFollowed = data.user.followers?.some(
              (follower) => String(follower._id || follower) === currentUserId
            ) || false;
            if (!isUserFollowed && currentUser?.following) {
              isUserFollowed = currentUser.following.some(
                (following) => String(following._id || following) === profileId
              );
            }
          }
          setIsFollowing(isUserFollowed);
        } else {
          setError('User profile not found');
        }
      } catch (error) {
        setError('Failed to load profile: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchUserPosts = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/posts/user-posts/${userId}`, {
          headers: { Authorization: `Bearer ${cookies.get('token')}` },
        });
        if (data.success) {
          setUserPosts(data.posts);
          const liked = new Set();
          data.posts.forEach((post) => {
            if (post.likes?.includes(currentUser?._id)) liked.add(post._id);
          });
          setLikedPosts(liked);
        }
      } catch (error) {
        setUserPosts([]);
      }
    };

    const loadStories = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/stories/user/${userId}`, {
          headers: { Authorization: `Bearer ${cookies.get('token')}` },
        });
        if (data.success) setUserStories(data.stories);
      } catch (error) {
        console.log('Error fetching stories:', error);
      }
    };

    if (userId) {
      fetchUserProfile();
      fetchUserPosts();
      void loadStories();
    }
  }, [userId, backendUrl, currentUser?._id, currentUser?.following]);

  useEffect(() => {
    localStorage.setItem('viewedStories', JSON.stringify([...viewedStories]));
  }, [viewedStories]);

  const handleFollowToggle = async () => {
    try {
      const token = cookies.get('token');
      if (!token) { toast.error('Please login first'); return; }
      if (isFollowing) {
        const { data } = await axios.post(`${backendUrl}/api/user/unfollow/${userId}`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (data.success) {
          setIsFollowing(false);
          const profileData = await axios.get(`${backendUrl}/api/user/profile/${userId}`);
          if (profileData.data.success) setProfileUser(profileData.data.user);
          await fetchCurrentUserDetails();
          toast.success('Unfollowed successfully');
        }
      } else {
        const { data } = await axios.post(`${backendUrl}/api/user/follow/${userId}`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (data.success) {
          setIsFollowing(true);
          const profileData = await axios.get(`${backendUrl}/api/user/profile/${userId}`);
          if (profileData.data.success) setProfileUser(profileData.data.user);
          await fetchCurrentUserDetails();
          toast.success('Followed successfully');
        }
      }
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('Already'))
        setIsFollowing(true);
      toast.error(error.response?.data?.message || 'Action failed');
    }
  };

  const handleLike = async (postId) => {
    try {
      await likePosts(postId);
      const newLiked = new Set(likedPosts);
      if (newLiked.has(postId)) newLiked.delete(postId);
      else newLiked.add(postId);
      setLikedPosts(newLiked);
      const { data } = await axios.get(`${backendUrl}/api/posts/user-posts/${userId}`, {
        headers: { Authorization: `Bearer ${cookies.get('token')}` },
      });
      if (data.success) {
        setUserPosts(data.posts);
        if (selectedPhoto && selectedPhoto._id === postId) {
          const updatedPost = data.posts.find((p) => p._id === postId);
          if (updatedPost) setSelectedPhoto(updatedPost);
        }
      }
    } catch (error) { console.log(error); }
  };

  const handleCommentSubmit = async (e, postId) => {
    e.preventDefault();
    if (comments.text?.trim()) {
      await postsComments(postId, comments.text);
      setComments({ text: '' });
      const { data } = await axios.get(`${backendUrl}/api/posts/user-posts/${userId}`, {
        headers: { Authorization: `Bearer ${cookies.get('token')}` },
      });
      if (data.success) {
        setUserPosts(data.posts);
        if (selectedPhoto && selectedPhoto._id === postId) {
          const updatedPost = data.posts.find((p) => p._id === postId);
          if (updatedPost) setSelectedPhoto(updatedPost);
        }
      }
    }
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      await deletePost(postId);
      setSelectedPhoto(null);
      const { data } = await axios.get(`${backendUrl}/api/posts/user-posts/${userId}`, {
        headers: { Authorization: `Bearer ${cookies.get('token')}` },
      });
      if (data.success) setUserPosts(data.posts);
    }
  };

  const handleSharePost = async (post) => {
    const postUrl = `${window.location.origin}/profile/${userId}`;
    const shareText = `Check out this post by ${profileUser?.username}: "${post.text?.substring(0, 50)}..."`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Check out this post', text: shareText, url: postUrl }); }
      catch (error) { console.log('Error sharing:', error); }
    } else {
      navigator.clipboard.writeText(`${shareText}\n${postUrl}`);
      toast.success('Post link copied to clipboard!');
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
    const { data } = await axios.get(`${backendUrl}/api/posts/user-posts/${userId}`, {
      headers: { Authorization: `Bearer ${cookies.get('token')}` },
    });
    if (data.success) {
      setUserPosts(data.posts);
    }
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

  const hasStory = userStories.length > 0;
  const hasViewedStory = hasStory && userStories.every((story) => viewedStories.has(String(story._id)));

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-screen ${isDarkMode ? 'bg-black text-white' : 'bg-white text-black'}`}>
        <div className="text-center">
          <div className="mb-4">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className={`flex items-center justify-center h-screen ${isDarkMode ? 'bg-black text-white' : 'bg-white text-black'}`}>
        <div className="text-center">
          <div className="text-lg font-semibold mb-2">{error || 'User not found'}</div>
          <button onClick={() => navigate('/posts')} className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded">
            Go back to posts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-black'}`}>
      <div className="flex flex-col md:flex-row">
        <div className="hidden md:block md:w-64 shrink-0"><SideBar /></div>

        <div className="flex-1 w-full pb-10 overflow-y-auto">

          {/* ── Profile Header (same layout as ProfilePage) ── */}
          <div className={`mx-auto max-w-4xl ${isDarkMode ? 'bg-black border-gray-800' : 'bg-white border-gray-100'} border-b px-4 md:px-8 pt-8 md:pt-10 pb-6`}>
            <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start sm:justify-center sm:gap-12 md:gap-16">

              {/* Avatar + Story ring */}
              <div className="shrink-0">
                <button
                  onClick={() => hasStory && setViewingStory(true)}
                  className={`block rounded-full p-0.5 transition ${
                    hasStory
                      ? hasViewedStory
                        ? 'bg-gray-500 cursor-pointer'
                        : 'bg-linear-to-tr from-yellow-400 via-pink-500 to-purple-600 cursor-pointer hover:opacity-90'
                      : 'bg-transparent cursor-default'
                  }`}
                  title={hasStory ? 'View story' : 'No story'}
                >
                  <div className={`rounded-full p-0.5 ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
                    {profileUser?.avatar ? (
                      <img
                        src={getMediaUrl(profileUser.avatar, backendUrl)}
                        alt={profileUser.username}
                        className="w-28 h-28 md:w-40 md:h-40 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-28 h-28 md:w-40 md:h-40 rounded-full bg-linear-to-br from-blue-400 to-purple-600 flex items-center justify-center">
                        <span className="text-5xl text-white font-bold">
                          {profileUser?.username?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              </div>

              {/* Info */}
              <div className="flex-1 max-w-xl text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center sm:items-center gap-3 mb-5">
                  <h1 className="text-2xl md:text-3xl font-light">{profileUser?.username}</h1>
                  {/* ✅ Follow/Unfollow button — blue */}
                  {currentUser?._id !== userId && (
                    <button
                      onClick={handleFollowToggle}
                      className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
                        isFollowing
                          ? isDarkMode
                            ? 'bg-white/10 text-white hover:bg-white/20'
                            : 'bg-gray-200 text-black hover:bg-gray-300'
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                      }`}
                    >
                      {isFollowing ? 'Unfollow' : 'Follow'}
                    </button>
                  )}
                </div>

                {/* Stats */}
                <div className="flex justify-center sm:justify-start gap-8 mb-5">
                  <div className={statsButton}>
                    <p className="text-xl font-bold">{userPosts.length}</p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>posts</p>
                  </div>
                  <button className={statsButton} onClick={() => setShowFollowersModal(true)}>
                    <p className="text-xl font-bold">{profileUser.followers?.length || 0}</p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>followers</p>
                  </button>
                  <button className={statsButton} onClick={() => setShowFollowingModal(true)}>
                    <p className="text-xl font-bold">{profileUser.following?.length || 0}</p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>following</p>
                  </button>
                </div>

                {/* Bio */}
                <div className="max-w-xl space-y-1">
                  <p className="font-semibold text-sm">{profileUser?.username}</p>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {profileUser?.email}
                  </p>
                </div>
              </div>
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
                <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  This user hasn't shared any posts yet
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-0 md:grid-cols-4">
                {userPosts.map((post) => {
                  const mediaItems = getPostMediaItems(post);
                  const firstMedia = mediaItems[0];
                  return (
                    <div
                      key={post._id}
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
          user={profileUser}
          backendUrl={backendUrl}
          isDarkMode={isDarkMode}
          currentUserId={currentUser?._id}
          onClose={() => setViewingStory(false)}
          onStoryViewed={handleStoryViewed}
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
            {/* Image side */}
            <div
              className="flex-1 bg-black flex items-center justify-center relative"
              onWheelCapture={handleSelectedPhotoWheel}
              onMouseEnter={() => setIsPointerOverSelectedPhoto(true)}
              onMouseLeave={() => setIsPointerOverSelectedPhoto(false)}
              style={{ overscrollBehaviorX: 'contain' }}
            >
              {selectedPhotoMedia[selectedPhotoImageIndex] ? (
                isVideoMedia(selectedPhotoMedia[selectedPhotoImageIndex]) ? (
                  <video ref={selectedPhotoVideoRef} src={getMediaUrl(selectedPhotoMedia[selectedPhotoImageIndex]?.url, backendUrl)} alt="Post" className="max-w-full max-h-full object-contain" style={{ overscrollBehaviorX: 'contain' }} autoPlay loop muted={selectedPhotoMuted} playsInline preload="metadata" onClick={toggleSelectedPhotoPlayback} onWheel={handleSelectedPhotoWheel} />
                ) : (
                  <img src={getMediaUrl(selectedPhotoMedia[selectedPhotoImageIndex]?.url, backendUrl)} alt="Post" className="max-w-full max-h-full object-contain" style={{ overscrollBehaviorX: 'contain' }} onWheel={handleSelectedPhotoWheel} />
                )
              ) : null}
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

            {/* Right side */}
            <div className={`w-full md:w-96 flex flex-col overflow-hidden ${isDarkMode ? 'bg-[#1a1a1a]' : 'bg-white'}`}>
              {/* Header */}
              <div className={`px-4 py-3 flex items-center gap-3 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                <div className="w-9 h-9 rounded-full overflow-hidden shrink-0">
                  {profileUser?.avatar ? (
                    <img src={getMediaUrl(profileUser.avatar, backendUrl)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-linear-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                      {profileUser?.username?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                </div>
                <p className={`text-sm font-semibold flex-1 ${isDarkMode ? 'text-white' : 'text-black'}`}>{profileUser?.username}</p>
                {currentUser?._id === userId && (
                  <button
                    onClick={() => handleDeletePost(selectedPhoto._id)}
                    className="text-red-500 hover:text-red-600 transition p-1"
                  >
                    <MdDelete size={20} />
                  </button>
                )}
                <button
                  onClick={closeSelectedPhoto}
                  className={`p-1 rounded-full transition ${isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                >
                  <IoMdClose size={20} />
                </button>
              </div>

              {/* Caption */}
              {/* Comments */}
              <div className="insta-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {selectedPhoto.text && (
                  <div className={`border-b pb-3 ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                    <p className={`text-sm whitespace-pre-wrap break-words ${isDarkMode ? 'text-white' : 'text-black'}`}>
                      <span className="font-semibold mr-2">{profileUser?.username}</span>
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
                      String(comment.user?._id || '') === String(currentUser?._id || '') ||
                      String(selectedPhoto.user?._id || '') === String(currentUser?._id || '')
                    }
                    onDelete={() => handleDeleteComment(selectedPhoto._id, comment._id)}
                  />
                ))}
              </div>

              {/* Actions */}
              <div className={`border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-100'} px-4 py-3`}>
                <div className="flex items-center gap-4 mb-2">
                  <button onClick={() => handleLike(selectedPhoto._id)} className="hover:opacity-60 transition">
                    {likedPosts.has(selectedPhoto._id) ? (
                      <FaHeart className="text-red-500 text-xl" />
                    ) : (
                      <FaRegHeart className={`text-xl ${isDarkMode ? 'text-white' : 'text-black'}`} />
                    )}
                  </button>
                  <FaCommentDots className={`text-xl ${isDarkMode ? 'text-white' : 'text-black'}`} />
                  <button onClick={() => handleSharePost(selectedPhoto)} className="hover:opacity-60 transition">
                    <FaShare className={`text-xl ${isDarkMode ? 'text-white' : 'text-black'}`} />
                  </button>
                </div>
                <p className={`text-xs font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  {selectedPhoto.likes?.length || 0} likes
                </p>
                <form onSubmit={(e) => handleCommentSubmit(e, selectedPhoto._id)} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={comments.text || ''}
                    onChange={(e) => setComments((prev) => ({ ...prev, text: e.target.value }))}
                    placeholder="Add a comment..."
                    className={`flex-1 text-sm outline-none bg-transparent ${isDarkMode ? 'text-white placeholder-gray-500' : 'text-black placeholder-gray-400'}`}
                  />
                  <button
                    type="submit"
                    disabled={!comments.text?.trim()}
                    className="text-blue-500 font-semibold text-sm disabled:opacity-40 transition"
                  >
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
          users={profileUser?.followers}
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
          users={profileUser?.following}
          onClose={() => setShowFollowingModal(false)}
          onNavigate={(id) => navigate(`/profile/${id}`)}
          backendUrl={backendUrl}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  );
};

export default UserProfilePage;

