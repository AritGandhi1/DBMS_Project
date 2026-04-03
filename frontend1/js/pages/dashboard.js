const DashboardPage = {
  id: "dashboard",

  async render() {
    try {
      const studentDetails = await API.getStudentDetails();
      const student = studentDetails.student;

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
          </div>
        </div>
      `;
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
      const studentDetails = await API.getStudentDetails();
      const courses = await API.getStudentCourses();
      const enrollment = await API.getEnrollmentOptions();

      document.getElementById("enrolledCount").textContent = courses.courses?.length || 0;
      document.getElementById("currentTerm").textContent = enrollment.currentTermNumber ? `Term ${enrollment.currentTermNumber}` : "N/A";
      document.getElementById("advisorName").textContent = studentDetails.student?.advisorName || studentDetails.student?.advisorId || "N/A";
      document.getElementById("availableEnroll").textContent = enrollment.enrollmentOptions?.length || 0;
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
    }
  }
};
