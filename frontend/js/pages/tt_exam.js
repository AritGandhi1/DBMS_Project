const TTExamPage = {
  id: "tt-exam",

  renderOfferingOptions(offerings, selectedOfferingId) {
    const selected = String(selectedOfferingId || "");
    const options = (offerings || []).map((offering) => {
      const offeringId = String(offering.offeringId || "");
      const courseId = String(offering.courseId || "");
      const selectedAttr = offeringId === selected ? "selected" : "";
      return `<option value="${offeringId}" ${selectedAttr}>${offeringId} (${courseId})</option>`;
    }).join("");

    return `<option value="" disabled ${selected ? "" : "selected"}>${options ? "Select Offering" : "No Offerings Available"}</option>${options}`;
  },

  async render() {
    return `
      <div class="container">
        <div class="card">
          <div class="card-title">Exam Timetable Management</div>
          <div id="ttExamMessage"></div>
          <div class="card" style="margin-top: 12px;">
            <div class="card-title" style="font-size: 18px;">Add New Exam Slot</div>
            <form id="ttExamCreateForm">
              <div class="card-grid">
                <div class="form-group">
                  <label for="ttExamOfferingId">Offering ID</label>
                  <select id="ttExamOfferingId" required></select>
                </div>
                <div class="form-group">
                  <label for="ttExamType">Exam Type</label>
                  <select id="ttExamType" required>
                    <option value="MidSem">MidSem</option>
                    <option value="EndSem">EndSem</option>
                    <option value="Supplementary">Supplementary</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="ttExamDate">Exam Date</label>
                  <input id="ttExamDate" type="date" required />
                </div>
                <div class="form-group">
                  <label for="ttExamTime">Exam Time</label>
                  <input id="ttExamTime" type="time" required />
                </div>
                <div class="form-group">
                  <label for="ttExamVenue">Venue</label>
                  <input id="ttExamVenue" required />
                </div>
              </div>
              <button class="btn btn-primary" type="submit">Add Exam Schedule</button>
            </form>
          </div>
          <div class="card" style="margin-top: 12px;">
            <div class="card-title" style="font-size: 18px;">Current Exam Timetable</div>
            <div id="ttExamTable"></div>
          </div>
        </div>
      </div>
    `;
  },

  async mount() {
    const msgEl = document.getElementById("ttExamMessage");
    const tableEl = document.getElementById("ttExamTable");
    const form = document.getElementById("ttExamCreateForm");
    const offeringSelectEl = document.getElementById("ttExamOfferingId");

    const setMessage = (type, text) => {
      msgEl.innerHTML = text ? `<div class="message ${type}">${text}</div>` : "";
    };

    const load = async () => {
      try {
        const [examData, offeringData] = await Promise.all([
          API.getPicTtExamTimetable(),
          API.getPicTtOfferings()
        ]);
        const schedules = examData.schedules || [];
        const offerings = offeringData.offerings || [];

        offeringSelectEl.innerHTML = this.renderOfferingOptions(offerings, "");

        tableEl.innerHTML = schedules.length
          ? `
            <table>
              <thead>
                <tr>
                  <th>Exam ID</th><th>Offering</th><th>Course</th><th>Term</th><th>Type</th><th>Date</th><th>Time</th><th>Venue</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${schedules.map((s) => `
                  <tr>
                    <td>${s.examId}</td>
                    <td>${s.offeringId} (${s.courseId})</td>
                    <td>${s.courseId} - ${s.courseName}</td>
                    <td>${s.termNumber}</td>
                    <td>
                      <select data-exam-field="examType" data-exam-id="${s.examId}">
                        ${["MidSem", "EndSem", "Supplementary"].map((t) => `<option value="${t}" ${t === s.examType ? "selected" : ""}>${t}</option>`).join("")}
                      </select>
                    </td>
                    <td><input data-exam-field="examDate" data-exam-id="${s.examId}" type="date" value="${String(s.examDate || "").slice(0, 10)}" /></td>
                    <td><input data-exam-field="examTime" data-exam-id="${s.examId}" type="time" value="${String(s.examTime || "").slice(0, 5)}" /></td>
                    <td><input data-exam-field="venue" data-exam-id="${s.examId}" value="${s.venue || ""}" /></td>
                    <td>
                      <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; width: 100%;">
                        <button class="btn btn-primary" data-exam-update-id="${s.examId}">Update</button>
                        <button class="btn btn-danger" data-exam-delete-id="${s.examId}">Delete</button>
                      </div>
                    </td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          `
          : '<div class="message info">No exam timetable entries found.</div>';

        tableEl.querySelectorAll("button[data-exam-update-id]").forEach((btn) => {
          btn.addEventListener("click", async () => {
            const examId = btn.dataset.examUpdateId;
            const examTypeEl = tableEl.querySelector(`select[data-exam-field=\"examType\"][data-exam-id=\"${examId}\"]`);
            const examDateEl = tableEl.querySelector(`input[data-exam-field=\"examDate\"][data-exam-id=\"${examId}\"]`);
            const examTimeEl = tableEl.querySelector(`input[data-exam-field=\"examTime\"][data-exam-id=\"${examId}\"]`);
            const venueEl = tableEl.querySelector(`input[data-exam-field=\"venue\"][data-exam-id=\"${examId}\"]`);

            try {
              await API.updatePicTtExamTimetable(examId, {
                examType: examTypeEl?.value,
                examDate: examDateEl?.value,
                examTime: examTimeEl?.value,
                venue: venueEl?.value?.trim()
              });
              setMessage("success", "Exam timetable updated.");
              await load();
            } catch (error) {
              setMessage("error", error.message);
            }
          });
        });

        tableEl.querySelectorAll("button[data-exam-delete-id]").forEach((btn) => {
          btn.addEventListener("click", async () => {
            const examId = Number(btn.dataset.examDeleteId);
            if (!window.confirm(`Delete exam entry ${examId}?`)) {
              return;
            }

            try {
              await API.deletePicTtExamTimetable(examId);
              setMessage("success", "Exam timetable entry deleted.");
              await load();
            } catch (error) {
              setMessage("error", error.message);
            }
          });
        });
      } catch (error) {
        tableEl.innerHTML = "";
        setMessage("error", error.message);
      }
    };

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      try {
        await API.createPicTtExamTimetable({
          offeringId: Number(document.getElementById("ttExamOfferingId").value),
          examType: document.getElementById("ttExamType").value,
          examDate: document.getElementById("ttExamDate").value,
          examTime: document.getElementById("ttExamTime").value,
          venue: document.getElementById("ttExamVenue").value.trim()
        });
        form.reset();
        setMessage("success", "Exam timetable entry added.");
        await load();
      } catch (error) {
        setMessage("error", error.message);
      }
    });

    await load();
  }
};
