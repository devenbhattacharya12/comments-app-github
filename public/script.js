// Enhanced script.js with media upload, replies, and tagging features
document.addEventListener('DOMContentLoaded', () => {
  checkLoginStatus();
  loadComments();
  setupFileUpload();
  setupReplyFileUpload();
  setInterval(checkNewComments, 10000); // Check for new comments every 10 seconds
  setInterval(checkNotifications, 30000); // Check notifications every 30 seconds
});

let selectedFile = null;
let replySelectedFile = null;

// Check Login Status
function checkLoginStatus() {
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');
  
  if (token && username) {
    document.getElementById('authSection').classList.add('d-none');
    document.getElementById('navSection').classList.remove('d-none');
    document.getElementById('commentSection').classList.remove('d-none');
    document.getElementById('welcomeMessage').textContent = `Welcome, @${username}!`;
    checkNotifications(); // Load notifications on login
  }
}

// Handle User Registration
document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('registerUsername').value.trim();
  const password = document.getElementById('registerPassword').value.trim();

  const response = await fetch('/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (response.ok) {
    alert('Registration successful! You can now log in.');
    document.getElementById('registerForm').reset();
  } else {
    const data = await response.json();
    alert(data.error || 'Error: Username might already exist.');
  }
});

// Handle User Login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value.trim();

  const response = await fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();
  if (response.ok) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('username', username);
    localStorage.setItem('lastChecked', new Date().toISOString());
    checkLoginStatus();
  } else {
    alert(data.error || 'Login failed.');
  }
});

// Logout User
document.getElementById('logoutButton').addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  localStorage.removeItem('lastChecked');
  window.location.reload();
});

// Setup File Upload for Main Comment Form
function setupFileUpload() {
  const fileUploadArea = document.getElementById('fileUploadArea');
  const mediaInput = document.getElementById('mediaInput');
  const previewContainer = document.getElementById('previewContainer');

  // Click to upload
  fileUploadArea.addEventListener('click', () => {
    mediaInput.click();
  });

  // Drag and drop
  fileUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileUploadArea.classList.add('dragover');
  });

  fileUploadArea.addEventListener('dragleave', () => {
    fileUploadArea.classList.remove('dragover');
  });

  fileUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    fileUploadArea.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelection(files[0], previewContainer);
    }
  });

  // File input change
  mediaInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileSelection(e.target.files[0], previewContainer);
    }
  });
}

// Setup File Upload for Reply Form
function setupReplyFileUpload() {
  const replyFileUploadArea = document.getElementById('replyFileUploadArea');
  const replyMediaInput = document.getElementById('replyMediaInput');
  const replyPreviewContainer = document.getElementById('replyPreviewContainer');

  // Click to upload
  replyFileUploadArea.addEventListener('click', () => {
    replyMediaInput.click();
  });

  // Drag and drop
  replyFileUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    replyFileUploadArea.classList.add('dragover');
  });

  replyFileUploadArea.addEventListener('dragleave', () => {
    replyFileUploadArea.classList.remove('dragover');
  });

  replyFileUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    replyFileUploadArea.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleReplyFileSelection(files[0], replyPreviewContainer);
    }
  });

  // File input change
  replyMediaInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleReplyFileSelection(e.target.files[0], replyPreviewContainer);
    }
  });
}

// Handle file selection for main comment
function handleFileSelection(file, previewContainer) {
  if (!file.type.startsWith('image/')) {
    alert('Please select an image file.');
    return;
  }

  if (file.size > 10 * 1024 * 1024) { // 10MB limit
    alert('File size must be less than 10MB.');
    return;
  }

  selectedFile = file;
  showPreview(file, previewContainer, () => {
    selectedFile = null;
    document.getElementById('mediaInput').value = '';
  });
}

// Handle file selection for reply
function handleReplyFileSelection(file, replyPreviewContainer) {
  if (!file.type.startsWith('image/')) {
    alert('Please select an image file.');
    return;
  }

  if (file.size > 10 * 1024 * 1024) { // 10MB limit
    alert('File size must be less than 10MB.');
    return;
  }

  replySelectedFile = file;
  showPreview(file, replyPreviewContainer, () => {
    replySelectedFile = null;
    document.getElementById('replyMediaInput').value = '';
  });
}

// Show file preview
function showPreview(file, container, removeCallback) {
  const reader = new FileReader();
  reader.onload = (e) => {
    container.innerHTML = `
      <div class="preview-container">
        <img src="${e.target.result}" alt="Preview" class="preview-image">
        <button type="button" class="remove-preview" onclick="removePreview(this, arguments[0])">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
    container.classList.remove('d-none');
    
    // Store the remove callback
    container.querySelector('.remove-preview').removeCallback = removeCallback;
  };
  reader.readAsDataURL(file);
}

// Remove preview
function removePreview(button, event) {
  if (event) event.preventDefault();
  const container = button.closest('#previewContainer, #replyPreviewContainer');
  container.classList.add('d-none');
  container.innerHTML = '';
  
  if (button.removeCallback) {
    button.removeCallback();
  }
}

// Format comment text with tagged users
function formatCommentText(text) {
  return text.replace(/@(\w+)/g, '<a href="#" class="tagged-user" onclick="showUserProfile(\'$1\')">@$1</a>');
}

// Show user profile (placeholder function)
function showUserProfile(username) {
  alert(`Profile for @${username} (feature coming soon!)`);
}

// Load Comments with Replies
async function loadComments() {
  try {
    const response = await fetch('/comments');
    const comments = await response.json();
    const commentsList = document.getElementById('commentsList');
    commentsList.innerHTML = '';

    if (comments.length === 0) {
      commentsList.innerHTML = '<li class="list-group-item text-muted text-center">No thoughts yet... be the first to share!</li>';
      return;
    }

    comments.forEach(comment => {
      const li = createCommentElement(comment);
      commentsList.appendChild(li);
    });
  } catch (error) {
    console.error('Error loading comments:', error);
    document.getElementById('commentsList').innerHTML = '<li class="list-group-item text-danger">Error loading comments. Please refresh the page.</li>';
  }
}

// Create comment element
function createCommentElement(comment) {
  const li = document.createElement('li');
  li.classList.add('list-group-item');
  
  // Main comment content
  const commentContent = document.createElement('div');
  commentContent.innerHTML = `
    <div class="comment-text">
      <strong class="comment-name">@${comment.username}</strong>: ${formatCommentText(comment.comment)}
    </div>
  `;

  // Add media if present
  if (comment.mediaUrl) {
    const mediaContainer = document.createElement('div');
    mediaContainer.className = 'media-container';
    mediaContainer.innerHTML = `<img src="${comment.mediaUrl}" alt="Shared media" loading="lazy">`;
    commentContent.appendChild(mediaContainer);
  }

  // Button container
  const buttonContainer = document.createElement('div');
  buttonContainer.classList.add('d-flex', 'gap-2', 'mt-2', 'align-items-center', 'flex-wrap');
  
  // Like button
  const likeButton = document.createElement('button');
  likeButton.className = 'btn btn-sm btn-outline-success';
  likeButton.innerHTML = `<i class="fas fa-thumbs-up me-1"></i>Like (<span id="likes-${comment._id}">${comment.likes || 0}</span>)`;
  likeButton.onclick = () => likeComment(comment._id);
  
  // Dislike button
  const dislikeButton = document.createElement('button');
  dislikeButton.className = 'btn btn-sm btn-outline-danger';
  dislikeButton.innerHTML = `<i class="fas fa-thumbs-down me-1"></i>Dislike (<span id="dislikes-${comment._id}">${comment.dislikes || 0}</span>)`;
  dislikeButton.onclick = () => dislikeComment(comment._id);
  
  // Reply button
  const replyButton = document.createElement('button');
  replyButton.className = 'btn btn-sm btn-outline-primary';
  replyButton.innerHTML = `<i class="fas fa-reply me-1"></i>Reply`;
  replyButton.onclick = () => showReplyForm(comment._id, comment.username);

  // Timestamp
  const timestamp = document.createElement('small');
  timestamp.className = 'text-muted ms-auto';
  timestamp.textContent = new Date(comment.timestamp).toLocaleString();
  
  buttonContainer.appendChild(likeButton);
  buttonContainer.appendChild(dislikeButton);
  buttonContainer.appendChild(replyButton);
  buttonContainer.appendChild(timestamp);
  
  li.appendChild(commentContent);
  li.appendChild(buttonContainer);

  // Add replies if they exist
  if (comment.replies && comment.replies.length > 0) {
    const repliesSection = document.createElement('div');
    repliesSection.className = 'reply-section';
    repliesSection.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-2">
        <small class="text-muted"><i class="fas fa-reply me-1"></i>${comment.replies.length} ${comment.replies.length === 1 ? 'reply' : 'replies'}</small>
        <span class="collapse-replies" onclick="toggleReplies('${comment._id}')">
          <i class="fas fa-chevron-down" id="chevron-${comment._id}"></i> Hide replies
        </span>
      </div>
      <div id="replies-${comment._id}">
        ${comment.replies.map(reply => createReplyHTML(reply)).join('')}
      </div>
    `;
    li.appendChild(repliesSection);
  }

  return li;
}

// Create reply HTML
function createReplyHTML(reply) {
  const mediaHTML = reply.mediaUrl ? 
    `<div class="media-container"><img src="${reply.mediaUrl}" alt="Reply media" loading="lazy"></div>` : '';

  return `
    <div class="reply-item">
      <div class="comment-text">
        <strong class="comment-name">@${reply.username}</strong>: ${formatCommentText(reply.comment)}
      </div>
      ${mediaHTML}
      <div class="d-flex gap-2 mt-2 align-items-center">
        <button class="btn btn-sm btn-outline-success" onclick="likeComment('${reply._id}')">
          <i class="fas fa-thumbs-up me-1"></i>Like (<span id="likes-${reply._id}">${reply.likes || 0}</span>)
        </button>
        <button class="btn btn-sm btn-outline-danger" onclick="dislikeComment('${reply._id}')">
          <i class="fas fa-thumbs-down me-1"></i>Dislike (<span id="dislikes-${reply._id}">${reply.dislikes || 0}</span>)
        </button>
        <small class="text-muted ms-auto">${new Date(reply.timestamp).toLocaleString()}</small>
      </div>
    </div>
  `;
}

// Toggle replies visibility
function toggleReplies(commentId) {
  const repliesDiv = document.getElementById(`replies-${commentId}`);
  const chevron = document.getElementById(`chevron-${commentId}`);
  const collapseButton = chevron.parentElement;
  
  if (repliesDiv.style.display === 'none') {
    repliesDiv.style.display = 'block';
    chevron.className = 'fas fa-chevron-down';
    collapseButton.innerHTML = '<i class="fas fa-chevron-down" id="chevron-' + commentId + '"></i> Hide replies';
  } else {
    repliesDiv.style.display = 'none';
    chevron.className = 'fas fa-chevron-right';
    collapseButton.innerHTML = '<i class="fas fa-chevron-right" id="chevron-' + commentId + '"></i> Show replies';
  }
}

// Show reply form
function showReplyForm(parentCommentId, parentUsername) {
  const replySection = document.getElementById('replySection');
  const replyText = document.getElementById('replyText');
  const parentCommentIdInput = document.getElementById('parentCommentId');
  
  replySection.classList.remove('d-none');
  replyText.placeholder = `Reply to @${parentUsername}... (Use @username to tag someone)`;
  parentCommentIdInput.value = parentCommentId;
  
  // Scroll to reply form
  replySection.scrollIntoView({ behavior: 'smooth', block: 'center' });
  replyText.focus();
}

// Hide reply form
document.getElementById('cancelReply').addEventListener('click', () => {
  document.getElementById('replySection').classList.add('d-none');
  document.getElementById('replyForm').reset();
  document.getElementById('replyPreviewContainer').classList.add('d-none');
  document.getElementById('replyPreviewContainer').innerHTML = '';
  replySelectedFile = null;
});

// Post Comment
document.getElementById('commentForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const token = localStorage.getItem('token');
  const comment = document.getElementById('comment').value.trim();

  if (!token) {
    alert('You must be logged in to comment.');
    return;
  }

  if (!comment) {
    alert('Comment cannot be empty.');
    return;
  }

  try {
    const formData = new FormData();
    formData.append('comment', comment);
    
    if (selectedFile) {
      formData.append('media', selectedFile);
    }

    const response = await fetch('/comments', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`
      },
      body: formData,
    });

    if (response.ok) {
      document.getElementById('comment').value = '';
      document.getElementById('previewContainer').classList.add('d-none');
      document.getElementById('previewContainer').innerHTML = '';
      document.getElementById('mediaInput').value = '';
      selectedFile = null;
      localStorage.setItem('lastChecked', new Date().toISOString());
      loadComments();
    } else {
      const data = await response.json();
      alert(data.error || 'Error posting comment.');
    }
  } catch (error) {
    console.error('Error posting comment:', error);
    alert('Network error. Please try again.');
  }
});

// Post Reply
document.getElementById('replyForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const token = localStorage.getItem('token');
  const replyText = document.getElementById('replyText').value.trim();
  const parentCommentId = document.getElementById('parentCommentId').value;

  if (!token) {
    alert('You must be logged in to reply.');
    return;
  }

  if (!replyText) {
    alert('Reply cannot be empty.');
    return;
  }

  try {
    const formData = new FormData();
    formData.append('comment', replyText);
    formData.append('parentCommentId', parentCommentId);
    
    if (replySelectedFile) {
      formData.append('media', replySelectedFile);
    }

    const response = await fetch('/comments', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`
      },
      body: formData,
    });

    if (response.ok) {
      document.getElementById('replySection').classList.add('d-none');
      document.getElementById('replyForm').reset();
      document.getElementById('replyPreviewContainer').classList.add('d-none');
      document.getElementById('replyPreviewContainer').innerHTML = '';
      replySelectedFile = null;
      loadComments();
    } else {
      const data = await response.json();
      alert(data.error || 'Error posting reply.');
    }
  } catch (error) {
    console.error('Error posting reply:', error);
    alert('Network error. Please try again.');
  }
});

// Like Comment
async function likeComment(commentId) {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('You must be logged in to like a comment.');
    return;
  }

  try {
    const response = await fetch('/like-comment', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ commentId }),
    });

    const data = await response.json();
    
    if (response.ok) {
      document.getElementById(`likes-${commentId}`).innerText = data.likes;
      document.getElementById(`dislikes-${commentId}`).innerText = data.dislikes;
    } else {
      if (data.error) {
        alert(data.error);
      } else {
        alert('Error liking comment.');
      }
    }
  } catch (error) {
    console.error('Error liking comment:', error);
    alert('Network error. Please try again.');
  }
}

// Dislike Comment
async function dislikeComment(commentId) {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('You must be logged in to dislike a comment.');
    return;
  }

  try {
    const response = await fetch('/dislike-comment', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ commentId }),
    });

    const data = await response.json();
    
    if (response.ok) {
      document.getElementById(`likes-${commentId}`).innerText = data.likes;
      document.getElementById(`dislikes-${commentId}`).innerText = data.dislikes;
    } else {
      if (data.error) {
        alert(data.error);
      } else {
        alert('Error disliking comment.');
      }
    }
  } catch (error) {
    console.error('Error disliking comment:', error);
    alert('Network error. Please try again.');
  }
}

// Notifications functionality
document.getElementById('notificationsToggle').addEventListener('click', () => {
  const panel = document.getElementById('notificationsPanel');
  if (panel.classList.contains('d-none')) {
    panel.classList.remove('d-none');
    loadNotifications();
  } else {
    panel.classList.add('d-none');
  }
});

// Load notifications
async function loadNotifications() {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const response = await fetch('/notifications', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const notifications = await response.json();
      displayNotifications(notifications);
    }
  } catch (error) {
    console.error('Error loading notifications:', error);
  }
}

// Display notifications
function displayNotifications(notifications) {
  const notificationsList = document.getElementById('notificationsList');
  
  if (notifications.length === 0) {
    notificationsList.innerHTML = '<div class="p-3 text-center text-muted">No notifications</div>';
    return;
  }

  notificationsList.innerHTML = notifications.map(notification => `
    <div class="notification-item ${!notification.read ? 'unread' : ''}" data-id="${notification._id}">
      <div class="d-flex justify-content-between">
        <div>
          <strong>${notification.message}</strong>
          <div class="notification-time">${new Date(notification.timestamp).toLocaleString()}</div>
        </div>
        ${!notification.read ? '<button class="btn btn-sm btn-outline-primary" onclick="markAsRead(\'' + notification._id + '\')">Mark Read</button>' : ''}
      </div>
    </div>
  `).join('');
}

// Mark notification as read
async function markAsRead(notificationId) {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const response = await fetch(`/notifications/${notificationId}/read`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      loadNotifications();
      checkNotifications();
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}

// Mark all notifications as read
document.getElementById('markAllRead').addEventListener('click', async () => {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const notifications = await fetch('/notifications', {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json());

    // Mark each unread notification as read
    const unreadNotifications = notifications.filter(n => !n.read);
    for (const notification of unreadNotifications) {
      await markAsRead(notification._id);
    }
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
  }
});

// Check for new notifications
async function checkNotifications() {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const response = await fetch('/notifications/unread-count', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const data = await response.json();
      const badge = document.getElementById('notificationCount');
      
      if (data.count > 0) {
        badge.textContent = data.count;
        badge.classList.remove('d-none');
      } else {
        badge.classList.add('d-none');
      }
    }
  } catch (error) {
    console.error('Error checking notifications:', error);
  }
}

// Check for new comments since the last time the user posted
async function checkNewComments() {
  const username = localStorage.getItem("username");
  const token = localStorage.getItem("token");
  
  if (!username || !token) return;

  try {
    const response = await fetch(`/new-comments?username=${username}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) return;
    
    const data = await response.json();
    const notificationBadge = document.getElementById('notificationBadge');
    
    if (data.count > 0) {
      notificationBadge.innerHTML = `<i class="fas fa-bell me-2"></i>${data.count} new comments since your last post!`;
      notificationBadge.classList.remove('d-none');
    } else {
      notificationBadge.classList.add('d-none');
    }
  } catch (error) {
    console.error("Error checking new comments:", error);
  }
}

// Make functions globally accessible
window.likeComment = likeComment;
window.dislikeComment = dislikeComment;
window.showUserProfile = showUserProfile;
window.toggleReplies = toggleReplies;
window.removePreview = removePreview;
window.markAsRead = markAsRead;