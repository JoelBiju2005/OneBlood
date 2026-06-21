const passwordResetOTPTemplate = ({ name, otp }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your OneBlood password</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0"
        style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;
               overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- HEADER -->
        <tr>
          <td style="background:#C0152A;padding:28px 40px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:28px;font-weight:800;letter-spacing:-0.5px;">
              One<span style="font-weight:400;">Blood</span>
            </h1>
            <p style="color:rgba(255,255,255,0.75);margin:6px 0 0;font-size:11px;
                      letter-spacing:3px;text-transform:uppercase;">
              Emergency Blood Resource Platform
            </p>
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="padding:40px 40px 24px;">

            <h2 style="color:#1a1a1a;font-size:20px;margin:0 0 12px;">
              Password Reset Request
            </h2>

            <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 28px;">
              Hi ${name},<br><br>
              We received a request to reset the password for your OneBlood account.
              Use the code below to proceed. This code is valid for
              <strong>10 minutes</strong>.
            </p>

            <!-- OTP BOX -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
              <tr>
                <td align="center"
                  style="background:#fff5f5;border:2px solid #C0152A;border-radius:12px;
                         padding:28px 20px;">
                  <p style="color:#888;font-size:11px;margin:0 0 10px;
                            text-transform:uppercase;letter-spacing:3px;">
                    Your One-Time Password
                  </p>
                  <p style="color:#C0152A;font-size:44px;font-weight:800;margin:0;
                            font-family:'Courier New',Courier,monospace;letter-spacing:14px;">
                    ${otp}
                  </p>
                  <p style="color:#aaa;font-size:12px;margin:12px 0 0;">
                    Expires in 10 minutes
                  </p>
                </td>
              </tr>
            </table>

            <!-- SECURITY NOTE -->
            <table width="100%" cellpadding="0" cellspacing="0"
              style="background:#f9f9f9;border-radius:8px;margin:0 0 28px;">
              <tr>
                <td style="padding:16px 20px;">
                  <p style="color:#888;font-size:13px;margin:0;line-height:1.6;">
                    🔒 <strong>Never share this code with anyone</strong> —
                    OneBlood staff will never ask for it.<br>
                    If you didn't request a password reset, you can safely ignore
                    this email. Your account remains secure.
                  </p>
                </td>
              </tr>
            </table>

            <p style="color:#aaa;font-size:12px;line-height:1.6;margin:0;">
              This code can only be used once. After 5 incorrect attempts,
              the code will be invalidated and you will need to request a new one.
            </p>

          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#1a1a1a;padding:20px 40px;text-align:center;">
            <p style="color:#888;font-size:12px;margin:0 0 6px;">
              OneBlood · Connecting lives, one drop at a time.
            </p>
            <p style="color:#555;font-size:11px;margin:0;">
              This is an automated message — do not reply directly to this email.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

module.exports = {
  passwordResetOTPTemplate
};
