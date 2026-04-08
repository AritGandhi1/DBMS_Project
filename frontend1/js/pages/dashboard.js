const DashboardPage = {
  id: "dashboard",

  renderAdminDashboard() {
    const user = Auth.getUser() || {};

    return `
      <div class="container">
        <div class="card">
          <div class="card-title">Admin Dashboard</div>
          <div class="card-grid">
            <div class="card-item">
              <div class="card-item-label">Name</div>
              <div class="card-item-value" style="font-size: 16px; color: #333;">${user.name || "Admin"}</div>
            </div>
            <div class="card-item">
              <div class="card-item-label">Admin ID</div>
              <div class="card-item-value" style="font-size: 16px; color: #333;">${user.id || "N/A"}</div>
            </div>
            <div class="card-item">
              <div class="card-item-label">Role</div>
              <div class="card-item-value" style="font-size: 16px; color: #333;">${user.role || "ADMIN"}</div>
            </div>
          </div>
        </div>

        <div class="dashboard-grid">
          <div class="stat-card success">
            <div class="stat-label">Feedback Status</div>
            <div class="stat-value" id="adminFeedbackStatusValue">Loading...</div>
            <button class="btn btn-primary" style="margin-top: 10px;" id="adminToggleFeedbackBtn" type="button">Toggle</button>
          </div>
          <div class="stat-card info">
            <div class="stat-label">Enrollment Status</div>
            <div class="stat-value" id="adminEnrollmentStatusValue">Loading...</div>
            <button class="btn btn-primary" style="margin-top: 10px;" id="adminToggleEnrollmentBtn" type="button">Toggle</button>
          </div>
        </div>

        <div class="card">
          <div class="card-title">Admin Access</div>
          <div class="message info">Admin login is active. Use User Management to create and update student/faculty accounts.</div>
          <div style="margin-top: 12px;">
            <button class="btn btn-danger" id="adminEndTermBtn" type="button">End Term</button>
          </div>
        </div>
      </div>
    `;
  },

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
                <th>Term</th>
              </tr>
            </thead>
            <tbody>
              ${courses
                .map(
                  (course) => `
                    <tr>
                      <td>${course.courseId}</td>
                      <td>${course.courseName}</td>
                      <td>${course.termNumber || "-"}</td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
        `
      : '<div class="message info">No courses assigned to you yet.</div>';

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
          <div class="stat-card success">
            <div class="stat-label">Total Courses</div>
            <div class="stat-value">${courses.length}</div>
          </div>
          <div class="stat-card info">
            <div class="stat-label">TAs Under You</div>
            <div class="stat-value">${tas.length}</div>
          </div>
        </div>

        <div class="card">
          <div class="card-title">All Courses</div>
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

      if (user?.role === "ADMIN") {
        return this.renderAdminDashboard();
      }

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
      if (user?.role === "ADMIN") {
        const statusEl = document.getElementById("adminFeedbackStatusValue");
        const toggleBtn = document.getElementById("adminToggleFeedbackBtn");
        const enrollmentStatusEl = document.getElementById("adminEnrollmentStatusValue");
        const toggleEnrollmentBtn = document.getElementById("adminToggleEnrollmentBtn");
        const endTermBtn = document.getElementById("adminEndTermBtn");

        const loadStatus = async () => {
          const status = await API.getAdminFeedbackStatus();
          const isActive = Boolean(status.feedbackActive);
          if (statusEl) {
            statusEl.textContent = isActive ? "Active" : "Inactive";
          }
          if (toggleBtn) {
            toggleBtn.textContent = isActive ? "Set Inactive" : "Set Active";
          }
          return isActive;
        };

        let currentActive = true;
        let currentEnrollmentActive = true;
        try {
          currentActive = await loadStatus();
          const enrollmentStatus = await API.getAdminEnrollmentStatus();
          currentEnrollmentActive = Boolean(enrollmentStatus.enrollmentActive);
          if (enrollmentStatusEl) {
            enrollmentStatusEl.textContent = currentEnrollmentActive ? "Active" : "Inactive";
          }
          if (toggleEnrollmentBtn) {
            toggleEnrollmentBtn.textContent = currentEnrollmentActive ? "Set Inactive" : "Set Active";
          }
        } catch (error) {
          if (statusEl) {
            statusEl.textContent = "Error";
          }
          if (toggleBtn) {
            toggleBtn.disabled = true;
          }
          if (enrollmentStatusEl) {
            enrollmentStatusEl.textContent = "Error";
          }
          if (toggleEnrollmentBtn) {
            toggleEnrollmentBtn.disabled = true;
          }
          return;
        }

        if (toggleBtn) {
          toggleBtn.addEventListener("click", async () => {
            toggleBtn.disabled = true;
            try {
              const updated = await API.updateAdminFeedbackStatus(!currentActive);
              currentActive = Boolean(updated.feedbackActive);
              await loadStatus();
            } catch (error) {
              alert(error.message || "Failed to update feedback status");
            } finally {
              toggleBtn.disabled = false;
            }
          });
        }

        if (toggleEnrollmentBtn) {
          toggleEnrollmentBtn.addEventListener("click", async () => {
            toggleEnrollmentBtn.disabled = true;
            try {
              const updated = await API.updateAdminEnrollmentStatus(!currentEnrollmentActive);
              currentEnrollmentActive = Boolean(updated.enrollmentActive);
              if (enrollmentStatusEl) {
                enrollmentStatusEl.textContent = currentEnrollmentActive ? "Active" : "Inactive";
              }
              toggleEnrollmentBtn.textContent = currentEnrollmentActive ? "Set Inactive" : "Set Active";
            } catch (error) {
              alert(error.message || "Failed to update enrollment status");
            } finally {
              toggleEnrollmentBtn.disabled = false;
            }
          });
        }

        if (endTermBtn) {
          endTermBtn.addEventListener("click", async () => {
            const confirmed = window.confirm(
              "Are you sure you want to end the term? This will clear course offerings, feedback, enrollments, timetables, and notifications."
            );

            if (!confirmed) {
              return;
            }

            endTermBtn.disabled = true;
            const previousText = endTermBtn.textContent;
            endTermBtn.textContent = "Processing...";

            try {
              const response = await API.endAdminTerm();
              alert(
                `Term ended successfully. Students processed: ${response.studentsProcessed || 0}, GPA updated: ${response.gpaUpdatedCount || 0}, Term incremented: ${response.termIncrementedCount || 0}.`
              );
            } catch (error) {
              alert(error.message || "Failed to end term");
            } finally {
              endTermBtn.disabled = false;
              endTermBtn.textContent = previousText || "End Term";
            }
          });
        }

        return;
      }

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
