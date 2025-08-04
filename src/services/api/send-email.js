// api/send-email.js (Example backend API endpoint)
// This would be implemented in your backend (Express.js, Next.js API routes, etc.)

const nodemailer = require('nodemailer');

// Email configuration using your Gmail credentials
const EMAIL_CONFIG = {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: 'dukaniethnicstore@gmail.com',
        pass: 'cquh pjqh hlyi cafy' // App password, not regular password
    }
};

// Create transporter
const transporter = nodemailer.createTransporter(EMAIL_CONFIG);

// Verify transporter configuration
transporter.verify((error, success) => {
    if (error) {
        console.log('Email configuration error:', error);
    } else {
        console.log('Email server is ready to send messages');
    }
});

// API endpoint for sending emails
async function sendEmailAPI(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const {
            to_email,
            to_name,
            subject,
            html_content,
            text_content,
            from_email = EMAIL_CONFIG.auth.user,
            from_name = 'Staff Management System'
        } = req.body;

        // Validate required fields
        if (!to_email || !subject || !html_content) {
            return res.status(400).json({
                error: 'Missing required fields: to_email, subject, html_content'
            });
        }

        // Email options
        const mailOptions = {
            from: `"${from_name}" <${from_email}>`,
            to: to_name ? `"${to_name}" <${to_email}>` : to_email,
            subject: subject,
            html: html_content,
            text: text_content || stripHtmlTags(html_content)
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);

        console.log('Email sent successfully:', info.messageId);

        res.status(200).json({
            success: true,
            messageId: info.messageId,
            message: 'Email sent successfully'
        });

    } catch (error) {
        console.error('Email sending error:', error);

        res.status(500).json({
            success: false,
            error: 'Failed to send email',
            details: error.message
        });
    }
}

// Helper function to strip HTML tags for plain text fallback
function stripHtmlTags(html) {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

// Bulk email sending function
async function sendBulkEmails(emails) {
    const results = [];

    for (const emailData of emails) {
        try {
            const mailOptions = {
                from: `"${emailData.from_name || 'Staff Management System'}" <${emailData.from_email || EMAIL_CONFIG.auth.user}>`,
                to: emailData.to_name ? `"${emailData.to_name}" <${emailData.to_email}>` : emailData.to_email,
                subject: emailData.subject,
                html: emailData.html_content,
                text: emailData.text_content || stripHtmlTags(emailData.html_content)
            };

            const info = await transporter.sendMail(mailOptions);
            results.push({
                to: emailData.to_email,
                success: true,
                messageId: info.messageId
            });

            // Add delay between emails to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
            console.error(`Failed to send email to ${emailData.to_email}:`, error);
            results.push({
                to: emailData.to_email,
                success: false,
                error: error.message
            });
        }
    }

    return results;
}

// Specific email templates
const EMAIL_TEMPLATES = {
    payslip: {
        subject: (data) => `Payslip - ${data.payPeriod}`,
        generateHtml: (data) => {
            // Use the HTML template from the PayrollDialog component
            return data.htmlContent;
        }
    },

    roster: {
        subject: (data) => `Work Roster - ${data.rosterName}`,
        generateHtml: (data) => {
            // Use the HTML template from the email service
            return data.htmlContent;
        }
    },

    certificationAlert: {
        subject: () => 'URGENT: Certification Expiry Alert - Action Required',
        generateHtml: (data) => {
            return data.htmlContent;
        }
    }
};

// Express.js route example
function setupEmailRoutes(app) {
    // Single email endpoint
    app.post('/api/send-email', sendEmailAPI);

    // Bulk email endpoint
    app.post('/api/send-bulk-emails', async (req, res) => {
        try {
            const { emails } = req.body;

            if (!Array.isArray(emails) || emails.length === 0) {
                return res.status(400).json({ error: 'Invalid emails array' });
            }

            const results = await sendBulkEmails(emails);

            res.status(200).json({
                success: true,
                results,
                summary: {
                    total: results.length,
                    successful: results.filter(r => r.success).length,
                    failed: results.filter(r => !r.success).length
                }
            });

        } catch (error) {
            console.error('Bulk email error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to send bulk emails',
                details: error.message
            });
        }
    });

    // Template-based email endpoint
    app.post('/api/send-template-email', async (req, res) => {
        try {
            const { template, data } = req.body;

            if (!EMAIL_TEMPLATES[template]) {
                return res.status(400).json({ error: 'Invalid email template' });
            }

            const templateConfig = EMAIL_TEMPLATES[template];
            const subject = templateConfig.subject(data);
            const htmlContent = templateConfig.generateHtml(data);

            const mailOptions = {
                from: `"${data.from_name || 'Staff Management System'}" <${data.from_email || EMAIL_CONFIG.auth.user}>`,
                to: data.to_name ? `"${data.to_name}" <${data.to_email}>` : data.to_email,
                subject,
                html: htmlContent,
                text: data.text_content || stripHtmlTags(htmlContent)
            };

            const info = await transporter.sendMail(mailOptions);

            res.status(200).json({
                success: true,
                messageId: info.messageId,
                template,
                message: 'Template email sent successfully'
            });

        } catch (error) {
            console.error('Template email error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to send template email',
                details: error.message
            });
        }
    });
}

// Next.js API route example
// pages/api/send-email.js
export default async function handler(req, res) {
    return sendEmailAPI(req, res);
}

// Email queue system for better reliability
class EmailQueue {
    constructor() {
        this.queue = [];
        this.processing = false;
    }

    add(emailData) {
        this.queue.push({
            ...emailData,
            id: Date.now() + Math.random(),
            timestamp: new Date(),
            attempts: 0,
            maxAttempts: 3
        });

        this.process();
    }

    async process() {
        if (this.processing || this.queue.length === 0) return;

        this.processing = true;

        while (this.queue.length > 0) {
            const email = this.queue.shift();

            try {
                const mailOptions = {
                    from: `"${email.from_name || 'Staff Management System'}" <${email.from_email || EMAIL_CONFIG.auth.user}>`,
                    to: email.to_name ? `"${email.to_name}" <${email.to_email}>` : email.to_email,
                    subject: email.subject,
                    html: email.html_content,
                    text: email.text_content || stripHtmlTags(email.html_content)
                };

                await transporter.sendMail(mailOptions);
                console.log(`Email sent successfully: ${email.id}`);

            } catch (error) {
                console.error(`Email failed: ${email.id}`, error);

                email.attempts++;
                if (email.attempts < email.maxAttempts) {
                    // Re-queue for retry
                    this.queue.push(email);
                } else {
                    console.error(`Email permanently failed after ${email.maxAttempts} attempts: ${email.id}`);
                }
            }

            // Rate limiting delay
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        this.processing = false;
    }
}

// Export for use in your application
module.exports = {
    sendEmailAPI,
    sendBulkEmails,
    setupEmailRoutes,
    EmailQueue,
    EMAIL_TEMPLATES
};

/* 
USAGE EXAMPLES:

1. Frontend usage with fetch:
```javascript
const response = await fetch('/api/send-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to_email: 'staff@example.com',
    to_name: 'John Doe',
    subject: 'Your Payslip',
    html_content: '<h1>Payslip</h1><p>Content here...</p>',
    from_name: 'Payroll Department'
  })
});
```

2. Express.js setup:
```javascript
const express = require('express');
const { setupEmailRoutes } = require('./email-api');

const app = express();
app.use(express.json());
setupEmailRoutes(app);
app.listen(3000);
```

3. Using the email queue:
```javascript
const emailQueue = new EmailQueue();
emailQueue.add({
  to_email: 'staff@example.com',
  subject: 'Test',
  html_content: '<p>Test email</p>'
});
```
*/