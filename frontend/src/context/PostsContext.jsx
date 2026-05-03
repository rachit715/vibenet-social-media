import axios from 'axios';
import cookies from 'js-cookie';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import { toast } from 'react-toastify';

const PostContext = createContext();

const PostContextProvider = ({ children }) => {
  const navigate = useNavigate();

  const { backendUrl, token } = useContext(AuthContext);

  const [Allposts, setAllPosts] = useState([]);
  const [userPosts, setUserPosts] = useState([]);

  const utoken = cookies.get('token');

  const fetchAllPosts = useCallback(async () => {
    try {
      const currentToken = cookies.get('token');
      const { data } = await axios.get(`${backendUrl}/api/posts/get-posts`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });
      if (data.success) {
        // Shuffle posts randomly using Fisher-Yates algorithm
        const shuffledPosts = [...data.posts];
        for (let i = shuffledPosts.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffledPosts[i], shuffledPosts[j]] = [
            shuffledPosts[j],
            shuffledPosts[i],
          ];
        }
        setAllPosts(shuffledPosts);
      }
    } catch (error) {
      toast.error(error.message);
    }
  }, [backendUrl]);

  const fetchPostsofLoginUser = useCallback(async () => {
    try {
      const currentToken = cookies.get('token');
      const { data } = await axios.get(`${backendUrl}/api/posts/user-posts`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });
      if (data.success) {
        setUserPosts(data.posts);
      }
    } catch (error) {
      console.log(error);
    }
  }, [backendUrl]);

  const likePosts = async (id) => {
    try {
      const { data } = await axios.put(
        `${backendUrl}/api/posts/post/${id}/like`,
        {},
        {
          headers: {
            Authorization: `Bearer ${utoken}`,
          },
        }
      );
      if (data.success) {
        toast.success(data.message);
        fetchAllPosts();
      }
    } catch (error) {
      console.log(error);
    }
  };

  const postsComments = async (id, text) => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/posts/post/${id}/comments`,
        { text },
        {
          headers: {
            Authorization: `Bearer ${utoken}`,
          },
        }
      );
      if (data.success) {
        toast.success(data.message);
        fetchAllPosts();
      }
    } catch (error) {
      console.log(error);
    }
  };

  const deleteComment = async (postId, commentId) => {
    try {
      const { data } = await axios.delete(
        `${backendUrl}/api/posts/post/${postId}/comments/${commentId}`,
        {
          headers: {
            Authorization: `Bearer ${utoken}`,
          },
        }
      );
      if (data.success) {
        toast.success(data.message);
        fetchAllPosts();
        fetchPostsofLoginUser();
        return true;
      }
    } catch (error) {
      console.log(error);
      toast.error('Failed to delete comment');
    }
    return false;
  };

  const createPost = async (text, images) => {
    const formData = new FormData();
    formData.append('text', text);

    // Handle multiple images
    if (Array.isArray(images) && images.length > 0) {
      images.forEach((image) => {
        formData.append('images', image);
      });
    } else if (images) {
      formData.append('images', images);
    }

    try {
      const { data } = await axios.post(
        `${backendUrl}/api/posts/create`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${utoken}`,
          },
        }
      );

      if (data.success) {
        toast.success(data.message);
        fetchAllPosts();
        navigate('/posts');
      }
    } catch (error) {
      console.log('ERROR FULL:', JSON.stringify(error, null, 2));
      console.log('ERROR MESSAGE:', error.message);
      console.log(error);
    }
  };

  const navigateToUserProfile = (userId) => {
    navigate(`/profile/${userId}`);
  };

  const deletePost = async (id) => {
    try {
      const { data } = await axios.delete(
        `${backendUrl}/api/posts/post/${id}/delete`,
        {
          headers: {
            Authorization: `Bearer ${utoken}`,
          },
        }
      );
      if (data.success) {
        toast.success(data.message);
        fetchPostsofLoginUser();
        fetchAllPosts();
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (!token) return;

    let isMounted = true;

    const loadPosts = async () => {
      await fetchAllPosts();
      if (!isMounted) return;
      await fetchPostsofLoginUser();
    };

    void loadPosts();

    return () => {
      isMounted = false;
    };
  }, [token, fetchAllPosts, fetchPostsofLoginUser]);

  const values = {
    fetchAllPosts,
    fetchPostsofLoginUser,
    likePosts,
    postsComments,
    deleteComment,
    createPost,
    deletePost,
    navigateToUserProfile,
    Allposts,
    userPosts,
    setUserPosts,
  };

  return <PostContext.Provider value={values}>{children}</PostContext.Provider>;
};

export default PostContextProvider;
export { PostContext };
