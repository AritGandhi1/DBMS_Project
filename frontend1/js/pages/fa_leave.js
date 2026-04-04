const FALeavePage = {
  id: "fa-leave",

  async render() {
    return `
      <div class="container">
        <div class="card">
          <div class="card-title">FA Leave Section</div>
          <div class="leave-tabs">
            <button class="leave-tab active" data-view="current">Current Applications</button>
            <button class="leave-tab" data-view="history">Leave History</button>
          </div>
          <div id="faLeaveMessage"></div>
          <div id="faLeaveContent"></div>
        </div>
      </div>
    `;
  },

  async mount() {
    const messageEl = document.getElementById("faLeaveMessage");
    const contentEl = document.getElementById("faLeaveContent");
    const tabs = Array.from(document.querySelectorAll(".leave-tab[data-view]"));
    let currentView = "current";

    const setMessage = (type, text) => {
      messageEl.innerHTML = text ? `<div class="message ${type}">${text}</div>` : "";
    };

    const renderRows = (applications, showActions) => {
      if (!applications.length) {
        return '<div class="message info">No leave applications found.</div>';
      }

      return `
        <table>
          <thead>
            <tr>
              <th>Leave ID</th>
              <th>Student</th>
              <th>Student ID</th>
              <th>Branch</th>
              <th>Email</th>
              <th>From</th>
              <th>To</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Applied On</th>
              ${showActions ? "<th>Actions</th>" : ""}
            </tr>
          </thead>
          <tbody>
            ${applications.map((app) => `
              <tr>
                <td>${app.leaveId}</td>
                <td>${app.studentName}</td>
                <td>${app.studentId}</td>
                <td>${app.branch || "-"}</td>
                <td>${app.collegeEmail || "-"}</td>
                <td>${new Date(app.startDate).toLocaleDateString()}</td>
                <td>${new Date(app.endDate).toLocaleDateString()}</td>
                <td>${app.reason || "-"}</td>
                <td>${app.status}</td>
                <td>${new Date(app.appliedOn).toLocaleDateString()}</td>
                ${showActions ? `
                  <td>
                    ${app.status === 'Pending' ? `
                      <button class="btn btn-primary" data-leave-action="approve" data-leave-id="${app.leaveId}" style="margin-right:8px;">Approve</button>
                      <button class="btn btn-danger" data-leave-action="reject" data-leave-id="${app.leaveId}">Reject</button>
                    ` : '-'}
                  </td>
                ` : ''}
              </tr>
            `).join("")}
          </tbody>
        </table>
      `;
    };

    const load = async () => {
      try {
        const response = await API.getFacultyLeaveApplications();
        const currentApplications = response.currentApplications || [];
        const history = response.history || [];

        contentEl.innerHTML = currentView === "current"
          ? renderRows(currentApplications, true)
          : renderRows(history, false);

        contentEl.querySelectorAll("button[data-leave-action]").forEach((button) => {
          button.addEventListener("click", async () => {
            const leaveId = button.dataset.leaveId;
            const action = button.dataset.leaveAction;

            try {
              await API.decideFacultyLeaveApplication(leaveId, action.toUpperCase());
              setMessage("success", `Leave application ${action}d successfully.`);
              await load();
            } catch (error) {
              setMessage("error", error.message);
            }
          });
        });
      } catch (error) {
        contentEl.innerHTML = `<div class="message error">${error.message}</div>`;
      }
    };

    tabs.forEach((tab) => {
      tab.addEventListener("click", async () => {
        currentView = tab.dataset.view;
        tabs.forEach((t) => t.classList.toggle("active", t === tab));
        await load();
      });
    });

    await load();
  }
};
