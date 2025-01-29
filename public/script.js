document.addEventListener('DOMContentLoaded', () => {
  checkLoginStatus();
  loadComments();
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
    checkLoginStatus();
  } else {
    alert('Login failed.');
  }
});

// Logout User
document.getElementById('logoutButton').addEventListener('click', () => {
  localStorage.removeItem('token');
  window.location.reload();
});

// Load Comments
async function loadComments() {
  const response = await fetch('/comments');
  const comments = await response.json();
  const commentsList = document.getElementById('commentsList');
  commentsList.innerHTML = '';

  comments.forEach(comment => {
    const li = document.createElement('li');
    li.classList.add('list-group-item');
    li.innerHTML = `<strong>@${comment.username}</strong>: ${comment.comment}`;
    commentsList.appendChild(li);
  });
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
