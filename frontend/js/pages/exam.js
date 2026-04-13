const ExamPage = {
  id: "exam",

  formatDate(dateValue) {
    return dateValue ? new Date(dateValue).toLocaleDateString() : "N/A";
  },

  formatTime(timeValue) {
    if (!timeValue) return "N/A";
    const raw = String(timeValue);
    const date = new Date(`1970-01-01T${raw}`);
    if (Number.isNaN(date.getTime())) {
      return raw;
    }

    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  },

  renderTable(records, emptyMessage) {
    if (!records.length) {
      return `<div class="message info" style="margin-top: 20px;">${emptyMessage}</div>`;
    }

    let rowsHtml = "";

    records.forEach((record) => {
      rowsHtml += `
        <tr>
          <td>${record.courseId}</td>
          <td>${record.courseName}</td>
          <td>${record.termNumber}</td>
          <td>${this.formatDate(record.examDate)}</td>
          <td>${this.formatTime(record.examTime)}</td>
          <td>${record.venue || "TBA"}</td>
        </tr>
      `;
    });

    return `
      <table>
        <thead>
          <tr>
            <th>Course ID</th>
            <th>Course Name</th>
            <th>Term</th>
            <th>Date</th>
            <th>Time</th>
            <th>Venue</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    `;
  },

  async render() {
    try {
      const response = await API.getExamSchedule();
      const midSemExams = response.midSemExams || [];
      const endSemExams = response.endSemExams || [];

      return `
        <div class="container">
          <div class="card">
            <div class="card-title">Mid Sem Exam Schedule</div>
            ${this.renderTable(midSemExams, "No Mid Sem exams found for enrolled subjects.")}
          </div>

          <div class="card">
            <div class="card-title">End Sem Exam Schedule</div>
            ${this.renderTable(endSemExams, "No End Sem exams found for enrolled subjects.")}
          </div>
        </div>
      `;
    } catch (error) {
      return `
        <div class="container">
          <div class="message error">Error loading exam schedule: ${error.message}</div>
        </div>
      `;
    }
  }
};