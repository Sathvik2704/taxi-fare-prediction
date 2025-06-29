const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import backend models
const { User, Feedback, SearchHistory, SavedAddress, AdminMessage } = require('./auth-backend/models.js');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Prepare the Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taxi-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

app.prepare().then(() => {
  const server = express();

  // CORS configuration
  server.use(cors({
    origin: function(origin, callback) {
      if(!origin) return callback(null, true);
      
      const allowedOrigins = [
        'http://localhost:3000', 
        'http://localhost:3001', 
        'http://localhost:5173',
        'https://taxi-fare-prediction-app.vercel.app',
        process.env.RAILWAY_STATIC_URL,
        process.env.RAILWAY_PUBLIC_DOMAIN
      ].filter(Boolean);
      
      if (allowedOrigins.indexOf(origin) === -1) {
        console.log('CORS: Origin not allowed:', origin);
      }
      
      if (process.env.NODE_ENV !== 'production' || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('CORS: Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With']
  }));

  server.use(session({ secret: 'your_secret', resave: false, saveUninitialized: true }));
  server.use(passport.initialize());
  server.use(passport.session());

  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((obj, done) => done(null, obj));

  const ADMIN_EMAIL = 'sathwik272004@gmail.com';
  const ADMIN_PASSWORD = 'sathvik123';
  const JWT_SECRET = process.env.JWT_SECRET || 'secure_taxi_fare_jwt_token_secret';

  // Track users on login
  async function trackUserEmail(email) {
    if (!email) return;
    try {
      await User.findOneAndUpdate(
        { email },
        { email },
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error('Error tracking user:', error);
    }
  }

  // API Routes
  server.use('/api', express.json());

  // Health check endpoint
  server.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // User registration
  server.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists with this email' });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create new user
      const newUser = new User({
        name,
        email,
        password: hashedPassword,
        provider: 'local'
      });
      
      await newUser.save();
      await trackUserEmail(email);
      
      res.json({ success: true, message: 'User registered successfully' });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Error registering user' });
    }
  });

  // User login
  server.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    try {
      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { email: user.email, role: 'user' },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      // Update last login
      user.lastLogin = new Date();
      await user.save();
      
      res.json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          provider: user.provider
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Error during login' });
    }
  });

  // Validate token
  server.get('/api/validate-token', verifyUserJWT, async (req, res) => {
    try {
      const user = await User.findOne({ email: req.user.email });
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
      
      res.json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          provider: user.provider
        }
      });
    } catch (error) {
      console.error('Token validation error:', error);
      res.status(500).json({ error: 'Error validating token' });
    }
  });

  // Social login
  server.post('/api/social-login', async (req, res) => {
    const { profile } = req.body;
    
    if (!profile || !profile.emails || !profile.emails[0]) {
      return res.status(400).json({ error: 'Invalid profile data' });
    }
    
    try {
      const email = profile.emails[0].value;
      
      // Find or create user
      let user = await User.findOne({ email });
      
      if (!user) {
        // Create new user
        user = new User({
          name: profile.displayName,
          email,
          provider: profile.provider,
          lastLogin: new Date()
        });
        await user.save();
      } else {
        // Update existing user
        user.lastLogin = new Date();
        user.name = profile.displayName;
        await user.save();
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { email: user.email, role: 'user' },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      res.json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          provider: user.provider
        }
      });
    } catch (error) {
      console.error('Social login error:', error);
      res.status(500).json({ error: 'Error during social login' });
    }
  });

  // Feedback submission
  server.post('/api/feedback', async (req, res) => {
    console.log('Feedback submission received:', req.body);
    
    const { user, feedback } = req.body;
    if (!user || !feedback) {
      console.log('Feedback validation failed - missing user or feedback');
      return res.status(400).json({ error: 'Missing user or feedback' });
    }
    
    try {
      const newFeedback = new Feedback({ user, feedback });
      await newFeedback.save();
      await trackUserEmail(user);
      console.log('Feedback saved successfully');
      res.json({ success: true });
    } catch (error) {
      console.error('Error saving feedback:', error);
      res.status(500).json({ error: 'Error saving feedback' });
    }
  });

  // Search history submission
  server.post('/api/search-history', async (req, res) => {
    const { user, pickup, dropoff } = req.body;
    if (!user || !pickup || !dropoff) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    try {
      const newSearch = new SearchHistory({ user, pickup, dropoff });
      await newSearch.save();
      await trackUserEmail(user);
      res.json({ success: true });
    } catch (error) {
      console.error('Error saving search history:', error);
      res.status(500).json({ error: 'Error saving search history' });
    }
  });

  // Admin login
  server.post('/api/admin/login', (req, res) => {
    console.log('Admin login attempt:', req.body.email);
    
    if (!req.body.email || !req.body.password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const { email, password } = req.body;
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const token = jwt.sign({ email, role: 'admin' }, JWT_SECRET, { expiresIn: '2h' });
      trackUserEmail(email);
      console.log('Admin login successful for:', email);
      res.json({ success: true, token });
    } else {
      console.log('Admin login failed - invalid credentials');
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });

  // JWT middleware for admin
  function verifyAdminJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.role !== 'admin') throw new Error();
      req.admin = decoded;
      next();
    } catch {
      res.status(401).json({ error: 'Invalid token' });
    }
  }

  // JWT middleware for user authentication
  function verifyUserJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
    }
  }

  // Admin: get all feedbacks
  server.get('/api/admin/feedback', verifyAdminJWT, async (req, res) => {
    try {
      const feedbacks = await Feedback.find().sort({ date: -1 });
      console.log('Admin requesting feedback data. Total feedbacks:', feedbacks.length);
      res.json(feedbacks);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
      res.status(500).json({ error: 'Error fetching feedbacks' });
    }
  });

  // Admin: get user count and search histories
  server.get('/api/admin/users', verifyAdminJWT, async (req, res) => {
    try {
      const users = await User.find();
      const searchHistories = await SearchHistory.find().sort({ date: -1 });
      
      res.json({
        userCount: users.length,
        searchHistories: searchHistories.slice(0, 50) // Limit to 50 most recent
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Error fetching users' });
    }
  });

  // Admin: respond to user feedback
  server.post('/api/admin/respond', verifyAdminJWT, async (req, res) => {
    const { userEmail, message } = req.body;
    if (!userEmail || !message) {
      return res.status(400).json({ error: 'User email and message are required' });
    }
    
    try {
      const adminMessage = new AdminMessage({
        user: userEmail,
        message,
        date: new Date()
      });
      await adminMessage.save();
      res.json({ success: true });
    } catch (error) {
      console.error('Error saving admin response:', error);
      res.status(500).json({ error: 'Error saving response' });
    }
  });

  // User: get admin responses
  server.get('/api/user/admin-responses', verifyUserJWT, async (req, res) => {
    try {
      const responses = await AdminMessage.find({ user: req.user.email }).sort({ date: -1 });
      res.json(responses);
    } catch (error) {
      console.error('Error fetching admin responses:', error);
      res.status(500).json({ error: 'Error fetching responses' });
    }
  });

  // Google OAuth routes
  server.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  server.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
      res.redirect('/');
    }
  );

  // Facebook OAuth routes
  server.get('/auth/facebook',
    passport.authenticate('facebook', { scope: ['email'] })
  );

  server.get('/auth/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/login' }),
    (req, res) => {
      res.redirect('/');
    }
  );

  // Configure Google Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.RAILWAY_PUBLIC_DOMAIN || 'http://localhost:3000'}/auth/google/callback`
    }, async function(accessToken, refreshToken, profile, done) {
      try {
        await trackUser(profile);
        return done(null, profile);
      } catch (error) {
        return done(error, null);
      }
    }));
  }

  // Configure Facebook Strategy
  if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    passport.use(new FacebookStrategy({
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: `${process.env.RAILWAY_PUBLIC_DOMAIN || 'http://localhost:3000'}/auth/facebook/callback`,
      profileFields: ['id', 'displayName', 'photos', 'email']
    }, async function(accessToken, refreshToken, profile, done) {
      try {
        await trackUser(profile);
        return done(null, profile);
      } catch (error) {
        return done(error, null);
      }
    }));
  }

  async function trackUser(profile) {
    if (!profile.emails || !profile.emails[0]) return;
    const email = profile.emails[0].value;
    try {
      await User.findOneAndUpdate(
        { email },
        { 
          email,
          name: profile.displayName,
          provider: profile.provider,
          lastLogin: new Date()
        },
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error('Error tracking user:', error);
    }
  }

  // Handle all other requests with Next.js
  server.all('*', (req, res) => {
    return handle(req, res);
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
}); 