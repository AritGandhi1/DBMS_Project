const TTCoursePage = {
  id: "tt-course",

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

  renderRoomOptions(rooms, selectedRoomId) {
    const selected = String(selectedRoomId || "");
    const roomOptions = (rooms || []).map((room) => {
      const roomId = String(room.roomId || "");
      const capacity = room.capacity == null ? "N/A" : room.capacity;
      const selectedAttr = roomId === selected ? "selected" : "";
      return `<option value="${roomId}" ${selectedAttr}>${roomId} (${capacity})</option>`;
    }).join("");

    if (!selected && roomOptions) {
      return `<option value="" disabled selected>Select Room</option>${roomOptions}`;
    }

    if (selected && !roomOptions.includes(`value="${selected}"`)) {
      return `<option value="${selected}" selected>${selected}</option>${roomOptions}`;
    }

    return `<option value="" disabled ${roomOptions ? "" : "selected"}>${roomOptions ? "Select Room" : "No Rooms Available"}</option>${roomOptions}`;
  },

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
                  <select id="ttCourseOfferingId" required></select>
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
                  <select id="ttCourseRoomId" required></select>
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
    const roomSelectEl = document.getElementById("ttCourseRoomId");
    const offeringSelectEl = document.getElementById("ttCourseOfferingId");

    const setMessage = (type, text) => {
      msgEl.innerHTML = text ? `<div class="message ${type}">${text}</div>` : "";
    };

    const load = async () => {
      try {
        const [timetableData, roomData, offeringData] = await Promise.all([
          API.getPicTtCourseTimetable(),
          API.getPicTtRooms(),
          API.getPicTtOfferings()
        ]);
        const schedules = timetableData.schedules || [];
        const rooms = roomData.rooms || [];
        const offerings = offeringData.offerings || [];

        roomSelectEl.innerHTML = this.renderRoomOptions(rooms, "");
        offeringSelectEl.innerHTML = this.renderOfferingOptions(offerings, "");

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
                    <td>${s.offeringId} (${s.courseId})</td>
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
                      <select data-tt-field="roomId" data-tt-id="${s.timetableId}">
                        ${this.renderRoomOptions(rooms, s.roomId)}
                      </select>
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
            const roomEl = tableEl.querySelector(`select[data-tt-field=\"roomId\"][data-tt-id=\"${timetableId}\"]`);

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
