const MarksUpdatePage = {
  id: "marks-update",

  async render() {
    return `
      <div class="container">
        <div class="card">
          <div class="card-title">Marks Updating</div>
          <div class="form-group">
            <label for="marksCourseSelect">Select Course</label>
            <select id="marksCourseSelect"></select>
          </div>
          <div id="marksUpdateMessage"></div>
          <div id="marksTableWrap" class="table-wrap"></div>
        </div>
      </div>
    `;
  },

  async mount() {
    const messageEl = document.getElementById("marksUpdateMessage");
    const selectEl = document.getElementById("marksCourseSelect");

    const setMessage = (type, text) => {
      messageEl.innerHTML = `<div class="message ${type}">${text}</div>`;
    };

    const loadMarks = async () => {
      const offeringId = selectEl.value;
      if (!offeringId) {
        document.getElementById("marksTableWrap").innerHTML = "";
        return;
      }

      try {
        const response = await API.getFacultyMarks(offeringId);
        const students = response.students || [];

        if (!students.length) {
          document.getElementById("marksTableWrap").innerHTML = '<div class="message info">No enrolled students found.</div>';
          return;
        }

        document.getElementById("marksTableWrap").innerHTML = `
          <table>
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Mid Sem</th>
                <th>End Sem</th>
                <th>Internal</th>
                <th>Total</th>
                <th>Grade</th>
              </tr>
            </thead>
            <tbody>
              ${students
                .map(
                  (row) => `
                  <tr>
                    <td>${row.studentId}</td>
                    <td>${row.name}</td>
                    <td>${row.midSem ?? "-"}</td>
                    <td>${row.endSem ?? "-"}</td>
                    <td>${row.internal ?? "-"}</td>
                    <td>${row.total ?? "-"}</td>
                    <td>${row.grade ?? "-"}</td>
                  </tr>
                `
                )
                .join("")}
            </tbody>
          </table>

          <div class="card" style="margin-top:16px;">
            <div class="card-title" style="font-size:18px;">Update Student Marks</div>
            <form id="marksUpdateForm">
              <div class="card-grid">
                <div class="form-group">
                  <label for="marksStudentId">Student ID</label>
                  <input id="marksStudentId" required placeholder="23CS01" />
                </div>
                <div class="form-group">
                  <label for="marksMidSem">Mid Sem (0-30)</label>
                  <input id="marksMidSem" type="number" min="0" max="30" />
                </div>
                <div class="form-group">
                  <label for="marksEndSem">End Sem (0-50)</label>
                  <input id="marksEndSem" type="number" min="0" max="50" />
                </div>
                <div class="form-group">
                  <label for="marksInternal">Internal (0-20)</label>
                  <input id="marksInternal" type="number" min="0" max="20" />
                </div>
                <div class="form-group">
                  <label for="marksGrade">Grade</label>
                  <select id="marksGrade">
                    <option value="">None</option>
                    <option value="EX">EX</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                    <option value="F">F</option>
                  </select>
                </div>
              </div>
              <button class="btn btn-primary" type="submit">Update Marks</button>
            </form>
          </div>
        `;

        const form = document.getElementById("marksUpdateForm");
        form.addEventListener("submit", async (event) => {
          event.preventDefault();

          try {
            await API.updateFacultyMarks({
              offeringId: Number(offeringId),
              studentId: document.getElementById("marksStudentId").value.trim(),
              midSem: document.getElementById("marksMidSem").value,
              endSem: document.getElementById("marksEndSem").value,
              internal: document.getElementById("marksInternal").value,
              grade: document.getElementById("marksGrade").value
            });

            setMessage("success", "Marks updated successfully.");
            await loadMarks();
          } catch (error) {
            setMessage("error", error.message);
          }
        });
      } catch (error) {
        setMessage("error", error.message);
        document.getElementById("marksTableWrap").innerHTML = "";
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

      selectEl.addEventListener("change", loadMarks);
      await loadMarks();
    } catch (error) {
      setMessage("error", error.message);
      selectEl.innerHTML = '<option value="">Unable to load courses</option>';
    }
  }
};
