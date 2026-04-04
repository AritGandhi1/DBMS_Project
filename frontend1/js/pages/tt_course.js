const TTCoursePage = {
  id: "tt-course",

  async render() {
    return `
      <div class="container">
        <div class="card">
          <div class="card-title">Course Timetable Management</div>
          <div id="ttCourseMessage"></div>
          <div class="card" style="margin-top: 12px;">
            <div class="card-title" style="font-size: 18px;">Add New Course Slot</div>
            <form id="ttCourseCreateForm">
              <div class="card-grid">
                <div class="form-group">
                  <label for="ttCourseOfferingId">Offering ID</label>
                  <input id="ttCourseOfferingId" type="number" min="1" required />
                </div>
                <div class="form-group">
                  <label for="ttCourseDay">Day</label>
                  <select id="ttCourseDay" required>
                    <option value="Mon">Mon</option>
                    <option value="Tue">Tue</option>
                    <option value="Wed">Wed</option>
                    <option value="Thu">Thu</option>
                    <option value="Fri">Fri</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="ttCourseStartTime">Start Time</label>
                  <input id="ttCourseStartTime" type="time" required />
                </div>
                <div class="form-group">
                  <label for="ttCourseEndTime">End Time</label>
                  <input id="ttCourseEndTime" type="time" required />
                </div>
                <div class="form-group">
                  <label for="ttCourseRoomId">Room ID</label>
                  <input id="ttCourseRoomId" required />
                </div>
              </div>
              <button class="btn btn-primary" type="submit">Add Course Schedule</button>
            </form>
          </div>
          <div class="card" style="margin-top: 12px;">
            <div class="card-title" style="font-size: 18px;">Current Course Timetable</div>
            <div id="ttCourseTable"></div>
          </div>
        </div>
      </div>
    `;
  },

  async mount() {
    const msgEl = document.getElementById("ttCourseMessage");
    const tableEl = document.getElementById("ttCourseTable");
    const form = document.getElementById("ttCourseCreateForm");

    const setMessage = (type, text) => {
      msgEl.innerHTML = text ? `<div class="message ${type}">${text}</div>` : "";
    };

    const load = async () => {
      try {
        const data = await API.getPicTtCourseTimetable();
        const schedules = data.schedules || [];

        tableEl.innerHTML = schedules.length
          ? `
            <table>
              <thead>
                <tr>
                  <th>TT ID</th><th>Offering</th><th>Course</th><th>Term</th><th>Day</th><th>Time</th><th>Room</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${schedules.map((s) => `
                  <tr>
                    <td>${s.timetableId}</td>
                    <td>${s.offeringId}</td>
                    <td>${s.courseId} - ${s.courseName}</td>
                    <td>${s.termNumber}</td>
                    <td>
                      <select data-tt-field="day" data-tt-id="${s.timetableId}">
                        ${["Mon", "Tue", "Wed", "Thu", "Fri"].map((d) => `<option value="${d}" ${d === s.day ? "selected" : ""}>${d}</option>`).join("")}
                      </select>
                    </td>
                    <td>
                      <input data-tt-field="startTime" data-tt-id="${s.timetableId}" type="time" value="${String(s.startTime || "").slice(0, 5)}" style="margin-bottom:6px;" />
                      <input data-tt-field="endTime" data-tt-id="${s.timetableId}" type="time" value="${String(s.endTime || "").slice(0, 5)}" />
                    </td>
                    <td>
                      <input data-tt-field="roomId" data-tt-id="${s.timetableId}" value="${s.roomId || ""}" />
                    </td>
                    <td>
                      <button class="btn btn-primary" data-tt-update-id="${s.timetableId}">Update</button>
                    </td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          `
          : '<div class="message info">No course timetable entries found.</div>';

        tableEl.querySelectorAll("button[data-tt-update-id]").forEach((btn) => {
          btn.addEventListener("click", async () => {
            const timetableId = btn.dataset.ttUpdateId;
            const dayEl = tableEl.querySelector(`select[data-tt-field=\"day\"][data-tt-id=\"${timetableId}\"]`);
            const startEl = tableEl.querySelector(`input[data-tt-field=\"startTime\"][data-tt-id=\"${timetableId}\"]`);
            const endEl = tableEl.querySelector(`input[data-tt-field=\"endTime\"][data-tt-id=\"${timetableId}\"]`);
            const roomEl = tableEl.querySelector(`input[data-tt-field=\"roomId\"][data-tt-id=\"${timetableId}\"]`);

            try {
              await API.updatePicTtCourseTimetable(timetableId, {
                day: dayEl?.value,
                startTime: startEl?.value,
                endTime: endEl?.value,
                roomId: roomEl?.value?.trim()
              });
              setMessage("success", "Course timetable updated.");
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
        await API.createPicTtCourseTimetable({
          offeringId: Number(document.getElementById("ttCourseOfferingId").value),
          day: document.getElementById("ttCourseDay").value,
          startTime: document.getElementById("ttCourseStartTime").value,
          endTime: document.getElementById("ttCourseEndTime").value,
          roomId: document.getElementById("ttCourseRoomId").value.trim()
        });
        form.reset();
        setMessage("success", "Course timetable entry added.");
        await load();
      } catch (error) {
        setMessage("error", error.message);
      }
    });

    await load();
  }
};
