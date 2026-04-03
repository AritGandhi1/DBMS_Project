class Auth {
  static setToken(token) {
    localStorage.setItem("auth_token", token);
  }

  static getToken() {
    return localStorage.getItem("auth_token");
  }

  static isAuthenticated() {
    return !!this.getToken();
  }

  static logout() {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");

    // Use hash routing so redirect works consistently across all pages.
    window.location.hash = "#/login";
    if (typeof Router !== "undefined" && Router.navigate) {
      Router.navigate("#/login");
    }
  }

  static setUser(user) {
    localStorage.setItem("user", JSON.stringify(user));
  }

  static getUser() {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  }
}
