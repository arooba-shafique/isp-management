import net from "node:net";
import tls from "node:tls";
import { logger } from "./logger";

function encodeBase64(str: string): string {
  return Buffer.from(str).toString("base64");
}

async function smtpSend(from: string, to: string, subject: string, html: string): Promise<void> {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";

  if (!user || !pass) {
    throw new Error("SMTP_USER and SMTP_PASS must be set");
  }

  const boundary = "----=_Part_" + Date.now();
  const message =
    `From: ${from}\r\n` +
    `To: ${to}\r\n` +
    `Subject: ${subject}\r\n` +
    `MIME-Version: 1.0\r\n` +
    `Content-Type: multipart/alternative; boundary="${boundary}"\r\n` +
    `\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: text/plain; charset="UTF-8"\r\n` +
    `\r\n` +
    `Password reset link: ${extractLink(html)}\r\n` +
    `\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: text/html; charset="UTF-8"\r\n` +
    `\r\n` +
    `${html}\r\n` +
    `\r\n` +
    `--${boundary}--\r\n`;

  return new Promise((resolve, reject) => {
    let buffer = "";
    let step = 0;
    let secure = false;
    let socket: net.Socket | null = null;

    function send(line: string) {
      if (socket) socket.write(line + "\r\n");
    }

    function onData(chunk: Buffer) {
      buffer += chunk.toString();
      const code = parseInt(buffer.substring(0, 3), 10);
      // Wait for multi-line responses (last line has space after code)
      if (buffer.length >= 3 && buffer.charAt(3) === " ") {
        const response = buffer.trim();
        buffer = "";

        if (code >= 500) {
          reject(new Error(`SMTP error: ${response}`));
          cleanup();
          return;
        }

        step++;
        handleStep(response);
      }
    }

    function cleanup() {
      if (socket) {
        socket.removeListener("data", onData);
        socket.end();
      }
    }

    function handleStep(_response: string) {
      try {
        switch (step) {
          case 1: send(`EHLO isp-system`); break;
          case 2: send(`STARTTLS`); break;
          case 3:
            secure = true;
            const tlsSocket = tls.connect({ socket: socket, host: host });
            socket = tlsSocket;
            tlsSocket.on("data", (d: Buffer) => {
              const resp = d.toString().trim();
              if (resp.startsWith("220")) {
                step = 4;
                handleStep(resp);
              }
            });
            break;
          case 4: send(`EHLO isp-system`); break;
          case 5: send(`AUTH LOGIN`); break;
          case 6: send(encodeBase64(user)); break;
          case 7: send(encodeBase64(pass)); break;
          case 8: send(`MAIL FROM:<${extractEmail(from)}>`); break;
          case 9: send(`RCPT TO:<${to}>`); break;
          case 10: send(`DATA`); break;
          case 11: send(message + "\r\n."); break;
          case 12: send(`QUIT`); cleanup(); resolve(); break;
        }
      } catch (err) {
        reject(err);
        cleanup();
      }
    }

    socket = net.createConnection(port, host, () => {
      step = 1;
    });

    socket.on("data", onData);
    socket.on("error", reject);
    socket.setTimeout(10000, () => {
      reject(new Error("SMTP connection timeout"));
      cleanup();
    });
  });
}

function extractEmail(from: string): string {
  const match = from.match(/<([^>]+)>/);
  return match ? match[1] : from;
}

function extractLink(html: string): string {
  const match = html.match(/href="([^"]+)"/);
  return match ? match[1] : "";
}

export async function sendPasswordResetEmail(to: string, resetToken: string): Promise<boolean> {
  const baseUrl = process.env.FRONTEND_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;
  const from = process.env.SMTP_FROM || "NetLink ISP <noreply@netlink.pk>";

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Password Reset Request</h2>
      <p>You requested a password reset. Use the button below to set a new password:</p>
      <a href="${resetLink}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Reset Password</a>
      <p style="margin-top: 24px;">This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
    </div>
  `;

  try {
    await smtpSend(from, to, "Password Reset - NetLink ISP", html);
    logger.info({ to }, "Password reset email sent via SMTP");
    return true;
  } catch (err) {
    logger.error({ err, to }, "Failed to send password reset email");
    return false;
  }
}
