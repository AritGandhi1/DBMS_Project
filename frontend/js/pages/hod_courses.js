const HODCoursesPage = {
  id: "hod-courses",

  renderCourseOptions(courses, selectedCourseId = "") {
    const selected = String(selectedCourseId || "").trim().toUpperCase();
    const options = (courses || [])
      .map((c) => {
        const courseId = String(c.courseId || "").trim().toUpperCase();
        const isSelected = courseId === selected ? "selected" : "";
        return `<option value="${courseId}" ${isSelected}>${courseId} - ${c.courseName}</option>`;
      })
      .join("");

    return `<option value="" disabled ${selected ? "" : "selected"}>Select Course ID</option>${options}`;
  },

  async render() {
    return `
      <div class="container">
        <div class="card">
          <div class="card-title">Department Courses Management</div>
          <div id="hodCourseMessage"></div>

          <div class="card" style="margin-top: 12px;">
            <div class="card-title" style="font-size: 18px;">Add New Course</div>
            <form id="hodAddCourseForm" style="margin-bottom: 12px;">
              <div class="card-grid">
                <div class="form-group">
                  <label for="hodCourseId">Course ID</label>
                  <input id="hodCourseId" required />
                </div>
                <div class="form-group">
                  <label for="hodCourseName">Course Name</label>
                  <input id="hodCourseName" required />
                </div>
                <div class="form-group">
                  <label for="hodCourseCredits">Credits</label>
                  <input id="hodCourseCredits" type="number" min="1" step="1" required />
                </div>
              </div>
              <button class="btn btn-primary" type="submit">Add Course</button>
            </form>
          </div>

          <div class="card" style="margin-top: 12px;">
            <div class="card-title" style="font-size: 18px;">All Department Courses</div>
            <div id="hodCourseTable"></div>
          </div>

          <div class="card" style="margin-top: 12px;">
            <div class="card-title" style="font-size: 18px;">Course Offerings (Add: Course ID, Type, Faculty ID)</div>
            <form id="hodAddOfferingForm" style="margin-bottom: 12px;">
              <div class="card-grid">
                <div class="form-group">
                  <label for="hodOfferingCourseId">Course ID</label>
                  <select id="hodOfferingCourseId" required></select>
                </div>
                <div class="form-group">
                  <label for="hodOfferingType">Type</label>
                  <select id="hodOfferingType" required>
                    <option value="Core">Core</option>
                    <option value="Elective">Elective</option>
                    <option value="Lab">Lab</option>
                    <option value="Breadth">Breadth</option>
                    <option value="Lateral">Lateral</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="hodOfferingFacultyId">Faculty ID (optional)</label>
                  <input id="hodOfferingFacultyId" list="hodFacultyList" placeholder="Optional" />
                  <datalist id="hodFacultyList"></datalist>
                </div>
              </div>
              <button class="btn btn-primary" type="submit">Add Offering</button>
            </form>
            <div id="hodOfferingTable"></div>
          </div>

          <div class="card" style="margin-top: 12px;">
            <div class="card-title" style="font-size: 18px;">Add Prerequisite</div>
            <form id="hodAddPrereqForm">
              <div class="card-grid">
                <div class="form-group">
                  <label for="hodPrereqCourse">Course ID</label>
                  <input id="hodPrereqCourse" required />
                </div>
                <div class="form-group">
                  <label for="hodPrereqId">Prerequisite Course ID</label>
                  <input id="hodPrereqId" required />
                </div>
              </div>
              <button class="btn btn-primary" type="submit">Add Prerequisite</button>
            </form>
          </div>

          <div class="card" style="margin-top: 12px;">
            <div class="card-title" style="font-size: 18px;">Prerequisites (Edit / Remove)</div>
            <div id="hodPrereqTable"></div>
          </div>
        </div>
      </div>
    `;
  },

  async mount() {
    const msgEl = document.getElementById("hodCourseMessage");
    const courseTableEl = document.getElementById("hodCourseTable");
    const prereqTableEl = document.getElementById("hodPrereqTable");
    const addCourseForm = document.getElementById("hodAddCourseForm");
    const addOfferingForm = document.getElementById("hodAddOfferingForm");
    const addPrereqForm = document.getElementById("hodAddPrereqForm");
    const offeringTableEl = document.getElementById("hodOfferingTable");
    const facultyListEl = document.getElementById("hodFacultyList");
    const offeringCourseSelectEl = document.getElementById("hodOfferingCourseId");

    const setMessage = (type, text) => {
      msgEl.innerHTML = text ? `<div class="message ${type}">${text}</div>` : "";
    };

    const load = async () => {
      try {
        const data = await API.getHodCourseManagement();
        const courses = data.courses || [];
        const prerequisites = data.prerequisites || [];
        const offerings = data.offerings || [];
        const facultyMembers = data.facultyMembers || [];

        facultyListEl.innerHTML = facultyMembers
          .map((f) => `<option value="${f.facultyId}">${f.name} (${f.facultyId})</option>`)
          .join("");

        courseTableEl.innerHTML = courses.length
          ? `
            <table>
              <thead>
                <tr><th>Course ID</th><th>Course Name</th><th>Credits</th><th>Branch</th><th>Actions</th></tr>
              </thead>
              <tbody>
                ${courses.map((c) => `
                  <tr>
                    <td>${c.courseId}</td>
                    <td>${c.courseName}</td>
                    <td>${c.credits}</td>
                    <td>${c.branch}</td>
                    <td><button class="btn btn-danger" data-course-delete="${c.courseId}">Delete</button></td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          `
          : '<div class="message info">No courses found for your department.</div>';

        offeringCourseSelectEl.innerHTML = this.renderCourseOptions(courses);

        prereqTableEl.innerHTML = prerequisites.length
          ? `
            <table>
              <thead>
                <tr><th>Course</th><th>Current Prerequisite</th><th>New Prerequisite ID</th><th>Actions</th></tr>
              </thead>
              <tbody>
                ${prerequisites.map((p) => `
                  <tr>
                    <td>${p.courseId} - ${p.courseName}</td>
                    <td>${p.prereqCourseId}${p.prereqCourseName ? ` - ${p.prereqCourseName}` : ""}</td>
                    <td>
                      <input data-prereq-edit-field="newPrereqCourseId" data-prereq-course-id="${p.courseId}" data-prereq-id="${p.prereqCourseId}" value="${p.prereqCourseId}" />
                    </td>
                    <td>
                      <button class="btn btn-primary" data-prereq-update-course="${p.courseId}" data-prereq-update-id="${p.prereqCourseId}" style="margin-right:8px;">Update</button>
                      <button class="btn btn-danger" data-prereq-delete-course="${p.courseId}" data-prereq-delete-id="${p.prereqCourseId}">Remove</button>
                    </td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          `
          : '<div class="message info">No prerequisites configured yet.</div>';

        offeringTableEl.innerHTML = offerings.length
          ? `
            <table>
              <thead>
                <tr><th>Offering ID</th><th>Course ID</th><th>Course Name</th><th>Credits</th><th>Term</th><th>Type</th><th>Faculty ID</th><th>Actions</th></tr>
              </thead>
              <tbody>
                ${offerings.map((o) => `
                  <tr>
                    <td>${o.offeringId}</td>
                    <td>${o.courseId}</td>
                    <td>${o.courseName}</td>
                    <td>${(courses.find((c) => c.courseId === o.courseId)?.credits) || "-"}</td>
                    <td>${o.termNumber}</td>
                    <td>
                      <select data-offering-field="type" data-offering-id="${o.offeringId}">
                        ${["Core", "Elective", "Lab", "Breadth", "Lateral"].map((t) => `<option value="${t}" ${t === o.type ? "selected" : ""}>${t}</option>`).join("")}
                      </select>
                    </td>
                    <td>
                      <input data-offering-field="facultyId" data-offering-id="${o.offeringId}" list="hodFacultyList" value="${o.facultyId || ""}" placeholder="Optional" />
                    </td>
                    <td>
                      <button class="btn btn-primary" data-offering-update="${o.offeringId}" style="margin-right:8px;">Update</button>
                      <button class="btn btn-danger" data-offering-delete="${o.offeringId}">Delete</button>
                    </td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          `
          : '<div class="message info">No course offerings configured yet.</div>';

        prereqTableEl.querySelectorAll("button[data-prereq-update-course]").forEach((btn) => {
          btn.addEventListener("click", async () => {
            const courseId = btn.dataset.prereqUpdateCourse;
            const currentPrereq = btn.dataset.prereqUpdateId;
            const newIdEl = prereqTableEl.querySelector(`input[data-prereq-edit-field=\"newPrereqCourseId\"][data-prereq-course-id=\"${courseId}\"][data-prereq-id=\"${currentPrereq}\"]`);

            try {
              await API.updateHodCoursePrerequisite(courseId, currentPrereq, newIdEl?.value?.trim()?.toUpperCase());
              setMessage("success", `Prerequisite for ${courseId} updated.`);
              await load();
            } catch (error) {
              setMessage("error", error.message);
            }
          });
        });

        prereqTableEl.querySelectorAll("button[data-prereq-delete-course]").forEach((btn) => {
          btn.addEventListener("click", async () => {
            const courseId = btn.dataset.prereqDeleteCourse;
            const prereqId = btn.dataset.prereqDeleteId;

            try {
              await API.deleteHodCoursePrerequisite(courseId, prereqId);
              setMessage("success", `Prerequisite ${prereqId} removed from ${courseId}.`);
              await load();
            } catch (error) {
              setMessage("error", error.message);
            }
          });
        });

        offeringTableEl.querySelectorAll("button[data-offering-update]").forEach((btn) => {
          btn.addEventListener("click", async () => {
            const offeringId = Number(btn.dataset.offeringUpdate);
            const typeEl = offeringTableEl.querySelector(`select[data-offering-field=\"type\"][data-offering-id=\"${offeringId}\"]`);
            const facultyEl = offeringTableEl.querySelector(`input[data-offering-field=\"facultyId\"][data-offering-id=\"${offeringId}\"]`);

            try {
              await API.updateHodCourseOffering(offeringId, {
                type: typeEl?.value,
                facultyId: (facultyEl?.value || "").trim().toUpperCase()
              });

              setMessage("success", `Offering ${offeringId} updated.`);
              await load();
            } catch (error) {
              setMessage("error", error.message);
            }
          });
        });

        offeringTableEl.querySelectorAll("button[data-offering-delete]").forEach((btn) => {
          btn.addEventListener("click", async () => {
            const offeringId = Number(btn.dataset.offeringDelete);
            const confirmed = window.confirm(`Delete offering ${offeringId}? This can remove enrollments, timetable and related records.`);
            if (!confirmed) {
              return;
            }

            try {
              await API.deleteHodCourseOffering(offeringId);
              setMessage("success", `Offering ${offeringId} deleted.`);
              await load();
            } catch (error) {
              setMessage("error", error.message);
            }
          });
        });

        courseTableEl.querySelectorAll("button[data-course-delete]").forEach((btn) => {
          btn.addEventListener("click", async () => {
            const courseId = String(btn.dataset.courseDelete || "").trim().toUpperCase();
            const confirmed = window.confirm(`Delete course ${courseId}? This will also delete related offerings and prerequisites.`);
            if (!confirmed) {
              return;
            }

            try {
              await API.deleteHodCourse(courseId);
              setMessage("success", `Course ${courseId} deleted successfully.`);
              await load();
            } catch (error) {
              setMessage("error", error.message);
            }
          });
        });
      } catch (error) {
        courseTableEl.innerHTML = "";
        prereqTableEl.innerHTML = "";
        offeringTableEl.innerHTML = "";
        setMessage("error", error.message);
      }
    };

    addPrereqForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      try {
        const courseId = document.getElementById("hodPrereqCourse").value.trim().toUpperCase();
        const prereqCourseId = document.getElementById("hodPrereqId").value.trim().toUpperCase();
        await API.addHodCoursePrerequisite(courseId, prereqCourseId);
        addPrereqForm.reset();
        setMessage("success", "Prerequisite added successfully.");
        await load();
      } catch (error) {
        setMessage("error", error.message);
      }
    });

    addCourseForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      try {
        await API.createHodCourse({
          courseId: document.getElementById("hodCourseId").value.trim().toUpperCase(),
          courseName: document.getElementById("hodCourseName").value.trim(),
          credits: Number(document.getElementById("hodCourseCredits").value)
        });
        addCourseForm.reset();
        setMessage("success", "Course added successfully.");
        await load();
      } catch (error) {
        setMessage("error", error.message);
      }
    });

    addOfferingForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      try {
        const courseId = document.getElementById("hodOfferingCourseId").value.trim().toUpperCase();
        await API.createHodCourseOffering({
          courseId,
          type: document.getElementById("hodOfferingType").value,
          facultyId: document.getElementById("hodOfferingFacultyId").value.trim().toUpperCase()
        });
        addOfferingForm.reset();
        setMessage("success", "Offering added successfully.");
        await load();
      } catch (error) {
        setMessage("error", error.message);
      }
    });

    await load();
  }
};
