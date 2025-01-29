// Fetch and display comments on page load
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
            <span class="comment-name">@${comment.name}</span>
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
  
  // Handle form submission
  document.getElementById('commentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
  
    const name = document.getElementById('name').value;
    const comment = document.getElementById('comment').value;
  
    try {
      const response = await fetch('/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, comment }),
      });
  
      if (response.ok) {
        document.getElementById('name').value = '';
        document.getElementById('comment').value = '';
        loadComments(); // Reload comments after submitting
      } else {
        const error = await response.json();
        console.error('Error submitting comment:', error);
      }
    } catch (err) {
      console.error('Error submitting comment:', err);
    }
  });
  
  // Initial load
  loadComments();
  