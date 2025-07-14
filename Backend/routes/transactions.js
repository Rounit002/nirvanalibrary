module.exports = (pool) => {
    const router = require('express').Router();
    const { checkAdminOrStaff } = require('./auth');
  
    router.get('/', checkAdminOrStaff, async (req, res) => {
      try {
        const result = await pool.query('SELECT * FROM transactions ORDER BY created_at DESC');
        res.json({ transactions: result.rows });
      } catch (err) {
        console.error('Error in transactions route (GET /):', err.stack);
        res.status(500).json({ message: 'Server error', error: err.message });
      }
    });
  
    router.post('/', checkAdminOrStaff, async (req, res) => {
      try {
        const { name, cash_receipt, online_receipt, cash_expense, online_expense } = req.body;
        if (!name) {
          return res.status(400).json({ message: 'Name is required' });
        }
        const result = await pool.query(
          'INSERT INTO transactions (name, cash_receipt, online_receipt, cash_expense, online_expense) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [name, cash_receipt || 0, online_receipt || 0, cash_expense || 0, online_expense || 0]
        );
        res.status(201).json(result.rows[0]);
      } catch (err) {
        console.error('Error in transactions POST route:', err.stack);
        res.status(500).json({ message: 'Server error', error: err.message });
      }
    });
  
    router.put('/:id', checkAdminOrStaff, async (req, res) => {
      try {
        const { id } = req.params;
        const { name, cash_receipt, online_receipt, cash_expense, online_expense } = req.body;
        const result = await pool.query(
          `UPDATE transactions SET
            name = COALESCE($1, name),
            cash_receipt = COALESCE($2, cash_receipt),
            online_receipt = COALESCE($3, online_receipt),
            cash_expense = COALESCE($4, cash_expense),
            online_expense = COALESCE($5, online_expense),
            updated_at = NOW()
          WHERE id = $6 RETURNING *`,
          [name, cash_receipt, online_receipt, cash_expense, online_expense, id]
        );
        if (result.rows.length === 0) {
          return res.status(404).json({ message: 'Transaction not found' });
        }
        res.json(result.rows[0]);
      } catch (err) {
        console.error('Error in transactions PUT route:', err.stack);
        res.status(500).json({ message: 'Server error', error: err.message });
      }
    });
  
    router.delete('/:id', checkAdminOrStaff, async (req, res) => {
      try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM transactions WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
          return res.status(404).json({ message: 'Transaction not found' });
        }
        res.json({ message: 'Transaction deleted successfully' });
      } catch (err) {
        console.error('Error in transactions DELETE route:', err.stack);
        res.status(500).json({ message: 'Server error', error: err.message });
      }
    });
  
    return router;
  };