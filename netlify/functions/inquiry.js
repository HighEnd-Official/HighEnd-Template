const nodemailer = require('nodemailer');

function json(statusCode, payload) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(payload),
  };
}

exports.handler = async event => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Origin': '*',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed.' });
  }

  const smtpUser = process.env.SMTP_USER || '';
  const smtpPass = process.env.SMTP_PASS || '';
  const mailTo = process.env.MAIL_TO || 'official.highend.lk@gmail.com';

  if (!smtpUser || !smtpPass) {
    return json(500, { error: 'SMTP credentials are not configured.' });
  }

  try {
    const payload = JSON.parse(event.body || '{}');
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

    return json(200, { ok: true });
  } catch (error) {
    return json(500, { error: error.message || 'Unable to send inquiry.' });
  }
};
