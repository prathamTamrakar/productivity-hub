from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import aiosmtplib

from app.config import settings


def _build_task_reminder_html(task_title: str, task_description: str, due_date: str, due_time: str) -> str:
    """Build HTML email template for task reminders."""
    description_section = ''
    if task_description:
        description_section = f'''
            <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Description</td>
                <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right;">{task_description}</td>
            </tr>'''

    return f'''<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px 10px;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #6366f1, #818cf8); padding: 32px 40px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Pratham Dashboard</h1>
                            <p style="color: #e0e7ff; margin: 8px 0 0; font-size: 14px;">Task Reminder</p>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding: 24px;">
                            <h2 style="color: #1f2937; margin: 0 0 8px; font-size: 20px;">⏰ Upcoming Task</h2>
                            <p style="color: #6b7280; margin: 0 0 24px; font-size: 14px;">You have a task coming up soon. Here are the details:</p>
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; padding: 20px;">
                                <tr>
                                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Task</td>
                                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">{task_title}</td>
                                </tr>{description_section}
                                <tr>
                                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Date</td>
                                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right;">{due_date}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Time</td>
                                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right;">{due_time}</td>
                                </tr>
                            </table>
                            <div style="text-align: center; margin-top: 32px;">
                                <a href="{settings.FRONTEND_URL}" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 14px; font-weight: 600;">View in Dashboard</a>
                            </div>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 40px; background-color: #f9fafb; text-align: center;">
                            <p style="color: #9ca3af; margin: 0; font-size: 12px;">This is an automated reminder from Pratham Dashboard.</p>
                            <p style="color: #9ca3af; margin: 4px 0 0; font-size: 12px;">You can manage your notification preferences in Settings.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>'''


def _build_followup_reminder_html(company: str, role: str, follow_up_date: str) -> str:
    """Build HTML email template for job follow-up reminders."""
    return f'''<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px 10px;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #6366f1, #818cf8); padding: 32px 40px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Pratham Dashboard</h1>
                            <p style="color: #e0e7ff; margin: 8px 0 0; font-size: 14px;">Job Follow-up Reminder</p>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding: 24px;">
                            <h2 style="color: #1f2937; margin: 0 0 8px; font-size: 20px;">📋 Follow-up Reminder</h2>
                            <p style="color: #6b7280; margin: 0 0 24px; font-size: 14px;">It's time to follow up on your job application:</p>
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; padding: 20px;">
                                <tr>
                                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Company</td>
                                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">{company}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Role</td>
                                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right;">{role}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Follow-up Date</td>
                                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right;">{follow_up_date}</td>
                                </tr>
                            </table>
                            <div style="text-align: center; margin-top: 32px;">
                                <a href="{settings.FRONTEND_URL}" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 14px; font-weight: 600;">View in Dashboard</a>
                            </div>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 40px; background-color: #f9fafb; text-align: center;">
                            <p style="color: #9ca3af; margin: 0; font-size: 12px;">This is an automated reminder from Pratham Dashboard.</p>
                            <p style="color: #9ca3af; margin: 4px 0 0; font-size: 12px;">You can manage your notification preferences in Settings.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>'''


async def send_task_reminder(to_email: str, task_title: str, task_description: str, due_date: str, due_time: str):
    """Send a task reminder email via SMTP."""
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f'⏰ Task Reminder: {task_title}'
        msg['From'] = settings.FROM_EMAIL
        msg['To'] = to_email

        html_content = _build_task_reminder_html(task_title, task_description, due_date, due_time)
        msg.attach(MIMEText(html_content, 'html'))

        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASS,
            start_tls=True,
        )
        print(f'Task reminder email sent to {to_email} for task: {task_title}')
    except Exception as e:
        print(f'Failed to send task reminder email to {to_email}: {e}')


async def send_followup_reminder(to_email: str, company: str, role: str, follow_up_date: str):
    """Send a job follow-up reminder email via SMTP."""
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f'📋 Follow-up Reminder: {role} at {company}'
        msg['From'] = settings.FROM_EMAIL
        msg['To'] = to_email

        html_content = _build_followup_reminder_html(company, role, follow_up_date)
        msg.attach(MIMEText(html_content, 'html'))

        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASS,
            start_tls=True,
        )
        print(f'Follow-up reminder email sent to {to_email} for {role} at {company}')
    except Exception as e:
        print(f'Failed to send follow-up reminder email to {to_email}: {e}')
