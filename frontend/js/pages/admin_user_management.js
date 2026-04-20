const AdminUserManagementPage = {
  id: "admin-users",

  students: [],
  faculties: [],

  escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  },

  formatDateInput(value) {
    if (!value) {
      return "";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return String(value).slice(0, 10);
    }
    return date.toISOString().slice(0, 10);
  },

  async render() {
    return `
      <div class="container admin-users-page">
        <section class="card admin-users-hero">
          <div>
            <p class="admin-users-kicker">Administration</p>
            <h2 class="card-title admin-users-title">User Management</h2>
            <p class="admin-users-subtitle">Create and maintain student and faculty accounts from one workspace.</p>
          </div>
          <div class="admin-users-stats" id="adminUserStats"></div>
        </section>

        <div id="adminUsersMessage"></div>

        <section class="admin-users-form-grid">
          <div class="card admin-users-panel">
            <div class="admin-users-panel-header">
              <div class="card-title admin-users-section-title">Add Student</div>
              <span class="admin-users-badge">Student Account</span>
            </div>
            <form id="adminAddStudentForm">
              <div class="card-grid admin-users-grid-tight">
                <div class="form-group"><label for="adminStudentId">Student ID</label><input id="adminStudentId" required /></div>
                <div class="form-group"><label for="adminStudentPassword">Password</label><input id="adminStudentPassword" required /></div>
                <div class="form-group"><label for="adminStudentName">Name</label><input id="adminStudentName" required /></div>
                <div class="form-group"><label for="adminStudentBatch">Batch</label><input id="adminStudentBatch" type="number" min="1" required /></div>
                <div class="form-group"><label for="adminStudentCollegeEmail">College Email</label><input id="adminStudentCollegeEmail" type="email" required /></div>
                <div class="form-group"><label for="adminStudentPersonalEmail">Personal Email</label><input id="adminStudentPersonalEmail" type="email" /></div>
                <div class="form-group"><label for="adminStudentPhone">Phone</label><input id="adminStudentPhone" /></div>
                <div class="form-group"><label for="adminStudentDob">DOB</label><input id="adminStudentDob" type="date" /></div>
                <div class="form-group"><label for="adminStudentAdvisorId">Advisor ID</label><input id="adminStudentAdvisorId" /></div>
                <div class="form-group"><label for="adminStudentTerm">Current Term</label><input id="adminStudentTerm" type="number" min="1" required /></div>
                <div class="form-group"><label for="adminStudentBranch">Branch</label><input id="adminStudentBranch" required /></div>
              </div>
              <button class="btn btn-primary" type="submit">Add Student</button>
            </form>
            <hr style="margin:16px 0; border:none; border-top:1px solid #eceff4;" />
            <form id="adminBulkStudentsForm">
              <div class="form-group">
                <label for="adminBulkStudentsFile">Bulk Upload (CSV/XLS/XLSX)</label>
                <input id="adminBulkStudentsFile" type="file" accept=".csv,.xls,.xlsx" required />
              </div>
              <div class="message info" style="margin-bottom:10px;">
                Headers: studentId, password, name, batch, collegeEmail, personalEmail, phone, dob, advisorId, currentTermNumber, branch
              </div>
              <button class="btn btn-secondary" type="submit">Upload Student File</button>
            </form>
          </div>

          <div class="card admin-users-panel">
            <div class="admin-users-panel-header">
              <div class="card-title admin-users-section-title">Add Faculty</div>
              <span class="admin-users-badge">Faculty Account</span>
            </div>
            <form id="adminAddFacultyForm">
              <div class="card-grid admin-users-grid-tight">
                <div class="form-group"><label for="adminFacultyId">Faculty ID</label><input id="adminFacultyId" required /></div>
                <div class="form-group"><label for="adminFacultyPassword">Password</label><input id="adminFacultyPassword" required /></div>
                <div class="form-group">
                  <label for="adminFacultyRole">Role</label>
                  <select id="adminFacultyRole">
                    <option value="Faculty">Faculty</option>
                    <option value="HOD">HOD</option>
                    <option value="PIC_TT">PIC_TT</option>
                    <option value="PIC_CDC">PIC_CDC</option>
                    <option value="PIC_EXAM">PIC_EXAM</option>
                  </select>
                </div>
                <div class="form-group"><label for="adminFacultyName">Name</label><input id="adminFacultyName" required /></div>
                <div class="form-group"><label for="adminFacultyEmail">Email</label><input id="adminFacultyEmail" type="email" /></div>
                <div class="form-group"><label for="adminFacultyPhone">Phone</label><input id="adminFacultyPhone" /></div>
                <div class="form-group"><label for="adminFacultyDepartment">Department</label><input id="adminFacultyDepartment" /></div>
              </div>
              <button class="btn btn-primary" type="submit">Add Faculty</button>
            </form>
            <hr style="margin:16px 0; border:none; border-top:1px solid #eceff4;" />
            <form id="adminBulkFacultyForm">
              <div class="form-group">
                <label for="adminBulkFacultyFile">Bulk Upload (CSV/XLS/XLSX)</label>
                <input id="adminBulkFacultyFile" type="file" accept=".csv,.xls,.xlsx" required />
              </div>
              <div class="message info" style="margin-bottom:10px;">
                Headers: facultyId, password, role, name, email, phone, department
              </div>
              <button class="btn btn-secondary" type="submit">Upload Faculty File</button>
            </form>
          </div>
        </section>

        <section class="card admin-users-panel">
          <div class="admin-users-table-header">
            <div class="card-title admin-users-section-title">Students</div>
            <input id="adminStudentsSearch" class="admin-users-search" placeholder="Search by ID, name, email, or branch" />
          </div>
          <div id="adminStudentsTable"></div>
        </section>

        <section class="card admin-users-panel">
          <div class="admin-users-table-header">
            <div class="card-title admin-users-section-title">Faculty</div>
            <input id="adminFacultySearch" class="admin-users-search" placeholder="Search by ID, name, email, role, or department" />
          </div>
          <div id="adminFacultyTable"></div>
        </section>
      </div>
    `;
  },

  renderStats(statsEl) {
    statsEl.innerHTML = `
      <div class="admin-users-stat-card">
        <div class="admin-users-stat-label">Students</div>
        <div class="admin-users-stat-value">${this.students.length}</div>
      </div>
      <div class="admin-users-stat-card">
        <div class="admin-users-stat-label">Faculty</div>
        <div class="admin-users-stat-value">${this.faculties.length}</div>
      </div>
      <div class="admin-users-stat-card">
        <div class="admin-users-stat-label">Total Users</div>
        <div class="admin-users-stat-value">${this.students.length + this.faculties.length}</div>
      </div>
    `;
  },

  renderStudentsTable(studentsTableEl, query) {
    const normalizedQuery = (query || "").trim().toLowerCase();
    const filteredStudents = normalizedQuery
      ? this.students.filter((student) => [
          student.studentId,
          student.name,
          student.collegeEmail,
          student.personalEmail,
          student.branch
        ].some((field) => String(field || "").toLowerCase().includes(normalizedQuery)))
      : this.students;

    studentsTableEl.innerHTML = filteredStudents.length
      ? `
        <div class="admin-users-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Student ID</th><th>Name</th><th>Batch</th><th>College Email</th><th>Personal Email</th><th>Phone</th><th>DOB</th><th>Advisor ID</th><th>Term</th><th>Branch</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filteredStudents.map((student) => {
                const sid = this.escapeHtml(student.studentId);
                return `
                  <tr>
                    <td><input data-student-field="studentId" data-student-id="${sid}" value="${sid}" /></td>
                    <td><input data-student-field="name" data-student-id="${sid}" value="${this.escapeHtml(student.name || "")}" /></td>
                    <td><input data-student-field="batch" data-student-id="${sid}" type="number" min="1" value="${this.escapeHtml(student.batch || "")}" /></td>
                    <td><input data-student-field="collegeEmail" data-student-id="${sid}" value="${this.escapeHtml(student.collegeEmail || "")}" /></td>
                    <td><input data-student-field="personalEmail" data-student-id="${sid}" value="${this.escapeHtml(student.personalEmail || "")}" /></td>
                    <td><input data-student-field="phone" data-student-id="${sid}" value="${this.escapeHtml(student.phone || "")}" /></td>
                    <td><input data-student-field="dob" data-student-id="${sid}" type="date" value="${this.formatDateInput(student.dob)}" /></td>
                    <td><input data-student-field="advisorId" data-student-id="${sid}" value="${this.escapeHtml(student.advisorId || "")}" /></td>
                    <td><input data-student-field="currentTermNumber" data-student-id="${sid}" type="number" min="1" value="${this.escapeHtml(student.currentTermNumber || "")}" /></td>
                    <td><input data-student-field="branch" data-student-id="${sid}" value="${this.escapeHtml(student.branch || "")}" /></td>
                    <td>
                      <div style="display:flex; gap:8px;">
                        <button class="btn btn-primary" data-student-update="${sid}" type="button">Update</button>
                        <button class="btn btn-danger" data-student-delete="${sid}" type="button">Delete</button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
      `
      : '<div class="message info">No students match this search.</div>';
  },

  renderFacultyTable(facultyTableEl, query) {
    const normalizedQuery = (query || "").trim().toLowerCase();
    const filteredFaculty = normalizedQuery
      ? this.faculties.filter((faculty) => [
          faculty.facultyId,
          faculty.name,
          faculty.email,
          faculty.role,
          faculty.department
        ].some((field) => String(field || "").toLowerCase().includes(normalizedQuery)))
      : this.faculties;

    facultyTableEl.innerHTML = filteredFaculty.length
      ? `
        <div class="admin-users-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Faculty ID</th><th>Role</th><th>Name</th><th>Email</th><th>Phone</th><th>Department</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filteredFaculty.map((faculty) => {
                const fid = this.escapeHtml(faculty.facultyId);
                return `
                  <tr>
                    <td><input data-faculty-field="facultyId" data-faculty-id="${fid}" value="${fid}" /></td>
                    <td>
                      <select data-faculty-field="role" data-faculty-id="${fid}">
                        ${["Faculty", "HOD", "PIC_TT", "PIC_CDC", "PIC_EXAM"].map((r) => `<option value="${r}" ${r === faculty.role ? "selected" : ""}>${r}</option>`).join("")}
                      </select>
                    </td>
                    <td><input data-faculty-field="name" data-faculty-id="${fid}" value="${this.escapeHtml(faculty.name || "")}" /></td>
                    <td><input data-faculty-field="email" data-faculty-id="${fid}" value="${this.escapeHtml(faculty.email || "")}" /></td>
                    <td><input data-faculty-field="phone" data-faculty-id="${fid}" value="${this.escapeHtml(faculty.phone || "")}" /></td>
                    <td><input data-faculty-field="department" data-faculty-id="${fid}" value="${this.escapeHtml(faculty.department || "")}" /></td>
                    <td>
                      <div style="display:flex; gap:8px;">
                        <button class="btn btn-primary" data-faculty-update="${fid}" type="button">Update</button>
                        <button class="btn btn-danger" data-faculty-delete="${fid}" type="button">Delete</button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
      `
      : '<div class="message info">No faculty match this search.</div>';
  },

  bindTableActions(studentsTableEl, facultyTableEl, setMessage, load) {
    studentsTableEl.querySelectorAll("button[data-student-update]").forEach((button) => {
      button.addEventListener("click", async () => {
        const studentId = button.dataset.studentUpdate;
        const row = button.closest("tr");
        const getValue = (field) => row?.querySelector(`[data-student-field="${field}"]`)?.value;

        try {
          await API.updateAdminStudent(studentId, {
            studentId: (getValue("studentId") || "").trim(),
            name: (getValue("name") || "").trim(),
            batch: getValue("batch"),
            collegeEmail: (getValue("collegeEmail") || "").trim(),
            personalEmail: getValue("personalEmail"),
            phone: getValue("phone"),
            dob: getValue("dob"),
            advisorId: getValue("advisorId"),
            currentTermNumber: getValue("currentTermNumber"),
            branch: (getValue("branch") || "").trim()
          });

          setMessage("success", `Student ${studentId} updated successfully.`);
          await load();
        } catch (error) {
          setMessage("error", error.message);
        }
      });
    });

    studentsTableEl.querySelectorAll("button[data-student-delete]").forEach((button) => {
      button.addEventListener("click", async () => {
        const studentId = button.dataset.studentDelete;
        const confirmed = window.confirm(`Delete student ${studentId}? This cannot be undone.`);
        if (!confirmed) {
          return;
        }

        try {
          await API.deleteAdminStudent(studentId);
          setMessage("success", `Student ${studentId} deleted successfully.`);
          await load();
        } catch (error) {
          setMessage("error", error.message || "Failed to delete student");
        }
      });
    });

    facultyTableEl.querySelectorAll("button[data-faculty-update]").forEach((button) => {
      button.addEventListener("click", async () => {
        const facultyId = button.dataset.facultyUpdate;
        const row = button.closest("tr");
        const getValue = (field) => row?.querySelector(`[data-faculty-field="${field}"]`)?.value;

        try {
          await API.updateAdminFaculty(facultyId, {
            facultyId: (getValue("facultyId") || "").trim(),
            role: getValue("role"),
            name: (getValue("name") || "").trim(),
            email: getValue("email"),
            phone: getValue("phone"),
            department: getValue("department")
          });

          setMessage("success", `Faculty ${facultyId} updated successfully.`);
          await load();
        } catch (error) {
          setMessage("error", error.message);
        }
      });
    });

    facultyTableEl.querySelectorAll("button[data-faculty-delete]").forEach((button) => {
      button.addEventListener("click", async () => {
        const facultyId = button.dataset.facultyDelete;
        const confirmed = window.confirm(`Delete faculty ${facultyId}? This cannot be undone.`);
        if (!confirmed) {
          return;
        }

        try {
          await API.deleteAdminFaculty(facultyId);
          setMessage("success", `Faculty ${facultyId} deleted successfully.`);
          await load();
        } catch (error) {
          setMessage("error", error.message || "Failed to delete faculty");
        }
      });
    });
  },

  refreshView(studentsTableEl, facultyTableEl, statsEl, studentsSearchEl, facultySearchEl, setMessage, load) {
    this.renderStats(statsEl);
    this.renderStudentsTable(studentsTableEl, studentsSearchEl.value);
    this.renderFacultyTable(facultyTableEl, facultySearchEl.value);
    this.bindTableActions(studentsTableEl, facultyTableEl, setMessage, load);
  },

  async mount() {
    const messageEl = document.getElementById("adminUsersMessage");
    const studentsTableEl = document.getElementById("adminStudentsTable");
    const facultyTableEl = document.getElementById("adminFacultyTable");
    const addStudentForm = document.getElementById("adminAddStudentForm");
    const addFacultyForm = document.getElementById("adminAddFacultyForm");
    const bulkStudentsForm = document.getElementById("adminBulkStudentsForm");
    const bulkFacultyForm = document.getElementById("adminBulkFacultyForm");
    const statsEl = document.getElementById("adminUserStats");
    const studentsSearchEl = document.getElementById("adminStudentsSearch");
    const facultySearchEl = document.getElementById("adminFacultySearch");

    const setMessage = (type, text) => {
      messageEl.innerHTML = text ? `<div class="message ${type}">${this.escapeHtml(text)}</div>` : "";
    };

    const load = async () => {
      try {
        const data = await API.getAdminUsers();
        this.students = data.students || [];
        this.faculties = data.faculties || [];
        this.refreshView(studentsTableEl, facultyTableEl, statsEl, studentsSearchEl, facultySearchEl, setMessage, load);
      } catch (error) {
        studentsTableEl.innerHTML = "";
        facultyTableEl.innerHTML = "";
        statsEl.innerHTML = "";
        setMessage("error", error.message || "Failed to load user management data");
      }
    };

    studentsSearchEl.addEventListener("input", () => {
      this.renderStudentsTable(studentsTableEl, studentsSearchEl.value);
      this.bindTableActions(studentsTableEl, facultyTableEl, setMessage, load);
    });

    facultySearchEl.addEventListener("input", () => {
      this.renderFacultyTable(facultyTableEl, facultySearchEl.value);
      this.bindTableActions(studentsTableEl, facultyTableEl, setMessage, load);
    });

    addStudentForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      try {
        await API.createAdminStudent({
          studentId: document.getElementById("adminStudentId").value.trim(),
          password: document.getElementById("adminStudentPassword").value,
          name: document.getElementById("adminStudentName").value.trim(),
          batch: Number(document.getElementById("adminStudentBatch").value),
          collegeEmail: document.getElementById("adminStudentCollegeEmail").value.trim(),
          personalEmail: document.getElementById("adminStudentPersonalEmail").value.trim(),
          phone: document.getElementById("adminStudentPhone").value.trim(),
          dob: document.getElementById("adminStudentDob").value,
          advisorId: document.getElementById("adminStudentAdvisorId").value.trim(),
          currentTermNumber: Number(document.getElementById("adminStudentTerm").value),
          branch: document.getElementById("adminStudentBranch").value.trim()
        });

        addStudentForm.reset();
        setMessage("success", "Student added successfully.");
        await load();
      } catch (error) {
        setMessage("error", error.message);
      }
    });

    addFacultyForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      try {
        await API.createAdminFaculty({
          facultyId: document.getElementById("adminFacultyId").value.trim(),
          password: document.getElementById("adminFacultyPassword").value,
          role: document.getElementById("adminFacultyRole").value,
          name: document.getElementById("adminFacultyName").value.trim(),
          email: document.getElementById("adminFacultyEmail").value.trim(),
          phone: document.getElementById("adminFacultyPhone").value.trim(),
          department: document.getElementById("adminFacultyDepartment").value.trim()
        });

        addFacultyForm.reset();
        setMessage("success", "Faculty added successfully.");
        await load();
      } catch (error) {
        setMessage("error", error.message);
      }
    });

    bulkStudentsForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const fileInput = document.getElementById("adminBulkStudentsFile");
      const file = fileInput?.files?.[0];

      if (!file) {
        setMessage("error", "Please choose a student CSV/Excel file.");
        return;
      }

      try {
        const result = await API.uploadAdminStudentsFile(file);
        const summary = `Student upload complete. Inserted: ${result.insertedCount || 0}, Failed: ${result.failedCount || 0}, Skipped: ${result.skippedCount || 0}.`;
        setMessage("success", summary);
        bulkStudentsForm.reset();
        await load();
      } catch (error) {
        setMessage("error", error.message || "Student bulk upload failed");
      }
    });

    bulkFacultyForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const fileInput = document.getElementById("adminBulkFacultyFile");
      const file = fileInput?.files?.[0];

      if (!file) {
        setMessage("error", "Please choose a faculty CSV/Excel file.");
        return;
      }

      try {
        const result = await API.uploadAdminFacultyFile(file);
        const summary = `Faculty upload complete. Inserted: ${result.insertedCount || 0}, Failed: ${result.failedCount || 0}, Skipped: ${result.skippedCount || 0}.`;
        setMessage("success", summary);
        bulkFacultyForm.reset();
        await load();
      } catch (error) {
        setMessage("error", error.message || "Faculty bulk upload failed");
      }
    });

    await load();
  }
};
