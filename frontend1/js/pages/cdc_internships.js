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
                <div class="form-group">
                  <label for="cdcInternFile">Attachment (optional)</label>
                  <input id="cdcInternFile" type="file" />
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

    const readFilePayload = (file) => new Promise((resolve, reject) => {
      if (!file) {
        resolve(null);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = String(event.target?.result || "");
        const base64 = result.includes(",") ? result.split(",")[1] : "";
        resolve({ fileName: file.name, fileData: base64 });
      };
      reader.onerror = () => reject(new Error("Failed to read attachment file"));
      reader.readAsDataURL(file);
    });

    const buildOpeningRow = (opening) => `
      <tr>
        <td>${opening.openingId}</td>
        <td><input data-intern-field="company" data-intern-id="${opening.openingId}" value="${opening.company}" /></td>
        <td><input data-intern-field="role" data-intern-id="${opening.openingId}" value="${opening.role}" /></td>
        <td><input data-intern-field="stipend" data-intern-id="${opening.openingId}" type="number" min="0" step="0.01" value="${opening.stipend}" /></td>
        <td><input data-intern-field="durationMonths" data-intern-id="${opening.openingId}" type="number" min="0.5" step="0.5" value="${opening.durationMonths}" /></td>
        <td>
          <select data-intern-field="isActive" data-intern-id="${opening.openingId}">
            <option value="1" ${opening.isActive ? "selected" : ""}>Yes</option>
            <option value="0" ${!opening.isActive ? "selected" : ""}>No</option>
          </select>
        </td>
        <td>
          <div style="font-size: 12px; color: #555; margin-bottom: 6px;">${opening.fileName || "No file uploaded"}</div>
          <input type="file" data-intern-field="file" data-intern-id="${opening.openingId}" />
        </td>
        <td>
          <button class="btn btn-primary" data-intern-update="${opening.openingId}">Update</button>
        </td>
      </tr>
    `;

    const load = async () => {
      try {
        const data = await API.getCdcInternships();
        const openings = data.openings || [];
        const applications = data.applications || [];

        openingsEl.innerHTML = openings.length
          ? `
            <table>
              <thead>
                <tr><th>Opening ID</th><th>Company</th><th>Role</th><th>Stipend</th><th>Duration</th><th>Active</th><th>Attachment</th><th>Actions</th></tr>
              </thead>
              <tbody>
                ${openings.map((opening) => buildOpeningRow(opening)).join("")}
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

        openingsEl.querySelectorAll("button[data-intern-update]").forEach((btn) => {
          btn.addEventListener("click", async () => {
            const openingId = Number(btn.dataset.internUpdate);
            const companyEl = openingsEl.querySelector(`input[data-intern-field="company"][data-intern-id="${openingId}"]`);
            const roleEl = openingsEl.querySelector(`input[data-intern-field="role"][data-intern-id="${openingId}"]`);
            const stipendEl = openingsEl.querySelector(`input[data-intern-field="stipend"][data-intern-id="${openingId}"]`);
            const durationEl = openingsEl.querySelector(`input[data-intern-field="durationMonths"][data-intern-id="${openingId}"]`);
            const isActiveEl = openingsEl.querySelector(`select[data-intern-field="isActive"][data-intern-id="${openingId}"]`);
            const fileInput = openingsEl.querySelector(`input[data-intern-field="file"][data-intern-id="${openingId}"]`);

            try {
              const filePayload = await readFilePayload(fileInput?.files?.[0]);
              await API.updateCdcInternshipOpening(openingId, {
                company: companyEl?.value?.trim(),
                role: roleEl?.value?.trim(),
                stipend: Number(stipendEl?.value),
                durationMonths: Number(durationEl?.value),
                isActive: isActiveEl?.value,
                ...(filePayload || {})
              });
              setMessage("success", `Internship opening ${openingId} updated.`);
              await load();
            } catch (error) {
              setMessage("error", error.message);
            }
          });
        });

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
        const file = document.getElementById("cdcInternFile")?.files?.[0] || null;
        const filePayload = await readFilePayload(file);
        await API.createCdcInternshipOpening({
          company: document.getElementById("cdcInternCompany").value.trim(),
          role: document.getElementById("cdcInternRole").value.trim(),
          stipend: Number(document.getElementById("cdcInternStipend").value),
          durationMonths: Number(document.getElementById("cdcInternDuration").value),
          ...(filePayload || {})
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
