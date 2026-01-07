
const nodemailer = require('nodemailer');

// Create a transporter with your email credentials
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'ghsaleemjadoon@gmail.com', // Your Gmail address
    pass: 'sqydrxwkfemiavot',          // Your App Password
  },
});

/**
 * Function to send an email
 * @param {string} toEmail - The recipient's email address
 * @param {string} subject - The subject of the email
 * @param {string} message - The body of the email
 */
async function sendEmail( subject, message,email) {
  try {
    const mailOptions = {
      from: 'ghsaleemjadoon@gmail.com', // Sender address
      to: email,                      // Recipient address
      subject: subject,                 // Email subject
      text: message,                    // Plain text body
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log(info)

    return 'sent'
  } catch (error) {
    console.error(`Error sending email: ${error.message}`);
    return 'error'
  }
}

// Example usage
module.exports= sendEmail;
