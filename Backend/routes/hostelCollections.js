// ./routes/hostelCollections.js (for HOSTEL system)
module.exports = (pool) => {
  const router = require('express').Router();
  const { checkAdminOrStaff } = require('./auth'); 

  router.get('/', checkAdminOrStaff, async (req, res) => {
    try {
      let queryText = `
        SELECT 
          hsh.id as history_id,
          hsh.student_id,
          hs.name as student_name, 
          hs.branch_id, 
          hb.name as branch_name,
          hs.phone_number as student_phone_number,
          hs.registration_number as student_registration_number,
          hs.room_number as student_current_room_number,
          hs.security_money as student_security_money, -- <<< ADDED SECURITY MONEY
          hsh.stay_start_date,
          hsh.stay_end_date,
          hsh.total_fee,
          hsh.cash_paid,
          hsh.online_paid,
          hsh.due_amount,
          hsh.room_number as history_room_number, 
          hsh.remark as history_remark,
          hsh.created_at as history_created_at,
          hsh.updated_at as history_updated_at 
        FROM hostel_student_history hsh
        LEFT JOIN hostel_students hs ON hsh.student_id = hs.id
        LEFT JOIN hostel_branches hb ON hs.branch_id = hb.id
      `;
      const queryParams = [];
      const conditions = [];

      if (req.query.month && String(req.query.month).trim() !== '') {
        const monthParam = String(req.query.month);
        if (!/^\d{4}-\d{2}$/.test(monthParam)) {
          return res.status(400).json({ message: 'Invalid month format. Use YYYY-MM' });
        }
        const year = parseInt(monthParam.substring(0, 4));
        const month = parseInt(monthParam.substring(5, 7));
        
        if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
            return res.status(400).json({ message: 'Invalid year or month value in month parameter.' });
        }
        
        const firstDayOfMonth = new Date(year, month - 1, 1);
        const lastDayOfMonth = new Date(year, month, 0); 

        conditions.push(
          `(hsh.stay_start_date <= $${queryParams.length + 1} AND hsh.stay_end_date >= $${queryParams.length + 2})`
        );
        queryParams.push(lastDayOfMonth.toISOString().split('T')[0], firstDayOfMonth.toISOString().split('T')[0]);
      }

      if (req.query.branch_id && String(req.query.branch_id).trim() !== '') {
        const branchIdParam = parseInt(String(req.query.branch_id));
        if(isNaN(branchIdParam)){
            return res.status(400).json({ message: 'Invalid branch ID for filtering.' });
        }
        conditions.push(`hs.branch_id = $${queryParams.length + 1}`);
        queryParams.push(branchIdParam);
      }
      
      if (conditions.length > 0) {
        queryText += ` WHERE ${conditions.join(' AND ')}`;
      }

      queryText += ` ORDER BY hs.name ASC, hsh.stay_start_date DESC`;
      
      console.log('[hostelCollections.js GET] Executing query:', queryText, queryParams);
      const result = await pool.query(queryText, queryParams);
      
      // Backend sends snake_case keys; api.ts response interceptor converts to camelCase.
      // The mapping in HostelCollectionDue.tsx will expect camelCase.
      res.json({ collections: result.rows });
    } catch (err) {
      console.error('[hostelCollections.js GET] Error fetching hostel collections:', err.stack);
      res.status(500).json({ message: 'Server error fetching collections', error: err.message });
    }
  });

  router.put('/:historyId', checkAdminOrStaff, async (req, res) => {
    try {
      const { historyId } = req.params;
      const parsedHistoryId = parseInt(historyId);
      if (isNaN(parsedHistoryId)) {
        return res.status(400).json({ message: 'Invalid history ID format.' });
      }

      const { payment_amount, payment_type } = req.body;

      if (typeof payment_amount !== 'number' || payment_amount <= 0) {
        return res.status(400).json({ message: 'Payment amount must be a positive number.' });
      }
      if (!['cash', 'online'].includes(payment_type)) {
        return res.status(400).json({ message: 'Invalid payment type. Must be "cash" or "online".' });
      }

      await pool.query('BEGIN');
      const historyRes = await pool.query('SELECT * FROM hostel_student_history WHERE id = $1 FOR UPDATE', [parsedHistoryId]);
      if (historyRes.rows.length === 0) {
        await pool.query('ROLLBACK');
        return res.status(404).json({ message: 'History record not found.' });
      }
      
      const history = historyRes.rows[0];
      const currentTotalFee = parseFloat(history.total_fee);
      let currentCashPaid = parseFloat(history.cash_paid);
      let currentOnlinePaid = parseFloat(history.online_paid);
      const currentDueAmount = parseFloat(history.due_amount);

      if (payment_amount > currentDueAmount + 0.001) { 
        await pool.query('ROLLBACK');
        return res.status(400).json({ message: `Payment amount (₹${payment_amount.toFixed(2)}) exceeds current due amount (₹${currentDueAmount.toFixed(2)}).` });
      }

      if (payment_type === 'cash') {
        currentCashPaid += payment_amount;
      } else { 
        currentOnlinePaid += payment_amount;
      }
      
      const newTotalPaid = currentCashPaid + currentOnlinePaid;
      const newDueAmount = currentTotalFee - newTotalPaid;

      const updateResult = await pool.query(
        'UPDATE hostel_student_history SET cash_paid = $1, online_paid = $2, due_amount = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
        [currentCashPaid.toFixed(2), currentOnlinePaid.toFixed(2), newDueAmount.toFixed(2), parsedHistoryId]
      );
      await pool.query('COMMIT');
      
      res.json({ message: 'Payment updated successfully', updatedHistory: updateResult.rows[0] });
    } catch (err) {
      await pool.query('ROLLBACK');
      console.error('[hostelCollections.js PUT /:historyId] Error updating payment:', err.stack);
      res.status(500).json({ message: 'Server error updating payment', error: err.message });
    }
  });

  return router;
};