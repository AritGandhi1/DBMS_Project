// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  // Set initial route based on auth
  const initialRoute = Auth.isAuthenticated() ? '#/dashboard' : '#/login';
  
  if (window.location.hash) {
    Router.navigate(window.location.hash);
  } else {
    window.location.hash = initialRoute;
  }
});

