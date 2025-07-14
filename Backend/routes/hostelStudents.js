// ./routes/hostelStudents.js
const { checkAdminOrStaff } = require('./auth'); 

module.exports = (pool) => {
  const router = require('express').Router();

  // GET all hostel students (as previously provided, should be fine)
  router.get('/', checkAdminOrStaff, async (req, res) => {
    try {
      const { branch_id } = req.query; 
      let queryText = `
        SELECT 
          s.id, s.branch_id, s.name, s.address, s.father_name, s.mother_name, 
          s.aadhar_number, s.phone_number, s.profile_image_url, s.aadhar_image_url,
          s.religion, s.food_preference, s.gender, s.security_money, 
          s.registration_number, s.room_number AS student_room_number, s.remark AS student_remark, 
          s.created_at AS student_created_at, s.updated_at AS student_updated_at,
          b.name as branch_name,
          hsh.id as history_id, hsh.stay_start_date, hsh.stay_end_date, hsh.total_fee,
          hsh.cash_paid, hsh.online_paid, hsh.due_amount,
          hsh.room_number AS history_room_number, hsh.remark AS history_remark,
          hsh.created_at AS history_created_at
        FROM hostel_students s
        LEFT JOIN hostel_branches b ON s.branch_id = b.id
        LEFT JOIN (
          SELECT *,
                 ROW_NUMBER() OVER(PARTITION BY student_id ORDER BY stay_end_date DESC, created_at DESC) as rn
          FROM hostel_student_history
        ) hsh ON s.id = hsh.student_id AND hsh.rn = 1
      `;
      const queryParams = [];
      if (branch_id) {
        const parsedQueryBranchId = parseInt(branch_id);
        if (isNaN(parsedQueryBranchId)) {
            return res.status(400).json({ message: 'Invalid branch ID format for filtering.' });
        }
        queryText += ' WHERE s.branch_id = $1';
        queryParams.push(parsedQueryBranchId); 
      }
      queryText += ' ORDER BY s.name ASC'; // Added ASC for consistent ordering
      
      const result = await pool.query(queryText, queryParams);
      res.json({ students: result.rows });
    } catch (err) {
      console.error('Error in GET /hostel/students:', err.stack);
      res.status(500).json({ message: 'Server error fetching hostel students', error: err.message });
    }
  });

  // GET a single hostel student by ID with their complete history
  router.get('/:id', checkAdminOrStaff, async (req, res) => {
    try {
      const { id } = req.params;
      const parsedId = parseInt(id);
      if (isNaN(parsedId)) {
        return res.status(400).json({ message: 'Invalid student ID format' });
      }

      const studentResult = await pool.query(
        `SELECT s.*, b.name as branch_name 
         FROM hostel_students s
         LEFT JOIN hostel_branches b ON s.branch_id = b.id
         WHERE s.id = $1`,
        [parsedId]
      );

      if (studentResult.rows.length === 0) {
        return res.status(404).json({ message: 'Student not found' });
      }
      const student = studentResult.rows[0];

      const historyResult = await pool.query(
        `SELECT * FROM hostel_student_history 
         WHERE student_id = $1 
         ORDER BY stay_start_date DESC, created_at DESC`, // Get all history records
        [parsedId]
      );
      
      const history = historyResult.rows.map(row => ({
        ...row, // Spread all columns from history
        total_fee: parseFloat(String(row.total_fee || 0)),
        cash_paid: parseFloat(String(row.cash_paid || 0)),
        online_paid: parseFloat(String(row.online_paid || 0)),
        due_amount: parseFloat(String(row.due_amount || 0)),
      }));

      // The API response for getHostelStudent should be an object containing student and its full history array
      res.json({ student, history }); 
    } catch (err) {
      console.error('Error in GET /hostel/students/:id:', err.stack);
      res.status(500).json({ message: 'Server error fetching student details', error: err.message });
    }
  });

  // POST (add) a new hostel student - This creates student and initial history
  router.post('/', checkAdminOrStaff, async (req, res) => {
    // ... (Keep your existing POST logic, it correctly creates student and history)
    // This part seems to be working fine now for adding new students.
    console.log('Backend received POST /hostel/students request with body:', JSON.stringify(req.body, null, 2));
    const {
      branch_id, name, address, father_name, mother_name, aadhar_number, phone_number,
      profile_image_url, aadhar_image_url, religion, food_preference, gender, security_money,
      registration_number, stay_start_date, stay_end_date, total_fee, cash_paid,
      online_paid, room_number, remark,
    } = req.body;

    if (!branch_id) return res.status(400).json({ message: 'Branch ID is strictly required.' });
    const parsedBranchId = parseInt(branch_id); 
    if (isNaN(parsedBranchId)) return res.status(400).json({ message: 'Branch ID must be a valid number.' });

    if (!name || !name.trim()) return res.status(400).json({ message: 'Name is required.' });
    if (!stay_start_date) return res.status(400).json({ message: 'Stay start date is required.' });
    if (!stay_end_date) return res.status(400).json({ message: 'Stay end date is required.' });
    if (total_fee === undefined || total_fee === null) return res.status(400).json({ message: 'Total fee is required.' });
    const totalFeeNum = parseFloat(total_fee);
    if (isNaN(totalFeeNum) || totalFeeNum < 0) return res.status(400).json({ message: 'Total fee must be a non-negative number.' });
    
    if (!room_number || !String(room_number).trim()) return res.status(400).json({ message: 'Room number is required.' });
    if (!religion || !String(religion).trim()) return res.status(400).json({ message: 'Religion is required.' });
    if (!food_preference) return res.status(400).json({ message: 'Food preference is required.' });
    if (!gender) return res.status(400).json({ message: 'Gender is required.' });
    
    const parsedSecurityMoney = security_money ? parseFloat(security_money) : 0.0;
    if (isNaN(parsedSecurityMoney) || parsedSecurityMoney < 0) return res.status(400).json({ message: 'Security money must be a non-negative number.' });

    if (aadhar_number && !/^\d{12}$/.test(aadhar_number)) return res.status(400).json({ message: 'Aadhar number must be a 12-digit number.' });
    if (phone_number && !/^\d{10}$/.test(phone_number)) return res.status(400).json({ message: 'Phone number must be a 10-digit number.' });

    const cashPaidNum = cash_paid ? parseFloat(cash_paid) : 0.0;
    if (isNaN(cashPaidNum) || cashPaidNum < 0) return res.status(400).json({ message: 'Cash paid must be a non-negative number.' });
    const onlinePaidNum = online_paid ? parseFloat(online_paid) : 0.0;
    if (isNaN(onlinePaidNum) || onlinePaidNum < 0) return res.status(400).json({ message: 'Online paid must be a non-negative number.' });

    try {
      await pool.query('BEGIN');

      const branchCheck = await pool.query('SELECT id FROM hostel_branches WHERE id = $1', [parsedBranchId]);
      if (branchCheck.rows.length === 0) {
        await pool.query('ROLLBACK');
        return res.status(400).json({ message: `Branch with ID ${parsedBranchId} does not exist.` });
      }

      const studentInsertQuery = `
        INSERT INTO hostel_students (
          branch_id, name, address, father_name, mother_name, aadhar_number, phone_number,
          profile_image_url, aadhar_image_url, religion, food_preference, gender, security_money, 
          registration_number, room_number, remark, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
        RETURNING *`;
      const studentInsertParams = [
        parsedBranchId, name.trim(), address || null, father_name || null, mother_name || null,
        aadhar_number || null, phone_number || null, profile_image_url || null, aadhar_image_url || null,
        String(religion).trim(), food_preference, gender, parsedSecurityMoney, registration_number || null,
        String(room_number).trim(), remark || null
      ];
      const studentResult = await pool.query(studentInsertQuery, studentInsertParams);
      const newStudent = studentResult.rows[0];

      const totalPaid = cashPaidNum + onlinePaidNum;
      const dueAmount = totalFeeNum - totalPaid;

      const historyInsertQuery = `
        INSERT INTO hostel_student_history (
          student_id, stay_start_date, stay_end_date, total_fee, cash_paid, online_paid, due_amount, 
          room_number, remark, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP) 
        RETURNING *`;
      const historyInsertParams = [
        newStudent.id, stay_start_date, stay_end_date, totalFeeNum, cashPaidNum, onlinePaidNum,
        dueAmount, String(room_number).trim(), remark || null
      ];
      const historyResult = await pool.query(historyInsertQuery, historyInsertParams);
      const newHistory = historyResult.rows[0];

      await pool.query('COMMIT');
      res.status(201).json({ student: newStudent, history: newHistory });

    } catch (err) {
      await pool.query('ROLLBACK');
      console.error('Error in POST /hostel/students:', err.stack);
      if (err.code === '23503') {
          res.status(400).json({ message: `Invalid reference for ${err.constraint || 'a foreign key'}. Please check input values.`, errorDetail: err.detail });
      } else if (err.code === '23505') {
          res.status(409).json({ message: `Duplicate entry for ${err.constraint || 'a unique field'}. This value already exists.`, errorDetail: err.detail });
      } else {
          res.status(500).json({ message: err.message || 'Server error adding hostel student', error: err.toString() });
      }
    }
  });

  // --- UPDATED PUT ROUTE ---
  router.put('/:id', checkAdminOrStaff, async (req, res) => {
    const { id } = req.params;
    const studentId = parseInt(id);

    if (isNaN(studentId)) {
      return res.status(400).json({ message: 'Invalid student ID format' });
    }

    console.log(`Backend received PUT /hostel/students/${studentId} with body:`, JSON.stringify(req.body, null, 2));

    // These are fields that can be updated in the hostel_students table
    const {
      branch_id, name, address, father_name, mother_name, aadhar_number, phone_number,
      profile_image_url, aadhar_image_url, religion, food_preference, gender, security_money,
      registration_number, room_number, remark,
      // Note: stay_start_date, stay_end_date, total_fee, cash_paid, online_paid are for HISTORY,
      // and should NOT be updated here directly. They are managed via POST (new student) or POST /:id/renew.
    } = req.body;

    let parsedBranchId;
    if (branch_id !== undefined && branch_id !== null && String(branch_id).trim() !== '') {
        parsedBranchId = parseInt(branch_id);
        if (isNaN(parsedBranchId)) return res.status(400).json({ message: 'Branch ID must be a valid number if provided.' });
    }
    
    const parsedSecurityMoney = (security_money !== undefined && security_money !== null && String(security_money).trim() !== '') 
                                ? parseFloat(security_money) : undefined;
    if (parsedSecurityMoney !== undefined && (isNaN(parsedSecurityMoney) || parsedSecurityMoney < 0)) {
        return res.status(400).json({ message: 'Security money must be a non-negative number if provided.' });
    }
    
    // Validate other fields if necessary (e.g., Aadhar, phone format)
    if (aadhar_number && !/^\d{12}$/.test(aadhar_number)) return res.status(400).json({ message: 'Aadhar number must be a 12-digit number.' });
    if (phone_number && !/^\d{10}$/.test(phone_number)) return res.status(400).json({ message: 'Phone number must be a 10-digit number.' });


    try {
      await pool.query('BEGIN');

      if (parsedBranchId !== undefined) {
        const branchCheck = await pool.query('SELECT id FROM hostel_branches WHERE id = $1', [parsedBranchId]);
        if (branchCheck.rows.length === 0) {
          await pool.query('ROLLBACK');
          return res.status(400).json({ message: `Branch with ID ${parsedBranchId} does not exist.` });
        }
      }
      
      // Construct dynamic UPDATE query based on provided fields
      const fieldsToUpdate = [];
      const valuesToUpdate = [];
      let paramCount = 1;

      // Add fields to update if they are provided in req.body
      // This COALESCE approach is good for partial updates.
      // Ensure that the keys here match the column names in your 'hostel_students' table.
      const updatableStudentFields = {
        branch_id: parsedBranchId,
        name: name?.trim(),
        address: address !== undefined ? (address?.trim() || null) : undefined,
        father_name: father_name !== undefined ? (father_name?.trim() || null) : undefined,
        mother_name: mother_name !== undefined ? (mother_name?.trim() || null) : undefined,
        aadhar_number: aadhar_number || undefined, // Assuming aadhar can be updated to empty/null
        phone_number: phone_number || undefined,
        profile_image_url: profile_image_url !== undefined ? (profile_image_url || null) : undefined,
        aadhar_image_url: aadhar_image_url !== undefined ? (aadhar_image_url || null) : undefined,
        religion: religion?.trim(),
        food_preference: food_preference,
        gender: gender,
        security_money: parsedSecurityMoney,
        registration_number: registration_number !== undefined ? (registration_number?.trim() || null) : undefined,
        room_number: room_number?.trim(), // Student's current default room
        remark: remark !== undefined ? (remark?.trim() || null) : undefined, // Student's general remark
      };

      for (const [key, value] of Object.entries(updatableStudentFields)) {
        if (value !== undefined) { // Only include fields that were actually in req.body (or derived and defined)
          fieldsToUpdate.push(`${key} = $${paramCount++}`);
          valuesToUpdate.push(value);
        }
      }

      if (fieldsToUpdate.length === 0) {
        // If no student-specific fields were sent for update, we might still want to update history
        // OR return a message that nothing was updated.
        // For now, let's assume if only history-related fields were sent, they should be ignored by this route.
        const currentStudent = await pool.query('SELECT * FROM hostel_students WHERE id = $1', [studentId]);
         if (currentStudent.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ message: 'Student not found' });
        }
        await pool.query('COMMIT'); // Nothing to update in hostel_students
        return res.status(200).json({ student: currentStudent.rows[0], message: 'No student details provided for update.' });
      }

      // Always update the 'updated_at' timestamp
      fieldsToUpdate.push(`updated_at = CURRENT_TIMESTAMP`);
      valuesToUpdate.push(studentId); // Add studentId for the WHERE clause

      const studentUpdateQuery = `
        UPDATE hostel_students 
        SET ${fieldsToUpdate.join(', ')} 
        WHERE id = $${paramCount} 
        RETURNING *`;
      
      console.log('[hostelStudents.js PUT] Executing query:', studentUpdateQuery, valuesToUpdate);
      const result = await pool.query(studentUpdateQuery, valuesToUpdate);

      if (result.rows.length === 0) {
        await pool.query('ROLLBACK'); // Should not happen if we checked before, but good practice
        return res.status(404).json({ message: 'Student not found during update' });
      }
      
      const updatedStudent = result.rows[0];
      await pool.query('COMMIT');
      
      // Return the updated student object (which now includes student data and latest history)
      // Fetch the history again to provide consistent response structure like GET /:id
      const historyResult = await pool.query(
        `SELECT * FROM hostel_student_history WHERE student_id = $1 ORDER BY stay_start_date DESC, created_at DESC`,
        [studentId]
      );
      const history = historyResult.rows.map(row => ({
        ...row,
        total_fee: parseFloat(String(row.total_fee || 0)),
        cash_paid: parseFloat(String(row.cash_paid || 0)),
        online_paid: parseFloat(String(row.online_paid || 0)),
        due_amount: parseFloat(String(row.due_amount || 0)),
      }));

      res.json({ student: updatedStudent, history: history, message: "Student details updated successfully." });

    } catch (err) {
      await pool.query('ROLLBACK');
      console.error('Error in PUT /hostel/students/:id:', err.stack);
      res.status(500).json({ message: 'Server error updating hostel student', error: err.message });
    }
  });
  
  // POST to renew a student's stay (adds to history) - This should remain as is.
  router.post('/:id/renew', checkAdminOrStaff, async (req, res) => {
    // ... (Keep your existing RENEW logic, it correctly creates a new history entry)
    // This part was reported as working fine.
    const { id } = req.params;
    const studentId = parseInt(id);
    if (isNaN(studentId)) {
        return res.status(400).json({ message: 'Invalid student ID format' });
    }

    const {
        stay_start_date, stay_end_date, total_fee, cash_paid, online_paid,
        room_number, remark, // These are for the new history entry
    } = req.body;

    if (!stay_start_date || !stay_end_date || total_fee === undefined || room_number === undefined || String(room_number).trim() === '') {
        return res.status(400).json({ message: 'Missing required fields for renewal: stay dates, total fee, and room number are required.' });
    }
    const totalFeeNum = parseFloat(total_fee);
    if (isNaN(totalFeeNum) || totalFeeNum < 0) return res.status(400).json({ message: 'Total fee must be a non-negative number.' });
    const cashPaidNum = cash_paid ? parseFloat(cash_paid) : 0.0;
    const onlinePaidNum = online_paid ? parseFloat(online_paid) : 0.0;

    try {
        await pool.query('BEGIN');

        const studentRes = await pool.query('SELECT id, room_number FROM hostel_students WHERE id = $1', [studentId]);
        if (studentRes.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ message: 'Student not found for renewal.' });
        }
        
        // Update student's main room_number if the new history's room_number is different
        if (studentRes.rows[0].room_number !== String(room_number).trim()){
            await pool.query('UPDATE hostel_students SET room_number = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', 
                [String(room_number).trim(), studentId]);
        }

        const totalPaid = cashPaidNum + onlinePaidNum;
        const dueAmount = totalFeeNum - totalPaid;
        
        const historyInsertQuery = `
            INSERT INTO hostel_student_history (
                student_id, stay_start_date, stay_end_date, total_fee, cash_paid, online_paid, due_amount, 
                room_number, remark, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP) 
            RETURNING *`;
        const historyInsertParams = [
            studentId, stay_start_date, stay_end_date, totalFeeNum, cashPaidNum, onlinePaidNum,
            dueAmount, String(room_number).trim(), remark || null
        ];
        const historyResult = await pool.query(historyInsertQuery, historyInsertParams);
        
        await pool.query('COMMIT');
        res.json({ history: historyResult.rows[0], message: "Student renewed successfully." });

    } catch (err) {
        await pool.query('ROLLBACK');
        console.error('Error in POST /hostel/students/:id/renew:', err.stack);
        res.status(500).json({ message: 'Server error renewing student stay', error: err.message });
    }
  });

  // GET expired hostel students
  router.get('/meta/expired', checkAdminOrStaff, async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT hs.id, hs.name, hs.phone_number, hs.aadhar_number, hs.room_number,
               MAX(hsh.stay_end_date) as latest_stay_end_date,
               b.name as branch_name
        FROM hostel_students hs
        LEFT JOIN hostel_student_history hsh ON hs.id = hsh.student_id 
        LEFT JOIN hostel_branches b ON hs.branch_id = b.id
        WHERE hsh.id IS NOT NULL 
        GROUP BY hs.id, b.name, hs.phone_number, hs.aadhar_number, hs.room_number /* Added missing GROUP BY columns */
        HAVING MAX(hsh.stay_end_date) < CURRENT_DATE
        ORDER BY hs.name ASC
      `);
      res.json({ expiredStudents: result.rows });
    } catch (err) {
      console.error('Error fetching expired hostel students:', err.stack);
      res.status(500).json({ message: 'Server error fetching expired students', error: err.message });
    }
  });

  // DELETE a hostel student
  router.delete('/:id', checkAdminOrStaff, async (req, res) => {
    const { id } = req.params;
    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return res.status(400).json({ message: 'Invalid student ID format' });
    }
    try {
      await pool.query('BEGIN');
      // Ensure history is deleted first if ON DELETE CASCADE is not set on the DB
      await pool.query('DELETE FROM hostel_student_history WHERE student_id = $1', [parsedId]);
      
      const result = await pool.query('DELETE FROM hostel_students WHERE id = $1 RETURNING *', [parsedId]);
      if (result.rowCount === 0) {
        await pool.query('ROLLBACK');
        return res.status(404).json({ message: 'Student not found' });
      }
      await pool.query('COMMIT');
      res.json({ message: 'Student and their history deleted successfully', student: result.rows[0] });
    } catch (err) {
      await pool.query('ROLLBACK');
      console.error('Error in DELETE /hostel/students/:id:', err.stack);
      if (err.code === '23503') { 
        res.status(409).json({ message: 'Cannot delete student due to related records in other tables (foreign key constraint).', errorDetail: err.detail });
      } else {
        res.status(500).json({ message: 'Server error deleting hostel student', error: err.message });
      }
    }
  });

  return router;
};