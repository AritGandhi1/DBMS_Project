const LeaveApplicationPage = {
  id: 'leave-application',

  async render() {
    const view = sessionStorage.getItem('leaveView') || 'apply';
    
    return `
      <div class="leave-application-container">
        <div class="page-header">
          <h1>Leave Application</h1>
        </div>

        <div class="leave-tabs">
          <button class="leave-tab ${view === 'apply' ? 'active' : ''}" onclick="LeaveApplicationPage.switchView('apply')">
            Apply Leave
          </button>
          <button class="leave-tab ${view === 'past' ? 'active' : ''}" onclick="LeaveApplicationPage.switchView('past')">
            Past Applications
          </button>
        </div>

        <div id="leaveContent">
          ${view === 'apply' ? this.renderApplyForm() : this.renderPastApplications()}
        </div>
      </div>
    `;
  },

  renderApplyForm() {
    return `
      <div class="leave-apply-form">
        <form id="leaveForm" onsubmit="LeaveApplicationPage.submitLeaveApplication(event)">
          <div class="form-group">
            <label for="leaveType">Leave Type:</label>
            <select id="leaveType" required>
              <option value="">Select Leave Type</option>
              <option value="sick">Sick Leave</option>
              <option value="casual">Casual Leave</option>
              <option value="earned">Earned Leave</option>
              <option value="emergency">Emergency Leave</option>
            </select>
          </div>

          <div class="form-group">
            <label for="startDate">Start Date:</label>
            <input type="date" id="startDate" required>
          </div>

          <div class="form-group">
            <label for="endDate">End Date:</label>
            <input type="date" id="endDate" required>
          </div>

          <div class="form-group">
            <label for="reason">Reason:</label>
            <textarea id="reason" rows="4" placeholder="Enter reason for leave" required></textarea>
          </div>

          <div class="form-group">
            <button type="submit" class="btn btn-primary">Submit Application</button>
          </div>
        </form>
        <div id="leaveMessage"></div>
      </div>
    `;
  },

  renderPastApplications() {
    return `
      <div class="past-applications">
        <div id="pastApplicationsList" class="applications-list">
          <p>Loading applications...</p>
        </div>
      </div>
    `;
  },

  switchView(view) {
    sessionStorage.setItem('leaveView', view);
    Router.navigate(`#/leave-application`);
  },

  async submitLeaveApplication(event) {
    event.preventDefault();

    const leaveData = {
      leaveType: document.getElementById('leaveType').value,
      startDate: document.getElementById('startDate').value,
      endDate: document.getElementById('endDate').value,
      reason: document.getElementById('reason').value
    };

    try {
      const response = await API.submitLeaveApplication(leaveData);
      const messageEl = document.getElementById('leaveMessage');
      messageEl.innerHTML = '<div class="message success">Leave application submitted successfully!</div>';
      document.getElementById('leaveForm').reset();
      
      setTimeout(() => {
        messageEl.innerHTML = '';
      }, 3000);
    } catch (error) {
      const messageEl = document.getElementById('leaveMessage');
      messageEl.innerHTML = `<div class="message error">Error: ${error.message}</div>`;
    }
  },

  async mount() {
    const view = sessionStorage.getItem('leaveView') || 'apply';
    
    if (view === 'past') {
      await this.loadPastApplications();
    }
  },

  async loadPastApplications() {
    const container = document.getElementById('pastApplicationsList');
    
    try {
      const response = await API.getPastLeaveApplications();
      const applications = response.applications || [];

      if (applications.length === 0) {
        container.innerHTML = '<p class="empty-message">No leave applications found</p>';
        return;
      }

      container.innerHTML = applications
        .map((app) => `
          <div class="application-card">
            <div class="app-header">
              <h3>${app.leaveType}</h3>
              <span class="status ${app.status.toLowerCase()}">${app.status}</span>
            </div>
            <div class="app-details">
              <p><strong>From:</strong> ${new Date(app.startDate).toLocaleDateString()}</p>
              <p><strong>To:</strong> ${new Date(app.endDate).toLocaleDateString()}</p>
              <p><strong>Reason:</strong> ${app.reason}</p>
              <p><strong>Applied on:</strong> ${new Date(app.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        `)
        .join('');
    } catch (error) {
      container.innerHTML = `<p class="error">Error loading applications: ${error.message}</p>`;
    }
  }
};
