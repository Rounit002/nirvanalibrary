module.exports = (pool) => {
  const express = require('express');
  const router = express.Router();
  const { checkAdminOrStaff } = require('./auth');

  router.get('/', checkAdminOrStaff, async (req, res) => {
    try {
      const { shiftId, branchId } = req.query;
      const shiftIdNum = shiftId ? parseInt(shiftId, 10) : null;
      const branchIdNum = branchId ? parseInt(branchId, 10) : null;
      let queryText = `
        SELECT s.id AS seat_id, s.seat_number,
               sch.id AS shift_id, sch.title AS shift_title,
               st.id AS student_id, st.name AS student_name
        FROM seats s
        CROSS JOIN schedules sch
        LEFT JOIN seat_assignments sa ON s.id = sa.seat_id AND sch.id = sa.shift_id
        LEFT JOIN students st ON sa.student_id = st.id
        WHERE 1=1
      `;
      const params = [];
      
      if (shiftIdNum) {
        queryText += ` AND sch.id = $${params.length + 1}`;
        params.push(shiftIdNum);
      }
      if (branchIdNum) {
        queryText += ` AND s.branch_id = $${params.length + 1}`;
        params.push(branchIdNum);
      }
      queryText += ` ORDER BY s.seat_number, sch.id`;

      const result = await pool.query(queryText, params);
      const seatsMap = new Map();

      result.rows.forEach(row => {
        const seatId = row.seat_id;
        if (!seatsMap.has(seatId)) {
          seatsMap.set(seatId, {
            id: seatId,
            seatNumber: row.seat_number,
            shifts: []
          });
        }
        seatsMap.get(seatId).shifts.push({
          shiftId: row.shift_id,
          shiftTitle: row.shift_title,
          isAssigned: !!row.student_id,
          studentName: row.student_name || null
        });
      });

      res.json({ seats: Array.from(seatsMap.values()) });
    } catch (err) {
      console.error('Error fetching seats:', err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  });

  router.post('/', checkAdminOrStaff, async (req, res) => {
    try {
      const { seat_numbers, branch_id } = req.body;
      if (!seat_numbers) {
        return res.status(400).json({ message: 'seatNumbers is required' });
      }
      
      const seatArray = seat_numbers.split(',').map(s => s.trim()).filter(s => s);
      if (seatArray.length === 0) {
        return res.status(400).json({ message: 'No seat numbers provided' });
      }
      
      const branchIdNum = branch_id ? parseInt(branch_id, 10) : null;
      const existingSeats = await pool.query(
        'SELECT seat_number FROM seats WHERE seat_number = ANY($1) AND ($2::integer IS NULL OR branch_id = $2)',
        [seatArray, branchIdNum]
      );

      if (existingSeats.rows.length > 0) {
        const existingNumbers = existingSeats.rows.map(row => row.seat_number);
        return res.status(400).json({ message: `Seats already exist: ${existingNumbers.join(', ')}` });
      }
      
      const insertQuery = 'INSERT INTO seats (seat_number, branch_id) VALUES ' +
        seatArray.map((_, i) => `($${i + 1}, $${seatArray.length + 1})`).join(', ');
      
      await pool.query(insertQuery, [...seatArray, branchIdNum]);
      res.status(201).json({ message: 'Seats added successfully' });
    } catch (err) {
      console.error('Error adding seats:', err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  });

  router.delete('/:id', checkAdminOrStaff, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      await pool.query('DELETE FROM seat_assignments WHERE seat_id = $1', [id]);
      const result = await pool.query('DELETE FROM seats WHERE id = $1 RETURNING *', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Seat not found' });
      }
      res.json({ message: 'Seat deleted successfully' });
    } catch (err) {
      console.error('Error deleting seat:', err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  });

  router.get('/:seatId/assignments', checkAdminOrStaff, async (req, res) => {
    try {
      const seatId = parseInt(req.params.seatId, 10);
      const result = await pool.query(`
        SELECT 
          s.id as student_id,
          s.name as student_name,
          sch.title as shift_title
        FROM students s
        JOIN seat_assignments sa ON s.id = sa.student_id
        JOIN schedules sch ON sa.shift_id = sch.id
        WHERE sa.seat_id = $1 AND s.status = 'active'
      `, [seatId]);
      const assignments = result.rows.map(row => ({
        studentId: row.student_id,
        studentName: row.student_name,
        shiftTitle: row.shift_title || 'No shift',
      }));
      res.json({ assignments });
    } catch (err) {
      console.error('Error fetching seat assignments:', err);
      res.status(500).json({ message: 'Server error fetching seat assignments', error: err.message });
    }
  });

  router.get('/:seatId/available-shifts', checkAdminOrStaff, async (req, res) => {
    try {
      const seatId = parseInt(req.params.seatId, 10);
      const result = await pool.query(`
        SELECT sch.id, sch.title, sch.time, sch.event_date
        FROM schedules sch
        LEFT JOIN seat_assignments sa ON sch.id = sa.shift_id AND sa.seat_id = $1
        WHERE sa.shift_id IS NULL
        ORDER BY sch.event_date, sch.time
      `, [seatId]);
      const availableShifts = result.rows.map(row => ({
        id: row.id,
        title: row.title,
        time: row.time,
        eventDate: row.event_date,
      }));
      res.json({ availableShifts });
    } catch (err) {
      console.error('Error fetching available shifts:', err);
      res.status(500).json({ message: 'Server error fetching available shifts', error: err.message });
    }
  });

  return router;
};