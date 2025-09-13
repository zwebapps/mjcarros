const nodemailer = require('nodemailer');

async function testEmail() {
  try {
    console.log('📧 Testing Gmail SMTP Configuration...\n');

    // Check environment variables
    const requiredVars = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS', 'EMAIL_FROM'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.log('❌ Missing environment variables:');
      missingVars.forEach(varName => console.log(`   - ${varName}`));
      console.log('\n💡 Add these to your .env file:');
      console.log('EMAIL_HOST=smtp.gmail.com');
      console.log('EMAIL_PORT=587');
      console.log('EMAIL_USER=your-gmail@gmail.com');
      console.log('EMAIL_PASS=your-app-password');
      console.log('EMAIL_FROM="MJ Carros <your-gmail@gmail.com>"');
      return;
    }

    console.log('✅ Environment variables found:');
    console.log(`   Host: ${process.env.EMAIL_HOST}`);
    console.log(`   Port: ${process.env.EMAIL_PORT}`);
    console.log(`   User: ${process.env.EMAIL_USER}`);
    console.log(`   From: ${process.env.EMAIL_FROM}`);
    console.log('');

    // Create transporter
    const transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    console.log('🔗 Testing SMTP connection...');
    
    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP connection successful!');

    // Send test email
    const testEmail = process.env.EMAIL_USER; // Send to yourself
    console.log(`📤 Sending test email to: ${testEmail}`);

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: testEmail,
      subject: 'MJ Carros - Email Test',
      html: `
        <h2>🎉 Email Configuration Test</h2>
        <p>Congratulations! Your Gmail SMTP is working correctly.</p>
        <p><strong>Configuration Details:</strong></p>
        <ul>
          <li>Host: ${process.env.EMAIL_HOST}</li>
          <li>Port: ${process.env.EMAIL_PORT}</li>
          <li>User: ${process.env.EMAIL_USER}</li>
          <li>From: ${process.env.EMAIL_FROM}</li>
        </ul>
        <p>Your MJ Carros application can now send:</p>
        <ul>
          <li>Order confirmation emails</li>
          <li>Contact form notifications</li>
          <li>Admin notifications</li>
        </ul>
        <p><em>This is an automated test email from MJ Carros.</em></p>
      `
    });

    console.log('✅ Test email sent successfully!');
    console.log(`📧 Message ID: ${info.messageId}`);
    console.log('\n🎉 Gmail SMTP configuration is working perfectly!');
    console.log('\n📋 Next steps:');
    console.log('   1. Check your Gmail inbox for the test email');
    console.log('   2. Your app can now send order confirmations and contact form emails');
    console.log('   3. Test the contact form on your website');

  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure you have 2-Factor Authentication enabled on Gmail');
    console.log('   2. Generate an App Password (not your regular Gmail password)');
    console.log('   3. Check that all environment variables are set correctly');
    console.log('   4. Verify the App Password is 16 characters (no spaces)');
    console.log('\n💡 Gmail App Password setup:');
    console.log('   - Go to Google Account → Security → 2-Step Verification');
    console.log('   - Click "App passwords" → Generate password for "Mail"');
    console.log('   - Use the generated password (not your Gmail password)');
  }
}

// Run the test
testEmail();
