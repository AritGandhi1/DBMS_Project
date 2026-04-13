const TAEnrollmentPage = {
  id: "ta-enrollment",

  async render() {
    return `
      <div class="container">
        <div class="card">
          <div class="card-title">TA Enrollment</div>
          <div id="taEnrollmentMessage"></div>
          <div id="taApplicationsTable"></div>
        </div>
      </div>
    `;
  },

  async mount() {
    const messageEl = document.getElementById("taEnrollmentMessage");
    const tableEl = document.getElementById("taApplicationsTable");

    const setMessage = (type, text) => {
      messageEl.innerHTML = `<div class="message ${type}">${text}</div>`;
    };

    const loadApplications = async () => {
      try {
        const response = await API.getFacultyTAApplications();
        const applications = response.applications || [];

        if (!applications.length) {
          tableEl.innerHTML = '<div class="message info">No TA applications found.</div>';
          return;
        }

        tableEl.innerHTML = `
          <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>TA ID</th>
                <th>Student ID</th>
                <th>Name</th>
                <th>Branch</th>
                <th>Email</th>
                <th>Term</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${applications
                .map(
                  (app) => `
                    <tr>
                      <td>${app.taId}</td>
                      <td>${app.studentId}</td>
                      <td>${app.studentName}</td>
                      <td>${app.branch || "-"}</td>
                      <td>${app.collegeEmail || "-"}</td>
                      <td>${app.termNumber}</td>
                      <td>${app.role}</td>
                      <td>${app.status}</td>
                      <td>
                        ${app.status === 'Pending' || app.resumeId ? `
                          <div class="ta-action-group">
                            ${app.resumeId ? `<button class="btn btn-secondary" data-ta-resume-id="${app.taId}">View Resume</button>` : ""}
                            ${app.status === 'Pending' ? `
                              <button class="btn btn-primary" data-ta-action="accept" data-ta-id="${app.taId}">Accept</button>
                              <button class="btn btn-danger" data-ta-action="reject" data-ta-id="${app.taId}">Reject</button>
                            ` : ""}
                          </div>
                        ` : '-'}
                      </td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
          </div>
        `;

        tableEl.querySelectorAll("button[data-ta-action]").forEach((button) => {
          button.addEventListener("click", async () => {
            const taId = button.dataset.taId;
            const action = button.dataset.taAction;

            try {
              await API.decideFacultyTAApplication(taId, action.toUpperCase());
              setMessage("success", `TA application ${action}ed successfully.`);
              await loadApplications();
            } catch (error) {
              setMessage("error", error.message);
            }
          });
        });

        tableEl.querySelectorAll("button[data-ta-resume-id]").forEach((button) => {
          button.addEventListener("click", async () => {
            const taId = button.dataset.taResumeId;
            try {
              const blob = await API.downloadFacultyTAResume(taId);
              const url = window.URL.createObjectURL(blob);
              window.open(url, "_blank", "noopener,noreferrer");
              setTimeout(() => window.URL.revokeObjectURL(url), 60 * 1000);
            } catch (error) {
              setMessage("error", error.message || "Failed to open resume");
            }
          });
        });
      } catch (error) {
        setMessage("error", error.message);
        tableEl.innerHTML = "";
      }
    };

    await loadApplications();
  }
};
