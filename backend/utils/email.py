import random
import string
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
import os

# Configuration (Use environment variables in production)
conf = ConnectionConfig(
    MAIL_USERNAME = os.getenv("MAIL_USERNAME", ""),
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", ""),
    MAIL_FROM = os.getenv("MAIL_FROM", "noreply@antipdf.com"),
    MAIL_PORT = int(os.getenv("MAIL_PORT", 587)),
    MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com"),
    MAIL_STARTTLS = True,
    MAIL_SSL_TLS = False,
    USE_CREDENTIALS = True,
    VALIDATE_CERTS = True
)

def generate_verification_code():
    return ''.join(random.choices(string.digits, k=6))

async def send_verification_email(email: str, code: str):
    # FALLBACK: If NO credentials, just print to console for development
    if not conf.MAIL_USERNAME or not conf.MAIL_PASSWORD:
        print(f"\n[EMAIL MOCK] Verification Code for {email}: {code}\n")
        return True

    # REAL DELIVERY
    try:
        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #6366f1; text-align: center;">AntiPDF Verification</h2>
            <p>Hello,</p>
            <p>Your verification code for AntiPDF is:</p>
            <div style="text-align: center; margin: 30px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e293b; background: #f1f5f9; padding: 10px 20px; border-radius: 8px;">
                    {code}
                </span>
            </div>
            <p>This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;" />
            <p style="font-size: 12px; color: #94a3b8; text-align: center;">&copy; 2026 AntiPDF. All rights reserved.</p>
        </div>
        """
        
        message = MessageSchema(
            subject="AntiPDF - Your Verification Code",
            recipients=[email],
            body=html,
            subtype="html"
        )
        
        fm = FastMail(conf)
        await fm.send_message(message)
        print(f"\n[EMAIL SUCCESS] Sent to {email}\n")
        return True
    except Exception as e:
        print(f"\n[EMAIL ERROR] Failed to send to {email}: {str(e)}\n")
        # For development, stay functional even if email fails
        print(f"Fallback Code: {code}")
        return False
