const API_BASE_URL = "http://localhost:5000/api";

class API {
  static async call(method, endpoint, data = null) {
    try {
      const token = localStorage.getItem("auth_token");
      const headers = {
        "Content-Type": "application/json"
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const config = {
        method,
        headers
      };

      if (data) {
        config.body = JSON.stringify(data);
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.message || "API Error");
      }

      return json;
    } catch (error) {
      throw error;
    }
  }

  // Auth endpoints
  static async register(payload) {
    return this.call("POST", "/auth/register", payload);
  }

  static async login(payload) {
    return this.call("POST", "/auth/login", payload);
  }

  static async me() {
    return this.call("GET", "/auth/me");
  }

  // Student endpoints
  static async getStudentDetails() {
    return this.call("GET", "/student/me");
  }

  static async getStudentCourses() {
    return this.call("GET", "/student/courses");
  }

  static async getEnrollmentOptions() {
    return this.call("GET", "/student/enrollment-options");
  }

  static async enrollCourse(offeringId) {
    return this.call("POST", "/student/enroll", { offeringId });
  }

  static async getTranscript() {
    return this.call("GET", "/student/transcript");
  }

  static async getResults() {
    return this.call("GET", "/student/results");
  }

  static async getAttendance() {
    return this.call("GET", "/student/attendance");
  }

  static async getInternships() {
    return this.call("GET", "/student/internships");
  }

  static async applyInternship(openingId) {
    return this.call("POST", "/student/internships/apply", { openingId });
  }

  static async getPlacements() {
    return this.call("GET", "/student/placements");
  }

  static async applyPlacement(openingId) {
    return this.call("POST", "/student/placements/apply", { openingId });
  }

  static async getTimetable() {
    return this.call("GET", "/student/timetable");
  }

  static async getNotifications() {
    return this.call("GET", "/student/notifications");
  }

  static async getCoursesForFeedback() {
    return this.call("GET", "/student/feedback/courses");
  }

  static async submitFeedback(offeringId, rating, comment) {
    return this.call("POST", "/student/feedback/submit", { offeringId, rating, comment });
  }
}
