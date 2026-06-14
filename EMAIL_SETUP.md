# Feedback Email Setup

The feedback form sends email through the Netlify function at `/api/inquiry`.

Required Netlify environment variables:

```text
SMTP_USER=solutionsh94@gmail.com
SMTP_PASS=your Gmail App Password
MAIL_TO=official.highend.lk@gmail.com
```

Important:

- `SMTP_PASS` must be a Gmail App Password, not the normal Gmail password.
- The local `.env` file is only for local testing. Netlify does not read it automatically.
- After changing environment variables in Netlify, redeploy the site.
- If the form shows `Email is not configured on the hosting server`, Netlify is missing `SMTP_USER` or `SMTP_PASS`.
- If the form shows `Gmail rejected the SMTP login`, create a new Gmail App Password and update `SMTP_PASS`.

