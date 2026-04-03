const InternshipsPage = {
  id: "internships",

  groupByStatus(records) {
    return {
      accepted: records.filter((record) => record.status === "Accepted"),
      applied: records.filter((record) => record.status === "Applied"),
      rejected: records.filter((record) => record.status === "Rejected")
    };
  },

  renderStatusTable(title, records) {
    if (records.length === 0) {
      return `
        <div class="card" style="margin-top: 16px;">
          <div class="card-title">${title}</div>
          <div class="message info" style="margin-top: 20px;">No records in this category.</div>
        </div>
      `;
    }

    let tableHtml = `
      <div class="card" style="margin-top: 16px;">
        <div class="card-title">${title} (${records.length})</div>
        <table>
          <thead>
            <tr>
              <th>Company</th>
              <th>Role</th>
              <th>Package</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
    `;

    records.forEach((record) => {
      tableHtml += `
        <tr>
          <td>${record.company}</td>
          <td>${record.role}</td>
          <td>${record.package}</td>
          <td>${record.duration} months</td>
        </tr>
      `;
    });

    tableHtml += `
          </tbody>
        </table>
      </div>
    `;

    return tableHtml;
  },

  renderOpeningsTable(openings, canApply, appliedToOpenings = []) {
    if (openings.length === 0) {
      return `<div class="message info" style="margin-top: 20px;">No companies are currently hiring for internships.</div>`;
    }

    let tableHtml = `
      <table>
        <thead>
          <tr>
            <th>Company</th>
            <th>Role</th>
            <th>Stipend</th>
            <th>Duration</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
    `;

    openings.forEach((opening) => {
      const hasApplied = appliedToOpenings.includes(opening.openingId);
      const isDisabled = !canApply || hasApplied;
      const buttonText = hasApplied ? "Already Applied" : "Apply";

      tableHtml += `
        <tr>
          <td>${opening.company}</td>
          <td>${opening.role}</td>
          <td>${opening.stipend}</td>
          <td>${opening.durationMonths} months</td>
          <td>
            <button class="btn btn-primary" style="padding: 6px 12px; font-size: 12px;" ${isDisabled ? "disabled" : ""}
              onclick="InternshipsPage.apply('${opening.openingId}', '${opening.company}', '${opening.role}')">
              ${buttonText}
            </button>
          </td>
        </tr>
      `;
    });

    tableHtml += `
        </tbody>
      </table>
    `;

    return tableHtml;
  },

  async render() {
    try {
      const response = await API.getInternships();
      const internships = response.internships || [];
      const groupedInternships = this.groupByStatus(internships);
      const openings = response.openings || [];
      const currentTermNumber = response.currentTermNumber;
      const canApply = Boolean(response.canApply);
      const hasAcceptedInternship = Boolean(response.hasAcceptedInternship);
      const appliedToOpenings = response.appliedToOpenings || [];

      let eligibilityMessage = "";
      if (hasAcceptedInternship) {
        eligibilityMessage = '<div class="message info" style="margin-bottom: 16px;">You already have an accepted internship. Any pending applications have been moved out of Applied.</div>';
      } else if (!canApply) {
        eligibilityMessage = '<div class="message info" style="margin-bottom: 16px;">Internship applications are available only in semester 5 or 6.</div>';
      }

      return `
        <div class="container">
          <div class="card">
            <div class="card-title">Internships ${currentTermNumber ? `(Semester ${currentTermNumber})` : ""}</div>
            ${eligibilityMessage}
          </div>
          ${this.renderStatusTable("Accepted", groupedInternships.accepted)}
          ${this.renderStatusTable("Applied", groupedInternships.applied)}
          ${this.renderStatusTable("Rejected", groupedInternships.rejected)}
          <div class="card">
            <div class="card-title">Companies Currently Hiring</div>
            ${this.renderOpeningsTable(openings, canApply, appliedToOpenings)}
            <div id="internshipApplyMessage" style="margin-top: 12px;"></div>
          </div>
        </div>
      `;
    } catch (error) {
      return `
        <div class="container">
          <div class="message error">Error loading internships: ${error.message}</div>
        </div>
      `;
    }
  },

  async apply(openingId, company, role) {
    const messageWrap = document.getElementById("internshipApplyMessage");

    if (messageWrap) {
      messageWrap.innerHTML = '<div class="loading"><div class="spinner"></div>Submitting internship application...</div>';
    }

    try {
      await API.applyInternship(openingId);
      if (messageWrap) {
        messageWrap.innerHTML = `<div class="message success">Applied to ${company} for ${role}. Refreshing...</div>`;
      }

      setTimeout(() => {
        Router.navigate("#/internships");
      }, 800);
    } catch (error) {
      if (messageWrap) {
        messageWrap.innerHTML = `<div class="message error">${error.message}</div>`;
      }
    }
  }
};