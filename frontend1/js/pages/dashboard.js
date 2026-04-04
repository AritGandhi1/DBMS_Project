const DashboardPage = {
  id: "dashboard",

  renderFacultyDashboard(data) {
    const faculty = data.faculty || {};
    const courses = data.courses || [];
    const tas = data.tas || [];

    const coursesMarkup = courses.length
      ? `
          <table>
            <thead>
              <tr>
                <th>Course ID</th>
                <th>Course Name</th>
              </tr>
            </thead>
            <tbody>
              ${courses
                .map(
                  (course) => `
                    <tr>
                      <td>${course.courseId}</td>
                      <td>${course.courseName}</td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
        `
      : '<div class="message info">No courses assigned for the current term.</div>';

    const taMarkup = tas.length
      ? `
          <table>
            <thead>
              <tr>
                <th>TA Name</th>
                <th>Student ID</th>
                <th>Email</th>
                <th>Role</th>
                <th>Course</th>
              </tr>
            </thead>
            <tbody>
              ${tas
                .map(
                  (ta) => `
                    <tr>
                      <td>${ta.name}</td>
                      <td>${ta.studentId}</td>
                      <td>${ta.collegeEmail || "N/A"}</td>
                      <td>${ta.role || "TA"}</td>
                      <td>${ta.courseName || "Unassigned"}</td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
        `
      : '<div class="message info">No TAs assigned under you for the current term.</div>';

    return `
      <div class="container">
        <div class="card">
          <div class="card-title">Faculty Profile</div>
          <div class="card-grid">
            <div class="card-item">
              <div class="card-item-label">Name</div>
              <div class="card-item-value" style="font-size: 16px; color: #333;">${faculty.name || "N/A"}</div>
            </div>
            <div class="card-item">
              <div class="card-item-label">Faculty ID</div>
              <div class="card-item-value" style="font-size: 16px; color: #333;">${faculty.id || "N/A"}</div>
            </div>
            <div class="card-item">
              <div class="card-item-label">Department</div>
              <div class="card-item-value" style="font-size: 16px; color: #333;">${faculty.department || "N/A"}</div>
            </div>
            <div class="card-item">
              <div class="card-item-label">Email</div>
              <div class="card-item-value" style="font-size: 12px; color: #333; word-break: break-all;">${faculty.email || "N/A"}</div>
            </div>
          </div>
        </div>

        <div class="dashboard-grid">
          <div class="stat-card">
            <div class="stat-label">Current Term</div>
            <div class="stat-value" style="font-size: 18px; color: #333;">${data.currentTermNumber ? `Term ${data.currentTermNumber}` : "N/A"}</div>
          </div>
          <div class="stat-card success">
            <div class="stat-label">Courses This Term</div>
            <div class="stat-value">${courses.length}</div>
          </div>
          <div class="stat-card info">
            <div class="stat-label">TAs Under You</div>
            <div class="stat-value">${tas.length}</div>
          </div>
        </div>

        <div class="card">
          <div class="card-title">Courses This Semester</div>
          ${coursesMarkup}
        </div>

        <div class="card">
          <div class="card-title">Teaching Assistants</div>
          ${taMarkup}
        </div>
      </div>
    `;
  },

  async renderStudentDashboard() {
    const studentDetails = await API.getStudentDetails();
    const student = studentDetails.student;

    const taSection = student.isTA ? `
          <div class="stat-card info">
            <div class="stat-label">TA Role</div>
            <div class="stat-value" id="taRole" style="font-size: 18px; color: #333;">-</div>
          </div>
    ` : '';

    return `
      <div class="container">
        <div class="card">
          <div class="card-title">Student Profile</div>
          <div class="card-grid">
            <div class="card-item">
              <div class="card-item-label">Name</div>
              <div class="card-item-value" style="font-size: 16px; color: #333;">${student.name}</div>
            </div>
            <div class="card-item">
              <div class="card-item-label">Student ID</div>
              <div class="card-item-value" style="font-size: 16px; color: #333;">${student.id}</div>
            </div>
            <div class="card-item">
              <div class="card-item-label">Branch</div>
              <div class="card-item-value" style="font-size: 16px; color: #333;">${student.branch}</div>
            </div>
            <div class="card-item">
              <div class="card-item-label">Batch</div>
              <div class="card-item-value" style="font-size: 16px; color: #333;">${student.batch}</div>
            </div>
            <div class="card-item">
              <div class="card-item-label">College Email</div>
              <div class="card-item-value" style="font-size: 12px; color: #333; word-break: break-all;">${student.collegeEmail}</div>
            </div>
            <div class="card-item">
              <div class="card-item-label">Phone</div>
              <div class="card-item-value" style="font-size: 16px; color: #333;">${student.phone || 'N/A'}</div>
            </div>
          </div>
        </div>

        <div class="dashboard-grid">
          <div class="stat-card">
            <div class="stat-label">Enrolled Courses</div>
            <div class="stat-value" id="enrolledCount">-</div>
          </div>
          <div class="stat-card warning">
            <div class="stat-label">Current Term</div>
            <div class="stat-value" id="currentTerm" style="font-size: 18px; color: #333;">-</div>
          </div>
          <div class="stat-card success">
            <div class="stat-label">FA</div>
            <div class="stat-value" id="advisorName" style="font-size: 18px; color: #333;">-</div>
          </div>
          <div class="stat-card warning">
            <div class="stat-label">Available Enrollments</div>
            <div class="stat-value" id="availableEnroll">-</div>
          </div>
          ${taSection}
        </div>
      </div>
    `;
  },

  async render() {
    try {
      const user = Auth.getUser();

      if (user?.role === "FACULTY") {
        const facultyDashboard = await API.getFacultyDashboard();
        return this.renderFacultyDashboard(facultyDashboard);
      }

      return this.renderStudentDashboard();
    } catch (error) {
      return `
        <div class="container">
          <div class="message error">Error loading dashboard: ${error.message}</div>
        </div>
      `;
    }
  },

  async mount() {
    try {
      const user = Auth.getUser();
      if (user?.role === "FACULTY") {
        return;
      }

      const studentDetails = await API.getStudentDetails();
      const courses = await API.getStudentCourses();
      const enrollment = await API.getEnrollmentOptions();

      document.getElementById("enrolledCount").textContent = courses.courses?.length || 0;
      document.getElementById("currentTerm").textContent = enrollment.currentTermNumber ? `Term ${enrollment.currentTermNumber}` : "N/A";
      document.getElementById("advisorName").textContent = studentDetails.student?.advisorName || studentDetails.student?.advisorId || "N/A";
      document.getElementById("availableEnroll").textContent = enrollment.enrollmentOptions?.length || 0;
      
      // Display TA role if student is a TA
      if (studentDetails.student?.isTA && document.getElementById("taRole")) {
        document.getElementById("taRole").textContent = studentDetails.student?.taRole || "TA";
      }
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
    }
  }
};
