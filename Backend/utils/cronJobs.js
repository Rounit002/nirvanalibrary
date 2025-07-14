const cron = require('node-cron');
const { sendExpirationReminder } = require('./email');
const { sendWhatsAppMessage } = require('./whatsapp');

const setupCronJobs = (pool) => {
  // Schedule a daily task at 10 AM to send expiration reminders
  cron.schedule('0 16 * * *', async () => {
    try {
      console.log('Running expiration reminder cron job...');

      // Get settings
      const settingsResult = await pool.query('SELECT * FROM settings');
      const settings = {};
      settingsResult.rows.forEach(row => {
        settings[row.key] = row.value;
      });

      const daysBefore = parseInt(settings.days_before_expiration);
      if (!daysBefore || isNaN(daysBefore)) {
        console.log('Days before expiration not set or invalid');
        return;
      }

      const brevoTemplateId = settings.brevo_template_id;
      if (!brevoTemplateId) {
        console.log('Brevo template ID not set');
        return;
      }

      // Calculate the date range
      const currentDate = new Date();
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + daysBefore);

      const currentDateString = currentDate.toISOString().split('T')[0];
      const targetDateString = targetDate.toISOString().split('T')[0];

      // Get students whose membership ends within the date range
      const studentsResult = await pool.query(
        "SELECT * FROM students WHERE membership_end BETWEEN $1 AND $2 AND status = 'active'",
        [currentDateString, targetDateString]
      );
      const students = studentsResult.rows;

      if (students.length === 0) {
        console.log('No students with memberships expiring between', currentDateString, 'and', targetDateString);
        return;
      }

      for (const student of students) {
        // Send Brevo email
        await sendExpirationReminder(student, brevoTemplateId);

        // Send WhatsApp message
        if (student.phone) {
          let formattedPhone = student.phone.trim();
          if (!formattedPhone.startsWith('+')) {
            formattedPhone = `+91${formattedPhone.replace(/\D/g, '')}`;
          }
          await sendWhatsAppMessage(formattedPhone);
        }
      }
    } catch (err) {
      console.error('Error in expiration reminder cron job:', err);
    }
  }, {
    timezone: 'Asia/Kolkata'
  });

  console.log('Cron jobs scheduled successfully in Asia/Kolkata timezone');
};

module.exports = { setupCronJobs };
