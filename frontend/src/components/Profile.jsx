import { useContext, useEffect, useRef, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { PostContext } from '../context/PostsContext';
import { IoMdClose } from 'react-icons/io';
import { FaVolumeMute, FaVolumeUp } from 'react-icons/fa';
import { getMediaUrl, getPostMediaItems, isVideoMedia } from '../utils/media';
import useHorizontalWheelHistoryBlock from '../hooks/useHorizontalWheelHistoryBlock';
import useGlobalVideoMute from '../hooks/useGlobalVideoMute';
import HighlightedText from './HighlightedText';

const Profile = () => {
  const { user, backendUrl } = useContext(AuthContext);
  const { userPosts, fetchPostsofLoginUser } = useContext(PostContext);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [selectedPhotoImageIndex, setSelectedPhotoImageIndex] = useState(0);
  const [selectedPhotoMuted, setSelectedPhotoMuted] = useGlobalVideoMute();
  const [isPointerOverSelectedPhoto, setIsPointerOverSelectedPhoto] = useState(false);
  const selectedPhotoWheelDelta = useRef(0);
  const selectedPhotoWheelLockUntil = useRef(0);
  const selectedPhotoWheelResetTimeout = useRef(null);
  const selectedPhotoVideoRef = useRef(null);
  const selectedPhotoMedia = getPostMediaItems(selectedPhoto);

  useHorizontalWheelHistoryBlock(
    isPointerOverSelectedPhoto && Boolean(selectedPhotoMedia.length > 1)
  );

  useEffect(() => {
    fetchPostsofLoginUser();
  }, [fetchPostsofLoginUser]);

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

  return (
    <div className="p-6 min-h-[87vh] border-l rounded-md bg-linear-to-b from-[#13072e] to-[#3f2182] border-gray-700 hidden md:block">
      <div className="max-w-4xl mx-auto rounded-lg shadow-lg p-6">
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-0">
          {user?.avatar ? (
            <img
              src={getMediaUrl(user.avatar, backendUrl)}
              alt="User Avatar"
              className="w-32 h-32 rounded-full object-cover"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-gray-400"></div>
          )}
          <div className="hidden lg:block justify-center">
            <h1 className="text-2xl font-bold text-white">{user?.username}</h1>
            <div className="mt-2 max-w-xs">
              <p className="text-xs text-gray-300">{user?.email}</p>
            </div>
            <div className="mt-4 flex flex-row justify-center items-center gap-2">
              <p className="text-white text-md">
                <span className="font-semibold">Total Posts:</span>
                {userPosts.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto mt-6 max-h-xl overflow-y-scroll">
        <h2 className="text-xl font-bold text-white mb-4">Uploaded Photos</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 object-cover h-20">
          {userPosts.map((post, index) => {
            const mediaItems = getPostMediaItems(post);
            const firstMedia = mediaItems[0];

            return (
              <div
                key={index}
                className="relative aspect-w-1 aspect-h-1 rounded-lg overflow-hidden shadow-group cursor-pointer"
                onClick={() => {
                  setSelectedPhoto(post);
                  setSelectedPhotoImageIndex(0);
                }}
              >
                {firstMedia && (
                  isVideoMedia(firstMedia) ? (
                    <video
                      src={getMediaUrl(firstMedia.url, backendUrl)}
                      className="object-cover w-full h-full hover:opacity-75 transition-opacity"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <img
                      src={getMediaUrl(firstMedia.url, backendUrl)}
                      alt="image"
                      className="object-cover w-full h-full hover:opacity-75 transition-opacity"
                    />
                  )
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div
            className="relative max-w-2xl max-h-96 bg-black rounded-lg"
            onWheelCapture={handleSelectedPhotoWheel}
            onMouseEnter={() => setIsPointerOverSelectedPhoto(true)}
            onMouseLeave={() => setIsPointerOverSelectedPhoto(false)}
            style={{ overscrollBehaviorX: 'contain' }}
          >
            <button
              onClick={closeSelectedPhoto}
              className="absolute -top-10 -right-2 text-white text-3xl hover:text-gray-300 transition"
            >
              <IoMdClose />
            </button>
            {isVideoMedia(selectedPhotoMedia[selectedPhotoImageIndex]) ? (
              <video
                ref={selectedPhotoVideoRef}
                src={getMediaUrl(selectedPhotoMedia[selectedPhotoImageIndex]?.url, backendUrl)}
                className="w-full h-full object-cover rounded-lg"
                style={{ overscrollBehaviorX: 'contain' }}
                autoPlay
                loop
                muted={selectedPhotoMuted}
                playsInline
                preload="metadata"
                onClick={toggleSelectedPhotoPlayback}
                onWheel={handleSelectedPhotoWheel}
              />
            ) : (
              <img
                src={getMediaUrl(
                  selectedPhotoMedia[selectedPhotoImageIndex]?.url,
                  backendUrl
                )}
                alt="Full view"
                className="w-full h-full object-cover rounded-lg"
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
              </>
            )}
            <div className="p-4 text-white">
              <p className="mt-2 whitespace-pre-wrap break-words text-sm">
                <HighlightedText text={selectedPhoto.text} />
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
