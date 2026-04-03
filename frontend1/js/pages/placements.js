const PlacementsPage = {
  id: "placements",

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
      return `<div class="message info" style="margin-top: 20px;">No companies are currently hiring for placements.</div>`;
    }

    let tableHtml = `
      <table>
        <thead>
          <tr>
            <th>Company</th>
            <th>Role</th>
            <th>CTC</th>
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
          <td>${opening.ctc}</td>
          <td>
            <button class="btn btn-primary" style="padding: 6px 12px; font-size: 12px;" ${isDisabled ? "disabled" : ""}
              onclick="PlacementsPage.apply('${opening.openingId}', '${opening.company}', '${opening.role}')">
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
      const response = await API.getPlacements();
      const placements = response.placements || [];
      const groupedPlacements = this.groupByStatus(placements);
      const openings = response.openings || [];
      const currentTermNumber = response.currentTermNumber;
      const canApply = Boolean(response.canApply);
      const hasAcceptedInternship = Boolean(response.hasAcceptedInternship);
      const hasAcceptedPlacement = Boolean(response.hasAcceptedPlacement);
      const appliedToOpenings = response.appliedToOpenings || [];

      let eligibilityMessage = "";
      if (hasAcceptedInternship) {
        eligibilityMessage = '<div class="message info" style="margin-bottom: 16px;">Students with secured internships cannot apply for placements.</div>';
      } else if (hasAcceptedPlacement) {
        eligibilityMessage = '<div class="message info" style="margin-bottom: 16px;">You already have an accepted placement. Any pending applications have been moved out of Applied.</div>';
      } else if (!canApply) {
        eligibilityMessage = '<div class="message info" style="margin-bottom: 16px;">Placement applications are available only in semester 7 or 8.</div>';
      }

      return `
        <div class="container">
          <div class="card">
            <div class="card-title">Placements ${currentTermNumber ? `(Semester ${currentTermNumber})` : ""}</div>
            ${eligibilityMessage}
          </div>
          ${this.renderStatusTable("Accepted", groupedPlacements.accepted)}
          ${this.renderStatusTable("Applied", groupedPlacements.applied)}
          ${this.renderStatusTable("Rejected", groupedPlacements.rejected)}
          <div class="card">
            <div class="card-title">Companies Currently Hiring</div>
            ${this.renderOpeningsTable(openings, canApply, appliedToOpenings)}
            <div id="placementApplyMessage" style="margin-top: 12px;"></div>
          </div>
        </div>
      `;
    } catch (error) {
      return `
        <div class="container">
          <div class="message error">Error loading placements: ${error.message}</div>
        </div>
      `;
    }
  },

  async apply(openingId, company, role) {
    const messageWrap = document.getElementById("placementApplyMessage");

    if (messageWrap) {
      messageWrap.innerHTML = '<div class="loading"><div class="spinner"></div>Submitting placement application...</div>';
    }

    try {
      await API.applyPlacement(openingId);
      if (messageWrap) {
        messageWrap.innerHTML = `<div class="message success">Applied to ${company} for ${role}. Refreshing...</div>`;
      }

      setTimeout(() => {
        Router.navigate("#/placements");
      }, 800);
    } catch (error) {
      if (messageWrap) {
        messageWrap.innerHTML = `<div class="message error">${error.message}</div>`;
      }
    }
  }
};