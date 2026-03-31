import "./style.css";
import axios from "axios";

const app = document.getElementById("app");
const API_BASE_URL = "http://localhost:5000/api";
const TOKEN_KEY = "dbms_auth_token";

app.innerHTML = `
  <main class="layout">
    <section class="hero">
      <h1>DBMS Auth Tester</h1>
      <p>Register, login with user_id, and test protected endpoint quickly.</p>
    </section>

    <section class="panel">
      <h2>Backend Health</h2>
      <div class="row">
        <button id="healthBtn" type="button">Check Health</button>
        <span id="healthStatus" class="meta"></span>
      </div>
    </section>

    <section class="panel">
      <h2>Register Student</h2>
      <form id="registerForm" class="form-grid">
        <label>Student ID<input id="regStudentId" required placeholder="S1001" /></label>
        <label>Name<input id="regName" required placeholder="Ari TG" /></label>
        <label>Batch<input id="regBatch" required type="number" placeholder="2026" /></label>
        <label>College Email<input id="regEmail" required type="email" placeholder="ari.student@example.com" /></label>
        <label>Password<input id="regPassword" required type="password" placeholder="secret123" /></label>
        <button type="submit">Register</button>
      </form>
    </section>

    <section class="panel">
      <h2>Login with user_id</h2>
      <form id="loginForm" class="form-grid">
        <label>User ID<input id="loginUserId" required placeholder="S1001" /></label>
        <label>Password<input id="loginPassword" required type="password" placeholder="secret123" /></label>
        <button type="submit">Login</button>
      </form>
    </section>

    <section class="panel">
      <h2>Protected Route</h2>
      <div class="row">
        <button id="meBtn" type="button">Fetch /auth/me</button>
        <button id="logoutBtn" type="button" class="secondary">Clear Token</button>
      </div>
      <p id="tokenState" class="meta"></p>
    </section>

    <section class="panel">
      <h2>Response</h2>
      <pre id="responseBox">Ready.</pre>
    </section>
  </main>
`;

const responseBox = document.getElementById("responseBox");
const healthStatus = document.getElementById("healthStatus");
const tokenState = document.getElementById("tokenState");

function setResponse(value) {
  responseBox.textContent = typeof value === "string" ? value : JSON.stringify(value, null, 2);
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
  renderTokenState();
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  renderTokenState();
}

function renderTokenState() {
  const token = getToken();
  tokenState.textContent = token
    ? `Token saved (${token.slice(0, 20)}...)`
    : "No token stored.";
}

async function callApi(config) {
  try {
    const token = getToken();
    const headers = {
      ...(config.headers || {})
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await axios({
      baseURL: API_BASE_URL,
      ...config,
      headers
    });

    setResponse({
      status: response.status,
      data: response.data
    });

    return response.data;
  } catch (error) {
    if (error.response) {
      setResponse({
        status: error.response.status,
        data: error.response.data
      });
    } else {
      setResponse({ message: error.message });
    }

    return null;
  }
}

async function checkBackend() {
  const data = await callApi({ method: "get", url: "/health" });

  if (data && data.status) {
    healthStatus.textContent = `Status: ${data.status}`;
  } else {
    healthStatus.textContent = "Backend not reachable.";
  }
}

document.getElementById("healthBtn").addEventListener("click", checkBackend);

document.getElementById("registerForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const payload = {
    studentId: document.getElementById("regStudentId").value,
    name: document.getElementById("regName").value,
    batch: Number(document.getElementById("regBatch").value),
    email: document.getElementById("regEmail").value,
    password: document.getElementById("regPassword").value
  };

  const data = await callApi({ method: "post", url: "/auth/register", data: payload });
  if (data && data.token) {
    setToken(data.token);
  }
});

document.getElementById("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const payload = {
    userId: document.getElementById("loginUserId").value,
    password: document.getElementById("loginPassword").value
  };

  const data = await callApi({ method: "post", url: "/auth/login", data: payload });
  if (data && data.token) {
    setToken(data.token);
  }
});

document.getElementById("meBtn").addEventListener("click", async () => {
  await callApi({ method: "get", url: "/auth/me" });
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  clearToken();
  setResponse("Token cleared.");
});

renderTokenState();
checkBackend();
