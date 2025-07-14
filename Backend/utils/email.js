const SibApiV3Sdk = require('@sendinblue/client');

const sendExpirationReminder = async (student, templateId) => {
  try {
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.to = [{ email: student.email }];
    sendSmtpEmail.templateId = parseInt(templateId);
    sendSmtpEmail.params = {
      NAME: student.name,
      MEMBERSHIP_END: student.membership_end,
    };

    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`Email sent to ${student.email}`);
  } catch (err) {
    console.error(`Failed to send email to ${student.email}:`, err);
    throw err;
  }
};

module.exports = { sendExpirationReminder };