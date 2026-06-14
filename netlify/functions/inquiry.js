const nodemailer = require('nodemailer');

function json(statusCode, payload) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Cache-Control': 'no-store',
    },
    body: JSON.stringify(payload || {}),
  };
}

exports.handler = async event => {
  if (event.httpMethod === 'OPTIONS') {
    return json(200, { ok: true });
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed.' });
  }

  const smtpUser =
    process.env.SMTP_USER ||
    process.env.EMAIL_USER ||
    process.env.GMAIL_USER ||
    '';

  const smtpPass =
    process.env.SMTP_PASS ||
    process.env.EMAIL_PASS ||
    process.env.GMAIL_APP_PASSWORD ||
    '';

  const mailTo = (process.env.MAIL_TO || 'official.highend.lk@gmail.com').trim();

  if (!smtpUser || !smtpPass) {
    return json(500, {
      error:
        'Email is not configured. Add SMTP_USER and SMTP_PASS in Netlify environment variables.',
    });
  }

  try {
    let payload = {};

    try {
      payload = JSON.parse(event.body || '{}');
    } catch {
      return json(400, { error: 'Invalid JSON request body.' });
    }

    const pkg = String(payload.package || 'General enquiry').trim();
    const name = String(payload.name || '').trim();
    const note = String(payload.note || '').trim();

    if (!name) {
      return json(400, { error: 'Name is required.' });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const subject = `HIGHEND inquiry - ${pkg}`;

    const text = [
      `Package: ${pkg}`,
      `Name: ${name}`,
      '',
      'Note:',
      note || 'No extra note',
    ].join('\n');

    await transporter.sendMail({
      from: `HIGHEND Website <${smtpUser}>`,
      to: mailTo,
      replyTo: smtpUser,
      subject,
      text,
    });

    return json(200, { ok: true, message: 'Inquiry sent successfully.' });
  } catch (error) {
    let message = error.message || 'Unable to send inquiry.';

    if (error.code === 'EAUTH') {
      message = 'Gmail rejected the SMTP login. Use a Gmail App Password for SMTP_PASS.';
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKET') {
      message =
        'Could not connect to Gmail SMTP from Netlify. Check SMTP settings and try again.';
    }

    return json(500, { error: message });
  }
};