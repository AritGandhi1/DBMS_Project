const AdminFeedbackPage = {
  id: "admin-feedback",

  feedbacks: [],

  escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  },

  formatDate(value) {
    if (!value) {
      return "-";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return this.escapeHtml(String(value));
    }

    return this.escapeHtml(date.toLocaleDateString());
  },

  async render() {
    return `
      <div class="container admin-users-page">
        <section class="card admin-users-hero">
          <div>
            <p class="admin-users-kicker">Administration</p>
            <h2 class="card-title admin-users-title">Student Feedback</h2>
            <p class="admin-users-subtitle">Review submitted course feedback from students across all offerings.</p>
          </div>
          <div class="admin-users-stats" id="adminFeedbackStats"></div>
        </section>

        <div id="adminFeedbackMessage"></div>

        <section class="card admin-users-panel">
          <div class="admin-users-table-header">
            <div class="card-title admin-users-section-title">Course-wise Average Rating</div>
          </div>
          <div id="adminFeedbackCourseAverages"></div>
        </section>

        <section class="card admin-users-panel">
          <div class="admin-users-table-header">
            <div class="card-title admin-users-section-title">Submitted Feedback</div>
            <input id="adminFeedbackSearch" class="admin-users-search" placeholder="Search by student, course, faculty, or comment" />
          </div>
          <div id="adminFeedbackTable"></div>
        </section>
      </div>
    `;
  },

  renderStats(statsEl) {
    const total = this.feedbacks.length;
    const commented = this.feedbacks.filter((item) => String(item.comment || "").trim() !== "").length;
    const uniqueCourses = new Set(
      this.feedbacks.map((item) => `${String(item.courseId || "").trim()}|${String(item.termNumber || "").trim()}`)
    ).size;

    statsEl.innerHTML = `
      <div class="admin-users-stat-card">
        <div class="admin-users-stat-label">Total Feedback</div>
        <div class="admin-users-stat-value">${total}</div>
      </div>
      <div class="admin-users-stat-card">
        <div class="admin-users-stat-label">Courses Rated</div>
        <div class="admin-users-stat-value">${uniqueCourses}</div>
      </div>
      <div class="admin-users-stat-card">
        <div class="admin-users-stat-label">With Comment</div>
        <div class="admin-users-stat-value">${commented}</div>
      </div>
    `;
  },

  renderCourseAverages(containerEl) {
    const grouped = new Map();

    this.feedbacks.forEach((item) => {
      const courseId = String(item.courseId || "").trim();
      const termNumber = String(item.termNumber || "").trim();
      const key = `${courseId}|${termNumber}`;

      if (!grouped.has(key)) {
        grouped.set(key, {
          courseId,
          courseName: String(item.courseName || "").trim(),
          termNumber,
          totalRating: 0,
          count: 0
        });
      }

      const group = grouped.get(key);
      group.totalRating += Number(item.rating || 0);
      group.count += 1;
    });

    const rows = Array.from(grouped.values())
      .map((group) => ({
        ...group,
        average: group.count > 0 ? (group.totalRating / group.count).toFixed(2) : "0.00"
      }))
      .sort((a, b) => {
        if (a.termNumber !== b.termNumber) {
          return Number(b.termNumber || 0) - Number(a.termNumber || 0);
        }
        return String(a.courseId).localeCompare(String(b.courseId));
      });

    containerEl.innerHTML = rows.length
      ? `
        <div class="admin-users-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Course</th>
                <th>Term</th>
                <th>Average Rating</th>
                <th>Responses</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map((row) => `
                <tr>
                  <td>${this.escapeHtml(row.courseId)}<br /><span style="color:#7a8796; font-size: 12px;">${this.escapeHtml(row.courseName)}</span></td>
                  <td>${this.escapeHtml(row.termNumber || "-")}</td>
                  <td>${this.escapeHtml(row.average)}/5</td>
                  <td>${this.escapeHtml(row.count)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `
      : '<div class="message info">No feedback records available for course-wise averages.</div>';
  },

  renderTable(tableEl, query) {
    const normalizedQuery = String(query || "").trim().toLowerCase();

    const filtered = normalizedQuery
      ? this.feedbacks.filter((item) => [
          item.studentId,
          item.studentName,
          item.courseId,
          item.courseName,
          item.facultyId,
          item.facultyName,
          item.comment,
          item.termNumber,
          item.rating
        ].some((field) => String(field || "").toLowerCase().includes(normalizedQuery)))
      : this.feedbacks;

    tableEl.innerHTML = filtered.length
      ? `
        <div class="admin-users-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Course</th>
                <th>Faculty</th>
                <th>Term</th>
                <th>Rating</th>
                <th>Comment</th>
                <th>Submitted On</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map((item) => `
                <tr>
                  <td>${this.escapeHtml(item.studentId)}<br /><span style="color:#7a8796; font-size: 12px;">${this.escapeHtml(item.studentName)}</span></td>
                  <td>${this.escapeHtml(item.courseId)}<br /><span style="color:#7a8796; font-size: 12px;">${this.escapeHtml(item.courseName)}</span></td>
                  <td>${this.escapeHtml(item.facultyId || "-")}<br /><span style="color:#7a8796; font-size: 12px;">${this.escapeHtml(item.facultyName || "Unassigned")}</span></td>
                  <td>${this.escapeHtml(item.termNumber || "-")}</td>
                  <td>${this.escapeHtml(item.rating || 0)}/5</td>
                  <td style="min-width: 240px; white-space: normal;">${this.escapeHtml(item.comment || "-")}</td>
                  <td>${this.formatDate(item.submittedOn)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `
      : '<div class="message info">No feedback records match this search.</div>';
  },

  async mount() {
    const messageEl = document.getElementById("adminFeedbackMessage");
    const statsEl = document.getElementById("adminFeedbackStats");
    const courseAveragesEl = document.getElementById("adminFeedbackCourseAverages");
    const tableEl = document.getElementById("adminFeedbackTable");
    const searchEl = document.getElementById("adminFeedbackSearch");

    const setMessage = (type, text) => {
      messageEl.innerHTML = text ? `<div class="message ${type}">${this.escapeHtml(text)}</div>` : "";
    };

    const load = async () => {
      try {
        const response = await API.getAdminFeedbackList();
        this.feedbacks = response.feedbacks || [];
        this.renderStats(statsEl);
        this.renderCourseAverages(courseAveragesEl);
        this.renderTable(tableEl, searchEl.value);
      } catch (error) {
        this.feedbacks = [];
        statsEl.innerHTML = "";
        courseAveragesEl.innerHTML = "";
        tableEl.innerHTML = "";
        setMessage("error", error.message || "Failed to load feedback records");
      }
    };

    searchEl.addEventListener("input", () => {
      this.renderTable(tableEl, searchEl.value);
    });

    await load();
  }
};
