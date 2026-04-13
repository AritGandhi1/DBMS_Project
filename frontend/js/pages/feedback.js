const FeedbackPage = {
  id: "feedback",
  feedbackActive: true,

  async render() {
    try {
      const response = await API.getCoursesForFeedback();
      const courses = response.courses || [];
      this.feedbackActive = response.feedbackActive !== false;

      const inactiveBanner = this.feedbackActive
        ? ""
        : `
          <div class="card" style="margin-bottom: 16px; border-left: 4px solid #dc3545;">
            <div class="message error" style="margin: 0;">Feedback is currently inactive by admin. Submissions are disabled.</div>
          </div>
        `;

      if (courses.length === 0) {
        return `
          <div class="container">
            <div class="card">
              <div class="card-title">Course Feedback</div>
              <p style="text-align: center; color: #999; padding: 40px;">No courses enrolled yet.</p>
            </div>
          </div>
        `;
      }

      // Separate courses with and without feedback
      const withFeedback = courses.filter(c => c.hasFeedback);
      const withoutFeedback = courses.filter(c => !c.hasFeedback);

      let html = `<div class="container">${inactiveBanner}`;

      // Courses awaiting feedback
      if (withoutFeedback.length > 0) {
        html += `
          <div class="card">
            <div class="card-title">Pending Feedback (${withoutFeedback.length})</div>
            <div style="margin-top: 12px;">
        `;

        withoutFeedback.forEach(course => {
          html += `
            <div style="padding: 12px; border: 1px solid #eee; border-radius: 4px; margin-bottom: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-weight: bold;">${course.courseId} - ${course.courseName}</div>
                  <div style="font-size: 12px; color: #666;">Faculty: ${course.facultyName} | Credits: ${course.credits}</div>
                </div>
                <button class="btn btn-primary" style="padding: 6px 12px; font-size: 12px;"
                  ${this.feedbackActive ? "" : "disabled"}
                  onclick="FeedbackPage.openFeedbackForm('${course.offeringId}', '${course.courseId}', '${course.courseName}')">
                  Give Feedback
                </button>
              </div>
            </div>
          `;
        });

        html += `
            </div>
          </div>
        `;
      }

      // Courses with feedback already submitted
      if (withFeedback.length > 0) {
        html += `
          <div class="card" style="margin-top: 24px;">
            <div class="card-title">Feedback Submitted (${withFeedback.length})</div>
            <table>
              <thead>
                <tr>
                  <th>Course ID</th>
                  <th>Course Name</th>
                  <th>Faculty</th>
                  <th>Rating</th>
                  <th>Comment</th>
                  <th>Submitted On</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
        `;

        withFeedback.forEach(course => {
          const stars = "★".repeat(course.rating) + "☆".repeat(5 - course.rating);
          const submittedDate = new Date(course.submittedOn).toLocaleDateString();

          html += `
            <tr>
              <td>${course.courseId}</td>
              <td>${course.courseName}</td>
              <td>${course.facultyName}</td>
              <td><span style="color: #ff9800; font-weight: bold;">${stars}</span> ${course.rating}/5</td>
              <td><span style="font-size: 12px; color: #666;">${course.comment ? course.comment.substring(0, 50) + (course.comment.length > 50 ? '...' : '') : 'No comment'}</span></td>
              <td>${submittedDate}</td>
              <td>
                <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;"
                  ${this.feedbackActive ? "" : "disabled"}
                  onclick="FeedbackPage.openFeedbackForm('${course.offeringId}', '${course.courseId}', '${course.courseName}', ${course.rating}, '${course.comment.replace(/'/g, "\\'")}')">
                  Edit
                </button>
              </td>
            </tr>
          `;
        });

        html += `
              </tbody>
            </table>
          </div>
        `;
      }

      html += `
        </div>
        <div id="feedbackMessage"></div>
      `;

      return html;
    } catch (error) {
      return `
        <div class="container">
          <div class="message error">Error loading courses: ${error.message}</div>
        </div>
      `;
    }
  },

  openFeedbackForm(offeringId, courseId, courseName, existingRating = 0, existingComment = '') {
    if (!this.feedbackActive) {
      alert("Feedback is currently inactive by admin.");
      return;
    }

    let modalHtml = `
      <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;" id="feedbackModal">
        <div style="background: white; border-radius: 8px; padding: 24px; width: 90%; max-width: 500px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div style="font-size: 18px; font-weight: bold;">Course Feedback</div>
            <button style="background: none; border: none; font-size: 24px; cursor: pointer;" onclick="FeedbackPage.closeFeedbackForm()">×</button>
          </div>

          <div style="margin-bottom: 16px;">
            <div style="font-weight: bold;">${courseId} - ${courseName}</div>
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: bold;">Rating (1-5 stars)</label>
            <div style="display: flex; gap: 8px; font-size: 28px;">
              ${[1, 2, 3, 4, 5].map(i => `
                <span style="cursor: pointer; color: ${i <= existingRating ? '#ff9800' : '#ddd'}; transition: color 0.2s;" 
                  onclick="FeedbackPage.setRating(${i})" id="star-${i}">★</span>
              `).join('')}
            </div>
            <input type="hidden" id="ratingInput" value="${existingRating}">
          </div>

          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: bold;">Comment (Optional)</label>
            <textarea id="commentInput" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-family: inherit; font-size: 14px; resize: vertical; min-height: 100px;" placeholder="Share your feedback about this course...">${existingComment}</textarea>
          </div>

          <div style="display: flex; gap: 8px; justify-content: flex-end;">
            <button class="btn btn-secondary" style="padding: 8px 16px;" onclick="FeedbackPage.closeFeedbackForm()">Cancel</button>
            <button class="btn btn-primary" style="padding: 8px 16px;" onclick="FeedbackPage.submitFeedback('${offeringId}')">Submit Feedback</button>
          </div>
        </div>
      </div>
    `;

    const modal = document.createElement('div');
    modal.innerHTML = modalHtml;
    document.body.appendChild(modal);

    // Update star colors on hover
    for (let i = 1; i <= 5; i++) {
      const star = document.getElementById(`star-${i}`);
      star.addEventListener('mouseenter', () => {
        for (let j = 1; j <= 5; j++) {
          document.getElementById(`star-${j}`).style.color = j <= i ? '#ff9800' : '#ddd';
        }
      });
    }

    document.getElementById('feedbackModal').addEventListener('mouseleave', () => {
      const rating = parseInt(document.getElementById('ratingInput').value);
      for (let j = 1; j <= 5; j++) {
        document.getElementById(`star-${j}`).style.color = j <= rating ? '#ff9800' : '#ddd';
      }
    });
  },

  setRating(rating) {
    document.getElementById('ratingInput').value = rating;
    for (let i = 1; i <= 5; i++) {
      document.getElementById(`star-${i}`).style.color = i <= rating ? '#ff9800' : '#ddd';
    }
  },

  closeFeedbackForm() {
    const modal = document.getElementById('feedbackModal');
    if (modal && modal.parentNode) {
      modal.parentNode.removeChild(modal);
    }
  },

  async submitFeedback(offeringId) {
    if (!this.feedbackActive) {
      alert("Feedback is currently inactive by admin.");
      return;
    }

    const rating = parseInt(document.getElementById('ratingInput').value);
    const comment = document.getElementById('commentInput').value;

    if (!rating) {
      alert('Please select a rating');
      return;
    }

    try {
      await API.submitFeedback(offeringId, rating, comment);
      this.closeFeedbackForm();

      const messageDiv = document.getElementById('feedbackMessage');
      if (messageDiv) {
        messageDiv.innerHTML = '<div class="message success" style="margin-top: 16px;">Feedback submitted successfully. Refreshing...</div>';
      }

      setTimeout(() => {
        Router.navigate('#/feedback');
      }, 1000);
    } catch (error) {
      alert('Error submitting feedback: ' + error.message);
    }
  }
};
