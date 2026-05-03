import { useContext, useEffect, useState, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { PostContext } from '../context/PostsContext';
import { ThemeContext } from '../context/ThemeContext';
import SideBar from '../components/SideBar';
import Stories from '../components/Stories';
import CommentItem from '../components/CommentItem';
import HighlightedText from '../components/HighlightedText';
import ExpandableText from '../components/ExpandableText';
import {
  FaHeart,
  FaRegHeart,
  FaCommentDots,
  FaRegBookmark,
  FaVolumeMute,
  FaVolumeUp,
} from 'react-icons/fa';
import { BsThreeDots } from 'react-icons/bs';
import { MdDelete } from 'react-icons/md';
import { IoMdClose } from 'react-icons/io';
import { getMediaUrl, getPostMediaItems, isVideoMedia } from '../utils/media';
import useHorizontalWheelHistoryBlock from '../hooks/useHorizontalWheelHistoryBlock';
import useGlobalVideoMute from '../hooks/useGlobalVideoMute';

const isStoryViewerOpen = () =>
  document.documentElement.dataset.storyViewerOpen === 'true';

const Carousel = ({ mediaItems, backendUrl }) => {
  const [index, setIndex] = useState(0);
  const [isMuted, setIsMuted] = useGlobalVideoMute();
  const [isPaused, setIsPaused] = useState(true);
  const [isPointerOverMedia, setIsPointerOverMedia] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);
  const mouseStartX = useRef(null);
  const dragging = useRef(false);
  const wheelDelta = useRef(0);
  const wheelLockUntil = useRef(0);
  const wheelResetTimeout = useRef(null);
  const mediaVideoRef = useRef(null);
  const mediaContainerRef = useRef(null);

  useHorizontalWheelHistoryBlock(isPointerOverMedia && mediaItems.length > 1);

  useEffect(() => {
    const container = mediaContainerRef.current;
    if (!container) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting && entry.intersectionRatio >= 0.7);
      },
      { threshold: [0, 0.3, 0.7, 1] }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = mediaVideoRef.current;
    if (!video || !isVideoMedia(mediaItems[index])) return undefined;

    const syncPlayback = () => {
      if (document.hidden || isStoryViewerOpen() || !isInView || isPaused) {
        video.pause();
        return;
      }

      void video.play().catch(() => {});
    };

    syncPlayback();

    const pauseVideo = () => video.pause();
    const handleVisibilityChange = () => syncPlayback();
    const handleStoryPause = () => pauseVideo();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pause-feed-videos', handleStoryPause);

    return () => {
      video.pause();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pause-feed-videos', handleStoryPause);
    };
  }, [index, isInView, isPaused, mediaItems]);

  useEffect(() => {
    if (isVideoMedia(mediaItems[index])) {
      setIsPaused(true);
    }
  }, [index, mediaItems]);

  const handleTouchStart = (event) => {
    touchStartX.current = event.touches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (event) => {
    touchEndX.current = event.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0 && index < mediaItems.length - 1) setIndex((prev) => prev + 1);
      if (diff < 0 && index > 0) setIndex((prev) => prev - 1);
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const handleMouseDown = (event) => {
    mouseStartX.current = event.clientX;
    dragging.current = false;
  };

  const handleMouseMove = (event) => {
    if (
      mouseStartX.current !== null &&
      Math.abs(event.clientX - mouseStartX.current) > 5
    ) {
      dragging.current = true;
    }
  };

  const handleMouseUp = (event) => {
    if (mouseStartX.current === null) return;
    const diff = mouseStartX.current - event.clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0 && index < mediaItems.length - 1) setIndex((prev) => prev + 1);
      if (diff < 0 && index > 0) setIndex((prev) => prev - 1);
    }
    mouseStartX.current = null;
    dragging.current = false;
  };

  const handleWheel = (event) => {
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY) || Math.abs(event.deltaX) < 10) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (Date.now() < wheelLockUntil.current) return;

    wheelDelta.current += event.deltaX;

    if (wheelResetTimeout.current) clearTimeout(wheelResetTimeout.current);
    wheelResetTimeout.current = setTimeout(() => {
      wheelDelta.current = 0;
    }, 120);

    if (Math.abs(wheelDelta.current) < 80) return;

    if (wheelDelta.current > 0 && index < mediaItems.length - 1) {
      setIndex((prev) => prev + 1);
    } else if (wheelDelta.current < 0 && index > 0) {
      setIndex((prev) => prev - 1);
    }

    wheelDelta.current = 0;
    wheelLockUntil.current = Date.now() + 280;
  };

  const toggleVideoPlayback = () => {
    const video = mediaVideoRef.current;
    if (!video) return;

    if (video.paused) {
      void video.play();
      setIsPaused(false);
    } else {
      video.pause();
      setIsPaused(true);
    }
  };

  return (
    <div
      ref={mediaContainerRef}
      className="relative w-full select-none overflow-hidden"
      onWheelCapture={handleWheel}
      onMouseEnter={() => setIsPointerOverMedia(true)}
      onMouseLeave={() => setIsPointerOverMedia(false)}
      style={{ overscrollBehaviorX: 'contain' }}
    >
      {isVideoMedia(mediaItems[index]) ? (
        <video
          ref={mediaVideoRef}
          src={getMediaUrl(mediaItems[index].url, backendUrl)}
          className="block h-auto w-full cursor-pointer"
          style={{
            maxHeight: '585px',
            objectFit: 'contain',
            background: '#000',
            overscrollBehaviorX: 'contain',
          }}
          loop
          playsInline
          preload="metadata"
          muted={isMuted}
          data-feed-video="true"
          onClick={toggleVideoPlayback}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
        />
      ) : (
        <img
          src={getMediaUrl(mediaItems[index].url, backendUrl)}
          alt={`Post ${index + 1}`}
          className="block h-auto w-full cursor-pointer"
          draggable={false}
          style={{
            maxHeight: '585px',
            objectFit: 'contain',
            background: '#000',
            overscrollBehaviorX: 'contain',
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
        />
      )}

      {isVideoMedia(mediaItems[index]) && (
        <div className="absolute bottom-3 right-3 z-20">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setIsMuted((prev) => !prev);
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/50"
          >
            {isMuted ? <FaVolumeMute size={15} /> : <FaVolumeUp size={15} />}
          </button>
        </div>
      )}

      {index > 0 && (
        <button
          onClick={() => setIndex((prev) => prev - 1)}
          className="absolute left-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-lg leading-none text-white hover:bg-black/70"
        >
          ‹
        </button>
      )}

      {index < mediaItems.length - 1 && (
        <button
          onClick={() => setIndex((prev) => prev + 1)}
          className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-lg leading-none text-white hover:bg-black/70"
        >
          ›
        </button>
      )}

      <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
        {mediaItems.map((_, imageIndex) => (
          <button
            key={imageIndex}
            onClick={() => setIndex(imageIndex)}
            className={`h-1.5 w-1.5 rounded-full transition-all ${
              imageIndex === index ? 'scale-125 bg-white' : 'bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

const FeedVideo = ({ src, isMuted, onToggleMute }) => {
  const videoRef = useRef(null);
  const [isPaused, setIsPaused] = useState(true);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting && entry.intersectionRatio >= 0.7);
      },
      { threshold: [0, 0.3, 0.7, 1] }
    );

    observer.observe(video);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    const syncPlayback = () => {
      if (document.hidden || isStoryViewerOpen() || !isInView || isPaused) {
        video.pause();
        return;
      }

      void video.play().catch(() => {});
    };

    syncPlayback();

    const handleVisibilityChange = () => syncPlayback();
    const handleStoryPause = () => video.pause();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pause-feed-videos', handleStoryPause);

    return () => {
      video.pause();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pause-feed-videos', handleStoryPause);
    };
  }, [isInView, isPaused]);

  const handleVideoClick = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      void video.play().catch(() => {});
      setIsPaused(false);
    } else {
      video.pause();
      setIsPaused(true);
    }
  };

  return (
    <div className="relative w-full">
      <video
        ref={videoRef}
        src={src}
        className="block h-auto w-full cursor-pointer"
        style={{
          maxHeight: '585px',
          objectFit: 'contain',
          background: '#000',
          overscrollBehaviorX: 'contain',
        }}
        loop
        muted={isMuted}
        playsInline
        preload="metadata"
        data-feed-video="true"
        onClick={handleVideoClick}
      />

      <div className="absolute bottom-3 right-3 z-20">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleMute();
          }}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/50"
        >
          {isMuted ? <FaVolumeMute size={15} /> : <FaVolumeUp size={15} />}
        </button>
      </div>
    </div>
  );
};

const PostPage = () => {
  const { user, backendUrl } = useContext(AuthContext);
  const {
    Allposts,
    likePosts,
    postsComments,
    deleteComment,
    deletePost,
    navigateToUserProfile,
  } = useContext(PostContext);
  const { isDarkMode } = useContext(ThemeContext);
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedPostImageIndex, setSelectedPostImageIndex] = useState(0);
  const [selectedPostMuted, setSelectedPostMuted] = useGlobalVideoMute();
  const [comments, setComments] = useState({});
  const [isPointerOverSelectedMedia, setIsPointerOverSelectedMedia] = useState(false);
  const selectedPostWheelDelta = useRef(0);
  const selectedPostWheelLockUntil = useRef(0);
  const selectedPostWheelResetTimeout = useRef(null);
  const selectedPostVideoRef = useRef(null);

  const selectedPostMedia = getPostMediaItems(selectedPost);

  useHorizontalWheelHistoryBlock(
    isPointerOverSelectedMedia && Boolean(selectedPostMedia.length > 1)
  );

  useEffect(() => {
    if (!selectedPost) return undefined;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [selectedPost]);

  const handleComment = (event) => {
    setComments((prev) => ({ ...prev, text: event.target.value }));
  };

  const handleSubmit = (event, id) => {
    event.preventDefault();
    if (comments.text?.trim()) {
      postsComments(id, comments.text);
      setComments({ text: '' });
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    const success = await deleteComment(postId, commentId);
    if (!success) return;
    setSelectedPost((prev) =>
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

  const handleSelectedPostWheel = (event) => {
    if (selectedPostMedia.length <= 1) return;

    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY) || Math.abs(event.deltaX) < 10) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (Date.now() < selectedPostWheelLockUntil.current) return;

    selectedPostWheelDelta.current += event.deltaX;

    if (selectedPostWheelResetTimeout.current) {
      clearTimeout(selectedPostWheelResetTimeout.current);
    }
    selectedPostWheelResetTimeout.current = setTimeout(() => {
      selectedPostWheelDelta.current = 0;
    }, 120);

    if (Math.abs(selectedPostWheelDelta.current) < 80) return;

    if (selectedPostWheelDelta.current > 0) {
      setSelectedPostImageIndex((prev) =>
        Math.min(prev + 1, selectedPostMedia.length - 1)
      );
    } else {
      setSelectedPostImageIndex((prev) => Math.max(prev - 1, 0));
    }

    selectedPostWheelDelta.current = 0;
    selectedPostWheelLockUntil.current = Date.now() + 280;
  };

  const toggleSelectedPostPlayback = () => {
    const video = selectedPostVideoRef.current;
    if (!video) return;

    if (video.paused) {
      void video.play();
    } else {
      video.pause();
    }
  };

  const closeSelectedPost = () => {
    if (selectedPostVideoRef.current) {
      selectedPostVideoRef.current.pause();
    }
    setSelectedPost(null);
  };

  const bg = isDarkMode ? 'bg-black text-white' : 'bg-white text-black';
  const cardBg = isDarkMode ? 'bg-[#1a1a1a]' : 'bg-white';
  const border = isDarkMode ? 'border-gray-800' : 'border-gray-200';
  const subText = isDarkMode ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className={`flex min-h-screen ${bg}`}>
      <div className="hidden shrink-0 md:block md:w-64">
        <SideBar />
      </div>

      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-190 px-3 py-4">
          <div className="mb-5 w-full">
            <Stories />
          </div>

          <div className="space-y-9">
            {Allposts?.length > 0 ? (
              Allposts.map((post) => {
                const mediaItems = getPostMediaItems(post);

                return (
                  <article key={post._id} className="mx-auto max-w-117.5">
                    <div className="flex items-center justify-between px-1 py-2.5">
                      <div
                        className="flex cursor-pointer items-center gap-3 transition hover:opacity-80"
                        onClick={() => navigateToUserProfile(post.user._id)}
                      >
                        <div className="h-9 w-9 overflow-hidden rounded-full">
                          {post.user?.avatar ? (
                            <img
                              src={getMediaUrl(post.user.avatar, backendUrl)}
                              alt={post.user?.username}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-blue-400 to-purple-600 text-xs font-bold text-white">
                              {post.user?.username?.charAt(0)?.toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="leading-tight">
                          <p className="text-sm font-semibold">{post.user?.username}</p>
                          <p className={`text-xs ${subText}`}>
                            {new Date(post.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {user?._id === post.user._id && (
                          <button
                            onClick={() => deletePost(post._id)}
                            className="text-red-500 hover:text-red-700"
                            title="Delete post"
                          >
                            <MdDelete size={18} />
                          </button>
                        )}
                        <button type="button" className={subText} aria-label="Post options">
                          <BsThreeDots size={18} />
                        </button>
                      </div>
                    </div>

                    {mediaItems.length > 0 && (
                      <div
                        className={`overflow-hidden rounded-md border ${border} ${cardBg}`}
                        style={{ overscrollBehaviorX: 'contain' }}
                      >
                        {mediaItems.length === 1 ? (
                          <div className="w-full">
                            {isVideoMedia(mediaItems[0]) ? (
                              <FeedVideo
                                src={getMediaUrl(mediaItems[0].url, backendUrl)}
                                isMuted={selectedPostMuted}
                                onToggleMute={() => setSelectedPostMuted((prev) => !prev)}
                              />
                            ) : (
                              <img
                                src={getMediaUrl(mediaItems[0].url, backendUrl)}
                                alt="Post"
                                className="block h-auto w-full"
                                style={{
                                  maxHeight: '585px',
                                  objectFit: 'contain',
                                  background: '#000',
                                  overscrollBehaviorX: 'contain',
                                }}
                              />
                            )}
                          </div>
                        ) : (
                          <Carousel mediaItems={mediaItems} backendUrl={backendUrl} />
                        )}
                      </div>
                    )}

                    <div className="flex items-center px-1 pt-3">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => likePosts(post._id)}
                          className={`text-[22px] transition-transform hover:scale-110 active:scale-95 ${
                            post.likes?.includes(user?._id)
                              ? 'text-red-500'
                              : isDarkMode
                                ? 'text-white'
                                : 'text-black'
                          }`}
                          title="Like"
                        >
                          {post.likes?.includes(user?._id) ? <FaHeart /> : <FaRegHeart />}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPost(post);
                            setSelectedPostImageIndex(0);
                            setSelectedPostMuted(true);
                          }}
                          className={`text-[22px] transition-transform hover:scale-110 active:scale-95 ${
                            isDarkMode ? 'text-white' : 'text-black'
                          }`}
                          title="Comments"
                        >
                          <FaCommentDots />
                        </button>
                      </div>
                      <button
                        type="button"
                        className={`ml-auto text-[22px] transition-transform hover:scale-110 active:scale-95 ${
                          isDarkMode ? 'text-white' : 'text-black'
                        }`}
                        title="Save"
                        aria-label="Save post"
                      >
                        <FaRegBookmark />
                      </button>
                    </div>

                    {post.likes?.length > 0 && (
                      <p className="px-1 pt-1 text-sm font-semibold">
                        {post.likes.length} {post.likes.length === 1 ? 'like' : 'likes'}
                      </p>
                    )}

                    {post.text && (
                      <div className="px-1 pt-1 text-sm whitespace-pre-wrap break-words">
                        <span className="mr-1 font-semibold">{post.user?.username}</span>
                        <ExpandableText
                          text={post.text}
                          maxChars={160}
                          textClassName={isDarkMode ? 'text-gray-200' : 'text-gray-800'}
                          buttonClassName={isDarkMode ? 'text-gray-400' : 'text-gray-500'}
                          showLess
                        />
                      </div>
                    )}

                    {post.comments?.length > 0 && (
                      <div className="px-1 pt-1">
                        {post.comments.length > 1 && (
                          <button
                            onClick={() => {
                              setSelectedPost(post);
                              setSelectedPostImageIndex(0);
                              setSelectedPostMuted(true);
                            }}
                            className={`text-xs ${subText} hover:opacity-75`}
                          >
                            View all {post.comments.length} comments
                          </button>
                        )}
                        <div className="mt-0.5 text-sm">
                          <span className="mr-1 font-semibold">
                            {post.comments[post.comments.length - 1].user?.username}
                          </span>
                          <ExpandableText
                            text={post.comments[post.comments.length - 1].text}
                            maxChars={110}
                            textClassName={subText}
                            buttonClassName={subText}
                          />
                        </div>
                      </div>
                    )}

                    <form
                      onSubmit={(event) => handleSubmit(event, post._id)}
                      className="mt-1 flex items-center gap-2 px-1 py-2"
                    >
                      <input
                        type="text"
                        value={comments.text || ''}
                        onChange={handleComment}
                        placeholder="Add a comment..."
                        className={`flex-1 bg-transparent text-sm outline-none ${subText}`}
                      />
                      {comments.text?.trim() && (
                        <button
                          type="submit"
                          className="text-sm font-semibold text-blue-500 hover:text-blue-300"
                        >
                          Post
                        </button>
                      )}
                    </form>
                  </article>
                );
              })
            ) : (
              <div className="py-16 text-center">
                <p className={`text-sm ${subText}`}>
                  No posts yet. Follow users to see their posts!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={(event) => event.target === event.currentTarget && closeSelectedPost()}
        >
          <div className={`flex h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg ${cardBg}`}>
            <div
              className="relative flex flex-1 items-center justify-center bg-black"
              onWheelCapture={handleSelectedPostWheel}
              onMouseEnter={() => setIsPointerOverSelectedMedia(true)}
              onMouseLeave={() => setIsPointerOverSelectedMedia(false)}
              style={{ overscrollBehaviorX: 'contain' }}
            >
              {isVideoMedia(selectedPostMedia[selectedPostImageIndex]) ? (
                <video
                  ref={selectedPostVideoRef}
                  src={getMediaUrl(selectedPostMedia[selectedPostImageIndex]?.url, backendUrl)}
                  className="max-h-full max-w-full object-contain"
                  style={{ overscrollBehaviorX: 'contain' }}
                  autoPlay
                  loop
                  playsInline
                  muted={selectedPostMuted}
                  preload="metadata"
                  onClick={toggleSelectedPostPlayback}
                  onWheel={handleSelectedPostWheel}
                />
              ) : (
                <img
                  src={getMediaUrl(selectedPostMedia[selectedPostImageIndex]?.url, backendUrl)}
                  alt="Post"
                  className="max-h-full max-w-full object-contain"
                  style={{ overscrollBehaviorX: 'contain' }}
                  onWheel={handleSelectedPostWheel}
                />
              )}

              {selectedPostMedia.length > 1 && (
                <>
                  {selectedPostImageIndex > 0 && (
                    <button
                      onClick={() => setSelectedPostImageIndex((prev) => prev - 1)}
                      className="absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-xl text-white hover:bg-black/70"
                    >
                      ‹
                    </button>
                  )}
                  {selectedPostImageIndex < selectedPostMedia.length - 1 && (
                    <button
                      onClick={() => setSelectedPostImageIndex((prev) => prev + 1)}
                      className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-xl text-white hover:bg-black/70"
                    >
                      ›
                    </button>
                  )}
                  <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1">
                    {selectedPostMedia.map((_, imageIndex) => (
                      <button
                        key={imageIndex}
                        onClick={() => setSelectedPostImageIndex(imageIndex)}
                        className={`h-1.5 w-1.5 rounded-full transition-all ${
                          imageIndex === selectedPostImageIndex
                            ? 'scale-125 bg-white'
                            : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}

              {isVideoMedia(selectedPostMedia[selectedPostImageIndex]) && (
                <div className="absolute bottom-4 right-4 z-20">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedPostMuted((prev) => !prev);
                    }}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/50"
                  >
                    {selectedPostMuted ? <FaVolumeMute size={16} /> : <FaVolumeUp size={16} />}
                  </button>
                </div>
              )}
            </div>

            <div className={`flex w-80 flex-col border-l ${border}`}>
              <div className={`flex items-center justify-between border-b px-4 py-3 ${border}`}>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 overflow-hidden rounded-full">
                    {selectedPost.user?.avatar ? (
                      <img
                        src={getMediaUrl(selectedPost.user.avatar, backendUrl)}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-blue-400 to-purple-600 text-xs font-bold text-white">
                        {selectedPost.user?.username?.charAt(0)?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-semibold">{selectedPost.user?.username}</p>
                </div>
                <button onClick={closeSelectedPost} className="hover:opacity-60">
                  <IoMdClose size={20} />
                </button>
              </div>

              <div className="insta-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-3">
                {selectedPost.text && (
                  <div className={`mb-3 border-b pb-3 text-sm ${border}`}>
                    <span className="mr-1 font-semibold">{selectedPost.user?.username}</span>
                    <ExpandableText
                      text={selectedPost.text}
                      maxChars={260}
                      textClassName={isDarkMode ? 'text-gray-300' : 'text-gray-700'}
                      buttonClassName={isDarkMode ? 'text-gray-400' : 'text-gray-500'}
                      showLess
                    />
                  </div>
                )}

                {selectedPost.comments?.map((comment) => (
                  <CommentItem
                    key={comment._id}
                    comment={comment}
                    backendUrl={backendUrl}
                    isDarkMode={isDarkMode}
                    canDelete={
                      String(comment.user?._id || '') === String(user?._id || '') ||
                      String(selectedPost.user?._id || '') === String(user?._id || '')
                    }
                    onDelete={() => handleDeleteComment(selectedPost._id, comment._id)}
                  />
                ))}
              </div>

              <div className={`border-t px-4 py-3 ${border}`}>
                <div className="mb-2 flex gap-4 text-[22px]">
                  <button
                    onClick={() => likePosts(selectedPost._id)}
                    className={`transition-transform hover:scale-110 active:scale-95 ${
                      selectedPost.likes?.includes(user?._id)
                        ? 'text-red-500'
                        : isDarkMode
                          ? 'text-white'
                          : 'text-black'
                    }`}
                  >
                    {selectedPost.likes?.includes(user?._id) ? <FaHeart /> : <FaRegHeart />}
                  </button>
                  <FaCommentDots className={subText} />
                </div>

                {selectedPost.likes?.length > 0 && (
                  <p className="mb-2 text-sm font-semibold">
                    {selectedPost.likes.length}{' '}
                    {selectedPost.likes.length === 1 ? 'like' : 'likes'}
                  </p>
                )}

                <form
                  onSubmit={(event) => handleSubmit(event, selectedPost._id)}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={comments.text || ''}
                    onChange={handleComment}
                    placeholder="Add a comment..."
                    className={`flex-1 bg-transparent text-sm outline-none ${
                      isDarkMode
                        ? 'text-white placeholder-gray-500'
                        : 'text-black placeholder-gray-600'
                    }`}
                  />
                  {comments.text?.trim() && (
                    <button type="submit" className="text-sm font-semibold text-blue-500">
                      Post
                    </button>
                  )}
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostPage;
