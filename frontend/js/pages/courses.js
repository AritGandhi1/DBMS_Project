const CoursesPage = {
  id: "courses",

  async render() {
    try {
      const response = await API.getStudentCourses();
      const courses = response.courses || [];

      if (courses.length === 0) {
        return `
          <div class="container">
            <div class="card">
              <div class="card-title">My Courses</div>
              <p style="text-align: center; color: #999; padding: 40px;">No courses enrolled yet.</p>
            </div>
          </div>
        `;
      }

      let tableHtml = `
        <table>
          <thead>
            <tr>
              <th>Course ID</th>
              <th>Course Name</th>
              <th>Credits</th>
              <th>Faculty</th>
              <th>Term</th>
              <th>Enrollment Date</th>
            </tr>
          </thead>
          <tbody>
      `;

      courses.forEach(course => {
        tableHtml += `
          <tr>
            <td>${course.courseId}</td>
            <td>${course.courseName}</td>
            <td>${course.credits}</td>
            <td>${course.facultyName}</td>
            <td>${course.termNumber}</td>
            <td>${new Date(course.enrollmentDate).toLocaleDateString()}</td>
          </tr>
        `;
      });

      tableHtml += `
          </tbody>
        </table>
      `;

      return `
        <div class="container">
          <div class="card">
            <div class="card-title">My Courses (${courses.length})</div>
            ${tableHtml}
          </div>
        </div>
      `;
    } catch (error) {
      return `
        <div class="container">
          <div class="message error">Error loading courses: ${error.message}</div>
        </div>
      `;
    }
  }
};
