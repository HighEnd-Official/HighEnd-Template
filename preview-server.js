const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');

const root = process.cwd();
const htmlFile = path.join(root, 'index.html');
const envFile = path.join(root, '.env');
const preferredPort = Number(process.env.PORT) || 8000;
const host = process.env.HOST || '127.0.0.1';
const pdfFilename = 'Le_Ceylonese_Proposal_Package.pdf';
const pdfDir = path.join(root, 'Download-PDF');
const pdfFile = path.join(pdfDir, pdfFilename);
const htmlSource = fs.readFileSync(htmlFile, 'utf8');
const logoMatch = htmlSource.match(/data:image\/png;base64,([^"]+)/);
const logoFile = path.join(root, 'SOFTWARE ENGINEERING TN.png');
const logoBuffer = logoMatch
  ? Buffer.from(logoMatch[1], 'base64')
  : fs.existsSync(logoFile)
    ? fs.readFileSync(logoFile)
    : null;
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
};

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile(envFile);

const smtpUser = process.env.SMTP_USER || '';
const smtpPass = process.env.SMTP_PASS || '';
const mailTo = (process.env.MAIL_TO || 'official.highend.lk@gmail.com').trim();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 15000,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.statusCode = 404;
      res.end('Not found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.setHeader(
      'Content-Type',
      mime[ext] || 'application/octet-stream'
    );
    if (ext === '.pdf') {
      const filename = path.basename(filePath);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`
      );
    }
    res.end(data);
  });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) {
        reject(new Error('Request too large.'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function addText(doc, text, x, y, options = {}) {
  doc.text(text, x, y, options);
  return doc.y;
}

function buildPdf(doc) {
  const marginX = 40;
  let y = 42;
  const pageWidth = doc.page.width - marginX * 2;
  const gold = '#c69a2b';
  const silver = '#2f2a23';
  const muted = '#7b7367';
  const charcoal = '#111111';
  const paper = '#ffffff';
  const paperStroke = '#e8e0cf';

  if (logoBuffer) {
    doc.image(logoBuffer, doc.page.width - marginX - 58, y - 2, { width: 58 });
  }

  doc.fillColor(gold).font('Helvetica-Bold').fontSize(10).text('HIGHEND Software Engineering', marginX, y, {
    width: pageWidth - 80,
    characterSpacing: 1.8,
  });
  y += 16;

  doc.fillColor(muted).font('Helvetica').fontSize(9).text('Le Ceylonese International Hotel Academy Proposal', marginX, y, {
    width: pageWidth - 80,
    characterSpacing: 1.2,
  });
  y += 30;

  doc.fillColor(charcoal).font('Helvetica-Bold').fontSize(22).text('Executive Summary', marginX, y, {
    width: pageWidth - 80,
    continued: false,
  });
  y += 36;

  doc.fillColor(muted).font('Helvetica').fontSize(10.5).text(
    'A luxury digital proposal focused on admissions, brand trust, and mobile-friendly student conversion.',
    marginX,
    y,
    { width: pageWidth }
  );
  y += 32;

  doc.moveTo(marginX, y - 6).lineTo(marginX + 176, y - 6).lineWidth(1).strokeColor(gold).stroke();

  const blocks = [
    { title: 'Client', body: 'Le Ceylonese International Hotel Academy' },
    { title: 'Contact', body: 'official.highend.lk@gmail.com\n077 488 2744' },
    {
      title: 'Core Scope',
      body: 'Luxury academy website\nAdmissions platform\nAI-assisted inquiry support\nMobile, tablet, desktop responsive design',
    },
    {
      title: 'Investment',
      body: 'Package 01 - LKR 170,000\nPackage 02 - LKR 290,000\nPackage 03 - LKR 390,000',
    },
  ];

  const blockW = (pageWidth - 10) / 2;
  const blockH = 64;
  blocks.forEach((block, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = marginX + col * (blockW + 10);
    const blockY = y + row * (blockH + 10);
    doc.roundedRect(x, blockY, blockW, blockH, 10).fillAndStroke(paper, paperStroke);
    doc.fillColor(gold).font('Helvetica-Bold').fontSize(9).text(block.title.toUpperCase(), x + 10, blockY + 8, {
      width: blockW - 20,
      characterSpacing: 1,
    });
    doc.fillColor(silver).font('Helvetica').fontSize(8.6).text(block.body, x + 10, blockY + 22, {
      width: blockW - 20,
      lineGap: 1.2,
    });
  });

  y += (blockH + 10) * 2 + 2;

  doc.fillColor(charcoal).font('Helvetica-Bold').fontSize(11).text('Package Details', marginX, y, { width: pageWidth });
  y += 18;

  const packageW = (pageWidth - 18) / 3;
  const packages = [
    {
      name: 'Package 01',
      price: 'LKR 170,000',
      desc: 'Luxury academy website, admissions form, responsive layout, SEO, SSL, 1 year hosting and domain.',
    },
    {
      name: 'Package 02',
      price: 'LKR 290,000',
      desc: 'Everything in Package 01 plus student accounts, secure login, dashboard, intake management, document upload, and PDF applications.',
    },
    {
      name: 'Package 03',
      price: 'LKR 390,000',
      desc: 'Everything in Package 02 plus AI website assistant, admission guidance chat flow, lead capture, and FAQ automation.',
    },
  ];

  packages.forEach((pkg, idx) => {
    const x = marginX + idx * (packageW + 9);
    const boxH = 116;
    doc.roundedRect(x, y, packageW, boxH, 10).fillAndStroke(paper, paperStroke);
    doc.fillColor(charcoal).font('Helvetica-Bold').fontSize(9.5).text(pkg.name, x + 10, y + 10, {
      width: packageW - 20,
    });
    doc.fillColor(gold).font('Helvetica-Bold').fontSize(8.5).text(pkg.price, x + 10, y + 24, {
      width: packageW - 20,
    });
    doc.fillColor(silver).font('Helvetica').fontSize(8.3).text(pkg.desc, x + 10, y + 40, {
      width: packageW - 20,
      lineGap: 1.15,
    });
  });

  y += 130;
  doc.fillColor(muted).font('Helvetica').fontSize(8.8).text('Prepared by HIGHEND Software Engineering', marginX, y, {
    width: pageWidth,
    align: 'left',
  });
}

async function generatePdfFile(filePath) {
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  const tempFile = `${filePath}.${process.pid}.${Date.now()}.tmp`;

  try {
    await new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 0 });
      const output = fs.createWriteStream(tempFile);
      let settled = false;

      function finish(error) {
        if (settled) return;
        settled = true;
        if (error) reject(error);
        else resolve();
      }

      output.on('finish', () => finish());
      output.on('error', finish);
      doc.on('error', finish);

      doc.pipe(output);
      buildPdf(doc);
      doc.end();
    });

    await fs.promises.rename(tempFile, filePath);
  } catch (error) {
    await fs.promises.rm(tempFile, { force: true }).catch(() => {});
    throw error;
  }
}

const server = http.createServer(async (req, res) => {
    const urlPath = req.url.split('?')[0];

    if (req.method === 'POST' && urlPath === '/api/inquiry') {
      try {
        if (!smtpUser || !smtpPass) {
          sendJson(res, 500, { error: 'SMTP credentials are not configured.' });
          return;
        }

        const raw = await readBody(req);
        const payload = JSON.parse(raw || '{}');
        const pkg = String(payload.package || 'General enquiry').trim();
        const name = String(payload.name || '').trim();
        const note = String(payload.note || '').trim();

        if (!name) {
          sendJson(res, 400, { error: 'Name is required.' });
          return;
        }

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

        sendJson(res, 200, { ok: true });
      } catch (error) {
        sendJson(res, 500, { error: error.message || 'Unable to send inquiry.' });
      }
      return;
    }

    if (req.method === 'GET' && urlPath === '/download-pdf') {
      serveFile(res, pdfFile);
      return;
    }

    let filePath = urlPath;
    if (filePath === '/') filePath = '/index.html';
    serveFile(res, path.join(root, decodeURIComponent(filePath)));
  });

let currentPort = preferredPort;
let attemptsLeft = 20;

server.on('error', error => {
  if (error.code === 'EADDRINUSE' && attemptsLeft > 0) {
    const busyPort = currentPort;
    currentPort += 1;
    attemptsLeft -= 1;
    console.log(`Port ${busyPort} is already in use. Trying ${currentPort}...`);
    server.listen(currentPort, host);
    return;
  }

  throw error;
});

server.on('listening', () => {
  const address = server.address();
  const activePort = address && typeof address === 'object' ? address.port : currentPort;
  console.log(`Preview server running at http://${host}:${activePort}/`);
});

server.listen(currentPort, host);
