const EnrollmentPage = {
  id: "enrollment",
  selectedMode: "course",
  currentTermNumber: 0,
  canShowTAMode: false,
  selectedTAResumeId: "",
  enrollmentActive: true,

  renderModeSelector() {
    const taOption = this.canShowTAMode
      ? `<option value="ta" ${this.selectedMode === "ta" ? "selected" : ""}>TA Enrollment</option>`
      : "";

    return `
      <div class="card">
        <div class="card-title">Enrollment Mode ${this.currentTermNumber ? `(Term ${this.currentTermNumber})` : ""}</div>
        <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
          <label for="enrollmentModeSelect" style="font-weight:600; color:#333;">Choose Mode:</label>
          <select id="enrollmentModeSelect" onchange="EnrollmentPage.changeMode(this.value)" style="padding:8px 12px; border:1px solid #ddd; border-radius:6px; min-width:210px;">
            <option value="course" ${this.selectedMode === "course" ? "selected" : ""}>Course Enrollment</option>
            ${taOption}
          </select>
        </div>
      </div>
    `;
  },

  renderCourseEnrollment(options, unavailableCourses) {
    if (!this.enrollmentActive) {
      return `
        <div class="card">
          <div class="message error" style="margin-top: 10px;">Course enrollment is currently inactive by admin.</div>
        </div>
        <div id="enrollMessage"></div>
      `;
    }

    let html = "";

    if (options.length > 0) {
      const grouped = {
        Core: [],
        Elective: [],
        Lateral: [],
        Breadth: [],
        Lab: []
      };

      options.forEach((opt) => {
        if (grouped[opt.type]) {
          grouped[opt.type].push(opt);
        }
      });

      Object.keys(grouped).forEach((type) => {
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

        grouped[type].forEach((course) => {
          html += `
            <tr>
              <td>${course.courseId}</td>
              <td>${course.courseName}</td>
              <td>${course.branch}</td>
              <td>${course.credits}</td>
              <td>${course.facultyName}</td>
              <td>
                <button class="btn btn-primary" style="padding: 6px 12px; font-size: 12px;"
                  onclick="EnrollmentPage.enrollCourse('${course.offeringId}', '${course.courseName}')">
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

    if (unavailableCourses.length > 0) {
      const grouped = {
        Core: [],
        Elective: [],
        Lateral: [],
        Breadth: [],
        Lab: []
      };

      unavailableCourses.forEach((opt) => {
        if (grouped[opt.type]) {
          grouped[opt.type].push(opt);
        }
      });

      html += `<div class="card" style="margin-top: 24px; border: 1px solid #ddd;">
        <div class="card-title" style="color: #d9534f;">Prerequisites Not Completed</div>
        <p style="font-size: 12px; color: #666; margin-bottom: 12px;">These courses require completed prerequisites. Complete them first to enroll.</p>`;

      Object.keys(grouped).forEach((type) => {
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

        grouped[type].forEach((course) => {
          html += `
            <tr style="opacity: 0.7;">
              <td>${course.courseId}</td>
              <td>${course.courseName}</td>
              <td><span style="color: #d9534f; font-weight: bold;">${course.missingPrereqs.join(", ")}</span></td>
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
      html += `
        <div class="card">
          <div class="card-title">Available Courses for Enrollment</div>
          <p style="text-align: center; color: #999; padding: 40px;">No courses available for enrollment in your current term.</p>
        </div>
      `;
    }

    html += `<div id="enrollMessage"></div>`;

    return html;
  },

  renderTAEnrollment(response, resumes = []) {
    const canApply = Boolean(response.canApply);
    const faculties = response.faculties || [];
    const appliedFacultyIds = response.appliedFacultyIds || [];
    const applications = response.applications || [];
    const hasResumes = resumes.length > 0;
    const selectedResumeId = this.selectedTAResumeId || (hasResumes ? String(resumes[0].resumeId) : "");
    this.selectedTAResumeId = selectedResumeId;

    let html = "";

    if (!canApply) {
      return `
        <div class="card">
          <div class="message info" style="margin-top: 10px;">TA Enrollment is available only for 7th and 8th term students.</div>
        </div>
      `;
    }

    if (applications.length > 0) {
      html += `
        <div class="card">
          <div class="card-title">My TA Applications (${applications.length})</div>
          <table>
            <thead>
              <tr>
                <th>Faculty ID</th>
                <th>Faculty Name</th>
                <th>Resume</th>
                <th>Role</th>
                <th>Status</th>
                <th>Term</th>
              </tr>
            </thead>
            <tbody>
      `;

      applications.forEach((item) => {
        html += `
          <tr>
            <td>${item.facultyId}</td>
            <td>${item.facultyName}</td>
            <td>${item.resumeFileName || "-"}</td>
            <td>${item.role}</td>
            <td>${item.status || "-"}</td>
            <td>${item.termNumber}</td>
          </tr>
        `;
      });

      html += `
            </tbody>
          </table>
        </div>
      `;
    }

    const resumeOptions = resumes
      .map((resume) => `<option value="${resume.resumeId}" ${String(resume.resumeId) === selectedResumeId ? "selected" : ""}>${resume.fileName}</option>`)
      .join("");

    html += `
      <div class="card">
        <div class="card-title">Department Faculty List</div>
        <div style="display:flex; flex-wrap:wrap; gap:10px; align-items:center; margin-bottom: 12px;">
          <label for="taResumeSelect" style="font-weight:600; color:#333;">Resume for TA application:</label>
          <select id="taResumeSelect" ${hasResumes ? "" : "disabled"} style="padding:8px 12px; border:1px solid #ddd; border-radius:6px; min-width:240px;">
            ${resumeOptions}
          </select>
        </div>
        ${hasResumes ? "" : '<div class="message info" style="margin-bottom: 12px;">Upload a resume first in Student Resume before applying for TA.</div>'}
    `;

    if (faculties.length === 0) {
      html += `<div class="message info" style="margin-top: 10px;">No faculty found in your department.</div>`;
    } else {
      html += `
        <table>
          <thead>
            <tr>
              <th>Faculty ID</th>
              <th>Name</th>
              <th>Department</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
      `;

      faculties.forEach((faculty) => {
        const hasApplied = appliedFacultyIds.includes(faculty.facultyId);
        html += `
          <tr>
            <td>${faculty.facultyId}</td>
            <td>${faculty.facultyName}</td>
            <td>${faculty.department}</td>
            <td>
              <button class="btn btn-primary" style="padding: 6px 12px; font-size: 12px;" ${(hasApplied || !hasResumes) ? "disabled" : ""}
                onclick="EnrollmentPage.applyTA('${faculty.facultyId}', '${faculty.facultyName}')">
                ${hasApplied ? "Applied" : "Apply"}
              </button>
            </td>
          </tr>
        `;
      });

      html += `
          </tbody>
        </table>
      `;
    }

    html += `
        <div id="taEnrollMessage" style="margin-top: 12px;"></div>
      </div>
    `;

    return html;
  },

  async render() {
    try {
      const courseResponse = await API.getEnrollmentOptions();
      this.enrollmentActive = courseResponse.enrollmentActive !== false;
      this.currentTermNumber = Number(courseResponse.currentTermNumber || 0);
      this.canShowTAMode = this.currentTermNumber === 7 || this.currentTermNumber === 8;

      if (!this.canShowTAMode && this.selectedMode === "ta") {
        this.selectedMode = "course";
      }

      let html = `<div class="container">`;
      html += this.renderModeSelector();

      if (this.selectedMode === "ta") {
        const [taResponse, resumeResponse] = await Promise.all([
          API.getTAEnrollmentOptions(),
          API.getStudentResumes()
        ]);
        html += this.renderTAEnrollment(taResponse, resumeResponse.resumes || []);
      } else {
        const options = courseResponse.enrollmentOptions || [];
        const unavailableCourses = courseResponse.unavailableCourses || [];
        html += this.renderCourseEnrollment(options, unavailableCourses);
      }

      html += `</div>`;
      return html;
    } catch (error) {
      return `
        <div class="container">
          <div class="message error">Error loading enrollment options: ${error.message}</div>
        </div>
      `;
    }
  },

  changeMode(mode) {
    this.selectedMode = mode === "ta" ? "ta" : "course";
    Router.navigate("#/enrollment");
  },

  async enrollCourse(offeringId, courseName) {
    if (!this.enrollmentActive) {
      const messageDiv = document.getElementById("enrollMessage");
      if (messageDiv) {
        messageDiv.innerHTML = `<div class="message error">Enrollment is currently inactive by admin.</div>`;
      }
      return;
    }

    try {
      const messageDiv = document.getElementById("enrollMessage");
      if (!messageDiv) return;

      messageDiv.innerHTML = '<div class="loading"><div class="spinner"></div>Enrolling in course...</div>';
      await API.enrollCourse(offeringId);

      messageDiv.innerHTML = `<div class="message success">Successfully enrolled in ${courseName}! Refreshing...</div>`;

      setTimeout(() => {
        Router.navigate("#/enrollment");
      }, 1000);
    } catch (error) {
      const messageDiv = document.getElementById("enrollMessage");
      if (messageDiv) {
        messageDiv.innerHTML = `<div class="message error">Error: ${error.message}</div>`;
      }
    }
  },

  async applyTA(facultyId, facultyName) {
    const resumeSelect = document.getElementById("taResumeSelect");
    const resumeId = resumeSelect ? resumeSelect.value : "";
    this.selectedTAResumeId = resumeId;

    if (!resumeId) {
      const messageWrap = document.getElementById("taEnrollMessage");
      if (messageWrap) {
        messageWrap.innerHTML = '<div class="message error">Please select a resume before applying.</div>';
      }
      return;
    }

    const messageWrap = document.getElementById("taEnrollMessage");
    if (messageWrap) {
      messageWrap.innerHTML = '<div class="loading"><div class="spinner"></div>Submitting TA application...</div>';
    }

    try {
      await API.applyTAEnrollment(facultyId, Number(resumeId));
      if (messageWrap) {
        messageWrap.innerHTML = `<div class="message success">Applied for TA with ${facultyName}. Refreshing...</div>`;
      }

      setTimeout(() => {
        Router.navigate("#/enrollment");
      }, 900);
    } catch (error) {
      if (messageWrap) {
        messageWrap.innerHTML = `<div class="message error">${error.message}</div>`;
      }
    }
  }
};
