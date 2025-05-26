// Social Media Platform Script - Based on your working script + new features
console.log('Social Media Platform loaded - preserving all existing features');

// Social media state
let currentView = 'mainFeed';
let currentNest = null;

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded');
  checkLoginStatus();
  
  // Check for new comments every 10 seconds
  setInterval(() => {
    checkNewComments();
  }, 10000);
  
  // Check for notifications every 30 seconds
  setInterval(() => {
    checkNotifications();
  }, 30000);
  
  // Setup social media navigation with delay
  setTimeout(() => {
    setupSocialMediaNavigation();
  }, 1000);
});

// Setup social media navigation (NEW)
function setupSocialMediaNavigation() {
  // Add mark all read event listener
  const markAllRead = document.getElementById('markAllRead');
  if (markAllRead) {
    console.log('Adding mark all read event listener');
    markAllRead.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      markAllNotificationsAsRead();
    });
  }

  // Logout button
  const logoutButton = document.getElementById('logoutButton');
  if (logoutButton) {
    logoutButton.addEventListener('click', logout);
  }

  // Form submissions - handle both old and new forms
  const registerForm = document.getElementById('registerForm');
  const loginForm = document.getElementById('loginForm');
  const commentForm = document.getElementById('commentForm');

  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
  }
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
  if (commentForm) {
    commentForm.addEventListener('submit', handleCommentSubmit);
  }
}

// ================== AUTHENTICATION (ENHANCED) ==================

// Check Login Status (ENHANCED for social media layout)
function checkLoginStatus() {
  console.log('Checking login status...');
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');
  
  console.log('Token:', token ? 'exists' : 'missing');
  console.log('Username:', username);
  
  if (token && username) {
    console.log('User is logged in, updating UI...');
    
    // Check if we're using the new social media layout or old layout
    const authContainer = document.getElementById('authContainer');
    const mainApp = document.getElementById('mainApp');
    const authSection = document.getElementById('authSection');
    const userMenuSection = document.getElementById('userMenuSection');
    const commentSection = document.getElementById('commentSection');
    
    if (authContainer && mainApp) {
      // NEW social media layout
      authContainer.classList.add('d-none');
      mainApp.classList.remove('d-none');
      
      // Set username in sidebar
      const sidebarUsername = document.getElementById('sidebarUsername');
      if (sidebarUsername) {
        sidebarUsername.textContent = `@${username}`;
      }
      
      // Load initial data
      loadMainFeed();
      loadUserNests();
    } else if (authSection && userMenuSection && commentSection) {
      // OLD layout compatibility
      authSection.classList.add('d-none');
      userMenuSection.classList.remove('d-none');
      commentSection.classList.remove('d-none');
      
      // Set welcome message
      const welcomeMessage = document.getElementById('welcomeMessage');
      if (welcomeMessage) {
        welcomeMessage.textContent = `Welcome, @${username}!`;
      }
      
      // Load comments using old method
      loadComments();
    } else {
      // Fallback: just load comments
      loadComments();
    }
    
    // Check for notifications on login
    checkNotifications();
    
    console.log('UI updated for logged in user');
  } else {
    console.log('User not logged in');
    
    // Show appropriate auth UI
    const authContainer = document.getElementById('authContainer');
    const mainApp = document.getElementById('mainApp');
    
    if (authContainer && mainApp) {
      authContainer.classList.remove('d-none');
      mainApp.classList.add('d-none');
    }
  }
}

// Handle User Registration (ENHANCED)
async function handleRegister(e) {
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
}

// Handle User Login (ENHANCED)
async function handleLogin(e) {
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
    } else {
      console.error('Login failed:', data);
      alert(data.error || 'Login failed.');
    }
  } catch (error) {
    console.error('Login network error:', error);
    alert('Network error during login');
  }
}

// Logout User (ENHANCED)
function logout() {
  console.log('Logging out...');
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  localStorage.removeItem('lastChecked');
  window.location.reload();
}

// ================== SOCIAL MEDIA NAVIGATION (NEW) ==================

// Show Main Feed
function showMainFeed() {
  console.log('Switching to Main Feed');
  currentView = 'mainFeed';
  currentNest = null;
  
  // Update navigation
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  const mainFeedNav = document.getElementById('mainFeedNav');
  if (mainFeedNav) mainFeedNav.classList.add('active');
  
  // Show/hide views
  const mainFeedView = document.getElementById('mainFeedView');
  const nestsView = document.getElementById('nestsView');
  const notificationsPanel = document.getElementById('notificationsPanel');
  
  if (mainFeedView) mainFeedView.classList.remove('d-none');
  if (nestsView) nestsView.classList.add('d-none');
  if (notificationsPanel) notificationsPanel.style.display = 'none';
  
  // Load main feed
  loadMainFeed();
}

// Show Nests
function showNests() {
  console.log('Switching to Nests');
  currentView = 'nests';
  
  // Update navigation
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  const nestsNav = document.getElementById('nestsNav');
  if (nestsNav) nestsNav.classList.add('active');
  
  // Show/hide views
  const mainFeedView = document.getElementById('mainFeedView');
  const nestsView = document.getElementById('nestsView');
  const notificationsPanel = document.getElementById('notificationsPanel');
  
  if (mainFeedView) mainFeedView.classList.add('d-none');
  if (nestsView) nestsView.classList.remove('d-none');
  if (notificationsPanel) notificationsPanel.style.display = 'none';
  
  // Load nests
  loadUserNests();
}

// ================== COMMENTS/POSTS (ALL PRESERVED FROM YOUR SCRIPT) ==================

// Format comment text with tagged users and clickable links (PRESERVED)
function formatCommentText(text) {
  // First, make URLs clickable
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  let formattedText = text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: #1DA1F2; text-decoration: underline;">$1</a>');
  
  // Then, make tagged users styled
  formattedText = formattedText.replace(/@(\w+)/g, '<span style="color: #1DA1F2; font-weight: bold;">@$1</span>');
  
  return formattedText;
}

// Load Comments (PRESERVED - your original function)
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

// Load Main Feed (NEW - same as loadComments but for social media layout)
async function loadMainFeed() {
  console.log('Loading main feed...');
  try {
    const response = await fetch('/comments');
    console.log('Main feed response status:', response.status);
    
    const comments = await response.json();
    console.log('Received main feed comments:', comments.length);
    
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
    
    console.log('Main feed loaded successfully');
  } catch (error) {
    console.error('Error loading main feed:', error);
    const commentsList = document.getElementById('commentsList');
    if (commentsList) {
      commentsList.innerHTML = '<li class="list-group-item text-danger">Error loading comments. Please refresh the page.</li>';
    }
  }
}

// Create comment element (PRESERVED from your script)
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

  // Add replies if they exist (PRESERVED)
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

// Handle Comment Submit (ENHANCED to work with both layouts)
async function handleCommentSubmit(e) {
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
    const postData = { comment };
    
    // If in a nest, add nestId
    if (currentNest) {
      postData.nestId = currentNest;
    }

    const response = await fetch('/comments', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(postData),
    });

    console.log('Comment post response status:', response.status);

    if (response.ok) {
      document.getElementById('comment').value = '';
      localStorage.setItem('lastChecked', new Date().toISOString());
      
      // Reload appropriate view
      if (currentView === 'mainFeed' || !currentView) {
        if (document.getElementById('mainFeedView')) {
          loadMainFeed();
        } else {
          loadComments(); // Fallback to old method
        }
      } else if (currentNest) {
        loadNestFeed(currentNest);
      }
      
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
}

// Show reply form (PRESERVED from your script)
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
  
  // Insert after appropriate section - check for both old and new layouts
  let targetSection = document.getElementById('commentSection'); // Old layout
  if (!targetSection) {
    targetSection = document.getElementById('mainFeedView'); // New layout
  }
  if (!targetSection) {
    targetSection = document.getElementById('currentNestFeed'); // Nest view
  }
  
  if (targetSection) {
    targetSection.parentNode.insertBefore(replyForm, targetSection.nextSibling);
  } else {
    // Fallback: append to body
    document.body.appendChild(replyForm);
  }
  
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

// Hide reply form (PRESERVED)
function hideReplyForm() {
  const replyForm = document.getElementById('replyForm');
  if (replyForm) {
    replyForm.remove();
  }
}

// Post Reply (PRESERVED from your script)
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
    const postData = { 
      comment: replyText,
      parentCommentId: parentCommentId 
    };
    
    // If in a nest, add nestId
    if (currentNest) {
      postData.nestId = currentNest;
    }

    const response = await fetch('/comments', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(postData),
    });

    console.log('Reply post response status:', response.status);

    if (response.ok) {
      hideReplyForm();
      
      // Reload appropriate view
      if (currentView === 'mainFeed' || !currentView) {
        if (document.getElementById('mainFeedView')) {
          loadMainFeed();
        } else {
          loadComments(); // Fallback to old method
        }
      } else if (currentNest) {
        loadNestFeed(currentNest);
      }
      
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

// Like Comment (PRESERVED from your script)
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

// Dislike Comment (PRESERVED from your script)
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

// ================== NOTIFICATIONS (ALL PRESERVED FROM YOUR SCRIPT) ==================

// Check for notifications (PRESERVED)
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
      if (!badge) return; // Badge doesn't exist in old layout
      
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

// Show notification toast (PRESERVED)
function showNotificationToast(message) {
  const toastContainer = document.getElementById('notificationToast');
  if (!toastContainer) return; // Toast container doesn't exist in old layout
  
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

// Toggle notifications panel (PRESERVED from your script)
function toggleNotificationsPanel() {
  console.log('Toggling notifications panel');
  const panel = document.getElementById('notificationsPanel');
  if (!panel) return;
  
  const isHidden = panel.style.display === 'none' || panel.style.display === '';
  console.log('Panel display style:', panel.style.display);
  console.log('Panel is hidden:', isHidden);
  
  if (isHidden) {
    console.log('Opening notifications panel');
    panel.style.display = 'block';
    loadNotifications();
    
    // Update navigation for social media layout
    const navItems = document.querySelectorAll('.nav-item');
    const notificationsNav = document.getElementById('notificationsNav');
    if (navItems.length > 0 && notificationsNav) {
      navItems.forEach(item => item.classList.remove('active'));
      notificationsNav.classList.add('active');
    }
  } else {
    console.log('Closing notifications panel');
    panel.style.display = 'none';
    
    // Restore previous navigation state
    const mainFeedNav = document.getElementById('mainFeedNav');
    const nestsNav = document.getElementById('nestsNav');
    if (currentView === 'mainFeed' && mainFeedNav) {
      mainFeedNav.classList.add('active');
    } else if (currentView === 'nests' && nestsNav) {
      nestsNav.classList.add('active');
    }
  }
}

// Load notifications (PRESERVED)
async function loadNotifications() {
  console.log('Loading notifications...');
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const response = await fetch('/notifications', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const notifications = await response.json();
      console.log('Loaded notifications:', notifications.length);
      displayNotifications(notifications);
    } else {
      console.error('Failed to load notifications:', response.status);
    }
  } catch (error) {
    console.error('Error loading notifications:', error);
  }
}

// Display notifications (PRESERVED)
function displayNotifications(notifications) {
  console.log('Displaying notifications:', notifications);
  const notificationsList = document.getElementById('notificationsList');
  if (!notificationsList) return;
  
  if (notifications.length === 0) {
    notificationsList.innerHTML = '<div class="p-3 text-center text-muted">No notifications</div>';
    return;
  }

  notificationsList.innerHTML = notifications.map(notification => `
    <div class="notification-item ${!notification.read ? 'unread' : ''}" 
         onclick="markNotificationAsRead('${notification._id}')" 
         style="cursor: pointer; padding: 12px; border-bottom: 1px solid #dee2e6; ${!notification.read ? 'background-color: #e3f2fd; border-left: 4px solid #1DA1F2;' : ''}">
      <div class="d-flex justify-content-between align-items-start">
        <div class="flex-grow-1">
          <div>
            <i class="fas fa-${notification.type === 'tag' ? 'at' : 'reply'} me-2"></i>
            <strong>${notification.message}</strong>
          </div>
          <div style="font-size: 0.8rem; color: #6c757d;">${new Date(notification.timestamp).toLocaleString()}</div>
        </div>
        ${!notification.read ? '<span class="badge bg-primary ms-2">New</span>' : ''}
      </div>
    </div>
  `).join('');
}

// Mark single notification as read (PRESERVED)
async function markNotificationAsRead(notificationId) {
  console.log('Marking notification as read:', notificationId);
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const response = await fetch(`/notifications/${notificationId}/read`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      console.log('Notification marked as read successfully');
      loadNotifications();
      checkNotifications();
    } else {
      console.error('Failed to mark notification as read:', response.status);
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}

// Mark all notifications as read (PRESERVED)
async function markAllNotificationsAsRead() {
  console.log('Marking all notifications as read');
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const notifications = await fetch('/notifications', {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json());

    console.log('Found notifications to mark as read:', notifications.length);

    // Mark each unread notification as read
    const unreadNotifications = notifications.filter(n => !n.read);
    console.log('Unread notifications:', unreadNotifications.length);
    
    for (const notification of unreadNotifications) {
      await markNotificationAsRead(notification._id);
    }
    
    // Refresh the display
    setTimeout(() => {
      loadNotifications();
      checkNotifications();
    }, 500);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
  }
}

// Check for new comments since the user's last post (PRESERVED)
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

// ================== NESTS FUNCTIONALITY (NEW) ==================

async function loadUserNests() {
  console.log('Loading user nests...');
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const response = await fetch('/nests', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const nests = await response.json();
      console.log('Loaded nests:', nests.length);
      displayUserNests(nests);
    } else {
      console.error('Failed to load nests:', response.status);
    }
  } catch (error) {
    console.error('Error loading nests:', error);
  }
}

function displayUserNests(nests) {
  const nestsList = document.getElementById('nestsList');
  if (!nestsList) return; // Nests list doesn't exist in old layout
  
  if (nests.length === 0) {
    nestsList.innerHTML = '<div style="color: rgba(255,255,255,0.7); font-size: 12px; text-align: center; padding: 10px;">No nests yet</div>';
    return;
  }

  nestsList.innerHTML = nests.map(nest => `
    <div class="nest-item ${currentNest === nest._id ? 'active' : ''}" onclick="selectNest('${nest._id}', '${nest.name}')">
      <div class="flex-grow-1">
        <div style="font-weight: 500;">${nest.name}</div>
        <div class="nest-members">${nest.members.length} member${nest.members.length !== 1 ? 's' : ''}</div>
      </div>
    </div>
  `).join('');
}

function selectNest(nestId, nestName) {
  console.log('Selecting nest:', nestName);
  currentNest = nestId;
  
  // Update nest items
  document.querySelectorAll('.nest-item').forEach(item => item.classList.remove('active'));
  if (event && event.currentTarget) {
    event.currentTarget.classList.add('active');
  }
  
  // Switch to nests view if not already there
  if (currentView !== 'nests') {
    showNests();
  }
  
  // Load nest feed
  loadNestFeed(nestId, nestName);
}

async function loadNestFeed(nestId, nestName) {
  console.log('Loading nest feed:', nestName);
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const response = await fetch(`/nests/${nestId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Loaded nest data:', data);
      displayNestFeed(data.nest, data.posts);
    } else {
      console.error('Failed to load nest feed:', response.status);
    }
  } catch (error) {
    console.error('Error loading nest feed:', error);
  }
}

function displayNestFeed(nest, posts) {
  const currentNestFeed = document.getElementById('currentNestFeed');
  if (!currentNestFeed) return; // Current nest feed doesn't exist in old layout
  
  currentNestFeed.innerHTML = `
    <div class="card mb-4">
      <div class="card-header">
        <h5 class="mb-0">
          <i class="fas fa-users me-2"></i>${nest.name}
        </h5>
        <small class="text-muted">${nest.description || 'No description'}</small>
        <div class="mt-2">
          <span class="badge bg-primary">${nest.members.length} members</span>
          <span class="badge bg-secondary">${nest.privacy}</span>
        </div>
      </div>
      <div class="card-body">
        <form id="nestCommentForm">
          <textarea class="form-control mb-3" id="nestComment" rows="3" placeholder="Share with ${nest.name}... (Use @username to tag someone)" required></textarea>
          <button type="submit" class="btn btn-primary">
            <i class="fas fa-paper-plane me-2"></i>Post to Nest
          </button>
        </form>
      </div>
    </div>
    
    <div class="card">
      <div class="card-header">
        <h6 class="mb-0">Nest Posts</h6>
      </div>
      <div class="card-body p-0">
        <ul id="nestPostsList" class="list-group list-group-flush"></ul>
      </div>
    </div>
  `;
  
  // Add event listener for nest comment form
  document.getElementById('nestCommentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleNestCommentSubmit(nest._id);
  });
  
  // Display posts
  const nestPostsList = document.getElementById('nestPostsList');
  
  if (posts.length === 0) {
    nestPostsList.innerHTML = '<li class="list-group-item text-muted text-center">No posts in this nest yet... start the conversation!</li>';
    return;
  }

  nestPostsList.innerHTML = '';
  posts.forEach(post => {
    const li = createCommentElement(post);
    nestPostsList.appendChild(li);
  });
}

async function handleNestCommentSubmit(nestId) {
  const token = localStorage.getItem('token');
  const comment = document.getElementById('nestComment').value.trim();

  if (!token) {
    alert('You must be logged in to post.');
    return;
  }

  if (!comment) {
    alert('Post cannot be empty.');
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
        comment,
        nestId: nestId 
      }),
    });

    if (response.ok) {
      document.getElementById('nestComment').value = '';
      loadNestFeed(nestId);
      console.log('Nest comment posted successfully');
    } else {
      const data = await response.json();
      console.error('Nest comment post error:', data);
      alert(data.error || 'Error posting to nest.');
    }
  } catch (error) {
    console.error('Nest comment post network error:', error);
    alert('Network error. Please try again.');
  }
}

// ================== NEST MANAGEMENT (NEW) ==================

function showCreateNestModal() {
  const modal = new bootstrap.Modal(document.getElementById('createNestModal'));
  modal.show();
}

function showJoinNestModal() {
  const modal = new bootstrap.Modal(document.getElementById('joinNestModal'));
  modal.show();
  loadAvailableNests();
}

async function createNest() {
  const token = localStorage.getItem('token');
  const name = document.getElementById('nestName').value.trim();
  const description = document.getElementById('nestDescription').value.trim();
  const privacy = document.querySelector('input[name="nestPrivacy"]:checked').value;

  if (!token) {
    alert('You must be logged in to create a nest.');
    return;
  }

  if (!name) {
    alert('Nest name is required.');
    return;
  }

  try {
    const response = await fetch('/nests', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name, description, privacy }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Nest created:', data);
      
      // Close modal and reset form
      bootstrap.Modal.getInstance(document.getElementById('createNestModal')).hide();
      document.getElementById('createNestForm').reset();
      
      // Reload nests
      loadUserNests();
      
      alert('Nest created successfully!');
    } else {
      const data = await response.json();
      alert(data.error || 'Error creating nest.');
    }
  } catch (error) {
    console.error('Error creating nest:', error);
    alert('Network error. Please try again.');
  }
}

async function loadAvailableNests() {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const response = await fetch('/nests/discover', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const nests = await response.json();
      displayAvailableNests(nests);
    }
  } catch (error) {
    console.error('Error loading available nests:', error);
  }
}

function displayAvailableNests(nests) {
  const availableNests = document.getElementById('availableNests');
  if (!availableNests) return;
  
  if (nests.length === 0) {
    availableNests.innerHTML = '<div class="text-center text-muted py-3">No public nests available to join</div>';
    return;
  }

  availableNests.innerHTML = nests.map(nest => `
    <div class="card mb-2">
      <div class="card-body py-2">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <h6 class="mb-1">${nest.name}</h6>
            <small class="text-muted">${nest.description || 'No description'}</small>
            <div class="mt-1">
              <span class="badge bg-light text-dark">${nest.members.length} members</span>
            </div>
          </div>
          <button class="btn btn-outline-primary btn-sm" onclick="joinNest('${nest._id}')">
            Join
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

async function joinNest(nestId) {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const response = await fetch(`/nests/${nestId}/join`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      alert('Successfully joined the nest!');
      loadUserNests();
      loadAvailableNests(); // Refresh available nests
    } else {
      const data = await response.json();
      alert(data.error || 'Error joining nest.');
    }
  } catch (error) {
    console.error('Error joining nest:', error);
    alert('Network error. Please try again.');
  }
}

// ================== COMPATIBILITY LAYER (OLD SCRIPT SUPPORT) ==================

// Support for old script.js event listeners that were added directly to DOM elements
document.addEventListener('DOMContentLoaded', () => {
  // Add delay to ensure elements exist
  setTimeout(() => {
    // Legacy support for old registration form
    const oldRegisterForm = document.getElementById('registerForm');
    if (oldRegisterForm && !oldRegisterForm.dataset.listenerAdded) {
      oldRegisterForm.addEventListener('submit', handleRegister);
      oldRegisterForm.dataset.listenerAdded = 'true';
    }

    // Legacy support for old login form
    const oldLoginForm = document.getElementById('loginForm');
    if (oldLoginForm && !oldLoginForm.dataset.listenerAdded) {
      oldLoginForm.addEventListener('submit', handleLogin);
      oldLoginForm.dataset.listenerAdded = 'true';
    }

    // Legacy support for old comment form
    const oldCommentForm = document.getElementById('commentForm');
    if (oldCommentForm && !oldCommentForm.dataset.listenerAdded) {
      oldCommentForm.addEventListener('submit', handleCommentSubmit);
      oldCommentForm.dataset.listenerAdded = 'true';
    }

    // Legacy support for old logout button
    const oldLogoutButton = document.getElementById('logoutButton');
    if (oldLogoutButton && !oldLogoutButton.dataset.listenerAdded) {
      oldLogoutButton.addEventListener('click', logout);
      oldLogoutButton.dataset.listenerAdded = 'true';
    }
  }, 1500);
});

// ================== GLOBAL FUNCTIONS ==================

// Make functions globally accessible (PRESERVING ALL FROM YOUR SCRIPT)
window.likeComment = likeComment;
window.dislikeComment = dislikeComment;
window.hideReplyForm = hideReplyForm;
window.markNotificationAsRead = markNotificationAsRead;
window.markAllNotificationsAsRead = markAllNotificationsAsRead;
window.toggleNotificationsPanel = toggleNotificationsPanel;

// NEW social media functions
window.showMainFeed = showMainFeed;
window.showNests = showNests;
window.selectNest = selectNest;
window.showCreateNestModal = showCreateNestModal;
window.showJoinNestModal = showJoinNestModal;
window.createNest = createNest;
window.joinNest = joinNest;

console.log('Enhanced Social Media Platform script setup complete - ALL FEATURES PRESERVED');