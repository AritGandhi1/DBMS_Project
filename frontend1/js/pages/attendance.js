const AttendancePage = {
  id: "attendance",
  attendanceData: [],
  selectedTerm: "all",

  getFilteredAttendance() {
    if (this.selectedTerm === "all") {
      return this.attendanceData;
    }

    const termNumber = Number(this.selectedTerm);
    return this.attendanceData.filter(record => Number(record.termNumber) === termNumber);
  },

  renderTable(records) {
    if (records.length === 0) {
      return `
        <div class="message info" style="margin-top: 20px;">No attendance records found for the selected term.</div>
      `;
    }

    let tableHtml = `
      <table>
        <thead>
          <tr>
            <th>Course ID</th>
            <th>Course Name</th>
            <th>Credits</th>
            <th>Classes Attended / Total Conducted</th>
            <th>Faculty</th>
            <th>Term</th>
          </tr>
        </thead>
        <tbody>
    `;

    records.forEach(record => {
      const attended = Number(record.classesAttendedCount || 0);
      const total = Number(record.totalClassesConducted || 0);
      const attendancePercent = total > 0 ? ((attended / total) * 100).toFixed(0) : "0";
      const color = attendancePercent >= 75 ? '#4caf50' : attendancePercent >= 50 ? '#ff9800' : '#f44336';

      tableHtml += `
        <tr>
          <td>${record.courseId}</td>
          <td>${record.courseName}</td>
          <td>${record.credits}</td>
          <td><strong style="color: ${color};">${attended}/${total} (${attendancePercent}%)</strong></td>
          <td>${record.facultyName}</td>
          <td>${record.termNumber}</td>
        </tr>
      `;
    });

    tableHtml += `
        </tbody>
      </table>
    `;

    return tableHtml;
  },

  async render() {
    try {
      const response = await API.getAttendance();
      this.attendanceData = response.attendance || [];

      const optionsHtml = [
        '<option value="all">All Terms</option>',
        ...Array.from({ length: 10 }, (_, index) => {
          const term = index + 1;
          return `<option value="${term}">Term ${term}</option>`;
        })
      ].join('');

      return `
        <div class="container">
          <div class="card">
            <div class="card-title">My Attendance</div>
            <div class="form-group" style="max-width: 240px; margin-bottom: 20px;">
              <label for="attendanceTermSelect">Select Term</label>
              <select id="attendanceTermSelect">
                ${optionsHtml}
              </select>
            </div>
            <div id="attendanceTableWrap">
              ${this.renderTable(this.getFilteredAttendance())}
            </div>
          </div>
        </div>
      `;
    } catch (error) {
      return `
        <div class="container">
          <div class="message error">Error loading attendance: ${error.message}</div>
        </div>
      `;
    }
  },

  mount() {
    const select = document.getElementById("attendanceTermSelect");
    const tableWrap = document.getElementById("attendanceTableWrap");

    if (!select || !tableWrap) {
      return;
    }

    select.value = this.selectedTerm;

    select.addEventListener("change", () => {
      this.selectedTerm = select.value;
      tableWrap.innerHTML = this.renderTable(this.getFilteredAttendance());
    });
  }
};
