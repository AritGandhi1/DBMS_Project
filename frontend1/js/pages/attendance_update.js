const AttendanceUpdatePage = {
  id: "attendance-update",

  async render() {
    return `
      <div class="container">
        <div class="card">
          <div class="card-title">Attendance Updating</div>
          <div class="card-grid">
            <div class="form-group">
              <label for="attendanceCourseSelect">Select Course</label>
              <select id="attendanceCourseSelect"></select>
            </div>
            <div class="form-group">
              <label for="attendanceClassHours">Class Duration</label>
              <select id="attendanceClassHours">
                <option value="1">1 Hour</option>
                <option value="2">2 Hours</option>
              </select>
            </div>
          </div>
          <div id="attendanceUpdateMessage"></div>
          <div id="attendanceTableWrap" class="table-wrap"></div>
        </div>
      </div>
    `;
  },

  async mount() {
    const messageEl = document.getElementById("attendanceUpdateMessage");
    const selectEl = document.getElementById("attendanceCourseSelect");
    const classHoursEl = document.getElementById("attendanceClassHours");

    const setMessage = (type, text) => {
      messageEl.innerHTML = `<div class="message ${type}">${text}</div>`;
    };

    const loadAttendance = async () => {
      const offeringId = selectEl.value;
      if (!offeringId) {
        document.getElementById("attendanceTableWrap").innerHTML = "";
        return;
      }

      try {
        const response = await API.getFacultyAttendance(offeringId);
        const students = response.students || [];
        const totalClassesConducted = Number(response.totalClassesConducted || 0);

        if (!students.length) {
          document.getElementById("attendanceTableWrap").innerHTML = '<div class="message info">No enrolled students found.</div>';
          return;
        }

        document.getElementById("attendanceTableWrap").innerHTML = `
          <div class="message info">Current Total Classes Conducted: <strong>${totalClassesConducted}</strong></div>
          <table>
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Classes Attended</th>
                <th>Present</th>
                <th>Absent</th>
              </tr>
            </thead>
            <tbody>
              ${students
                .map(
                  (row, index) => `
                  <tr>
                    <td>${row.studentId}</td>
                    <td>${row.name}</td>
                    <td>${row.classesAttendedCount ?? "-"}</td>
                    <td><input type="checkbox" data-row="${index}" data-status="present" checked></td>
                    <td><input type="checkbox" data-row="${index}" data-status="absent"></td>
                  </tr>
                `
                )
                .join("")}
            </tbody>
          </table>

          <div class="card" style="margin-top:16px;">
            <div class="card-title" style="font-size:18px;">Submit Attendance Session</div>
            <form id="attendanceUpdateForm">
              <button class="btn btn-primary" type="submit">Submit Attendance</button>
            </form>
          </div>
        `;

        // Keep present/absent mutually exclusive for each row.
        const toggles = document.querySelectorAll('input[type="checkbox"][data-row]');
        toggles.forEach((checkbox) => {
          checkbox.addEventListener("change", (event) => {
            const target = event.target;
            const row = target.dataset.row;
            const status = target.dataset.status;
            const counterpartStatus = status === "present" ? "absent" : "present";
            const counterpart = document.querySelector(`input[type="checkbox"][data-row="${row}"][data-status="${counterpartStatus}"]`);

            if (target.checked) {
              if (counterpart) {
                counterpart.checked = false;
              }
            } else if (counterpart) {
              counterpart.checked = true;
            }
          });
        });

        const form = document.getElementById("attendanceUpdateForm");
        form.addEventListener("submit", async (event) => {
          event.preventDefault();

          try {
            const records = students.map((row, index) => {
              const present = document.querySelector(`input[type="checkbox"][data-row="${index}"][data-status="present"]`)?.checked;
              const absent = document.querySelector(`input[type="checkbox"][data-row="${index}"][data-status="absent"]`)?.checked;

              if ((present && absent) || (!present && !absent)) {
                throw new Error(`Please choose exactly one status for ${row.studentId}`);
              }

              return {
                studentId: row.studentId,
                status: present ? "PRESENT" : "ABSENT"
              };
            });

            await API.markFacultyAttendanceSession({
              offeringId: Number(offeringId),
              classHours: Number(classHoursEl.value),
              records
            });

            setMessage("success", "Attendance updated successfully.");
            await loadAttendance();
          } catch (error) {
            setMessage("error", error.message);
          }
        });
      } catch (error) {
        setMessage("error", error.message);
        document.getElementById("attendanceTableWrap").innerHTML = "";
      }
    };

    try {
      const response = await API.getFacultyCourses();
      const courses = response.courses || [];

      if (!courses.length) {
        setMessage("info", "No current-term courses found for this faculty.");
        selectEl.innerHTML = '<option value="">No courses</option>';
        return;
      }

      selectEl.innerHTML = courses
        .map((course, index) => `<option value="${course.offeringId}" ${index === 0 ? "selected" : ""}>${course.courseId} - ${course.courseName}</option>`)
        .join("");

      selectEl.addEventListener("change", loadAttendance);
      await loadAttendance();
    } catch (error) {
      setMessage("error", error.message);
      selectEl.innerHTML = '<option value="">Unable to load courses</option>';
    }
  }
};
