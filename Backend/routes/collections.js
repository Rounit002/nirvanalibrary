module.exports = (pool) => {
  const router = require('express').Router();
  const { checkAdmin, checkAdminOrStaff } = require('./auth');

  router.get('/', checkAdminOrStaff, async (req, res) => {
    try {
      let query = `
        SELECT 
          smh.id as history_id, 
          smh.student_id, 
          smh.name, 
          sch.title as shift_title, 
          smh.total_fee, 
          smh.amount_paid, 
          smh.due_amount,
          smh.cash,
          smh.online,
          smh.security_money,
          smh.remark,
          smh.changed_at as created_at,
          smh.branch_id,
          b.name as branch_name
        FROM student_membership_history smh
        LEFT JOIN schedules sch ON smh.shift_id = sch.id
        LEFT JOIN branches b ON smh.branch_id = b.id
      `;
      const params = [];
      let paramIndex = 1;

      if (req.query.month) {
        const monthParam = req.query.month;
        if (!/^\d{4}-\d{2}$/.test(monthParam)) {
          return res.status(400).json({ message: 'Invalid month format. Use YYYY-MM' });
        }
        const [year, month] = monthParam.split('-');
        query += ` WHERE EXTRACT(YEAR FROM smh.changed_at) = $${paramIndex} AND EXTRACT(MONTH FROM smh.changed_at) = $${paramIndex + 1}`;
        params.push(year, month);
        paramIndex += 2;
      }

      if (req.query.branchId) {
        const branchId = parseInt(req.query.branchId, 10);
        if (isNaN(branchId)) {
          return res.status(400).json({ message: 'Invalid branch ID' });
        }
        query += (paramIndex > 1 ? ' AND' : ' WHERE') + ` smh.branch_id = $${paramIndex}`;
        params.push(branchId);
        paramIndex++;
      }

      query += ` ORDER BY smh.name`;
      const result = await pool.query(query, params);
      const collections = result.rows.map(row => ({
        historyId: row.history_id,
        studentId: row.student_id,
        name: row.name,
        shiftTitle: row.shift_title,
        totalFee: row.total_fee !== null && row.total_fee !== undefined ? parseFloat(row.total_fee) : 0,
        amountPaid: row.amount_paid !== null && row.amount_paid !== undefined ? parseFloat(row.amount_paid) : 0,
        dueAmount: row.due_amount !== null && row.due_amount !== undefined ? parseFloat(row.due_amount) : 0,
        cash: row.cash !== null && row.cash !== undefined ? parseFloat(row.cash) : 0,
        online: row.online !== null && row.online !== undefined ? parseFloat(row.online) : 0,
        securityMoney: row.security_money !== null && row.security_money !== undefined ? parseFloat(row.security_money) : 0,
        remark: row.remark || '',
        createdAt: row.created_at,
        branchId: row.branch_id,
        branchName: row.branch_name
      }));
      res.json({ collections });
    } catch (err) {
      console.error('Error fetching collections:', err);
      res.status(500).json({ message: 'Server error fetching collections', error: err.message });
    }
  });

  router.put('/:historyId', checkAdmin, async (req, res) => {
    const client = await pool.connect(); // Use a transaction to ensure consistency
    try {
      await client.query('BEGIN'); // Start transaction

      const { historyId } = req.params;
      const { payment_amount, payment_method } = req.body;

      // Validate payment_amount
      if (typeof payment_amount !== 'number' || payment_amount <= 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Invalid payment_amount' });
      }

      // Validate payment_method
      if (!['cash', 'online'].includes(payment_method)) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Invalid payment_method' });
      }

      // Fetch the existing history record
      const historyRes = await client.query('SELECT * FROM student_membership_history WHERE id = $1', [historyId]);
      if (historyRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'History record not found' });
      }
      const history = historyRes.rows[0];

      // Parse current values as floats, defaulting to 0 if null/undefined
      const current_cash = parseFloat(history.cash) || 0;
      const current_online = parseFloat(history.online) || 0;
      const current_total_fee = parseFloat(history.total_fee) || 0;
      const current_due_amount = parseFloat(history.due_amount) || 0;

      // Calculate new values based on payment method
      let new_cash = current_cash;
      let new_online = current_online;
      if (payment_method === 'cash') {
        new_cash += payment_amount;
      } else if (payment_method === 'online') {
        new_online += payment_amount;
      }

      // Calculate new amount_paid and due_amount
      const new_amount_paid = new_cash + new_online;
      const new_due_amount = current_total_fee - new_amount_paid;

      // Prevent overpayment
      if (new_due_amount < 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Payment exceeds due amount' });
      }

      // Update the student_membership_history table
      await client.query(
        `UPDATE student_membership_history 
         SET cash = $1, online = $2, amount_paid = $3, due_amount = $4 
         WHERE id = $5`,
        [new_cash, new_online, new_amount_paid, new_due_amount, historyId]
      );

      // Fetch the student_id from the history record
      const studentId = history.student_id;

      // Verify the student exists in the students table
      const studentRes = await client.query('SELECT * FROM students WHERE id = $1', [studentId]);
      if (studentRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'Student not found for this history record' });
      }

      // Update the students table with the new payment details
      await client.query(
        `UPDATE students 
         SET cash = $1, online = $2, amount_paid = $3, due_amount = $4 
         WHERE id = $5`,
        [new_cash, new_online, new_amount_paid, new_due_amount, studentId]
      );

      // Fetch the updated history record with shift title and branch name
      const updatedRes = await client.query(`
        SELECT 
          smh.id as history_id, 
          smh.student_id, 
          smh.name, 
          sch.title as shift_title, 
          smh.total_fee, 
          smh.amount_paid, 
          smh.due_amount,
          smh.cash,
          smh.online,
          smh.security_money,
          smh.remark,
          smh.changed_at as created_at,
          smh.branch_id,
          b.name as branch_name
        FROM student_membership_history smh
        LEFT JOIN schedules sch ON smh.shift_id = sch.id
        LEFT JOIN branches b ON smh.branch_id = b.id
        WHERE smh.id = $1
      `, [historyId]);
      const updatedHistory = updatedRes.rows[0];

      await client.query('COMMIT'); // Commit transaction

      // Return the updated collection data
      res.json({
        message: 'Payment updated successfully',
        collection: {
          historyId: updatedHistory.history_id,
          studentId: updatedHistory.student_id,
          name: updatedHistory.name,
          shiftTitle: updatedHistory.shift_title,
          totalFee: parseFloat(updatedHistory.total_fee) || 0,
          amountPaid: parseFloat(updatedHistory.amount_paid) || 0,
          dueAmount: parseFloat(updatedHistory.due_amount) || 0,
          cash: parseFloat(updatedHistory.cash) || 0,
          online: parseFloat(updatedHistory.online) || 0,
          securityMoney: parseFloat(updatedHistory.security_money) || 0,
          remark: updatedHistory.remark || '',
          createdAt: updatedHistory.created_at,
          branchId: updatedHistory.branch_id,
          branchName: updatedHistory.branch_name
        }
      });
    } catch (err) {
      await client.query('ROLLBACK'); // Roll back transaction on error
      console.error('Error updating payment:', err);
      res.status(500).json({ message: 'Server error updating payment', error: err.message });
    } finally {
      client.release();
    }
  });

  return router;
};