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

  static async getTAEnrollmentOptions() {
    return this.call("GET", "/student/ta-enrollment-options");
  }

  static async applyTAEnrollment(facultyId) {
    return this.call("POST", "/student/ta-enroll", { facultyId });
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

  static async getExamSchedule() {
    return this.call("GET", "/student/exams");
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

  // Leave Application endpoints
  static async submitLeaveApplication(leaveData) {
    return this.call("POST", "/student/leave-application/apply", leaveData);
  }

  static async getPastLeaveApplications() {
    return this.call("GET", "/student/leave-application/past");
  }

  // Faculty endpoints
  static async getFacultyDashboard() {
    return this.call("GET", "/faculty/dashboard");
  }

  static async getFacultyCourses() {
    return this.call("GET", "/faculty/courses");
  }

  static async getFacultyMarks(offeringId) {
    return this.call("GET", `/faculty/marks?offeringId=${encodeURIComponent(offeringId)}`);
  }

  static async updateFacultyMarks(payload) {
    return this.call("POST", "/faculty/marks/update", payload);
  }

  static async getFacultyAttendance(offeringId) {
    return this.call("GET", `/faculty/attendance?offeringId=${encodeURIComponent(offeringId)}`);
  }

  static async updateFacultyAttendance(payload) {
    return this.call("POST", "/faculty/attendance/update", payload);
  }

  static async markFacultyAttendanceSession(payload) {
    return this.call("POST", "/faculty/attendance/mark-session", payload);
  }

  static async sendFacultyNotification(payload) {
    return this.call("POST", "/faculty/notifications", payload);
  }

  static async getFacultyNotificationFeed() {
    return this.call("GET", "/faculty/notifications");
  }

  static async getFacultyTAApplications() {
    return this.call("GET", "/faculty/ta-applications");
  }

  static async decideFacultyTAApplication(taId, action) {
    return this.call("POST", `/faculty/ta-applications/${taId}/decision`, { action });
  }

  static async getFacultyLeaveApplications() {
    return this.call("GET", "/faculty/leave-applications");
  }

  static async decideFacultyLeaveApplication(leaveId, action) {
    return this.call("POST", `/faculty/leave-applications/${leaveId}/decision`, { action });
  }

  static async getCdcInternships() {
    return this.call("GET", "/faculty/cdc/internships");
  }

  static async createCdcInternshipOpening(payload) {
    return this.call("POST", "/faculty/cdc/internships/openings", payload);
  }

  static async decideCdcInternshipApplication(internshipId, action) {
    return this.call("POST", `/faculty/cdc/internships/applications/${internshipId}/decision`, { action });
  }

  static async getCdcPlacements() {
    return this.call("GET", "/faculty/cdc/placements");
  }

  static async createCdcPlacementOpening(payload) {
    return this.call("POST", "/faculty/cdc/placements/openings", payload);
  }

  static async decideCdcPlacementApplication(placementId, action) {
    return this.call("POST", `/faculty/cdc/placements/applications/${placementId}/decision`, { action });
  }

  static async getPicTtCourseTimetable() {
    return this.call("GET", "/faculty/tt/courses");
  }

  static async createPicTtCourseTimetable(payload) {
    return this.call("POST", "/faculty/tt/courses", payload);
  }

  static async updatePicTtCourseTimetable(timetableId, payload) {
    return this.call("PUT", `/faculty/tt/courses/${timetableId}`, payload);
  }

  static async getPicTtExamTimetable() {
    return this.call("GET", "/faculty/tt/exams");
  }

  static async createPicTtExamTimetable(payload) {
    return this.call("POST", "/faculty/tt/exams", payload);
  }

  static async updatePicTtExamTimetable(examId, payload) {
    return this.call("PUT", `/faculty/tt/exams/${examId}`, payload);
  }

  static async getHodCourseManagement() {
    return this.call("GET", "/faculty/hod/courses");
  }

  static async createHodCourse(payload) {
    return this.call("POST", "/faculty/hod/courses", payload);
  }

  static async updateHodCourse(courseId, payload) {
    return this.call("PUT", `/faculty/hod/courses/${encodeURIComponent(courseId)}`, payload);
  }

  static async deleteHodCourse(courseId) {
    return this.call("DELETE", `/faculty/hod/courses/${encodeURIComponent(courseId)}`);
  }

  static async createHodCourseOffering(payload) {
    return this.call("POST", "/faculty/hod/course-offerings", payload);
  }

  static async updateHodCourseOffering(offeringId, payload) {
    return this.call("PUT", `/faculty/hod/course-offerings/${offeringId}`, payload);
  }

  static async deleteHodCourseOffering(offeringId) {
    return this.call("DELETE", `/faculty/hod/course-offerings/${offeringId}`);
  }

  static async addHodCoursePrerequisite(courseId, prereqCourseId) {
    return this.call("POST", `/faculty/hod/courses/${encodeURIComponent(courseId)}/prerequisites`, { prereqCourseId });
  }

  static async updateHodCoursePrerequisite(courseId, currentPrereqCourseId, newPrereqCourseId) {
    return this.call(
      "PUT",
      `/faculty/hod/courses/${encodeURIComponent(courseId)}/prerequisites/${encodeURIComponent(currentPrereqCourseId)}`,
      { prereqCourseId: newPrereqCourseId }
    );
  }

  static async deleteHodCoursePrerequisite(courseId, prereqCourseId) {
    return this.call("DELETE", `/faculty/hod/courses/${encodeURIComponent(courseId)}/prerequisites/${encodeURIComponent(prereqCourseId)}`);
  }
}
