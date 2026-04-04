const CDCInternshipsPage = {
  id: "cdc-internships",

  async render() {
    return `
      <div class="container">
        <div class="card">
          <div class="card-title">CDC Internship Management</div>
          <div id="cdcInternshipMessage"></div>
          <div class="card" style="margin-top: 12px;">
            <div class="card-title" style="font-size: 18px;">Add New Internship Company</div>
            <form id="cdcInternshipCreateForm">
              <div class="card-grid">
                <div class="form-group">
                  <label for="cdcInternCompany">Company</label>
                  <input id="cdcInternCompany" required />
                </div>
                <div class="form-group">
                  <label for="cdcInternRole">Role</label>
                  <input id="cdcInternRole" required />
                </div>
                <div class="form-group">
                  <label for="cdcInternStipend">Stipend</label>
                  <input id="cdcInternStipend" type="number" min="0" step="0.01" required />
                </div>
                <div class="form-group">
                  <label for="cdcInternDuration">Duration (months)</label>
                  <input id="cdcInternDuration" type="number" min="0.5" step="0.5" required />
                </div>
              </div>
              <button class="btn btn-primary" type="submit">Add Internship Opening</button>
            </form>
          </div>
          <div class="card" style="margin-top: 12px;">
            <div class="card-title" style="font-size: 18px;">Internship Openings (Your Department)</div>
            <div id="cdcInternshipOpenings"></div>
          </div>
          <div class="card" style="margin-top: 12px;">
            <div class="card-title" style="font-size: 18px;">Applied Candidates</div>
            <div id="cdcInternshipApplications"></div>
          </div>
        </div>
      </div>
    `;
  },

  async mount() {
    const msgEl = document.getElementById("cdcInternshipMessage");
    const openingsEl = document.getElementById("cdcInternshipOpenings");
    const applicationsEl = document.getElementById("cdcInternshipApplications");
    const form = document.getElementById("cdcInternshipCreateForm");

    const setMessage = (type, text) => {
      msgEl.innerHTML = text ? `<div class="message ${type}">${text}</div>` : "";
    };

    const load = async () => {
      try {
        const data = await API.getCdcInternships();
        const openings = data.openings || [];
        const applications = data.applications || [];

        openingsEl.innerHTML = openings.length
          ? `
            <table>
              <thead>
                <tr><th>Opening ID</th><th>Company</th><th>Role</th><th>Stipend</th><th>Duration</th><th>Active</th></tr>
              </thead>
              <tbody>
                ${openings.map((o) => `
                  <tr>
                    <td>${o.openingId}</td>
                    <td>${o.company}</td>
                    <td>${o.role}</td>
                    <td>${o.stipend}</td>
                    <td>${o.durationMonths}</td>
                    <td>${o.isActive ? "Yes" : "No"}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          `
          : '<div class="message info">No internship openings yet.</div>';

        applicationsEl.innerHTML = applications.length
          ? `
            <table>
              <thead>
                <tr><th>ID</th><th>Student</th><th>Name</th><th>Company</th><th>Role</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                ${applications.map((a) => `
                  <tr>
                    <td>${a.internshipId}</td>
                    <td>${a.studentId}</td>
                    <td>${a.studentName}</td>
                    <td>${a.company}</td>
                    <td>${a.role}</td>
                    <td>${a.status}</td>
                    <td>
                      ${a.status === "Applied" ? `
                        <button class="btn btn-primary" data-intern-action="accept" data-intern-id="${a.internshipId}" style="margin-right:8px;">Accept</button>
                        <button class="btn btn-danger" data-intern-action="reject" data-intern-id="${a.internshipId}">Reject</button>
                      ` : '-'}
                    </td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          `
          : '<div class="message info">No applications yet.</div>';

        applicationsEl.querySelectorAll("button[data-intern-action]").forEach((btn) => {
          btn.addEventListener("click", async () => {
            try {
              await API.decideCdcInternshipApplication(btn.dataset.internId, btn.dataset.internAction.toUpperCase());
              setMessage("success", "Application decision saved.");
              await load();
            } catch (error) {
              setMessage("error", error.message);
            }
          });
        });
      } catch (error) {
        openingsEl.innerHTML = "";
        applicationsEl.innerHTML = "";
        setMessage("error", error.message);
      }
    };

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      try {
        await API.createCdcInternshipOpening({
          company: document.getElementById("cdcInternCompany").value.trim(),
          role: document.getElementById("cdcInternRole").value.trim(),
          stipend: Number(document.getElementById("cdcInternStipend").value),
          durationMonths: Number(document.getElementById("cdcInternDuration").value)
        });
        form.reset();
        setMessage("success", "Internship opening added.");
        await load();
      } catch (error) {
        setMessage("error", error.message);
      }
    });

    await load();
  }
};
