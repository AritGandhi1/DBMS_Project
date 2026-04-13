const SendNotificationPage = {
  id: "send-notification",

  async render() {
    const user = Auth.getUser();
    const isFacultyAdvisor = Boolean(user?.isFacultyAdvisor);

    return `
      <div class="container">
        <div class="card">
          <div class="card-title">Send Notification</div>
          <form id="sendNotificationForm">
            <div class="card-grid">
              <div class="form-group">
                <label for="notificationTargetType">Target Type</label>
                <select id="notificationTargetType" required>
                  <option value="COURSE">Course ID</option>
                  <option value="STUDENT">Student ID</option>
                  ${isFacultyAdvisor ? '<option value="FACULTY_ADVISOR">Faculty Advisor</option>' : ''}
                </select>
              </div>
              <div class="form-group">
                <label for="notificationTargetId">Course ID / Student ID</label>
                <input id="notificationTargetId" required placeholder="CS101 or 23CS01" />
              </div>
            </div>
            <div id="notificationTargetHint" class="message info" style="display:none; margin-bottom:12px;">
              Faculty Advisor target will send this notification to all students advised by you.
            </div>
            <div class="form-group">
              <label for="notificationMessage">Message</label>
              <textarea id="notificationMessage" rows="4" required placeholder="Type your notification message..."></textarea>
            </div>
            <button type="submit" class="btn btn-primary">Send</button>
          </form>
          <div id="sendNotificationMessage" style="margin-top:12px;"></div>
        </div>

        <div class="card">
          <div class="card-title">Recent Notifications</div>
          <div id="sentNotificationsTable"></div>
        </div>
      </div>
    `;
  },

  async mount() {
    const form = document.getElementById("sendNotificationForm");
    const feedbackEl = document.getElementById("sendNotificationMessage");
    const tableEl = document.getElementById("sentNotificationsTable");
    const targetTypeEl = document.getElementById("notificationTargetType");
    const targetIdEl = document.getElementById("notificationTargetId");
    const targetHintEl = document.getElementById("notificationTargetHint");
    const user = Auth.getUser();

    const setMessage = (type, text) => {
      feedbackEl.innerHTML = `<div class="message ${type}">${text}</div>`;
    };

    const loadTable = async () => {
      try {
        const response = await API.getFacultyNotificationFeed();
        const notifications = response.notifications || [];

        if (!notifications.length) {
          tableEl.innerHTML = '<div class="message info">No notifications yet.</div>';
          return;
        }

        tableEl.innerHTML = `
          <table>
            <thead>
              <tr>
                <th>Target ID</th>
                <th>Sent By</th>
                <th>Message</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              ${notifications
                .map(
                  (n) => `
                    <tr>
                      <td>${n.targetId}</td>
                      <td>${n.sentBy || "-"}</td>
                      <td>${n.message}</td>
                      <td>${new Date(n.createdAt).toLocaleString()}</td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
        `;
      } catch (error) {
        tableEl.innerHTML = `<div class="message error">${error.message}</div>`;
      }
    };

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const targetType = targetTypeEl.value;
      const targetId = targetType === "FACULTY_ADVISOR"
        ? String(user?.id || "").trim()
        : targetIdEl.value.trim();
      const message = document.getElementById("notificationMessage").value.trim();

      try {
        await API.sendFacultyNotification({ targetType, targetId, message });
        setMessage("success", "Notification sent successfully.");
        document.getElementById("notificationMessage").value = "";
        await loadTable();
      } catch (error) {
        setMessage("error", error.message);
      }
    });

    const updateTargetInputState = () => {
      const isFacultyAdvisorTarget = targetTypeEl.value === "FACULTY_ADVISOR";
      targetIdEl.disabled = isFacultyAdvisorTarget;
      targetIdEl.required = !isFacultyAdvisorTarget;
      targetIdEl.value = isFacultyAdvisorTarget ? "" : targetIdEl.value;
      targetIdEl.placeholder = isFacultyAdvisorTarget
        ? "Auto: your faculty ID will be used"
        : "CS101 or 23CS01";
      targetHintEl.style.display = isFacultyAdvisorTarget ? "block" : "none";
    };

    targetTypeEl.addEventListener("change", updateTargetInputState);
    updateTargetInputState();

    await loadTable();
  }
};
