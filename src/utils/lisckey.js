const crypto = require('crypto');  // Import the crypto module
const secretKey = 'f6f83d91b905e4f25d58f7b6fbb4b9f8e3f34516c7d8a33f4a1adfe442cd8edb9e59fe717f64f575160cc0f85b09c84b';  // Replace this with your actual secret key

function generateLicenseKey(machineId) {
  var time = Date.now();  // Current timestamp
  var randomValue = crypto.randomBytes(8).toString('hex');  // Generate a random 8-byte string

  // Validate the machineId input
  if (!machineId || typeof machineId !== 'string') {
    throw new Error('Invalid machineId provided.');
  }

  // Create the HMAC with SHA-256 using the secret key, time, and machine ID
  const hash = crypto.createHmac('sha256', secretKey)
    .update(machineId + time + randomValue)  // Combine machineId, time, and random value
    .digest('hex');  // Get the hash as a hexadecimal string

  console.log('Generated License Key:', hash);
  return hash;
}

// Export the function using CommonJS
module.exports = generateLicenseKey;
