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
            <div class="result-header">
              <div class="card-title result-title">Semester Result (1 - 8)</div>
              <button class="btn btn-primary result-download-btn" id="printResultBtn" type="button">Download Result PDF</button>
            </div>
            <div class="table-wrap">
              ${this.renderTable(results)}
            </div>
            <div id="resultPrintMessage"></div>
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
  },

  async mount() {
    const printBtn = document.getElementById("printResultBtn");
    const messageEl = document.getElementById("resultPrintMessage");

    if (!printBtn) {
      return;
    }

    const setMessage = (type, text) => {
      if (!messageEl) {
        return;
      }
      messageEl.innerHTML = text ? `<div class="message ${type}">${text}</div>` : "";
    };

    printBtn.addEventListener("click", async () => {
      const defaultLabel = "Download Result PDF";
      printBtn.disabled = true;
      printBtn.textContent = "Generating PDF...";
      setMessage("info", "Preparing PDF...");

      try {
        if (!window.jspdf || !window.jspdf.jsPDF) {
          throw new Error("PDF library is not loaded");
        }

        const [{ results = [] } = {}, { student = {} } = {}, { transcript = [] } = {}] = await Promise.all([
          API.getResults(),
          API.getStudentDetails(),
          API.getTranscript()
        ]);

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

        const left = 8;
        const right = 202;
        const pageBottom = 285;
        let y = 12;

        const truncate = (text, maxLen) => {
          const value = String(text == null ? "" : text);
          return value.length > maxLen ? `${value.slice(0, maxLen - 1)}.` : value;
        };

        const drawMainHeader = () => {
          doc.setFont("times", "bold");
          doc.setFontSize(11);
          doc.text("INDIAN INSTITUTE OF TECHNOLOGY BHUBANESWAR", 105, y, { align: "center" });
          y += 5;

          doc.setFont("times", "bold");
          doc.setFontSize(9);
          doc.text("Performance Details", 105, y, { align: "center" });
          y += 3;

          doc.rect(left, y, right - left, 10);
          doc.setFont("times", "bold");
          doc.setFontSize(7);
          doc.text(`Roll No.: ${student.studentId || student.id || "-"}`, left + 2, y + 4);
          doc.text(`Name: ${truncate(student.name || "-", 28)}`, left + 42, y + 4);
          doc.text(`Department: ${truncate(student.branch || "-", 24)}`, left + 96, y + 4);
          doc.text(`Generated: ${new Date().toLocaleDateString()}`, left + 152, y + 4);
          y += 13;
        };

        const ensureSpace = (requiredHeight) => {
          if (y + requiredHeight <= pageBottom) {
            return;
          }
          doc.addPage();
          y = 12;
          drawMainHeader();
        };

        const resultMap = new Map((Array.isArray(results) ? results : []).map((r) => [Number(r.semNumber), r]));
        const transcriptRows = Array.isArray(transcript) ? transcript : [];
        const termNumbers = [...new Set([
          ...transcriptRows.map((row) => Number(row.termNumber)).filter((n) => !Number.isNaN(n)),
          ...Array.from(resultMap.keys())
        ])].sort((a, b) => a - b);

        drawMainHeader();

        termNumbers.forEach((termNumber) => {
          const rowsForTerm = transcriptRows
            .filter((row) => Number(row.termNumber) === termNumber)
            .sort((a, b) => String(a.courseId || "").localeCompare(String(b.courseId || "")));

          const rowHeight = 6;
          const sectionHeight = 8 + rowHeight + Math.max(rowsForTerm.length, 1) * rowHeight + 9;
          ensureSpace(sectionHeight + 2);

          doc.setFont("times", "bold");
          doc.setFontSize(8);
          doc.setFillColor(225, 225, 225);
          doc.rect(left, y, right - left, 6, "F");
          doc.rect(left, y, right - left, 6);
          doc.text(`Semester : ${termNumber}`, left + 2, y + 4.2);
          y += 6;

          const columns = [
            { label: "Subno", width: 28 },
            { label: "Subject Name", width: 104 },
            { label: "Credit", width: 20 },
            { label: "Grade", width: 20 },
            { label: "Status", width: 22 }
          ];

          let x = left;
          doc.setFont("times", "bold");
          doc.setFontSize(7);
          columns.forEach((col) => {
            doc.rect(x, y, col.width, rowHeight);
            doc.text(col.label, x + 1.5, y + 4);
            x += col.width;
          });
          y += rowHeight;

          const termResult = resultMap.get(termNumber) || {};
          const safeRows = rowsForTerm.length ? rowsForTerm : [{ courseId: "-", courseName: "No subjects found", credits: "-", grade: "-" }];
          const isSemesterCompleted = termResult && termResult.sgpa != null;
          const semesterStatus = isSemesterCompleted ? "Completed" : "Registered";
          doc.setFont("times", "normal");
          safeRows.forEach((row) => {
            let cellX = left;
            const cells = [
              truncate(row.courseId || "-", 12),
              truncate(row.courseName || "-", 50),
              String(row.credits == null ? "-" : row.credits),
              String(row.grade || "-"),
              semesterStatus
            ];

            columns.forEach((col, index) => {
              doc.rect(cellX, y, col.width, rowHeight);
              doc.text(cells[index], cellX + 1.5, y + 4);
              cellX += col.width;
            });

            y += rowHeight;
          });

          const sgpa = termResult.sgpa == null ? "-" : Number(termResult.sgpa).toFixed(2);
          const cgpa = termResult.cgpa == null ? "-" : Number(termResult.cgpa).toFixed(2);

          doc.setFont("times", "bold");
          doc.rect(left, y, right - left, 7);
          doc.text("Performance Summary", left + 2, y + 4.5);
          doc.text(`SGPA: ${sgpa}`, left + 96, y + 4.5);
          doc.text(`CGPA: ${cgpa}`, left + 138, y + 4.5);
          y += 10;
        });

        if (termNumbers.length === 0) {
          doc.setFont("times", "normal");
          doc.setFontSize(9);
          doc.text("No result/transcript data available.", left, y + 4);
        }

        const fileBase = String(student.studentId || student.id || "student").replace(/[^a-zA-Z0-9_-]/g, "_");
        doc.save(`${fileBase}_result.pdf`);
        setMessage("success", "Result PDF downloaded successfully.");
      } catch (error) {
        setMessage("error", error.message || "Failed to generate result PDF");
      } finally {
        printBtn.disabled = false;
        printBtn.textContent = defaultLabel;
      }
    });
  }
};
