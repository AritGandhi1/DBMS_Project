const RegisterPage = {
  id: "register",

  render() {
    return `
      <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh;">
        <div class="form-container">
          <h1 style="text-align: center; margin-bottom: 30px; color: #667eea;">Register Student</h1>
          <form id="registerForm">
            <div class="form-group">
              <label for="studentId">Student ID</label>
              <input type="text" id="studentId" required placeholder="23CS01">
            </div>
            <div class="form-group">
              <label for="name">Full Name</label>
              <input type="text" id="name" required placeholder="John Doe">
            </div>
            <div class="form-group">
              <label for="batch">Batch</label>
              <input type="number" id="batch" required placeholder="2025">
            </div>
            <div class="form-group">
              <label for="branch">Branch</label>
              <select id="branch" required>
                <option value="">Select Branch</option>
                <option value="CSE">Computer Science (CSE)</option>
                <option value="IT">Information Technology (IT)</option>
                <option value="ECE">Electronics and Communication (ECE)</option>
                <option value="ME">Mechanical Engineering (ME)</option>
                <option value="CE">Civil Engineering (CE)</option>
              </select>
            </div>
            <div class="form-group">
              <label for="email">College Email</label>
              <input type="email" id="email" required placeholder="student@university.edu">
            </div>
            <div class="form-group">
              <label for="password">Password</label>
              <input type="password" id="password" required placeholder="Min 6 characters">
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%;">Register</button>
            <div class="form-link">
              Already have an account? <a href="#/login">Login</a>
            </div>
          </form>
          <div id="registerMessage"></div>
        </div>
      </div>
    `;
  },

  mount() {
    const form = document.getElementById("registerForm");
    const messageDiv = document.getElementById("registerMessage");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const payload = {
        studentId: document.getElementById("studentId").value,
        name: document.getElementById("name").value,
        batch: Number(document.getElementById("batch").value),
        branch: document.getElementById("branch").value,
        email: document.getElementById("email").value,
        password: document.getElementById("password").value
      };

      try {
        messageDiv.innerHTML = '<div class="loading"><div class="spinner"></div>Registering...</div>';

        const response = await API.register(payload);

        Auth.setToken(response.token);
        Auth.setUser(response.user);

        messageDiv.innerHTML = '<div class="message success">Registration successful! Redirecting to dashboard...</div>';

        setTimeout(() => {
          window.location.hash = '#/dashboard';
        }, 500);
      } catch (error) {
        messageDiv.innerHTML = `<div class="message error">${error.message}</div>`;
      }
    });
  }
};
