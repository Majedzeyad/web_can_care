import React, { useState, useEffect } from "react";
import "./style/Community.css";
import { subscribeToWebPosts, createWebPost } from '../services/firestoreService';
import { subscribeToAuthState } from '../services/authService';

/**
 * Community page component for viewing and managing community posts.
 * Allows users to view, create, like, and comment on posts about health tips,
 * diet, exercise, and mental health. All data is synchronized with Firestore in real-time.
 * @returns {JSX.Element} Community feed interface
 */
const Community = () => {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ type: "", post: null });
  const [posts, setPosts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // Subscribe to Firebase posts collection
  useEffect(() => {
    const unsubscribePosts = subscribeToWebPosts((postsData) => {
      console.log('Posts received:', postsData?.length || 0);
      setPosts(postsData || []);
      setLoading(false);
    });

    // Subscribe to auth state for current user
    const unsubscribeAuth = subscribeToAuthState((user) => {
      setCurrentUser(user || { id: 'guest', name: 'Guest', role: 'guest' });
    });

    return () => {
      unsubscribePosts();
      unsubscribeAuth();
    };
  }, []);

  /**
   * Filters posts based on search query (matches title or content).
   * @type {Array}
   */
  const filteredPosts = (posts || []).filter(
    p => {
      if (!p) return false;
      const searchLower = search.toLowerCase();
      return (p.title || '').toLowerCase().includes(searchLower) ||
             (p.content || '').toLowerCase().includes(searchLower) ||
             (p.category || '').toLowerCase().includes(searchLower);
    }
  );

  /**
   * Opens a modal dialog for post operations (add or view).
   * @param {string} type - Modal type: 'add' or 'view'
   * @param {Object|null} post - Post data (null for add operation)
   */
  const openCommunityPostModal = (type, post = null) => setModal({ type, post });

  /**
   * Adds a new community post - saves to Firebase.
   * @param {Object} newPost - Post data.
   */
  const handleAddPost = async (newPost) => {
    try {
      await createWebPost({
        title: newPost.title,
        content: newPost.content,
        category: newPost.category || 'General',
        image: newPost.image || '',
        authorName: currentUser?.name || 'Chief',
      });
      setModal({ type: "", post: null });
    } catch (error) {
      console.error('Error creating post:', error);
      alert(`Error creating post: ${error.message}`);
    }
  };

  /**
   * Formats a date/timestamp to a readable string.
   */
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    if (timestamp.toDate) return timestamp.toDate().toLocaleDateString();
    if (timestamp instanceof Date) return timestamp.toLocaleDateString();
    return timestamp.toString();
  };

  /**
   * Likes a post - saves to Firebase.
   * @param {string} id - Post ID.
   */
  const handleLike = async (id) => {
    try {
      const { updateWebPost } = require('../../services/firestoreService');
      const post = posts.find(p => p.id === id);
      if (post) {
        await updateWebPost(id, {
          likes: (post.likes || 0) + 1
        });
      }
    } catch (error) {
      console.error('Error liking post:', error);
      alert(`Error liking post: ${error.message}`);
    }
  };

  /**
   * Adds a comment to a post - saves to Firebase.
   * @param {string} postId - Post ID.
   * @param {string} text - Comment text.
   */
  const handleAddComment = async (postId, text) => {
    try {
      const { updateWebPost } = require('../services/firestoreService');
      const post = posts.find(p => p.id === postId);
      if (post) {
        const newComment = {
          id: Date.now().toString(),
          text,
          authorId: currentUser?.id || 'guest',
          authorName: currentUser?.name || 'Guest',
          authorRole: currentUser?.role || 'guest',
          timestamp: new Date().toISOString()
        };
        
        const updatedComments = [...(post.comments || []), newComment];
        await updateWebPost(postId, {
          comments: updatedComments
        });
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert(`Error adding comment: ${error.message}`);
    }
  };

  /**
   * Deletes a comment from a post - saves to Firebase.
   * @param {string} postId - Post ID containing the comment
   * @param {string} commentId - Comment ID to delete
   */
  const handleDeleteComment = async (postId, commentId) => {
    try {
      const { updateWebPost } = require('../services/firestoreService');
      const post = posts.find(p => p.id === postId);
      if (post) {
        const updatedComments = (post.comments || []).filter(c => c.id !== commentId);
        await updateWebPost(postId, {
          comments: updatedComments
        });
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert(`Error deleting comment: ${error.message}`);
    }
  };

  return (
    <div className="Community-page">
      <div className="Community-header">
        <div>
          <h1>Community Updates</h1>
          <p>Stay updated with the latest tips and announcements.</p>
        </div>
      </div>

      <div className="Community-actions">
        <input
          className="Community-search"
          type="text"
          placeholder="Search posts..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button onClick={() => openCommunityPostModal("add")}>Add Post</button>
      </div>

      {loading ? (
        <p className="empty-state">Loading posts...</p>
      ) : filteredPosts.length === 0 ? (
        <p className="empty-state">No posts found.</p>
      ) : (
        <div className="Community-feed">
          {filteredPosts.map(post => (
            <div key={post.id} className="Post-card">
              {post.image && <img src={post.image} alt={post.title || 'Post'} />}
              <div className="Post-info">
                <span className="Post-category">{post.category || 'General'}</span>
                <h3>{post.title || 'Untitled'}</h3>
                <p>{post.content || ''}</p>
              </div>

              <div className="Post-actions">
                <span className="Post-date">{formatDate(post.createdAt)}</span>
                <div className="Post-buttons">
                  <button
                    className="like-btn"
                    onClick={() => handleLike(post.id)}
                  >
                    👍 {post.likes || 0} | 💬 {(post.comments || []).length}
                  </button>
                  <button
                    className="view-btn"
                    onClick={() => openCommunityPostModal("view", post)}
                  >
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal.type === "add" && (
        <PostModal
          onSave={handleAddPost}
          onClose={() => openCommunityPostModal("", null)}
        />
      )}

      {modal.type === "view" && modal.post && (
        <ViewPostModal
          // Find the latest version of the post from posts array
          post={posts.find(p => p && p.id === modal.post?.id) || modal.post}
          currentUser={currentUser}
          onClose={() => openCommunityPostModal("", null)}
          onAddComment={handleAddComment}
          onDeleteComment={handleDeleteComment}
        />
      )}
    </div>
  );
};

/* ------------------ Post Modal ------------------ */
/**
 * Modal component for creating new community posts.
 * Allows users to add posts with title, content, category, and optional image.
 * @param {Object} props - Component props
 * @param {Function} props.onSave - Callback when post is saved
 * @param {Function} props.onClose - Callback to close the modal
 * @returns {JSX.Element} Post creation form modal
 */
const PostModal = ({ onSave, onClose }) => {
  const [form, setForm] = useState({
    title: "",
    content: "",
    category: "Diet",
    image: null
  });

  /**
   * Handles text input field changes.
   * @param {Event} e - Input change event
   */
  const handleCommunityPostFormChange = e =>
    setForm({ ...form, [e.target.name]: e.target.value });

  /**
   * Handles image file selection and creates a preview URL.
   * @param {Event} e - File input change event
   */
  const handleCommunityPostImageChange = e =>
    setForm({ ...form, image: URL.createObjectURL(e.target.files[0]) });

  /**
   * Saves the post with generated ID and metadata.
   */
  const saveCommunityPost = () => {
    if (!form.title.trim() || !form.content.trim()) {
      return alert('Title and content are required.');
    }
    onSave({
      ...form,
      likes: 0,
      comments: []
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Add Post</h2>
        <input name="title" onChange={handleCommunityPostFormChange} placeholder="Title" />
        <textarea name="content" onChange={handleCommunityPostFormChange} placeholder="Content" />
        <select name="category" onChange={handleCommunityPostFormChange}>
          <option>Diet</option>
          <option>Exercise</option>
          <option>Mental Health</option>
          <option>Tips</option>
        </select>

        <label className="Attachment-wrapper">
          <input type="file" hidden accept="image/*" onChange={handleCommunityPostImageChange} />
          <span className="Attachment-btn">📎 Attach image</span>
        </label>

        <div className="modal-actions">
          <button onClick={saveCommunityPost}>Add</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

/* ------------------ View Post Modal ------------------ */
/**
 * Modal component for viewing a post with its comments.
 * Allows users to read post content, view existing comments, and add new comments.
 * @param {Object} props - Component props
 * @param {Object} props.post - Post data to display
 * @param {Function} props.onClose - Callback to close the modal
 * @param {Function} props.onAddComment - Callback when a new comment is added
 * @param {Function} props.onDeleteComment - Callback when a comment is deleted
 * @returns {JSX.Element} Post view modal with comments
 */
const ViewPostModal = ({ post, currentUser, onClose, onAddComment, onDeleteComment }) => {
  const [comment, setComment] = useState("");

  if (!post) {
    return (
      <div className="modal-overlay">
        <div className="modal">
          <p>Post not found</p>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  /**
   * Submits a new comment if the comment text is not empty.
   */
  const submitCommunityComment = () => {
    if (!comment.trim() || !post?.id) return;
    onAddComment(post.id, comment);
    setComment("");
  };

  return (
    <div className="modal-overlay">
      <div className="modal view-post-modal">
        <h2>{post.title || 'Untitled'}</h2>
        <span className="Post-category">{post.category || 'General'}</span>
        <p>{post.content || ''}</p>

        <div className="comments-section">
          <h4>Comments</h4>
          {(!post.comments || post.comments.length === 0) && <p className="empty-state">No comments yet.</p>}

          {(post.comments || []).map(c => (
            <div key={c.id} className="comment">
              <div className="comment-header">
                <strong>{c.authorName}</strong>
                <span className={`role ${c.authorRole}`}>{c.authorRole}</span>
              </div>
              <p>{c.text}</p>
              <div className="comment-footer">
                <small>{c.timestamp ? new Date(c.timestamp).toLocaleString() : 'N/A'}</small>
                {currentUser && c.authorId === currentUser.id && (
                  <button className="delete-comment" onClick={() => onDeleteComment(post.id, c.id)}>
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}

          <textarea
            placeholder="Write a comment..."
            value={comment}
            onChange={e => setComment(e.target.value)}
          />
          <button onClick={submitCommunityComment}>Post Comment</button>
        </div>

        <div className="modal-actions">
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};
export default Community;
