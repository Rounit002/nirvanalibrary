// ./routes/auth.js

const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.status(401).json({ message: 'Unauthorized - Please log in' });
    }
    if (req.session.user.role === 'admin') {
      return next();
    }
    const userPermissions = req.session.user.permissions || [];
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({ message: 'Forbidden - Insufficient permissions' });
    }
    return next();
  };
};

const checkPermissions = (permissions = [], logic = 'OR') => {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.status(401).json({ message: 'Unauthorized - Please log in' });
    }

    // Admin role bypasses specific permission checks
    if (req.session.user.role === 'admin') {
      return next();
    }

    const userPermissions = req.session.user.permissions || [];
    let hasPermission;

    if (logic.toUpperCase() === 'AND') {
      // User must have ALL of the required permissions
      hasPermission = permissions.every(p => userPermissions.includes(p));
    } else {
      // User must have AT LEAST ONE of the required permissions
      hasPermission = permissions.some(p => userPermissions.includes(p));
    }

    if (!hasPermission) {
      return res.status(403).json({ message: 'Forbidden - Insufficient permissions' });
    }
    
    return next();
  };
};

const checkAdmin = (req, res, next) => {
  if (!req.session.user) {
    console.warn('[AUTH.JS] Admin Check Failed: No user in session for path:', req.path);
    return res.status(401).json({ message: 'Unauthorized - Please log in' });
  }
  if (req.session.user.role !== 'admin') {
    console.warn(`[AUTH.JS] Admin Check Failed: User ${req.session.user.username} (role: ${req.session.user.role}) is not an admin for path: ${req.path}`);
    return res.status(403).json({ message: 'Forbidden: Admin access required' });
  }
  return next();
};

const checkAdminOrStaff = (req, res, next) => {
  if (!req.session.user) {
    console.warn('[AUTH.JS] Admin/Staff Check Failed: No user in session for path:', req.path);
    return res.status(401).json({ message: 'Unauthorized - Please log in' });
  }
  if (req.session.user.role === 'admin' || req.session.user.role === 'staff') {
    return next();
  }
  console.warn(`[AUTH.JS] Admin/Staff Check Failed: User ${req.session.user.username} (role: ${req.session.user.role}) is not admin/staff for path: ${req.path}`);
  return res.status(403).json({ message: 'Forbidden: Admin or Staff access required' });
};

const authenticateUser = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.id) {
    return next();
  } else {
    console.warn('[AUTH.JS] User not authenticated for path:', req.path);
    return res.status(401).json({ message: 'Unauthorized - Please log in' });
  }
};

const authRouter = (pool) => {
  const router = require('express').Router();

  router.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }

      const result = await pool.query(
        'SELECT id, username, password, role, permissions FROM users WHERE username = $1',
        [username]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const user = result.rows[0];
      const isPasswordValid = (password === user.password);

      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      req.session.user = {
        id: user.id,
        username: user.username,
        role: user.role,
        permissions: user.permissions || []
      };

      console.log(`[AUTH.JS] User ${user.username} logged in successfully`);
      return res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          permissions: user.permissions || []
        }
      });
    } catch (err) {
      console.error('[AUTH.JS] Login error:', err.stack);
      return res.status(500).json({ message: 'Server error during login', error: err.message });
    }
  });

  router.get('/logout', (req, res) => {
    const username = req.session?.user?.username || 'Unknown';
    req.session.destroy((err) => {
      if (err) {
        console.error('[AUTH.JS] Logout error for user:', username, err.stack);
        return res.status(500).json({ message: 'Could not log out, please try again.' });
      }
      res.clearCookie('connect.sid');
      console.log(`[AUTH.JS] User ${username} logged out successfully.`);
      return res.json({ message: 'Logout successful' });
    });
  });

  router.get('/status', (req, res) => {
    try {
      if (req.session && req.session.user) {
        return res.json({
          isAuthenticated: true,
          user: {
            id: req.session.user.id,
            username: req.session.user.username,
            role: req.session.user.role,
            permissions: req.session.user.permissions || []
          }
        });
      }
      return res.json({ isAuthenticated: false, user: null });
    } catch (error) {
      console.error('[AUTH.JS] Error in /api/auth/status:', error);
      console.log('Session user permissions:', req.session.user.permissions);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  });

  // ✅ NEW: Refresh session with up-to-date DB values
  router.get('/refresh', authenticateUser, async (req, res) => {
    try {
      const result = await pool.query(
        'SELECT id, username, role, permissions FROM users WHERE id = $1',
        [req.session.user.id]
      );
      const user = result.rows[0];
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      req.session.user = {
        id: user.id,
        username: user.username,
        role: user.role,
        permissions: user.permissions || []
      };

      console.log(`[AUTH.JS] Session refreshed for user: ${user.username}`);
      return res.json({
        message: 'Session refreshed',
        user: req.session.user
      });
    } catch (error) {
      console.error('[AUTH.JS] Error refreshing session:', error.stack);
      return res.status(500).json({ message: 'Failed to refresh session', error: error.message });
    }
  });

  return router;
};

module.exports = {
  checkPermission,
  checkPermissions,
  checkAdmin,
  checkAdminOrStaff,
  authenticateUser,
  authRouter
};