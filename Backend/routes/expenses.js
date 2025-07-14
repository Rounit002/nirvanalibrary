module.exports = (pool) => {
  const express = require('express');
  const router = express.Router();
  const { checkAdminOrStaff } = require('./auth');

  router.get('/', checkAdminOrStaff, async (req, res) => {
    try {
      const { branchId } = req.query; // branchId will be a string from query
      let query = `
        SELECT e.*, b.name AS branch_name
        FROM expenses e
        LEFT JOIN branches b ON e.branch_id = b.id
      `;
      const params = [];
      if (branchId) {
        query += ` WHERE e.branch_id = $1`;
        params.push(parseInt(branchId, 10)); // Ensure it's an integer for the query
      }
      query += ' ORDER BY e.date DESC';
      
      const expensesResult = await pool.query(query, params);
      const productsResult = await pool.query('SELECT id, name FROM products');

      // Log the raw query result to debug
      console.log('Expenses query result:', expensesResult.rows);

      const formattedExpenses = expensesResult.rows.map(expense => ({
        ...expense,
        amount: parseFloat(expense.amount || 0),
        branch_name: expense.branch_name || null // Ensure branch_name is explicitly included
      }));

      // Log the formatted response to debug
      console.log('Formatted expenses response:', formattedExpenses);

      res.json({
        expenses: formattedExpenses,
        products: productsResult.rows
      });
    } catch (err) {
      console.error('Error fetching expenses:', err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  });

  router.post('/', checkAdminOrStaff, async (req, res) => {
    try {
      let { title, amount, date, remark, branch_id } = req.body;
      if (!title || !amount || !date) {
        return res.status(400).json({ message: 'Title, amount, and date are required' });
      }
      // Ensure branch_id is an integer or null
      branch_id = branch_id ? parseInt(branch_id, 10) : null;
      remark = remark || null;

      const result = await pool.query(
        'INSERT INTO expenses (title, amount, date, remark, branch_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [title, parseFloat(amount), date, remark, branch_id]
      );

      // Log the inserted expense
      console.log('Inserted expense:', result.rows[0]);

      res.status(201).json({
        ...result.rows[0],
        amount: parseFloat(result.rows[0].amount || 0)
      });
    } catch (err) {
      console.error('Error adding expense:', err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  });

  router.put('/:id', checkAdminOrStaff, async (req, res) => {
    try {
      const { id } = req.params; // id will be a string from URL param
      let { title, amount, date, remark, branch_id } = req.body;
      
      branch_id = branch_id ? parseInt(branch_id, 10) : null;
      remark = remark || null;

      const result = await pool.query(
        'UPDATE expenses SET title = $1, amount = $2, date = $3, remark = $4, branch_id = $5 WHERE id = $6 RETURNING *',
        [title, parseFloat(amount), date, remark, branch_id, parseInt(id, 10)]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Expense not found' });
      }

      // Log the updated expense
      console.log('Updated expense:', result.rows[0]);

      res.json({
        ...result.rows[0],
        amount: parseFloat(result.rows[0].amount || 0)
      });
    } catch (err) {
      console.error('Error updating expense:', err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  });

  router.delete('/:id', checkAdminOrStaff, async (req, res) => {
    try {
      const { id } = req.params; // id will be a string
      const result = await pool.query('DELETE FROM expenses WHERE id = $1 RETURNING *', [parseInt(id, 10)]);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Expense not found' });
      }
      res.json({ message: 'Expense deleted' });
    } catch (err) {
      console.error('Error deleting expense:', err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  });

  return router;
};