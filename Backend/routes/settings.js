const { checkAdmin } = require('./auth');

module.exports = (pool) => {
  const router = require('express').Router();

  router.get('/', checkAdmin, async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM settings');
      const settings = {};
      result.rows.forEach(row => {
        settings[row.key] = row.value;
      });
      res.json(settings);
    } catch (err) {
      console.error('Error in settings GET route:', err.stack);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  });

  router.put('/', checkAdmin, async (req, res) => {
    try {
      const { brevo_template_id, days_before_expiration } = req.body;
      if (brevo_template_id && typeof brevo_template_id !== 'string') {
        return res.status(400).json({ message: 'Invalid Brevo template ID' });
      }
      if (days_before_expiration && (isNaN(days_before_expiration) || days_before_expiration < 1)) {
        return res.status(400).json({ message: 'Days before expiration must be a positive integer' });
      }
      if (brevo_template_id) {
        await pool.query('INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2', ['brevo_template_id', brevo_template_id]);
      }
      if (days_before_expiration) {
        await pool.query('INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2', ['days_before_expiration', days_before_expiration.toString()]);
      }
      res.json({ message: 'Settings updated successfully' });
    } catch (err) {
      console.error('Error in settings PUT route:', err.stack);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  });

  return router;
};