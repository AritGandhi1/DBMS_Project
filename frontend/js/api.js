const API_BASE_URL = `${window.location.origin}/api`;

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

  static async callFormData(method, endpoint, formData) {
    try {
      const token = localStorage.getItem("auth_token");
      const headers = {};

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method,
        headers,
        body: formData
      });

      let json = {};
      try {
        json = await response.json();
      } catch (_) {
        json = {};
      }

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

  static async applyTAEnrollment(facultyId, resumeId) {
    return this.call("POST", "/student/ta-enroll", { facultyId, resumeId });
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

  static async applyInternship(openingId, resumeId) {
    return this.call("POST", "/student/internships/apply", { openingId, resumeId });
  }

  static async downloadInternshipOpeningAttachment(openingId) {
    const token = localStorage.getItem("auth_token");
    const response = await fetch(`${API_BASE_URL}/student/internships/openings/${openingId}/attachment`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      let errorMessage = "Failed to fetch internship attachment";
      try {
        const json = await response.json();
        errorMessage = json.message || errorMessage;
      } catch (_) {
        // Keep fallback message for non-JSON responses.
      }
      throw new Error(errorMessage);
    }

    return response.blob();
  }

  static async getPlacements() {
    return this.call("GET", "/student/placements");
  }

  static async applyPlacement(openingId, resumeId) {
    return this.call("POST", "/student/placements/apply", { openingId, resumeId });
  }

  static async downloadPlacementOpeningAttachment(openingId) {
    const token = localStorage.getItem("auth_token");
    const response = await fetch(`${API_BASE_URL}/student/placements/openings/${openingId}/attachment`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      let errorMessage = "Failed to fetch placement attachment";
      try {
        const json = await response.json();
        errorMessage = json.message || errorMessage;
      } catch (_) {
        // Keep fallback message for non-JSON responses.
      }
      throw new Error(errorMessage);
    }

    return response.blob();
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

  // Resume management endpoints
  static async uploadResume(fileName, fileData) {
    return this.call("POST", "/student/resume/upload", { fileName, fileData });
  }

  static async getStudentResumes() {
    return this.call("GET", "/student/resume/list");
  }

  static async deleteResume(resumeId) {
    return this.call("POST", "/student/resume/delete", { resumeId });
  }

  static async downloadResume(resumeId) {
    const token = localStorage.getItem("auth_token");
    const response = await fetch(`${API_BASE_URL}/student/resume/download/${resumeId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error("Failed to download resume");
    }

    return response.blob();
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

  static async downloadFacultyTAResume(taId) {
    const token = localStorage.getItem("auth_token");
    const response = await fetch(`${API_BASE_URL}/faculty/ta-applications/${taId}/resume`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      let errorMessage = "Failed to fetch resume";
      try {
        const json = await response.json();
        errorMessage = json.message || errorMessage;
      } catch (_) {
        // Keep fallback message for non-JSON responses.
      }
      throw new Error(errorMessage);
    }

    return response.blob();
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

  static async updateCdcInternshipOpening(openingId, payload) {
    return this.call("PUT", `/faculty/cdc/internships/openings/${openingId}`, payload);
  }

  static async deleteCdcInternshipOpening(openingId) {
    return this.call("DELETE", `/faculty/cdc/internships/openings/${openingId}`);
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

  static async updateCdcPlacementOpening(openingId, payload) {
    return this.call("PUT", `/faculty/cdc/placements/openings/${openingId}`, payload);
  }

  static async deleteCdcPlacementOpening(openingId) {
    return this.call("DELETE", `/faculty/cdc/placements/openings/${openingId}`);
  }

  static async decideCdcPlacementApplication(placementId, action) {
    return this.call("POST", `/faculty/cdc/placements/applications/${placementId}/decision`, { action });
  }

  static async getPicTtCourseTimetable() {
    return this.call("GET", "/faculty/tt/courses");
  }

  static async getPicTtRooms() {
    return this.call("GET", "/faculty/tt/rooms");
  }

  static async getPicTtOfferings() {
    return this.call("GET", "/faculty/tt/offerings");
  }

  static async createPicTtCourseTimetable(payload) {
    return this.call("POST", "/faculty/tt/courses", payload);
  }

  static async updatePicTtCourseTimetable(timetableId, payload) {
    return this.call("PUT", `/faculty/tt/courses/${timetableId}`, payload);
  }

  static async deletePicTtCourseTimetable(timetableId) {
    return this.call("DELETE", `/faculty/tt/courses/${timetableId}`);
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

  static async deletePicTtExamTimetable(examId) {
    return this.call("DELETE", `/faculty/tt/exams/${examId}`);
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

  // Admin endpoints
  static async getAdminUsers() {
    return this.call("GET", "/admin/users");
  }

  static async getAdminFeedbackStatus() {
    return this.call("GET", "/admin/feedback-status");
  }

  static async updateAdminFeedbackStatus(feedbackActive) {
    return this.call("PUT", "/admin/feedback-status", { feedbackActive: Boolean(feedbackActive) });
  }

  static async getAdminEnrollmentStatus() {
    return this.call("GET", "/admin/enrollment-status");
  }

  static async updateAdminEnrollmentStatus(enrollmentActive) {
    return this.call("PUT", "/admin/enrollment-status", { enrollmentActive: Boolean(enrollmentActive) });
  }

  static async endAdminTerm() {
    return this.call("POST", "/admin/end-term");
  }

  static async createAdminStudent(payload) {
    return this.call("POST", "/admin/students", payload);
  }

  static async updateAdminStudent(studentId, payload) {
    return this.call("PUT", `/admin/students/${encodeURIComponent(studentId)}`, payload);
  }

  static async createAdminFaculty(payload) {
    return this.call("POST", "/admin/faculty", payload);
  }

  static async updateAdminFaculty(facultyId, payload) {
    return this.call("PUT", `/admin/faculty/${encodeURIComponent(facultyId)}`, payload);
  }

  static async uploadAdminStudentsFile(file) {
    const formData = new FormData();
    formData.append("file", file);
    return this.callFormData("POST", "/admin/students/bulk-upload", formData);
  }

  static async uploadAdminFacultyFile(file) {
    const formData = new FormData();
    formData.append("file", file);
    return this.callFormData("POST", "/admin/faculty/bulk-upload", formData);
  }

  static async getAdminRooms() {
    return this.call("GET", "/admin/rooms");
  }

  static async createAdminRoom(payload) {
    return this.call("POST", "/admin/rooms", payload);
  }

  static async updateAdminRoom(roomId, payload) {
    return this.call("PUT", `/admin/rooms/${encodeURIComponent(roomId)}`, payload);
  }

  static async deleteAdminRoom(roomId) {
    return this.call("DELETE", `/admin/rooms/${encodeURIComponent(roomId)}`);
  }
}
