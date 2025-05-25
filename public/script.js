document.addEventListener('DOMContentLoaded', () => {
  checkLoginStatus();
  loadComments();
  setInterval(checkNewComments, 10000); // Check for new comments every 10 seconds
});

// Check Login Status
function checkLoginStatus() {
  const token = localStorage.getItem('token');
  if (token) {
    document.getElementById('authSection').classList.add('d-none');
    document.getElementById('logoutButton').classList.remove('d-none');
    document.getElementById('commentSection').classList.remove('d-none');
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
    alert('Error: Username might already exist.');
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
    localStorage.setItem('lastChecked', new Date().toISOString()); // Store last login time
    checkLoginStatus();
  } else {
    alert('Login failed.');
  }
});

// Logout User
document.getElementById('logoutButton').addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  localStorage.removeItem('lastChecked');
  window.location.reload();
});

// Load Comments with Like and Dislike Buttons
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
      const li = document.createElement('li');
      li.classList.add('list-group-item');
      
      // Comment content
      const commentContent = document.createElement('div');
      commentContent.innerHTML = `<strong class="comment-name">@${comment.username}</strong>: ${comment.comment}`;
      
      // Button container
      const buttonContainer = document.createElement('div');
      buttonContainer.classList.add('d-flex', 'gap-2', 'mt-2', 'align-items-center');
      
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
      
      // Timestamp
      const timestamp = document.createElement('small');
      timestamp.className = 'text-muted ms-auto';
      timestamp.textContent = new Date(comment.timestamp).toLocaleString();
      
      buttonContainer.appendChild(likeButton);
      buttonContainer.appendChild(dislikeButton);
      buttonContainer.appendChild(timestamp);
      
      li.appendChild(commentContent);
      li.appendChild(buttonContainer);
      commentsList.appendChild(li);
    });
  } catch (error) {
    console.error('Error loading comments:', error);
    document.getElementById('commentsList').innerHTML = '<li class="list-group-item text-danger">Error loading comments. Please refresh the page.</li>';
  }
}

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
      // Update both like and dislike counts since backend handles mutual exclusivity
      document.getElementById(`likes-${commentId}`).innerText = data.likes;
      document.getElementById(`dislikes-${commentId}`).innerText = data.dislikes;
    } else {
      // Handle specific error messages from backend
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
      // Update both like and dislike counts since backend handles mutual exclusivity
      document.getElementById(`likes-${commentId}`).innerText = data.likes;
      document.getElementById(`dislikes-${commentId}`).innerText = data.dislikes;
    } else {
      // Handle specific error messages from backend
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
    const response = await fetch('/comments', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ comment }),
    });

    if (response.ok) {
      document.getElementById('comment').value = '';
      localStorage.setItem('lastChecked', new Date().toISOString()); // Update last checked time
      loadComments(); // Reload comments to show the new one
    } else {
      const data = await response.json();
      alert(data.error || 'Error posting comment.');
    }
  } catch (error) {
    console.error('Error posting comment:', error);
    alert('Network error. Please try again.');
  }
});

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
      notificationBadge.innerText = `🔔 ${data.count} new comments since your last post!`;
      notificationBadge.classList.remove('d-none');
    } else {
      notificationBadge.classList.add('d-none');
    }
  } catch (error) {
    console.error("Error checking new comments:", error);
  }
}

// Ensure functions are globally accessible
window.likeComment = likeComment;
window.dislikeComment = dislikeComment;