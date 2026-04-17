// Import the mail functions
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    lines.forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    });
  }
}

loadEnvFile();

const host = process.env.EMAIL_HOST || '';
const port = Number(process.env.EMAIL_PORT || 587);
const user = process.env.EMAIL_USER || '';
const pass = process.env.EMAIL_PASS || '';
const fromAddress = process.env.EMAIL_FROM || 'MJ Carros <no-reply@mjcarros.com>';

const hasEmailConfig = !!(host && user && pass);

const transporter = hasEmailConfig
  ? nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } })
  : null;

async function sendMail(to, subject, html) {
  if (!transporter) return { skipped: true };
  await transporter.sendMail({ from: fromAddress, to, subject, html });
  return { ok: true };
}

async function testEmail() {
  console.log('📧 Testing email configuration...');
  console.log('Email config available:', hasEmailConfig);
  
  if (!hasEmailConfig) {
    console.log('❌ Email configuration is missing. Please set:');
    console.log('   EMAIL_HOST=smtp.gmail.com');
    console.log('   EMAIL_PORT=587');
    console.log('   EMAIL_USER=mjcarros@gmail.com');
    console.log('   EMAIL_PASS=tfdr wimc kiiq afff');
    console.log('   EMAIL_FROM=MJ Carros <mjcarros@gmail.com>');
    return;
  }

  try {
    const result = await sendMail(
      'test@example.com',
      'Test Email from MJ Carros',
      '<h2>Test Email</h2><p>This is a test email to verify email configuration.</p>'
    );
    
    if (result.skipped) {
      console.log('⚠️  Email sending was skipped (no configuration)');
    } else if (result.ok) {
      console.log('✅ Email sent successfully!');
    }
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
  }
}

testEmail();