import 'dotenv/config';

import express from 'express';
import rateLimit from 'express-rate-limit';
import { Resend } from 'resend';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const port = Number.parseInt(process.env.PORT || '3001', 10);
let resend;

app.set('trust proxy', process.env.TRUST_PROXY || 'loopback');

app.use(express.urlencoded({ extended: false, limit: '20kb' }));
app.use((req, res, next) => {
  const pathname = req.path.toLowerCase();
  const isPrivateFile =
    pathname === '/server.js' ||
    pathname === '/package.json' ||
    pathname === '/package-lock.json' ||
    pathname === '/readme.md' ||
    pathname === '/.env' ||
    pathname === '/.env.example' ||
    pathname.startsWith('/node_modules/');

  if (isPrivateFile) {
    return res.status(404).sendFile(path.join(__dirname, '404.html'));
  }

  return next();
});
app.use(
  express.static(__dirname, {
    extensions: ['html'],
    setHeaders(res, filePath) {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-store');
        return;
      }

      res.setHeader('Cache-Control', 'public, max-age=604800');
    },
  }),
);

const walkthroughLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler(req, res) {
    return res.redirect(303, '/index.html?form=rate-limited#contact');
  },
});

app.post('/walkthrough-request', walkthroughLimiter, async (req, res) => {
  const submission = normaliseSubmission(req.body);

  if (submission.website) {
    return res.redirect(303, '/thank-you.html');
  }

  const validationError = validateSubmission(submission);

  if (validationError) {
    console.warn('Invalid walkthrough request:', validationError);
    return res.redirect(303, '/index.html?form=invalid#contact');
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not configured.');
    return res.redirect(303, '/index.html?form=error#contact');
  }

  try {
    const { error } = await getResend().emails.send({
      from: process.env.CONTACT_FROM || 'Myntix Website <noreply@myntix.com>',
      to: [process.env.CONTACT_TO || 'hello@myntix.com'],
      subject: `New Myntix walkthrough request from ${submission.organisation}`,
      html: renderWalkthroughEmail(submission),
      text: renderWalkthroughText(submission),
      replyTo: submission.email,
    });

    if (error) {
      console.error('Resend email error:', error);
      return res.redirect(303, '/index.html?form=error#contact');
    }

    return res.redirect(303, '/thank-you.html');
  } catch (error) {
    console.error('Walkthrough request failed:', error);
    return res.redirect(303, '/index.html?form=error#contact');
  }
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '404.html'));
});

app.listen(port, () => {
  console.log(`Myntix landing server listening on http://127.0.0.1:${port}`);
});

function normaliseSubmission(body) {
  return {
    name: clean(body.name),
    email: clean(body.email).toLowerCase(),
    organisation: clean(body.school),
    role: clean(body.role),
    schoolSize: clean(body.schoolSize),
    interest: clean(body.interest),
    message: clean(body.message, 1600),
    website: clean(body.website),
  };
}

function validateSubmission(submission) {
  if (!submission.name) return 'Missing name';
  if (!isEmail(submission.email)) return 'Invalid email';
  if (!submission.organisation) return 'Missing organisation';
  return null;
}

function clean(value, maxLength = 240) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function renderWalkthroughEmail(submission) {
  const rows = [
    ['Name', submission.name],
    ['Email', submission.email],
    ['Organisation', submission.organisation],
    ['Role', submission.role || 'Not supplied'],
    ['Approx. students', submission.schoolSize || 'Not supplied'],
    ['Most interested in', submission.interest || 'Not supplied'],
    ['Message', submission.message || 'Not supplied'],
  ];

  return `
    <div style="font-family: Arial, sans-serif; color: #183f3d; line-height: 1.5;">
      <h1 style="font-size: 22px; margin: 0 0 16px;">New Myntix walkthrough request</h1>
      <table cellpadding="0" cellspacing="0" style="border-collapse: collapse; width: 100%; max-width: 680px;">
        ${rows
          .map(
            ([label, value]) => `
              <tr>
                <th align="left" style="border-bottom: 1px solid #dbe9e4; padding: 10px 12px 10px 0; width: 170px;">${escapeHtml(label)}</th>
                <td style="border-bottom: 1px solid #dbe9e4; padding: 10px 0;">${escapeHtml(value)}</td>
              </tr>
            `,
          )
          .join('')}
      </table>
    </div>
  `;
}

function renderWalkthroughText(submission) {
  return [
    'New Myntix walkthrough request',
    '',
    `Name: ${submission.name}`,
    `Email: ${submission.email}`,
    `Organisation: ${submission.organisation}`,
    `Role: ${submission.role || 'Not supplied'}`,
    `Approx. students: ${submission.schoolSize || 'Not supplied'}`,
    `Most interested in: ${submission.interest || 'Not supplied'}`,
    `Message: ${submission.message || 'Not supplied'}`,
  ].join('\n');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getResend() {
  resend ||= new Resend(process.env.RESEND_API_KEY);
  return resend;
}
