const CDCPlacementsPage = {
  id: "cdc-placements",

  async render() {
    return `
      <div class="container">
        <div class="card">
          <div class="card-title">CDC Placement Management</div>
          <div id="cdcPlacementMessage"></div>
          <div class="card" style="margin-top: 12px;">
            <div class="card-title" style="font-size: 18px;">Add New Placement Company</div>
            <form id="cdcPlacementCreateForm">
              <div class="card-grid">
                <div class="form-group">
                  <label for="cdcPlacementCompany">Company</label>
                  <input id="cdcPlacementCompany" required />
                </div>
                <div class="form-group">
                  <label for="cdcPlacementRole">Role</label>
                  <input id="cdcPlacementRole" required />
                </div>
                <div class="form-group">
                  <label for="cdcPlacementCtc">CTC</label>
                  <input id="cdcPlacementCtc" type="number" min="0" step="0.01" required />
                </div>
              </div>
              <button class="btn btn-primary" type="submit">Add Placement Opening</button>
            </form>
          </div>
          <div class="card" style="margin-top: 12px;">
            <div class="card-title" style="font-size: 18px;">Placement Openings (Your Department)</div>
            <div id="cdcPlacementOpenings"></div>
          </div>
          <div class="card" style="margin-top: 12px;">
            <div class="card-title" style="font-size: 18px;">Applied Candidates</div>
            <div id="cdcPlacementApplications"></div>
          </div>
        </div>
      </div>
    `;
  },

  async mount() {
    const msgEl = document.getElementById("cdcPlacementMessage");
    const openingsEl = document.getElementById("cdcPlacementOpenings");
    const applicationsEl = document.getElementById("cdcPlacementApplications");
    const form = document.getElementById("cdcPlacementCreateForm");

    const setMessage = (type, text) => {
      msgEl.innerHTML = text ? `<div class="message ${type}">${text}</div>` : "";
    };

    const load = async () => {
      try {
        const data = await API.getCdcPlacements();
        const openings = data.openings || [];
        const applications = data.applications || [];

        openingsEl.innerHTML = openings.length
          ? `
            <table>
              <thead>
                <tr><th>Opening ID</th><th>Company</th><th>Role</th><th>CTC</th><th>Active</th></tr>
              </thead>
              <tbody>
                ${openings.map((o) => `
                  <tr>
                    <td>${o.openingId}</td>
                    <td>${o.company}</td>
                    <td>${o.role}</td>
                    <td>${o.ctc}</td>
                    <td>${o.isActive ? "Yes" : "No"}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          `
          : '<div class="message info">No placement openings yet.</div>';

        applicationsEl.innerHTML = applications.length
          ? `
            <table>
              <thead>
                <tr><th>ID</th><th>Student</th><th>Name</th><th>Company</th><th>Role</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                ${applications.map((a) => `
                  <tr>
                    <td>${a.placementId}</td>
                    <td>${a.studentId}</td>
                    <td>${a.studentName}</td>
                    <td>${a.company}</td>
                    <td>${a.role}</td>
                    <td>${a.status}</td>
                    <td>
                      ${a.status === "Applied" ? `
                        <button class="btn btn-primary" data-placement-action="accept" data-placement-id="${a.placementId}" style="margin-right:8px;">Accept</button>
                        <button class="btn btn-danger" data-placement-action="reject" data-placement-id="${a.placementId}">Reject</button>
                      ` : '-'}
                    </td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          `
          : '<div class="message info">No applications yet.</div>';

        applicationsEl.querySelectorAll("button[data-placement-action]").forEach((btn) => {
          btn.addEventListener("click", async () => {
            try {
              await API.decideCdcPlacementApplication(btn.dataset.placementId, btn.dataset.placementAction.toUpperCase());
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
        await API.createCdcPlacementOpening({
          company: document.getElementById("cdcPlacementCompany").value.trim(),
          role: document.getElementById("cdcPlacementRole").value.trim(),
          ctc: Number(document.getElementById("cdcPlacementCtc").value)
        });
        form.reset();
        setMessage("success", "Placement opening added.");
        await load();
      } catch (error) {
        setMessage("error", error.message);
      }
    });

    await load();
  }
};
