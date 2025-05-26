// Basic script.js for debugging login issues
console.log('Script loaded successfully');

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded');
  checkLoginStatus();
  loadComments();
  
  // Check for new comments every 10 seconds (basic version)
  setInterval(checkNewComments, 10000);
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
    
    if (navSection) navSection.classList.remove('d-none');
    if (commentSection) commentSection.classList.remove('d-none');
    if (welcomeMessage) welcomeMessage.textContent = `Welcome, @${username}!`;
    
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

// Load Comments (Basic version)
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
      const li = document.createElement('li');
      li.classList.add('list-group-item');
      
      // Basic comment content
      li.innerHTML = `
        <div class="comment-text">
          <strong class="comment-name">@${comment.username}</strong>: ${comment.comment}
        </div>
        <div class="d-flex gap-2 mt-2 align-items-center">
          <button class="btn btn-sm btn-outline-success" onclick="likeComment('${comment._id}')">
            👍 Like (<span id="likes-${comment._id}">${comment.likes || 0}</span>)
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="dislikeComment('${comment._id}')">
            👎 Dislike (<span id="dislikes-${comment._id}">${comment.dislikes || 0}</span>)
          </button>
          <small class="text-muted ms-auto">${new Date(comment.timestamp).toLocaleString()}</small>
        </div>
      `;
      
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

// Like Comment (Basic version)
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

// Dislike Comment (Basic version)
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

// Post Comment (Basic version)
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

// Make functions globally accessible
window.likeComment = likeComment;
window.dislikeComment = dislikeComment;

console.log('Script setup complete');