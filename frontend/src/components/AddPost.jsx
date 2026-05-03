import { useState, useContext } from 'react';
import { PostContext } from '../context/PostsContext';
import { ThemeContext } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import SideBar from './SideBar';
import { FaImage, FaTimes } from 'react-icons/fa';
import { IoChevronBack, IoChevronForward } from 'react-icons/io5';
import { isVideoMedia } from '../utils/media';

const AddPost = () => {
  const [text, setText] = useState('');
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);

  const { createPost } = useContext(PostContext);
  const { isDarkMode } = useContext(ThemeContext);
  const navigate = useNavigate();

  const handleFiles = (files) => {
    const fileArray = Array.from(files);
    setImages((prev) => [...prev, ...fileArray]);

    fileArray.forEach((file) => {
      setImagePreviews((prev) => [
        ...prev,
        {
          url: URL.createObjectURL(file),
          type: file.type.startsWith('video/') ? 'video' : 'image',
          name: file.name,
        },
      ]);
    });
  };

  const handleImageChange = (e) => handleFiles(e.target.files);

  // Drag & Drop
  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!text.trim()) return alert('Add caption');
    if (images.length === 0) return alert('Upload image');

    setLoading(true);
    await createPost(text, images);
    setLoading(false);
  };

  return (
    <div className={`${isDarkMode ? 'bg-black text-white' : 'bg-gray-100 text-black'} flex min-h-screen`}>
      
      {/* Sidebar */}
      <div className="hidden md:block w-20 lg:w-64 border-r border-white/10">
        <SideBar />
      </div>

      {/* Main */}
      <div className="flex-1 flex justify-center p-4 md:p-8">
        <div
          className={`w-full max-w-2xl rounded-2xl shadow-2xl backdrop-blur ${
            isDarkMode
              ? 'bg-[#0d0d0d] border border-white/10'
              : 'bg-white border border-gray-200'
          }`}
        >
          {/* Header */}
          <div className="p-5 border-b border-white/10 flex justify-between items-center">
            <h2 className="text-lg font-semibold">Create new post</h2>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 space-y-6">

            {/* Caption */}
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What's on your mind?"
              className={`w-full p-3 rounded-lg outline-none resize-none ${
                isDarkMode
                  ? 'bg-black border border-white/10 text-white placeholder-gray-500 focus:border-white/30'
                  : 'bg-gray-100 border border-gray-300'
              }`}
              rows={4}
            />

            {/* Upload Box */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition cursor-pointer ${
                dragActive
                  ? 'border-blue-500 bg-blue-500/10'
                  : isDarkMode
                  ? 'border-white/10 hover:bg-white/5'
                  : 'border-gray-300 hover:bg-gray-100'
              }`}
            >
              <input
                type="file"
                multiple
                accept="image/*,video/mp4,video/webm,video/quicktime"
                onChange={handleImageChange}
                className="hidden"
                id="upload"
              />
              <label htmlFor="upload" className="cursor-pointer">
                <FaImage className="text-3xl mx-auto mb-2 text-gray-400" />
                <p className="text-sm">Drag & drop or click to upload</p>
              </label>
            </div>

            {/* Preview */}
            {imagePreviews.length > 0 && (
              <div>
                {/* Main Image */}
                <div className="relative">
                  {isVideoMedia(imagePreviews[currentIndex]) ? (
                    <video
                      src={imagePreviews[currentIndex]?.url}
                      className="w-full max-h-112.5 rounded-xl border border-white/10 bg-black object-contain"
                      muted
                      playsInline
                      controls
                    />
                  ) : (
                    <img
                      src={imagePreviews[currentIndex]?.url}
                      className="w-full max-h-112.5 object-cover rounded-xl border border-white/10"
                    />
                  )}

                  {imagePreviews.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentIndex((prev) =>
                            prev === 0 ? imagePreviews.length - 1 : prev - 1
                          )
                        }
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 p-2 rounded-full"
                      >
                        <IoChevronBack />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setCurrentIndex((prev) =>
                            prev === imagePreviews.length - 1 ? 0 : prev + 1
                          )
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 p-2 rounded-full"
                      >
                        <IoChevronForward />
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnails */}
                <div className="flex gap-2 mt-3 overflow-x-auto">
                  {imagePreviews.map((img, i) => (
                    <div key={i} className="relative">
                      {isVideoMedia(img) ? (
                        <video
                          src={img.url}
                          onClick={() => setCurrentIndex(i)}
                          className={`w-16 h-16 rounded-lg object-cover cursor-pointer border ${
                            i === currentIndex
                              ? 'border-white'
                              : 'border-white/10 opacity-60'
                          }`}
                          muted
                          playsInline
                        />
                      ) : (
                        <img
                          src={img.url}
                          onClick={() => setCurrentIndex(i)}
                          className={`w-16 h-16 rounded-lg object-cover cursor-pointer border ${
                            i === currentIndex
                              ? 'border-white'
                              : 'border-white/10 opacity-60'
                          }`}
                        />
                      )}
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute -top-2 -right-2 bg-red-500 p-1 rounded-full"
                      >
                        <FaTimes size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded-lg text-white font-semibold"
              >
                {loading ? 'Posting...' : 'Post'}
              </button>

              <button
                type="button"
                onClick={() => navigate('/posts')}
                className={`flex-1 py-2 rounded-lg ${
                  isDarkMode
                    ? 'bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-white/10'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default AddPost;
