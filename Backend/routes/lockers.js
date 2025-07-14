// routes/lockers.js
module.exports = (pool) => {
  const router = require('express').Router();
  const { checkPermissions } = require('./auth');

  // ✅ FIX: Modified to filter by branchId and join to get branch_name
  router.get('/', checkPermissions(['manage_seats', 'manage_library_students'], 'OR'), async (req, res) => {
    try {
      const { branchId } = req.query;
      let query = `
        SELECT 
          l.id, 
          l.locker_number, 
          l.is_assigned, 
          l.student_id, 
          s.name as student_name,
          b.name as branch_name,  -- Include branch name
          l.branch_id
        FROM locker l
        LEFT JOIN students s ON l.student_id = s.id
        LEFT JOIN branches b ON l.branch_id = b.id -- Join with branches table
      `;
      const params = [];

      if (branchId) {
        query += ` WHERE l.branch_id = $1`;
        params.push(parseInt(branchId, 10));
      }

      query += ` ORDER BY b.name, l.locker_number`;

      const result = await pool.query(query, params);
      res.json({ lockers: result.rows });
    } catch (err) {
      console.error('Error fetching lockers:', err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  });

  // ✅ FIX: Modified to require branch_id when creating a locker
  router.post('/', checkPermissions(['manage_seats']), async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { locker_number, branch_id } = req.body; // Added branch_id
      if (!locker_number || !branch_id) {
        return res.status(400).json({ message: 'Locker number and branch are required' });
      }
      const checkLocker = await client.query('SELECT 1 FROM locker WHERE locker_number = $1 AND branch_id = $2', [locker_number, branch_id]);
      if (checkLocker.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: `Locker with number ${locker_number} already exists in this branch` });
      }
      const result = await client.query(
        'INSERT INTO locker (locker_number, branch_id, is_assigned) VALUES ($1, $2, false) RETURNING *',
        [locker_number, branch_id] // Added branch_id to query
      );
      await client.query('COMMIT');
      res.status(201).json({ locker: result.rows[0] });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error creating locker:', err);
      res.status(500).json({ message: 'Server error', error: err.message });
    } finally {
      client.release();
    }
  });
  
  // ✅ FIX: Modified to allow updating locker_number and branch_id
  router.put('/:id', checkPermissions(['manage_seats']), async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const id = parseInt(req.params.id, 10);
      const { locker_number, branch_id } = req.body; // Added branch_id
      if (!locker_number || !branch_id) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Locker number and branch are required' });
      }
      // Check for duplicates in the target branch, excluding the current locker
      const checkLocker = await client.query('SELECT 1 FROM locker WHERE locker_number = $1 AND branch_id = $2 AND id != $3', [locker_number, branch_id, id]);
      if (checkLocker.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: `Locker with number ${locker_number} already exists in this branch` });
      }
      const result = await client.query(
        'UPDATE locker SET locker_number = $1, branch_id = $2 WHERE id = $3 RETURNING *',
        [locker_number, branch_id, id]
      );
      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'Locker not found' });
      }
      await client.query('COMMIT');
      res.json({ locker: result.rows[0] });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error updating locker:', err);
      res.status(500).json({ message: 'Server error', error: err.message });
    } finally {
      client.release();
    }
  });

  // This route remains the same, as it only deals with un-assigning from a student
  router.delete('/:id', checkPermissions(['manage_seats']), async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const id = parseInt(req.params.id, 10);
      const lockerCheck = await client.query('SELECT is_assigned, student_id FROM locker WHERE id = $1', [id]);
      if (lockerCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'Locker not found' });
      }
      if (lockerCheck.rows[0].is_assigned) {
        const studentId = lockerCheck.rows[0].student_id;
        await client.query('UPDATE students SET locker_id = NULL WHERE id = $1', [studentId]);
      }
      const result = await client.query('DELETE FROM locker WHERE id = $1 RETURNING *', [id]);
      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'Locker not found' });
      }
      await client.query('COMMIT');
      res.json({ message: 'Locker deleted', locker: result.rows[0] });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error deleting locker:', err);
      res.status(500).json({ message: 'Server error', error: err.message });
    } finally {
      client.release();
    }
  });

  return router;
};