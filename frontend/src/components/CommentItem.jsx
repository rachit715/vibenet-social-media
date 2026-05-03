import { useState } from 'react';
import { BsThreeDots } from 'react-icons/bs';
import { getMediaUrl } from '../utils/media';
import HighlightedText from './HighlightedText';

const CommentItem = ({
  comment,
  backendUrl,
  isDarkMode,
  canDelete = false,
  onDelete,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex items-start gap-3 text-sm">
      <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full">
        {comment.user?.avatar ? (
          <img
            src={getMediaUrl(comment.user.avatar, backendUrl)}
            alt={comment.user?.username}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-blue-400 to-purple-600 text-[10px] font-bold text-white">
            {comment.user?.username?.charAt(0)?.toUpperCase()}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={`leading-5 whitespace-pre-wrap break-words ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}
        >
          <span className={`mr-2 font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>
            {comment.user?.username}
          </span>
          <HighlightedText text={comment.text} />
        </p>
      </div>

      {canDelete && (
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className={`rounded-full p-1 transition ${isDarkMode ? 'text-gray-400 hover:bg-white/10 hover:text-white' : 'text-gray-500 hover:bg-black/5 hover:text-black'}`}
          >
            <BsThreeDots size={14} />
          </button>

          {menuOpen && (
            <div className={`absolute right-0 top-8 z-20 w-32 overflow-hidden rounded-2xl border ${isDarkMode ? 'border-white/10 bg-[#1f1f1f]' : 'border-gray-200 bg-white'} shadow-xl`}>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete?.();
                }}
                className="w-full px-4 py-3 text-sm font-semibold text-red-500 transition hover:bg-black/5 dark:hover:bg-white/10"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className={`w-full border-t px-4 py-3 text-sm transition ${isDarkMode ? 'border-white/10 text-white hover:bg-white/10' : 'border-gray-200 text-black hover:bg-black/5'}`}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommentItem;
