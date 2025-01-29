document.addEventListener('DOMContentLoaded', () => {
  checkLoginStatus();
  loadComments();
});

// Check if user is logged in
function checkLoginStatus() {
  const currentUser = localStorage.getItem('username');
  const userDisplay = document.getElementById('currentUser');
  const authForm = document.getElementById('authForm');
  const logoutButton = document.getElementById('logoutButton');
  const commentForm = document.getElementById('commentForm');

  if (currentUser) {
    userDisplay.textContent = `@${currentUser}`;
    authForm.classList.add('d-none');
    logoutButton.classList.remove('d-none');
    commentForm.classList.remove('d-none');
  }
}

// Handle Login/Register
document.getElementById('authForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('usernameInput').value.trim();

  const response = await fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });

  if (response.ok) {
    localStorage.setItem('username', username);
    checkLoginStatus();
  } else {
    alert('Error logging in. Try again.');
  }
});

// Logout User
document.getElementById('logoutButton').addEventListener('click', () => {
  fetch('/logout', { method: 'POST' });
  localStorage.removeItem('username');
  window.location.reload();
});

// Load Comments
async function loadComments() {
  try {
    const response = await fetch('/comments');
    const comments = await response.json();

    const commentsList = document.getElementById('commentsList');
    commentsList.innerHTML = '';

    comments.forEach(comment => {
      const li = document.createElement('li');
      li.classList.add('list-group-item');

      li.innerHTML = `
        <div>
          <span class="comment-name">@${comment.username}</span>
          <span class="comment-time"> · ${new Date(comment.timestamp).toLocaleString()}</span>
          <p class="comment-text">${comment.comment}</p>
        </div>
      `;

      commentsList.appendChild(li);
    });
  } catch (err) {
    console.error('Error fetching comments:', err);
  }
}

// Submit Comment
document.getElementById('commentForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = localStorage.getItem('username');
  const comment = document.getElementById('comment').value.trim();

  if (!username) {
    alert('You must be logged in to comment.');
    return;
  }

  const response = await fetch('/comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ comment }),
  });

  if (response.ok) {
    document.getElementById('comment').value = '';
    loadComments();
  } else {
    alert('Error submitting comment.');
  }
});
