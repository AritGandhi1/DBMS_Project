const TimetablePage = {
  id: "timetable",
  timetableData: [],

  getDayOrder(day) {
    const order = {
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5
    };

    return order[day] || 99;
  },

  renderTable(records) {
    if (records.length === 0) {
      return `
        <div class="message info" style="margin-top: 20px;">No timetable found for the current term.</div>
      `;
    }

    let tableHtml = `
      <table>
        <thead>
          <tr>
            <th>Day</th>
            <th>Time</th>
            <th>Course ID</th>
            <th>Course Name</th>
            <th>Credits</th>
            <th>Faculty</th>
            <th>Room</th>
          </tr>
        </thead>
        <tbody>
    `;

    records.forEach((record) => {
      tableHtml += `
        <tr>
          <td>${record.day}</td>
          <td>${record.startTime} - ${record.endTime}</td>
          <td>${record.courseId}</td>
          <td>${record.courseName}</td>
          <td>${record.credits}</td>
          <td>${record.facultyName}</td>
          <td>${record.roomId}</td>
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
      const response = await API.getTimetable();
      this.timetableData = response.timetable || [];
      const currentTermNumber = response.currentTermNumber;

      const records = [...this.timetableData].sort((left, right) => {
        const dayDiff = this.getDayOrder(left.day) - this.getDayOrder(right.day);
        if (dayDiff !== 0) return dayDiff;
        return String(left.startTime).localeCompare(String(right.startTime));
      });

      return `
        <div class="container">
          <div class="card">
            <div class="card-title">Timetable ${currentTermNumber ? `(Term ${currentTermNumber})` : ''}</div>
            ${this.renderTable(records)}
          </div>
        </div>
      `;
    } catch (error) {
      return `
        <div class="container">
          <div class="message error">Error loading timetable: ${error.message}</div>
        </div>
      `;
    }
  }
};