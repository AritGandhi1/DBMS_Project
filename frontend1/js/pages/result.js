const ResultPage = {
  id: "result",

  renderTable(results) {
    if (!results || results.length === 0) {
      return `
        <div class="message info" style="margin-top: 20px;">No result data found.</div>
      `;
    }

    let tableHtml = `
      <table>
        <thead>
          <tr>
            <th>Semester</th>
            <th>SGPA</th>
            <th>CGPA</th>
          </tr>
        </thead>
        <tbody>
    `;

    results.forEach((row) => {
      const sgpa = row.sgpa == null ? "-" : Number(row.sgpa).toFixed(2);
      const cgpa = row.cgpa == null ? "-" : Number(row.cgpa).toFixed(2);

      tableHtml += `
        <tr>
          <td>${row.semNumber}</td>
          <td>${sgpa}</td>
          <td>${cgpa}</td>
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
      const response = await API.getResults();
      const results = response.results || [];

      return `
        <div class="container">
          <div class="card">
            <div class="card-title">Semester Result (1 - 8)</div>
            ${this.renderTable(results)}
          </div>
        </div>
      `;
    } catch (error) {
      return `
        <div class="container">
          <div class="message error">Error loading results: ${error.message}</div>
        </div>
      `;
    }
  }
};
