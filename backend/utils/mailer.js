import nodemailer from "nodemailer";

let cachedTransporter;

const createTransporter = () => {
  if (cachedTransporter !== undefined) return cachedTransporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = String(process.env.SMTP_SECURE || "").toLowerCase() === "true";

  if (host && user && pass) {
    cachedTransporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });
    return cachedTransporter;
  }

  cachedTransporter = null;
  return cachedTransporter;
};

export const sendResetOtpEmail = async ({ to, name, otp }) => {
  const transporter = createTransporter();
  const from = process.env.MAIL_FROM || process.env.SMTP_USER || "no-reply@25zone.local";

  if (!transporter) {
    return { delivered: false, reason: "smtp_not_configured" };
  }

  await transporter.sendMail({
    from,
    to,
    subject: "Mã OTP đặt lại mật khẩu 25Zone",
    text: `Xin chào ${name || "bạn"}, mã OTP của bạn là ${otp}. Mã có hiệu lực trong 15 phút.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1f2937;">
        <h2 style="color: #003366; margin-bottom: 12px;">Đặt lại mật khẩu 25Zone</h2>
        <p>Xin chào ${name || "bạn"},</p>
        <p>Bạn vừa yêu cầu đặt lại mật khẩu. Vui lòng nhập mã OTP bên dưới:</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px; color: #003366; margin: 18px 0;">
          ${otp}
        </p>
        <p>Mã có hiệu lực trong <b>15 phút</b>. Nếu bạn không yêu cầu thao tác này, vui lòng bỏ qua email.</p>
      </div>
    `,
  });

  return { delivered: true };
};

