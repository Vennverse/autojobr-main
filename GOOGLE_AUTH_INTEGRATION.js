// Google Auth Integration for AutoJobr
// Add this to your existing server setup

const passport = require('passport');
const session = require('express-session');

// Initialize Google Auth Strategy
require('./auth/googleStrategy')(passport);

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS in production
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Google Auth Routes
const googleAuthRoutes = require('./auth/googleRoutes');
app.use('/auth', googleAuthRoutes);

// Auth middleware for protected routes
const requireAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
};

// Example protected route
app.get('/dashboard', requireAuth, (req, res) => {
  res.json({
    message: 'Welcome to dashboard',
    user: req.user
  });
});

// User info endpoint
app.get('/api/user', requireAuth, (req, res) => {
  res.json({
    user: {
      id: req.user.googleId,
      email: req.user.email,
      name: `${req.user.firstName} ${req.user.lastName}`,
      avatar: req.user.profileImage
    }
  });
});

module.exports = { requireAuth };