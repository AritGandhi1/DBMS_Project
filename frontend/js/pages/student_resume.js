const StudentResumePage = {
  id: "student-resume",

  async render() {
    return `
      <div class="container">
        <div class="card">
          <div class="card-title">Resume Management</div>
          <div id="resumeMessage"></div>
          
          <!-- Upload Resume Section -->
          <div class="card" style="margin-top: 12px;">
            <div class="card-title" style="font-size: 18px;">Upload Resume</div>
            <form id="resumeUploadForm">
              <div class="form-group">
                <label for="resumeFile">Select PDF File (Max 5MB)</label>
                <input type="file" id="resumeFile" accept=".pdf" required />
              </div>
              <button class="btn btn-primary" type="submit">Upload Resume</button>
            </form>
          </div>

          <!-- My Resumes Section -->
          <div class="card" style="margin-top: 12px;">
            <div class="card-title" style="font-size: 18px;">My Resumes</div>
            <div id="resumesList"></div>
          </div>
        </div>
      </div>
    `;
  },

  async mount() {
    const msgEl = document.getElementById("resumeMessage");
    const resumeListEl = document.getElementById("resumesList");
    const uploadForm = document.getElementById("resumeUploadForm");

    const setMessage = (type, text) => {
      msgEl.innerHTML = text ? `<div class="message ${type}">${text}</div>` : "";
    };

    const loadResumes = async () => {
      try {
        const data = await API.getStudentResumes();
        const resumes = data.resumes || [];

        if (resumes.length === 0) {
          resumeListEl.innerHTML = '<div class="message info">No resumes uploaded yet. Upload your first resume to get started!</div>';
          return;
        }

        let html = `
          <table>
            <thead>
              <tr>
                <th>File Name</th>
                <th>Size (KB)</th>
                <th>Uploaded On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
        `;

        resumes.forEach((resume) => {
          const uploadDate = new Date(resume.uploadedAt).toLocaleDateString();
          const fileSize = (resume.fileSize / 1024).toFixed(2);

          html += `
            <tr>
              <td>${resume.fileName}</td>
              <td>${fileSize}</td>
              <td>${uploadDate}</td>
              <td>
                <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px; margin-right: 5px;"
                  onclick="StudentResumePage.downloadResume(${resume.resumeId}, '${resume.fileName}')">
                  Download
                </button>
                <button class="btn btn-danger" style="padding: 6px 12px; font-size: 12px;"
                  onclick="StudentResumePage.deleteResume(${resume.resumeId})">
                  Delete
                </button>
              </td>
            </tr>
          `;
        });

        html += `
            </tbody>
          </table>
        `;

        resumeListEl.innerHTML = html;
      } catch (error) {
        setMessage("error", error.message || "Failed to load resumes");
      }
    };

    uploadForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const fileInput = document.getElementById("resumeFile");
      const file = fileInput.files[0];

      if (!file) {
        setMessage("error", "Please select a file");
        return;
      }

      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setMessage("error", "Only PDF files are allowed");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setMessage("error", "File size exceeds 5MB limit");
        return;
      }

      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const fileData = e.target.result.split(',')[1]; // Get base64 without data URL prefix
            const fileName = file.name;

            await API.uploadResume(fileName, fileData);
            setMessage("success", "Resume uploaded successfully!");
            uploadForm.reset();
            await loadResumes();
          } catch (error) {
            setMessage("error", error.message || "Failed to upload resume");
          }
        };
        reader.readAsDataURL(file);
      } catch (error) {
        setMessage("error", error.message || "Failed to process file");
      }
    });

    await loadResumes();
  },

  async downloadResume(resumeId, fileName) {
    try {
      const blob = await API.downloadResume(resumeId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      alert(error.message || "Failed to download resume");
    }
  },

  async deleteResume(resumeId) {
    if (!confirm("Are you sure you want to delete this resume?")) {
      return;
    }

    try {
      await API.deleteResume(resumeId);
      const msgEl = document.getElementById("resumeMessage");
      msgEl.innerHTML = '<div class="message success">Resume deleted successfully</div>';
      setTimeout(() => {
        this.mount(); // Reload the page
      }, 1000);
    } catch (error) {
      const msgEl = document.getElementById("resumeMessage");
      msgEl.innerHTML = `<div class="message error">${error.message || "Failed to delete resume"}</div>`;
    }
  }
};
