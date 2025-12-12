import nodemailer from "nodemailer";
import config from "../config/index.js";

const transporter = nodemailer.createTransport({
  host: config.email.host || process.env.EMAIL_HOST,
  port: config.email.port || Number(process.env.EMAIL_PORT) || 587,
  secure:
    config.email.secure === true ||
    process.env.EMAIL_SECURE === "true" ||
    false,
  auth: {
    user: config.email.user || process.env.EMAIL_USER,
    pass: config.email.pass || process.env.EMAIL_PASS,
  },
});

/**
 * sendMail
 * @param {string|string[]} to
 * @param {string} subject
 * @param {string} html
 * @param {string} text
 */
export async function sendMail({ to, subject, html, text }) {
  const from = config.email.from || process.env.EMAIL_FROM;
  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });
    console.log(
      `[email] Sent ${subject} -> ${to} (messageId=${info.messageId})`
    );
    return info;
  } catch (err) {
    console.error("[email] sendMail error:", err?.message ?? err);
    throw err;
  }
}

/**
 * Simple ready-made templates for DOWN/UP alerts
 */
export function downTemplate({ monitor, result }) {
  const subject = `ALERT: ${monitor.name || monitor.url} is DOWN`;
  const html = `
    <h3>🚨 DevSync Alert — Monitor DOWN</h3>
    <p><strong>Monitor:</strong> ${monitor.name || monitor.url}</p>
    <p><strong>URL:</strong> <a href="${monitor.url}">${monitor.url}</a></p>
    <p><strong>Checked at:</strong> ${new Date(result.checkedAt).toLocaleString()}</p>
    <p><strong>Status:</strong> DOWN (statusCode: ${result.statusCode ?? "N/A"})</p>
    <hr/>
    <p>This is an automated alert from DevSync.</p>
  `;
  const text = `ALERT: ${monitor.name || monitor.url} is DOWN\nURL: ${monitor.url}\nChecked at: ${new Date(result.checkedAt).toLocaleString()}\nStatusCode: ${result.statusCode ?? "N/A"}`;
  return { subject, html, text };
}

export function upTemplate({ monitor, result }) {
  const subject = `RECOVERY: ${monitor.name || monitor.url} is UP`;
  const html = `
    <h3>✅ DevSync — Monitor UP</h3>
    <p><strong>Monitor:</strong> ${monitor.name || monitor.url}</p>
    <p><strong>URL:</strong> <a href="${monitor.url}">${monitor.url}</a></p>
    <p><strong>Checked at:</strong> ${new Date(result.checkedAt).toLocaleString()}</p>
    <p><strong>Status:</strong> UP</p>
    <hr/>
    <p>This is an automated message from DevSync.</p>
  `;
  const text = `RECOVERY: ${monitor.name || monitor.url} is UP\nURL: ${monitor.url}\nChecked at: ${new Date(result.checkedAt).toLocaleString()}`;
  return { subject, html, text };
}
