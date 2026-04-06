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
            <div style="margin-top: 10px; padding: 10px; background-color: #f0f0f0; border-radius: 4px; font-size: 14px;">
              <strong>Note:</strong> Make sure you have uploaded a resume before applying. <a href="#/student-resume" style="color: #0066cc; text-decoration: underline;">Manage Resumes</a>
            </div>
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
    
    try {
      // Fetch resumes
      const resumeResponse = await API.getStudentResumes();
      const resumes = resumeResponse.resumes || [];

      if (resumes.length === 0) {
        if (messageWrap) {
          messageWrap.innerHTML = '<div class="message error">No resumes found. Please upload a resume before applying.</div>';
        }
        return;
      }

      // Create resume selection modal
      this.showResumeSelectionModal(openingId, company, role, resumes, messageWrap);
    } catch (error) {
      if (messageWrap) {
        messageWrap.innerHTML = `<div class="message error">${error.message}</div>`;
      }
    }
  },

  showResumeSelectionModal(openingId, company, role, resumes, messageWrap) {
    const modalHTML = `
      <div id="resumeSelectionModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
        <div style="background-color: white; padding: 20px; border-radius: 8px; max-width: 400px; width: 90%;">
          <h3 style="margin-top: 0;">Select Resume</h3>
          <p>Choose which resume to submit for ${company} - ${role}:</p>
          <div id="resumeOptions" style="margin: 15px 0;">
            ${resumes.map(r => `
              <label style="display: block; margin-bottom: 10px;"><input type="radio" name="selectedResume" value="${r.resumeId}" /> ${r.fileName}</label>
            `).join('')}
          </div>
          <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button class="btn btn-secondary" onclick="document.getElementById('resumeSelectionModal').remove();" style="margin: 0; padding: 8px 16px; font-size: 14px;">Cancel</button>
            <button class="btn btn-primary" onclick="PlacementsPage.submitApplication(${openingId}, '${company}', '${role}')" style="margin: 0; padding: 8px 16px; font-size: 14px;">Apply</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
  },

  async submitApplication(openingId, company, role) {
    const selectedResume = document.querySelector('input[name="selectedResume"]:checked');
    
    if (!selectedResume) {
      alert('Please select a resume');
      return;
    }

    const resumeId = selectedResume.value;
    const messageWrap = document.getElementById("placementApplyMessage");

    // Close modal
    const modal = document.getElementById('resumeSelectionModal');
    if (modal) {
      modal.remove();
    }

    if (messageWrap) {
      messageWrap.innerHTML = '<div class="loading"><div class="spinner"></div>Submitting placement application...</div>';
    }

    try {
      await API.applyPlacement(openingId, resumeId);
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