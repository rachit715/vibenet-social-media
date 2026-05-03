import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import axios from 'axios';
import {
  FaPause,
  FaPlay,
  FaTimes,
  FaHeart,
  FaRegHeart,
  FaVolumeMute,
  FaVolumeUp,
} from 'react-icons/fa';
import { BsThreeDots } from 'react-icons/bs';
import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';
import { toast } from 'react-toastify';
import { getMediaUrl, isVideoMedia } from '../utils/media';
import useGlobalVideoMute from '../hooks/useGlobalVideoMute';

const STORY_DURATION = 5000;

const StoryViewer = ({
  stories = [],
  user,
  backendUrl,
  onClose,
  isDarkMode,
  onStoryViewed,
  groupedStories,
  initialGroupIndex = 0,
  currentUserId,
  onStoryDeleted,
  showReplyBar = true,
}) => {
  const normalizedGroups = useMemo(() => {
    if (groupedStories?.length) {
      return groupedStories.filter(
        (group) => group?.user?._id && Array.isArray(group.stories) && group.stories.length > 0
      );
    }

    if (user?._id && stories.length > 0) {
      return [{ user, stories }];
    }

    return [];
  }, [groupedStories, stories, user]);

  const [activeGroupIndex, setActiveGroupIndex] = useState(
    Math.min(initialGroupIndex, Math.max(normalizedGroups.length - 1, 0))
  );
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [deletingStory, setDeletingStory] = useState(false);
  const [isMuted, setIsMuted] = useGlobalVideoMute();
  const [currentDuration, setCurrentDuration] = useState(STORY_DURATION);

  const animFrameRef = useRef(null);
  const startTimeRef = useRef(null);
  const pausedAtRef = useRef(0);
  const progressRef = useRef(0);
  const storyVideoRef = useRef(null);

  const activeGroup = normalizedGroups[activeGroupIndex];
  const currentStory = activeGroup?.stories?.[activeStoryIndex];
  const prevGroup = activeGroupIndex > 0 ? normalizedGroups[activeGroupIndex - 1] : null;
  const nextGroup =
    activeGroupIndex < normalizedGroups.length - 1
      ? normalizedGroups[activeGroupIndex + 1]
      : null;
  const canDeleteCurrentStory =
    String(activeGroup?.user?._id || '') === String(currentUserId || '');
  const currentStoryIsVideo =
    currentStory?.mediaType === 'video' || isVideoMedia(currentStory?.image);
  const currentStoryMuted = isMuted;

  useEffect(() => {
    setActiveGroupIndex((prev) =>
      Math.min(initialGroupIndex, Math.max(normalizedGroups.length - 1, 0), prev)
    );
  }, [initialGroupIndex, normalizedGroups.length]);

  useEffect(() => {
    if (!normalizedGroups.length) {
      onClose?.();
      return;
    }

    setActiveGroupIndex((prevGroupIndex) => {
      const nextGroupIndex = Math.min(prevGroupIndex, normalizedGroups.length - 1);
      const nextGroup = normalizedGroups[nextGroupIndex];
      if (!nextGroup?.stories?.length) return nextGroupIndex;
      setActiveStoryIndex((prevStoryIndex) =>
        Math.min(prevStoryIndex, nextGroup.stories.length - 1)
      );
      return nextGroupIndex;
    });
  }, [normalizedGroups, onClose]);

  useEffect(() => {
    if (!currentStory) return;
    onStoryViewed?.(String(currentStory._id));
  }, [currentStory, onStoryViewed]);

  useEffect(() => {
    setMenuOpen(false);
  }, [activeGroupIndex, activeStoryIndex]);

  useEffect(() => {
    if (!currentStory) return;
    if (currentStoryIsVideo) {
      setCurrentDuration(
        Math.min(Number(currentStory.duration || 0) || STORY_DURATION / 1000, 60) *
          1000
      );
    } else {
      setCurrentDuration(STORY_DURATION);
    }
  }, [currentStory, currentStoryIsVideo]);

  const resetProgress = useCallback(() => {
    setProgress(0);
    progressRef.current = 0;
    pausedAtRef.current = 0;
  }, []);

  const goToGroup = useCallback((nextGroupIndex) => {
    if (nextGroupIndex < 0 || nextGroupIndex >= normalizedGroups.length) return;
    resetProgress();
    setActiveGroupIndex(nextGroupIndex);
    setActiveStoryIndex(0);
  }, [normalizedGroups.length, resetProgress]);

  const goNext = useCallback(() => {
    if (!activeGroup) return;
    resetProgress();

    if (activeStoryIndex < activeGroup.stories.length - 1) {
      setActiveStoryIndex((prev) => prev + 1);
      return;
    }

    if (activeGroupIndex < normalizedGroups.length - 1) {
      setActiveGroupIndex((prev) => prev + 1);
      setActiveStoryIndex(0);
      return;
    }

    onClose?.();
  }, [activeGroup, activeGroupIndex, activeStoryIndex, normalizedGroups.length, onClose, resetProgress]);

  const goPrev = useCallback(() => {
    if (!activeGroup) return;
    resetProgress();

    if (activeStoryIndex > 0) {
      setActiveStoryIndex((prev) => prev - 1);
      return;
    }

    if (activeGroupIndex > 0) {
      const previousGroup = normalizedGroups[activeGroupIndex - 1];
      setActiveGroupIndex((prev) => prev - 1);
      setActiveStoryIndex(Math.max((previousGroup?.stories?.length || 1) - 1, 0));
    }
  }, [activeGroup, activeGroupIndex, activeStoryIndex, normalizedGroups, resetProgress]);

  useEffect(() => {
    if (!currentStory) return undefined;

    if (paused || menuOpen) {
      cancelAnimationFrame(animFrameRef.current);
      pausedAtRef.current = (progressRef.current / 100) * currentDuration;
      return undefined;
    }

    cancelAnimationFrame(animFrameRef.current);
    startTimeRef.current = performance.now() - pausedAtRef.current;

    const animate = (now) => {
      const pct = Math.min(
        ((now - startTimeRef.current) / currentDuration) * 100,
        100
      );
      setProgress(pct);
      progressRef.current = pct;

      if (pct < 100) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        goNext();
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animFrameRef.current);
  }, [currentDuration, currentStory, goNext, menuOpen, paused]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'ArrowRight') goNext();
      if (event.key === 'ArrowLeft') goPrev();
      if (event.key === 'Escape') onClose?.();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev, onClose]);

  const getTime = (date) => {
    const diff = Math.floor((new Date() - new Date(date)) / (1000 * 60));
    return diff < 60 ? `${Math.max(diff, 1)}m` : `${Math.floor(diff / 60)}h`;
  };

  const handleDeleteStory = async () => {
    if (!currentStory || deletingStory) return;

    const token =
      localStorage.getItem('token') ||
      document.cookie.split('token=')[1]?.split(';')[0];

    if (!token) {
      toast.error('Please login first');
      return;
    }

    setDeletingStory(true);
    try {
      const { data } = await axios.delete(
        `${backendUrl}/api/stories/${currentStory._id}/delete`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success('Story deleted');
        onStoryDeleted?.(currentStory);
      } else {
        toast.error(data.message || 'Failed to delete story');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete story');
    } finally {
      setDeletingStory(false);
      setMenuOpen(false);
    }
  };

  const toggleCurrentStoryMute = () => setIsMuted((prev) => !prev);

  useEffect(() => {
    if (!currentStoryIsVideo || !storyVideoRef.current) return;

    if (paused || menuOpen) {
      storyVideoRef.current.pause();
      return;
    }

    void storyVideoRef.current.play().catch(() => {});
  }, [activeGroupIndex, activeStoryIndex, currentStoryIsVideo, menuOpen, paused]);

  if (!normalizedGroups.length || !activeGroup || !currentStory) return null;

  return (
    <div
      className={`fixed inset-0 z-50 ${isDarkMode ? 'bg-black/95' : 'bg-black/90'} flex items-center justify-center px-3 py-4 md:px-6`}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <div className="relative flex w-full max-w-6xl items-center justify-center gap-2 md:gap-5">
        {prevGroup && (
          <button
            type="button"
            onClick={() => goToGroup(activeGroupIndex - 1)}
            className="hidden lg:block shrink-0"
          >
            <div className="relative h-[66vh] w-36 overflow-hidden rounded-[28px] bg-white/5 opacity-30 transition hover:opacity-55">
              {prevGroup.stories[0]?.mediaType === 'video' ||
              isVideoMedia(prevGroup.stories[0]?.image) ? (
                <video
                  src={getMediaUrl(prevGroup.stories[0].image, backendUrl)}
                  className="h-full w-full scale-105 object-cover blur-sm"
                  muted
                  playsInline
                  preload="metadata"
                />
              ) : (
                <img
                  src={getMediaUrl(prevGroup.stories[0].image, backendUrl)}
                  alt={prevGroup.user?.username}
                  className="h-full w-full scale-105 object-cover blur-sm"
                  draggable={false}
                />
              )}
              <div className="absolute inset-0 bg-black/65" />
              <div className="absolute inset-x-0 top-6 flex flex-col items-center px-4 text-center">
                <div className="h-14 w-14 overflow-hidden rounded-full border-2 border-pink-500/80 shadow-lg">
                  {prevGroup.user?.avatar ? (
                    <img
                      src={getMediaUrl(prevGroup.user.avatar, backendUrl)}
                      alt={prevGroup.user?.username}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-400 to-purple-600 text-xl font-bold text-white">
                      {prevGroup.user?.username?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                </div>
                <p className="mt-3 truncate text-sm font-semibold text-white">
                  {prevGroup.user?.username}
                </p>
                <p className="mt-1 text-xs text-white/70">
                  {getTime(prevGroup.stories[0].createdAt)}
                </p>
              </div>
            </div>
          </button>
        )}

        <div className="relative w-full max-w-[420px]">
          <div className="relative mx-auto aspect-[9/16] w-full overflow-hidden rounded-[32px] bg-zinc-950 shadow-[0_25px_80px_rgba(0,0,0,0.55)]">
            {currentStoryIsVideo ? (
              <div className="absolute inset-0 bg-black/55" />
            ) : (
              <img
                src={getMediaUrl(currentStory.image, backendUrl)}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl opacity-50"
                draggable={false}
              />
            )}
            <div className="absolute inset-0 bg-black/28" />
            {currentStoryIsVideo ? (
              <video
                ref={storyVideoRef}
                key={currentStory._id}
                src={getMediaUrl(currentStory.image, backendUrl)}
                className="relative z-[1] h-full w-full object-contain"
                autoPlay
                playsInline
                muted={currentStoryMuted}
                preload="metadata"
              />
            ) : (
              <img
                src={getMediaUrl(currentStory.image, backendUrl)}
                alt="Story"
                className="relative z-[1] h-full w-full object-contain"
                draggable={false}
              />
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/55" />

            <div className="absolute inset-x-0 top-3 z-20 flex gap-1 px-3">
              {activeGroup.stories.map((story, idx) => (
                <div
                  key={story._id}
                  className="h-1 flex-1 overflow-hidden rounded-full bg-white/25"
                >
                  <div
                    className="h-full rounded-full bg-white"
                    style={{
                      width:
                        idx < activeStoryIndex
                          ? '100%'
                          : idx === activeStoryIndex
                            ? `${progress}%`
                            : '0%',
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="absolute inset-x-0 top-5 z-20 flex items-start gap-3 px-4">
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-white/80 bg-white/10 shadow-md">
                {activeGroup.user?.avatar ? (
                  <img
                    src={getMediaUrl(activeGroup.user.avatar, backendUrl)}
                    alt={activeGroup.user?.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-400 to-purple-600 text-sm font-bold text-white">
                    {activeGroup.user?.username?.charAt(0)?.toUpperCase()}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1 pt-0.5">
                <p className="truncate text-sm font-semibold text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.75)]">
                  {activeGroup.user?.username}
                </p>
                <p className="text-xs text-white/75 [text-shadow:0_1px_8px_rgba(0,0,0,0.75)]">
                  {getTime(currentStory.createdAt)}
                </p>
              </div>

              <div className="ml-auto flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPaused((prev) => !prev)}
                  className="pt-1 text-white transition hover:opacity-75"
                >
                  {paused ? <FaPlay size={14} /> : <FaPause size={14} />}
                </button>

                {currentStoryIsVideo && (
                  <button
                    type="button"
                    onClick={toggleCurrentStoryMute}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/50"
                  >
                    {currentStoryMuted ? <FaVolumeMute size={15} /> : <FaVolumeUp size={15} />}
                  </button>
                )}

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setMenuOpen((prev) => !prev)}
                    className="pt-1 text-white transition hover:opacity-75"
                  >
                    <BsThreeDots size={18} />
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 top-8 w-36 overflow-hidden rounded-2xl border border-white/10 bg-black/85 p-1 backdrop-blur-md">
                      {canDeleteCurrentStory ? (
                        <button
                          type="button"
                          onClick={handleDeleteStory}
                          disabled={deletingStory}
                          className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-red-400 transition hover:bg-white/10 disabled:opacity-50"
                        >
                          {deletingStory ? 'Deleting...' : 'Delete story'}
                        </button>
                      ) : (
                        <div className="px-3 py-2 text-sm text-white/70">Story options</div>
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="pt-1 text-white transition hover:opacity-75"
                >
                  <FaTimes size={18} />
                </button>
              </div>
            </div>

            <div className="absolute inset-0 z-10 flex">
              <button type="button" onClick={goPrev} className="flex-1" aria-label="Previous story" />
              <button type="button" onClick={goNext} className="flex-1" aria-label="Next story" />
            </div>

            {currentStory.text && (
              <div className="absolute inset-x-0 bottom-24 z-20 px-6 text-center">
                <p className="rounded-3xl bg-black/18 px-4 py-3 text-sm font-medium text-white backdrop-blur-[1px]">
                  {currentStory.text}
                </p>
              </div>
            )}

            {showReplyBar && (
              <div className="absolute inset-x-0 bottom-4 z-20 flex items-center gap-3 px-4">
                <input
                  type="text"
                  value={replyText}
                  onChange={(event) => setReplyText(event.target.value)}
                  placeholder={`Reply to ${activeGroup.user?.username}...`}
                  onFocus={() => setPaused(true)}
                  onBlur={() => setPaused(false)}
                  className="flex-1 rounded-full border border-white/30 bg-white/10 px-4 py-2.5 text-sm text-white outline-none backdrop-blur placeholder:text-white/65 shadow-lg"
                />
                <button
                  type="button"
                  className="rounded-full border border-white/25 bg-white/10 p-2.5 text-white shadow-lg transition hover:scale-105 hover:opacity-80"
                  onClick={() => setPaused(true)}
                >
                  {replyText ? <FaHeart size={20} /> : <FaRegHeart size={20} />}
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={goPrev}
            className="absolute -left-3 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/16 text-white backdrop-blur transition hover:bg-white/28 md:-left-12"
          >
            <IoIosArrowBack className="text-xl" />
          </button>

          <button
            type="button"
            onClick={goNext}
            className="absolute -right-3 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/16 text-white backdrop-blur transition hover:bg-white/28 md:-right-12"
          >
            <IoIosArrowForward className="text-xl" />
          </button>
        </div>

        {nextGroup && (
          <button
            type="button"
            onClick={() => goToGroup(activeGroupIndex + 1)}
            className="hidden lg:block shrink-0"
          >
            <div className="relative h-[66vh] w-36 overflow-hidden rounded-[28px] bg-white/5 opacity-30 transition hover:opacity-55">
              {nextGroup.stories[0]?.mediaType === 'video' ||
              isVideoMedia(nextGroup.stories[0]?.image) ? (
                <video
                  src={getMediaUrl(nextGroup.stories[0].image, backendUrl)}
                  className="h-full w-full scale-105 object-cover blur-sm"
                  muted
                  playsInline
                  preload="metadata"
                />
              ) : (
                <img
                  src={getMediaUrl(nextGroup.stories[0].image, backendUrl)}
                  alt={nextGroup.user?.username}
                  className="h-full w-full scale-105 object-cover blur-sm"
                  draggable={false}
                />
              )}
              <div className="absolute inset-0 bg-black/65" />
              <div className="absolute inset-x-0 top-6 flex flex-col items-center px-4 text-center">
                <div className="h-14 w-14 overflow-hidden rounded-full border-2 border-pink-500/80 shadow-lg">
                  {nextGroup.user?.avatar ? (
                    <img
                      src={getMediaUrl(nextGroup.user.avatar, backendUrl)}
                      alt={nextGroup.user?.username}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-400 to-purple-600 text-xl font-bold text-white">
                      {nextGroup.user?.username?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                </div>
                <p className="mt-3 truncate text-sm font-semibold text-white">
                  {nextGroup.user?.username}
                </p>
                <p className="mt-1 text-xs text-white/70">
                  {getTime(nextGroup.stories[0].createdAt)}
                </p>
              </div>
            </div>
          </button>
        )}
      </div>
    </div>
  );
};

export default StoryViewer;
