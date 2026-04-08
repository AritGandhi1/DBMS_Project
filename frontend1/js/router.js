const pages = [
  LoginPage,
  RegisterPage,
  DashboardPage,
  AdminUserManagementPage,
  AdminRoomsPage,
  CoursesPage,
  TimetablePage,
  InternshipsPage,
  PlacementsPage,
  EnrollmentPage,
  TranscriptPage,
  ResultPage,
  AttendancePage,
  ExamPage,
  FeedbackPage,
  LeavePage,
  MarksUpdatePage,
  AttendanceUpdatePage,
  SendNotificationPage,
  TAEnrollmentPage,
  FALeavePage,
  CDCInternshipsPage,
  CDCPlacementsPage,
  TTCoursePage,
  TTExamPage,
  HODCoursesPage,
  StudentResumePage
];

const Router = {
  currentPage: null,
  isNavigating: false,
  mobileMenuOpen: false,
  notificationsOpen: false,

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    const menu = document.getElementById('mobileMenuDropdown');
    if (menu) {
      menu.classList.toggle('open', this.mobileMenuOpen);
    }
  },

  goToRoute(routeName) {
    this.mobileMenuOpen = false;
    window.location.hash = `#/${routeName}`;
  },

  toggleNotifications() {
    this.notificationsOpen = !this.notificationsOpen;
    const panel = document.getElementById('notificationsPanel');
    if (panel) {
      panel.classList.toggle('open', this.notificationsOpen);
    }
  },

  closeNotifications() {
    this.notificationsOpen = false;
    const panel = document.getElementById('notificationsPanel');
    if (panel) {
      panel.classList.remove('open');
    }
  },

  async loadNotifications() {
    const countEl = document.getElementById('notificationsCount');
    const listEl = document.getElementById('notificationsList');

    if (!countEl || !listEl) {
      return;
    }

    try {
      const response = await API.getNotifications();
      const notifications = response.notifications || [];
      const unreadCount = Number(response.unreadCount || 0);

      if (unreadCount > 0) {
        countEl.style.display = 'inline-flex';
      } else {
        countEl.style.display = 'none';
      }

      if (notifications.length === 0) {
        listEl.innerHTML = '<div class="notification-empty">No notifications</div>';
        return;
      }

      listEl.innerHTML = notifications
        .map((item) => {
          const created = new Date(item.createdAt);
          const when = Number.isNaN(created.getTime())
            ? ''
            : created.toLocaleDateString() + ' ' + created.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          return `
            <div class="notification-item">
              <div class="notification-message">${item.message}</div>
              <div class="notification-time">From: ${item.senderName || item.sentBy || 'Unknown'}</div>
              <div class="notification-time">${when}</div>
            </div>
          `;
        })
        .join('');
    } catch (error) {
      listEl.innerHTML = '<div class="notification-empty">Unable to load notifications</div>';
      countEl.style.display = 'none';
    }
  },

  async navigate(path) {
    if (this.isNavigating) return;
    this.isNavigating = true;

    try {
      // Normalize route from values like '#/dashboard', '/dashboard', or 'dashboard'
      const route = String(path || '').replace(/^#?\/?/, '') || '';
      const user = Auth.getUser();
      const role = user?.role || "STUDENT";
      const isFacultyAdvisor = role === "FACULTY" ? Boolean(user?.isFacultyAdvisor) : false;
      const isPicCdc = role === "FACULTY" && String(user?.facultyDesignation || "").toUpperCase() === "PIC_CDC";
      const isPicTt = role === "FACULTY" && String(user?.facultyDesignation || "").toUpperCase() === "PIC_TT";
      const isHod = role === "FACULTY" && String(user?.facultyDesignation || "").toUpperCase() === "HOD";

      const facultyRoutes = ['dashboard', 'marks-update', 'attendance-update', 'send-notification', 'ta-enrollment'];
      if (isFacultyAdvisor) {
        facultyRoutes.push('fa-leave');
      }
      if (isPicCdc) {
        facultyRoutes.push('cdc-internships', 'cdc-placements');
      }
      if (isPicTt) {
        facultyRoutes.push('tt-course', 'tt-exam');
      }
      if (isHod) {
        facultyRoutes.push('hod-courses');
      }

      const allowedRoutes = {
        STUDENT: [
          'dashboard',
          'enrollment',
          'courses',
          'timetable',
          'exam',
          'transcript',
          'result',
          'attendance',
          'feedback',
          'internships',
          'placements',
          'leave',
          'student-resume'
        ],
        FACULTY: facultyRoutes,
        ADMIN: ['dashboard', 'admin-users', 'admin-rooms', 'send-notification']
      };

      // Check authentication and redirect if needed
      if (!Auth.isAuthenticated()) {
        if (route !== 'login' && route !== 'register') {
          if (window.location.hash !== '#/login') {
            window.location.hash = '#/login';
          }
          this.isNavigating = false;
          return;
        }
      } else {
        if (route === 'login' || route === 'register' || route === '') {
          const defaultRoute = '#/dashboard';
          if (window.location.hash !== defaultRoute) {
            window.location.hash = defaultRoute;
          }
          this.isNavigating = false;
          return;
        }
      }

      if (Auth.isAuthenticated() && route && route !== 'login' && route !== 'register') {
        const roleRoutes = allowedRoutes[role] || ['dashboard'];
        if (!roleRoutes.includes(route)) {
          const defaultRoute = '#/dashboard';
          if (window.location.hash !== defaultRoute) {
            window.location.hash = defaultRoute;
          }
          this.isNavigating = false;
          return;
        }
      }

      // Find page
      let page = pages.find(p => p.id === route) || LoginPage;
      this.mobileMenuOpen = false;

      const app = document.getElementById('app');
      if (!app) {
        this.isNavigating = false;
        return;
      }

      if (Auth.isAuthenticated() && page.id !== 'login' && page.id !== 'register') {
        // Render header for authenticated users
        app.innerHTML = this.renderHeader(route) + '<div id="page-content"></div>';
        if (role === 'STUDENT') {
          this.loadNotifications();
        }
      } else {
        app.innerHTML = '<div id="page-content"></div>';
      }

      // Render page
      const content = await page.render();
      const pageContent = document.getElementById('page-content');
      if (pageContent) {
        pageContent.innerHTML = content;
      }

      // Mount page
      if (page.mount) {
        await page.mount();
      }

      this.currentPage = page;
    } finally {
      this.isNavigating = false;
    }
  },

  renderHeader(activeRoute) {
    const user = Auth.getUser();
    const isFaculty = user?.role === 'FACULTY';
    const isAdmin = user?.role === 'ADMIN';
    const isFacultyAdvisor = isFaculty ? Boolean(user?.isFacultyAdvisor) : false;
    const isPicCdc = isFaculty && String(user?.facultyDesignation || '').toUpperCase() === 'PIC_CDC';
    const isPicTt = isFaculty && String(user?.facultyDesignation || '').toUpperCase() === 'PIC_TT';
    const isHod = isFaculty && String(user?.facultyDesignation || '').toUpperCase() === 'HOD';
    const activeClass = (routeName) => activeRoute === routeName ? 'active' : '';
    const academicsActive = ['courses', 'timetable', 'transcript', 'result', 'attendance', 'exam', 'feedback'].includes(activeRoute);
    const cdcActive = ['internships', 'placements', 'student-resume'].includes(activeRoute);
    const facultyAcademicsActive = ['marks-update', 'attendance-update', 'ta-enrollment'].includes(activeRoute);
    const facultyTimetableActive = ['tt-course', 'tt-exam'].includes(activeRoute);

    const studentNav = `
            <a href="#/enrollment" class="nav-link ${activeClass('enrollment')}">Enrollment</a>
            <div class="nav-dropdown ${academicsActive ? 'active' : ''}">
              <button type="button" class="nav-dropdown-toggle">Academics</button>
              <div class="nav-dropdown-menu">
                <a href="#/courses" class="nav-link ${activeClass('courses')}">My Courses</a>
                <a href="#/timetable" class="nav-link ${activeClass('timetable')}">Timetable</a>
                <a href="#/exam" class="nav-link ${activeClass('exam')}">Exam Schedule</a>
                <a href="#/transcript" class="nav-link ${activeClass('transcript')}">Marks</a>
                <a href="#/result" class="nav-link ${activeClass('result')}">Result</a>
                <a href="#/attendance" class="nav-link ${activeClass('attendance')}">Attendance</a>
                <a href="#/feedback" class="nav-link ${activeClass('feedback')}">Feedback</a>
              </div>
            </div>
            <div class="nav-dropdown ${cdcActive ? 'active' : ''}">
              <button type="button" class="nav-dropdown-toggle">CDC</button>
              <div class="nav-dropdown-menu">
                <a href="#/internships" class="nav-link ${activeClass('internships')}">Internships</a>
                <a href="#/placements" class="nav-link ${activeClass('placements')}">Placements</a>
                <a href="#/student-resume" class="nav-link ${activeClass('student-resume')}">My Resumes</a>
              </div>
            </div>
            <a href="#/leave" class="nav-link ${activeClass('leave')}">Leave</a>
    `;

    const studentMobileNav = `
              <button class="mobile-menu-item ${activeClass('enrollment')}" onclick="Router.goToRoute('enrollment')">Enrollment</button>
              <details class="mobile-menu-group ${academicsActive ? 'active' : ''}">
                <summary class="mobile-menu-item">Academics</summary>
                <div class="mobile-submenu">
                  <button class="mobile-menu-item ${activeClass('courses')}" onclick="Router.goToRoute('courses')">My Courses</button>
                  <button class="mobile-menu-item ${activeClass('timetable')}" onclick="Router.goToRoute('timetable')">Timetable</button>
                  <button class="mobile-menu-item ${activeClass('exam')}" onclick="Router.goToRoute('exam')">Exam Schedule</button>
                  <button class="mobile-menu-item ${activeClass('transcript')}" onclick="Router.goToRoute('transcript')">Marks</button>
                  <button class="mobile-menu-item ${activeClass('result')}" onclick="Router.goToRoute('result')">Result</button>
                  <button class="mobile-menu-item ${activeClass('attendance')}" onclick="Router.goToRoute('attendance')">Attendance</button>
                  <button class="mobile-menu-item ${activeClass('feedback')}" onclick="Router.goToRoute('feedback')">Feedback</button>
                </div>
              </details>
              <details class="mobile-menu-group ${cdcActive ? 'active' : ''}">
                <summary class="mobile-menu-item">CDC</summary>
                <div class="mobile-submenu">
                  <button class="mobile-menu-item ${activeClass('internships')}" onclick="Router.goToRoute('internships')">Internships</button>
                  <button class="mobile-menu-item ${activeClass('placements')}" onclick="Router.goToRoute('placements')">Placements</button>
                  <button class="mobile-menu-item ${activeClass('student-resume')}" onclick="Router.goToRoute('student-resume')">My Resumes</button>
                </div>
              </details>
              <button class="mobile-menu-item ${activeClass('leave')}" onclick="Router.goToRoute('leave')">Leave</button>
    `;

    const facultyNav = `
            <div class="nav-dropdown ${facultyAcademicsActive ? 'active' : ''}">
              <button type="button" class="nav-dropdown-toggle">Academics</button>
              <div class="nav-dropdown-menu">
                <a href="#/marks-update" class="nav-link ${activeClass('marks-update')}">Marks Updating</a>
                <a href="#/attendance-update" class="nav-link ${activeClass('attendance-update')}">Attendance Updating</a>
                <a href="#/ta-enrollment" class="nav-link ${activeClass('ta-enrollment')}">TA Enrollment</a>
              </div>
            </div>
            ${isFacultyAdvisor ? `
            <div class="nav-dropdown ${activeClass('fa-leave') === 'active' ? 'active' : ''}">
              <button type="button" class="nav-dropdown-toggle">FA</button>
              <div class="nav-dropdown-menu">
                <a href="#/fa-leave" class="nav-link ${activeClass('fa-leave')}">Leave Applications</a>
              </div>
            </div>
            ` : ''}
            ${isPicCdc ? `
            <div class="nav-dropdown ${['cdc-internships', 'cdc-placements'].includes(activeRoute) ? 'active' : ''}">
              <button type="button" class="nav-dropdown-toggle">CDC</button>
              <div class="nav-dropdown-menu">
                <a href="#/cdc-internships" class="nav-link ${activeClass('cdc-internships')}">Internships</a>
                <a href="#/cdc-placements" class="nav-link ${activeClass('cdc-placements')}">Placements</a>
              </div>
            </div>
            ` : ''}
            ${isPicTt ? `
            <div class="nav-dropdown ${facultyTimetableActive ? 'active' : ''}">
              <button type="button" class="nav-dropdown-toggle">Time Table</button>
              <div class="nav-dropdown-menu">
                <a href="#/tt-course" class="nav-link ${activeClass('tt-course')}">Course Time Table</a>
                <a href="#/tt-exam" class="nav-link ${activeClass('tt-exam')}">Exam Time Table</a>
              </div>
            </div>
            ` : ''}
            ${isHod ? `<a href="#/hod-courses" class="nav-link ${activeClass('hod-courses')}">Courses</a>` : ''}
            <a href="#/send-notification" class="nav-link ${activeClass('send-notification')}">Send Notification</a>
    `;

    const facultyMobileNav = `
              <details class="mobile-menu-group ${facultyAcademicsActive ? 'active' : ''}">
                <summary class="mobile-menu-item">Academics</summary>
                <div class="mobile-submenu">
                  <button class="mobile-menu-item ${activeClass('marks-update')}" onclick="Router.goToRoute('marks-update')">Marks Updating</button>
                  <button class="mobile-menu-item ${activeClass('attendance-update')}" onclick="Router.goToRoute('attendance-update')">Attendance Updating</button>
                  <button class="mobile-menu-item ${activeClass('ta-enrollment')}" onclick="Router.goToRoute('ta-enrollment')">TA Enrollment</button>
                </div>
              </details>
              ${isFacultyAdvisor ? `
              <details class="mobile-menu-group ${activeClass('fa-leave') === 'active' ? 'active' : ''}">
                <summary class="mobile-menu-item">FA</summary>
                <div class="mobile-submenu">
                  <button class="mobile-menu-item ${activeClass('fa-leave')}" onclick="Router.goToRoute('fa-leave')">Leave Applications</button>
                </div>
              </details>
              ` : ''}
              ${isPicCdc ? `
              <details class="mobile-menu-group ${['cdc-internships', 'cdc-placements'].includes(activeRoute) ? 'active' : ''}">
                <summary class="mobile-menu-item">CDC</summary>
                <div class="mobile-submenu">
                  <button class="mobile-menu-item ${activeClass('cdc-internships')}" onclick="Router.goToRoute('cdc-internships')">Internships</button>
                  <button class="mobile-menu-item ${activeClass('cdc-placements')}" onclick="Router.goToRoute('cdc-placements')">Placements</button>
                </div>
              </details>
              ` : ''}
              ${isPicTt ? `
              <details class="mobile-menu-group ${facultyTimetableActive ? 'active' : ''}">
                <summary class="mobile-menu-item">Time Table</summary>
                <div class="mobile-submenu">
                  <button class="mobile-menu-item ${activeClass('tt-course')}" onclick="Router.goToRoute('tt-course')">Course Time Table</button>
                  <button class="mobile-menu-item ${activeClass('tt-exam')}" onclick="Router.goToRoute('tt-exam')">Exam Time Table</button>
                </div>
              </details>
              ` : ''}
              ${isHod ? `<button class="mobile-menu-item ${activeClass('hod-courses')}" onclick="Router.goToRoute('hod-courses')">Courses</button>` : ''}
              <button class="mobile-menu-item ${activeClass('send-notification')}" onclick="Router.goToRoute('send-notification')">Send Notification</button>
    `;

                    const adminNav = `
                      <a href="#/send-notification" class="nav-link ${activeClass('send-notification')}">Send Notification</a>
                      <a href="#/admin-users" class="nav-link ${activeClass('admin-users')}">User Management</a>
                      <a href="#/admin-rooms" class="nav-link ${activeClass('admin-rooms')}">Room Management</a>
                    `;

                    const adminMobileNav = `
                        <button class="mobile-menu-item ${activeClass('send-notification')}" onclick="Router.goToRoute('send-notification')">Send Notification</button>
                        <button class="mobile-menu-item ${activeClass('admin-users')}" onclick="Router.goToRoute('admin-users')">User Management</button>
                        <button class="mobile-menu-item ${activeClass('admin-rooms')}" onclick="Router.goToRoute('admin-rooms')">Room Management</button>
                    `;

    const notifications = (isFaculty || isAdmin)
      ? ''
      : `
            <div class="notification-wrap" id="notificationWrap">
              <button type="button" class="notification-btn" onclick="Router.toggleNotifications()" aria-label="Notifications">
                <span class="notification-icon">\uD83D\uDD14</span>
                <span class="notification-count" id="notificationsCount" style="display:none;"></span>
              </button>
              <div class="notifications-panel" id="notificationsPanel">
                <div class="notifications-title">Notifications</div>
                <div class="notifications-list" id="notificationsList">
                  <div class="notification-empty">Loading...</div>
                </div>
              </div>
            </div>
      `;

    return `
      <div class="header">
        <div class="header-content">
          <div class="logo">DBMS Portal</div>
          <div class="nav">
            <a href="#/dashboard" class="nav-link ${activeClass('dashboard')}">Dashboard</a>
            ${isFaculty ? facultyNav : isAdmin ? adminNav : studentNav}
          </div>
          <div class="mobile-nav-wrap">
            <button class="mobile-menu-btn" onclick="Router.toggleMobileMenu()" aria-label="Open navigation menu">
              <span></span>
              <span></span>
              <span></span>
            </button>
            <div id="mobileMenuDropdown" class="mobile-menu-dropdown ${this.mobileMenuOpen ? 'open' : ''}">
              <button class="mobile-menu-item ${activeClass('dashboard')}" onclick="Router.goToRoute('dashboard')">Dashboard</button>
              ${isFaculty ? facultyMobileNav : isAdmin ? adminMobileNav : studentMobileNav}
            </div>
          </div>
          <div class="user-info">
            <span class="user-name">${user?.name || 'User'}</span>
            ${notifications}
            <button class="btn btn-secondary" onclick="Auth.logout()">Logout</button>
          </div>
        </div>
      </div>
    `;
  }
};

// Listen for hash changes
window.addEventListener('hashchange', () => {
  Router.navigate(window.location.hash);
});

document.addEventListener('click', (event) => {
  const wrap = document.getElementById('notificationWrap');
  if (!wrap) {
    return;
  }

  if (!wrap.contains(event.target)) {
    Router.closeNotifications();
  }
});
