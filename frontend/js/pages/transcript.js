const TranscriptPage = {
  id: "transcript",
  transcriptData: [],
  selectedTerm: "all",

  getFilteredTranscript() {
    if (this.selectedTerm === "all") {
      return this.transcriptData;
    }

    const termNumber = Number(this.selectedTerm);
    return this.transcriptData.filter(record => Number(record.termNumber) === termNumber);
  },

  renderTable(records) {
    if (records.length === 0) {
      return `
        <div class="message info" style="margin-top: 20px;">No transcript records found for the selected term.</div>
      `;
    }

    let tableHtml = `
      <table>
        <thead>
          <tr>
            <th>Course ID</th>
            <th>Course Name</th>
            <th>Credits</th>
            <th>Mid Sem</th>
            <th>End Sem</th>
            <th>Internal</th>
            <th>Total</th>
            <th>Grade</th>
            <th>Term</th>
          </tr>
        </thead>
        <tbody>
    `;

    records.forEach(record => {
      const gradeColor = ['EX', 'A'].includes(record.grade)
        ? '#4caf50'
        : ['B', 'C'].includes(record.grade)
          ? '#ff9800'
          : '#f44336';
      const midSem = record.scores.midSem ?? '-';
      const endSem = record.scores.endSem ?? '-';
      const internal = record.scores.internal ?? '-';
      const total = record.scores.total ?? '-';
      const grade = record.grade ?? '-';

      tableHtml += `
        <tr>
          <td>${record.courseId}</td>
          <td>${record.courseName}</td>
          <td>${record.credits}</td>
          <td>${midSem}</td>
          <td>${endSem}</td>
          <td>${internal}</td>
          <td><strong>${total}</strong></td>
          <td><strong style="color: ${gradeColor};">${grade}</strong></td>
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
      const response = await API.getTranscript();
      this.transcriptData = response.transcript || [];

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
            <div class="card-title">Academic Transcript</div>
            <div class="form-group" style="max-width: 240px; margin-bottom: 20px;">
              <label for="termSelect">Select Term</label>
              <select id="termSelect">
                ${optionsHtml}
              </select>
            </div>
            <div id="transcriptTableWrap">
              ${this.renderTable(this.getFilteredTranscript())}
            </div>
          </div>
        </div>
      `;
    } catch (error) {
      return `
        <div class="container">
          <div class="message error">Error loading transcript: ${error.message}</div>
        </div>
      `;
    }
  },

  mount() {
    const select = document.getElementById("termSelect");
    const tableWrap = document.getElementById("transcriptTableWrap");

    if (!select || !tableWrap) {
      return;
    }

    select.value = this.selectedTerm;

    select.addEventListener("change", () => {
      this.selectedTerm = select.value;
      tableWrap.innerHTML = this.renderTable(this.getFilteredTranscript());
    });
  }
};
