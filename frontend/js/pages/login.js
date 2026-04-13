const LoginPage = {
  id: "login",
  
  render() {
    return `
      <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh;">
        <div class="form-container">
        <img src="./assets/images/Indian_Institute_of_Technology_Bhubaneswar_Logo.svg.png" alt="Login Background" class="login-logo">
          <h1 style="text-align: center; margin-bottom: 30px; color: #667eea;">Student Portal</h1>
          <form id="loginForm">
            <div class="form-group">
              <label for="userId">Student ID / Faculty ID</label>
              <input type="text" id="userId" required placeholder="23CS01 or CS01">
            </div>
            <div class="form-group">
              <label for="password">Password</label>
              <input type="password" id="password" required placeholder="Enter password">
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%;">Login</button>
            <div class="form-link">
              Don't have an account? <a href="#/register">Register</a>
            </div>
          </form>
          <div id="loginMessage"></div>
        </div>
      </div>
    `;
  },

  mount() {
    const form = document.getElementById("loginForm");
    const messageDiv = document.getElementById("loginMessage");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const userId = document.getElementById("userId").value;
      const password = document.getElementById("password").value;

      try {
        messageDiv.innerHTML = '<div class="loading"><div class="spinner"></div>Logging in...</div>';

        const response = await API.login({ userId, password });

        Auth.setToken(response.token);
        Auth.setUser(response.user);

        messageDiv.innerHTML = '<div class="message success">Login successful! Redirecting...</div>';

        setTimeout(() => {
          window.location.hash = '#/dashboard';
        }, 500);
      } catch (error) {
        messageDiv.innerHTML = `<div class="message error">${error.message}</div>`;
      }
    });
  }
};
