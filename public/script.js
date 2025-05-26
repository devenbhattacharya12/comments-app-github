// Enhanced script.js - Step 2: Adding Replies and Tagging
console.log('Enhanced script loaded - Step 2');

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded');
  checkLoginStatus();
  loadComments();
  
  // Check for new comments every 10 seconds
  setInterval(() => {
    checkNewComments();
  }, 10000);
  
  // Check for notifications every 30 seconds
  setInterval(() => {
    checkNotifications();
  }, 30000);
  
  // Add notification toggle event listener
  const notificationsToggle = document.getElementById('notificationsToggle');
  if (notificationsToggle) {
    notificationsToggle.addEventListener('click', () => {
      const panel = document.getElementById('notificationsPanel');
      if (panel.classList.contains('d-none')) {
        panel.classList.remove('d-none');
        loadNotifications();
      } else {
        panel.classList.add('d-none');
      }
    });
  }
  
  // Add mark all read event listener
  const markAllRead = document.getElementById('markAllRead');
  if (markAllRead) {
    markAllRead.addEventListener('click', markAllNotificationsAsRead);
  }
});

// Check Login Status
function checkLoginStatus() {
  console.log('Checking login status...');
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');
  
  console.log('Token:', token ? 'exists' : 'missing');
  console.log('Username:', username);
  
  if (token && username) {
    console.log('User is logged in, updating UI...');
    document.getElementById('authSection').classList.add('d-none');
    document.getElementById('userMenuSection').classList.remove('d-none');
    document.getElementById('commentSection').classList.remove('d-none');
    
    // Set welcome message
    const welcomeMessage = document.getElementById('welcomeMessage');
    if (welcomeMessage) {
      welcomeMessage.textContent = `Welcome, @${username}!`;
    }
    
    // Check for notifications on login
    checkNotifications();
    
    console.log('UI updated for logged in user');
  } else {
    console.log('User not logged in');
  }
}

// Handle User Registration
document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  console.log('Register form submitted');
  
  const username = document.getElementById('registerUsername').value.trim();
  const password = document.getElementById('registerPassword').value.trim();

  console.log('Attempting to register user:', username);

  try {
    const response = await fetch('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    console.log('Register response status:', response.status);

    if (response.ok) {
      alert('Registration successful! You can now log in.');
      document.getElementById('registerForm').reset();
    } else {
      const data = await response.json();
      console.error('Registration error:', data);
      alert(data.error || 'Error: Username might already exist.');
    }
  } catch (error) {
    console.error('Registration network error:', error);
    alert('Network error during registration');
  }
});

// Handle User Login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  console.log('Login form submitted');
  
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value.trim();

  console.log('Attempting to login user:', username);

  try {
    const response = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    console.log('Login response status:', response.status);

    const data = await response.json();
    console.log('Login response data:', data);

    if (response.ok) {
      console.log('Login successful, storing token...');
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', username);
      localStorage.setItem('lastChecked', new Date().toISOString());
      
      console.log('Token stored, checking login status...');
      checkLoginStatus();
      console.log('Loading comments...');
      loadComments();
    } else {
      console.error('Login failed:', data);
      alert(data.error || 'Login failed.');
    }
  } catch (error) {
    console.error('Login network error:', error);
    alert('Network error during login');
  }
});

// Logout User
document.getElementById('logoutButton').addEventListener('click', () => {
  console.log('Logging out...');
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  localStorage.removeItem('lastChecked');
  window.location.reload();
});

// Format comment text with tagged users
function formatCommentText(text) {
  return text.replace(/@(\w+)/g, '<span style="color: #1DA1F2; font-weight: bold;">@$1</span>');
}

// Load Comments with Replies
async function loadComments() {
  console.log('Loading comments...');
  try {
    const response = await fetch('/comments');
    console.log('Comments response status:', response.status);
    
    const comments = await response.json();
    console.log('Received comments:', comments.length);
    
    const commentsList = document.getElementById('commentsList');
    if (!commentsList) {
      console.error('Comments list element not found!');
      return;
    }
    
    commentsList.innerHTML = '';

    if (comments.length === 0) {
      commentsList.innerHTML = '<li class="list-group-item text-muted text-center">No thoughts yet... be the first to share!</li>';
      return;
    }

    comments.forEach(comment => {
      console.log('Processing comment:', comment._id);
      const li = createCommentElement(comment);
      commentsList.appendChild(li);
    });
    
    console.log('Comments loaded successfully');
  } catch (error) {
    console.error('Error loading comments:', error);
    const commentsList = document.getElementById('commentsList');
    if (commentsList) {
      commentsList.innerHTML = '<li class="list-group-item text-danger">Error loading comments. Please refresh the page.</li>';
    }
  }
}

// Create comment element with reply support
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

  // Button container
  const buttonContainer = document.createElement('div');
  buttonContainer.classList.add('d-flex', 'gap-2', 'mt-2', 'align-items-center', 'flex-wrap');
  
  // Like button
  const likeButton = document.createElement('button');
  likeButton.className = 'btn btn-sm btn-outline-success';
  likeButton.innerHTML = `👍 Like (<span id="likes-${comment._id}">${comment.likes || 0}</span>)`;
  likeButton.onclick = () => likeComment(comment._id);
  
  // Dislike button
  const dislikeButton = document.createElement('button');
  dislikeButton.className = 'btn btn-sm btn-outline-danger';
  dislikeButton.innerHTML = `👎 Dislike (<span id="dislikes-${comment._id}">${comment.dislikes || 0}</span>)`;
  dislikeButton.onclick = () => dislikeComment(comment._id);
  
  // Reply button
  const replyButton = document.createElement('button');
  replyButton.className = 'btn btn-sm btn-outline-primary';
  replyButton.innerHTML = `💬 Reply`;
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
    repliesSection.className = 'replies-section mt-3 ms-4';
    repliesSection.style.borderLeft = '3px solid #1DA1F2';
    repliesSection.style.paddingLeft = '15px';
    
    const repliesHeader = document.createElement('div');
    repliesHeader.innerHTML = `<small class="text-muted">💬 ${comment.replies.length} ${comment.replies.length === 1 ? 'reply' : 'replies'}</small>`;
    repliesSection.appendChild(repliesHeader);
    
    comment.replies.forEach(reply => {
      const replyDiv = document.createElement('div');
      replyDiv.className = 'reply-item mt-2 p-2';
      replyDiv.style.backgroundColor = '#f8f9fa';
      replyDiv.style.borderRadius = '8px';
      
      replyDiv.innerHTML = `
        <div class="comment-text">
          <strong class="comment-name">@${reply.username}</strong>: ${formatCommentText(reply.comment)}
        </div>
        <div class="d-flex gap-2 mt-1 align-items-center">
          <button class="btn btn-sm btn-outline-success" onclick="likeComment('${reply._id}')">
            👍 (<span id="likes-${reply._id}">${reply.likes || 0}</span>)
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="dislikeComment('${reply._id}')">
            👎 (<span id="dislikes-${reply._id}">${reply.dislikes || 0}</span>)
          </button>
          <small class="text-muted ms-auto">${new Date(reply.timestamp).toLocaleString()}</small>
        </div>
      `;
      
      repliesSection.appendChild(replyDiv);
    });
    
    li.appendChild(repliesSection);
  }

  return li;
}

// Show reply form
function showReplyForm(parentCommentId, parentUsername) {
  console.log('Showing reply form for comment:', parentCommentId);
  
  // Remove any existing reply forms
  const existingReplyForm = document.getElementById('replyForm');
  if (existingReplyForm) {
    existingReplyForm.remove();
  }
  
  // Create new reply form
  const replyForm = document.createElement('div');
  replyForm.id = 'replyForm';
  replyForm.className = 'card shadow-sm p-3 mt-3';
  replyForm.innerHTML = `
    <h6>Reply to @${parentUsername}</h6>
    <form id="replyFormElement">
      <textarea class="form-control mb-2" id="replyText" rows="2" placeholder="Write your reply... (Use @username to tag someone)" required></textarea>
      <div class="d-flex gap-2">
        <button type="submit" class="btn btn-primary btn-sm">💬 Post Reply</button>
        <button type="button" class="btn btn-secondary btn-sm" onclick="hideReplyForm()">Cancel</button>
      </div>
    </form>
  `;
  
  // Insert after the comment section
  const commentSection = document.getElementById('commentSection');
  commentSection.parentNode.insertBefore(replyForm, commentSection.nextSibling);
  
  // Add event listener for the reply form
  document.getElementById('replyFormElement').addEventListener('submit', async (e) => {
    e.preventDefault();
    await postReply(parentCommentId);
  });
  
  // Focus on the reply textarea
  document.getElementById('replyText').focus();
  
  // Scroll to the reply form
  replyForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Hide reply form
function hideReplyForm() {
  const replyForm = document.getElementById('replyForm');
  if (replyForm) {
    replyForm.remove();
  }
}

// Post Reply
async function postReply(parentCommentId) {
  const token = localStorage.getItem('token');
  const replyText = document.getElementById('replyText').value.trim();

  console.log('Posting reply:', { parentCommentId, replyLength: replyText.length });

  if (!token) {
    alert('You must be logged in to reply.');
    return;
  }

  if (!replyText) {
    alert('Reply cannot be empty.');
    return;
  }

  try {
    const response = await fetch('/comments', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        comment: replyText,
        parentCommentId: parentCommentId 
      }),
    });

    console.log('Reply post response status:', response.status);

    if (response.ok) {
      hideReplyForm();
      loadComments(); // Reload to show the new reply
      console.log('Reply posted successfully');
    } else {
      const data = await response.json();
      console.error('Reply post error:', data);
      alert(data.error || 'Error posting reply.');
    }
  } catch (error) {
    console.error('Reply post network error:', error);
    alert('Network error. Please try again.');
  }
}

// Like Comment
async function likeComment(commentId) {
  console.log('Liking comment:', commentId);
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
    console.log('Like response:', data);
    
    if (response.ok) {
      const likesElement = document.getElementById(`likes-${commentId}`);
      const dislikesElement = document.getElementById(`dislikes-${commentId}`);
      if (likesElement) likesElement.innerText = data.likes;
      if (dislikesElement) dislikesElement.innerText = data.dislikes;
    } else {
      console.error('Like error:', data);
      alert(data.error || 'Error liking comment.');
    }
  } catch (error) {
    console.error('Like network error:', error);
    alert('Network error. Please try again.');
  }
}

// Dislike Comment
async function dislikeComment(commentId) {
  console.log('Disliking comment:', commentId);
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
    console.log('Dislike response:', data);
    
    if (response.ok) {
      const likesElement = document.getElementById(`likes-${commentId}`);
      const dislikesElement = document.getElementById(`dislikes-${commentId}`);
      if (likesElement) likesElement.innerText = data.likes;
      if (dislikesElement) dislikesElement.innerText = data.dislikes;
    } else {
      console.error('Dislike error:', data);
      alert(data.error || 'Error disliking comment.');
    }
  } catch (error) {
    console.error('Dislike network error:', error);
    alert('Network error. Please try again.');
  }
}

// Post Comment
const commentForm = document.getElementById('commentForm');
if (commentForm) {
  commentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Comment form submitted');
    
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
      const response = await fetch('/comments', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ comment }),
      });

      console.log('Comment post response status:', response.status);

      if (response.ok) {
        document.getElementById('comment').value = '';
        localStorage.setItem('lastChecked', new Date().toISOString());
        loadComments();
        console.log('Comment posted successfully');
      } else {
        const data = await response.json();
        console.error('Comment post error:', data);
        alert(data.error || 'Error posting comment.');
      }
    } catch (error) {
      console.error('Comment post network error:', error);
      alert('Network error. Please try again.');
    }
  });
}

// Check for notifications
async function checkNotifications() {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const response = await fetch('/notifications/unread-count', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Unread notifications:', data.count);
      
      const badge = document.getElementById('notificationCount');
      const currentCount = parseInt(badge.textContent) || 0;
      
      if (data.count > 0) {
        badge.textContent = data.count;
        badge.classList.remove('d-none');
        
        // Show toast notification if count increased
        if (data.count > currentCount) {
          showNotificationToast(`You have ${data.count} new notification${data.count > 1 ? 's' : ''}!`);
        }
      } else {
        badge.classList.add('d-none');
      }
    }
  } catch (error) {
    console.error('Error checking notifications:', error);
  }
}

// Show notification toast
function showNotificationToast(message) {
  const toastContainer = document.getElementById('notificationToast');
  
  const toast = document.createElement('div');
  toast.className = 'alert alert-info alert-dismissible fade show';
  toast.innerHTML = `
    <i class="fas fa-bell me-2"></i>${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  
  toastContainer.appendChild(toast);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    if (toast.parentNode) {
      toast.remove();
    }
  }, 5000);
}

// Toggle notifications panel
document.addEventListener('DOMContentLoaded', () => {
  // ... existing code ...
  
  // Add notification toggle event listener
  const notificationsToggle = document.getElementById('notificationsToggle');
  if (notificationsToggle) {
    notificationsToggle.addEventListener('click', () => {
      const panel = document.getElementById('notificationsPanel');
      if (panel.classList.contains('d-none')) {
        panel.classList.remove('d-none');
        loadNotifications();
      } else {
        panel.classList.add('d-none');
      }
    });
  }
  
  // Add mark all read event listener
  const markAllRead = document.getElementById('markAllRead');
  if (markAllRead) {
    markAllRead.addEventListener('click', markAllNotificationsAsRead);
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
    <div class="notification-item ${!notification.read ? 'unread' : ''}" onclick="markNotificationAsRead('${notification._id}')">
      <div class="d-flex justify-content-between">
        <div>
          <div><i class="fas fa-${notification.type === 'tag' ? 'at' : 'reply'} me-2"></i><strong>${notification.message}</strong></div>
          <div class="notification-time">${new Date(notification.timestamp).toLocaleString()}</div>
        </div>
        ${!notification.read ? '<span class="badge bg-primary">New</span>' : ''}
      </div>
    </div>
  `).join('');
}

// Mark single notification as read
async function markNotificationAsRead(notificationId) {
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
async function markAllNotificationsAsRead() {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const notifications = await fetch('/notifications', {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json());

    // Mark each unread notification as read
    const unreadNotifications = notifications.filter(n => !n.read);
    for (const notification of unreadNotifications) {
      await markNotificationAsRead(notification._id);
    }
    
    // Refresh the display
    loadNotifications();
    checkNotifications();
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
  }
}

// Check for new comments since the user's last post
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
    
    if (notificationBadge && data.count > 0) {
      notificationBadge.innerHTML = `🔔 ${data.count} new comments since your last post!`;
      notificationBadge.classList.remove('d-none');
    } else if (notificationBadge) {
      notificationBadge.classList.add('d-none');
    }
  } catch (error) {
    console.error("Error checking new comments:", error);
  }
}

// Make functions globally accessible
window.likeComment = likeComment;
window.dislikeComment = dislikeComment;
window.hideReplyForm = hideReplyForm;
window.markNotificationAsRead = markNotificationAsRead;
window.markAllNotificationsAsRead = markAllNotificationsAsRead;

console.log('Enhanced script setup complete - Step 2');