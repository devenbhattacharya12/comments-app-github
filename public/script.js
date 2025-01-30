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
    checkLoginStatus();
  } else {
    alert('Login failed.');
  }
});

// Logout User
document.getElementById('logoutButton').addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  window.location.reload();
});

// Load Comments with Like Buttons
async function loadComments() {
  const response = await fetch('/comments');
  const comments = await response.json();
  const commentsList = document.getElementById('commentsList');
  commentsList.innerHTML = '';

  comments.forEach(comment => {
    const li = document.createElement('li');
    li.classList.add('list-group-item');
    li.innerHTML = `<strong>@${comment.username}</strong>: ${comment.comment} 
      <button onclick="likeComment('${comment._id}')" class="btn btn-sm btn-outline-primary">Like (<span id="likes-${comment._id}">${comment.likes}</span>)</button>`;
    commentsList.appendChild(li);
  });
}

// Like Comment
async function likeComment(commentId) {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('You must be logged in to like a comment.');
    return;
  }

  const response = await fetch('/like-comment', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ commentId }),
  });

  if (response.ok) {
    const data = await response.json();
    document.getElementById(`likes-${commentId}`).innerText = data.likes; // Update UI with new like count
  } else {
    alert('Error liking comment.');
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
    loadComments();
  } else {
    alert('Error posting comment.');
  }
});

// Check for new comments
async function checkNewComments() {
  const username = localStorage.getItem("username");
  if (!username) return;

  try {
    const response = await fetch(`/new-comments?username=${username}`);
    const data = await response.json();

    if (data.count > 0) {
      alert(`🔔 ${data.count} new comments since your last post!`);
    }
  } catch (error) {
    console.error("Error checking new comments:", error);
  }
}

// Ensure likeComment is globally accessible
window.likeComment = likeComment;
