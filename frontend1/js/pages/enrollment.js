const EnrollmentPage = {
  id: "enrollment",

  async render() {
    try {
      const response = await API.getEnrollmentOptions();
      const options = response.enrollmentOptions || [];
      const unavailableCourses = response.unavailableCourses || [];

      let html = `<div class="container">`;

      // Show available courses first
      if (options.length > 0) {
        // Group by type
        const grouped = {
          'Core': [],
          'Elective': [],
          'Lateral': [],
          'Breadth': [],
          'Lab': []
        };

        options.forEach(opt => {
          if (grouped[opt.type]) {
            grouped[opt.type].push(opt);
          }
        });

        Object.keys(grouped).forEach(type => {
          if (grouped[type].length === 0) return;

          html += `
            <div class="card">
              <div class="card-title">${type} Courses (${grouped[type].length})</div>
              <table>
                <thead>
                  <tr>
                    <th>Course ID</th>
                    <th>Course Name</th>
                    <th>Branch</th>
                    <th>Credits</th>
                    <th>Faculty</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
          `;

          grouped[type].forEach(course => {
            html += `
              <tr>
                <td>${course.courseId}</td>
                <td>${course.courseName}</td>
                <td>${course.branch}</td>
                <td>${course.credits}</td>
                <td>${course.facultyName}</td>
                <td>
                  <button class="btn btn-primary" style="padding: 6px 12px; font-size: 12px;"
                    onclick="EnrollmentPage.enroll('${course.offeringId}', '${course.courseName}')">
                    Enroll
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
        });
      }

      // Show unavailable courses
      if (unavailableCourses.length > 0) {
        const grouped = {
          'Core': [],
          'Elective': [],
          'Lateral': [],
          'Breadth': [],
          'Lab': []
        };

        unavailableCourses.forEach(opt => {
          if (grouped[opt.type]) {
            grouped[opt.type].push(opt);
          }
        });

        html += `<div class="card" style="margin-top: 24px; border: 1px solid #ddd;">
          <div class="card-title" style="color: #d9534f;">Prerequisites Not Completed</div>
          <p style="font-size: 12px; color: #666; margin-bottom: 12px;">These courses require completed prerequisites. Complete them first to enroll.</p>`;

        Object.keys(grouped).forEach(type => {
          if (grouped[type].length === 0) return;

          html += `
            <div style="margin-bottom: 12px;">
              <div style="font-weight: bold; font-size: 13px;">${type} Courses (${grouped[type].length})</div>
              <table style="margin-top: 8px;">
                <thead>
                  <tr>
                    <th>Course ID</th>
                    <th>Course Name</th>
                    <th>Prerequisites Needed</th>
                    <th>Branch</th>
                    <th>Credits</th>
                  </tr>
                </thead>
                <tbody>
          `;

          grouped[type].forEach(course => {
            html += `
              <tr style="opacity: 0.7;">
                <td>${course.courseId}</td>
                <td>${course.courseName}</td>
                <td><span style="color: #d9534f; font-weight: bold;">${course.missingPrereqs.join(', ')}</span></td>
                <td>${course.branch}</td>
                <td>${course.credits}</td>
              </tr>
            `;
          });

          html += `
                </tbody>
              </table>
            </div>
          `;
        });

        html += `</div>`;
      }

      if (options.length === 0 && unavailableCourses.length === 0) {
        html = `
          <div class="container">
            <div class="card">
              <div class="card-title">Available Courses for Enrollment</div>
              <p style="text-align: center; color: #999; padding: 40px;">No courses available for enrollment in your current term.</p>
            </div>
          </div>
        `;
      }

      html += `
        </div>
        <div id="enrollMessage"></div>
      `;

      return html;
    } catch (error) {
      return `
        <div class="container">
          <div class="message error">Error loading enrollment options: ${error.message}</div>
        </div>
      `;
    }
  },

  async enroll(offeringId, courseName) {
    try {
      const messageDiv = document.getElementById("enrollMessage");
      if (!messageDiv) return;

      messageDiv.innerHTML = '<div class="loading"><div class="spinner"></div>Enrolling in course...</div>';
      
      const response = await API.enrollCourse(offeringId);

      messageDiv.innerHTML = `<div class="message success">Successfully enrolled in ${courseName}! Refreshing...</div>`;

      // Refresh enrollment options after 1 second
      setTimeout(() => {
        Router.navigate('#/enrollment');
      }, 1000);
    } catch (error) {
      const messageDiv = document.getElementById("enrollMessage");
      if (messageDiv) {
        messageDiv.innerHTML = `<div class="message error">Error: ${error.message}</div>`;
      }
    }
  }
};
