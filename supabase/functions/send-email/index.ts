// supabase/functions/send-email/index.ts
// Enhanced with detailed logging and actual email sending

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enhanced logging function
function logWithTimestamp(level: string, message: string, data?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
  if (data) {
    console.log(`[${timestamp}] [DATA]`, JSON.stringify(data, null, 2));
  }
}

// Real SMTP implementation using native Deno APIs
class RealSmtpClient {
  private conn: Deno.TlsConn | null = null;
  private encoder = new TextEncoder();
  private decoder = new TextDecoder();

  async connect(options: {
    hostname: string;
    port: number;
    username: string;
    password: string;
  }) {
    logWithTimestamp('info', `Attempting SMTP connection to ${options.hostname}:${options.port}`);
    
    try {
      // Connect with TLS to Gmail
      this.conn = await Deno.connectTls({
        hostname: options.hostname,
        port: options.port,
      });

      logWithTimestamp('info', 'TLS connection established');

      // Read initial greeting
      const greeting = await this.readResponse();
      logWithTimestamp('info', 'Server greeting received', { greeting });

      // Send EHLO
      await this.sendCommand(`EHLO ${options.hostname}`);
      logWithTimestamp('info', 'EHLO command sent');

      // Authenticate
      await this.sendCommand("AUTH LOGIN");
      logWithTimestamp('info', 'AUTH LOGIN command sent');
      
      await this.sendCommand(btoa(options.username));
      logWithTimestamp('info', 'Username sent (base64 encoded)');
      
      await this.sendCommand(btoa(options.password));
      logWithTimestamp('info', 'Password sent (base64 encoded)');

      logWithTimestamp('success', 'SMTP authentication successful');
      return true;
    } catch (error) {
      logWithTimestamp('error', 'SMTP connection failed', { error: error.message });
      throw error;
    }
  }

  async sendEmail(options: {
    from: string;
    to: string;
    subject: string;
    html?: string;
    text?: string;
  }) {
    logWithTimestamp('info', 'Starting email send process', {
      from: options.from,
      to: options.to,
      subject: options.subject,
      hasHtml: !!options.html,
      hasText: !!options.text
    });

    try {
      // MAIL FROM
      await this.sendCommand(`MAIL FROM:<${options.from}>`);
      logWithTimestamp('info', 'MAIL FROM command sent');

      // RCPT TO
      await this.sendCommand(`RCPT TO:<${options.to}>`);
      logWithTimestamp('info', 'RCPT TO command sent');

      // DATA
      await this.sendCommand("DATA");
      logWithTimestamp('info', 'DATA command sent');

      // Build and send email content
      const emailContent = this.buildEmailContent(options);
      logWithTimestamp('info', 'Email content built', { 
        contentLength: emailContent.length,
        preview: emailContent.substring(0, 200) + '...'
      });

      await this.writeData(emailContent);
      await this.sendCommand(".");
      logWithTimestamp('info', 'Email content sent');

      logWithTimestamp('success', 'Email sent successfully via SMTP');
      return { success: true, messageId: `smtp-${Date.now()}` };
    } catch (error) {
      logWithTimestamp('error', 'Email sending failed', { error: error.message });
      throw error;
    }
  }

  private buildEmailContent(options: {
    from: string;
    to: string;
    subject: string;
    html?: string;
    text?: string;
  }): string {
    const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36)}`;
    
    let content = `From: ${options.from}\r\n`;
    content += `To: ${options.to}\r\n`;
    content += `Subject: ${options.subject}\r\n`;
    content += `MIME-Version: 1.0\r\n`;
    content += `Date: ${new Date().toUTCString()}\r\n`;
    
    if (options.html && options.text) {
      content += `Content-Type: multipart/alternative; boundary="${boundary}"\r\n\r\n`;
      content += `--${boundary}\r\n`;
      content += `Content-Type: text/plain; charset=utf-8\r\n\r\n`;
      content += `${options.text}\r\n\r\n`;
      content += `--${boundary}\r\n`;
      content += `Content-Type: text/html; charset=utf-8\r\n\r\n`;
      content += `${options.html}\r\n\r\n`;
      content += `--${boundary}--\r\n`;
    } else if (options.html) {
      content += `Content-Type: text/html; charset=utf-8\r\n\r\n`;
      content += `${options.html}\r\n`;
    } else {
      content += `Content-Type: text/plain; charset=utf-8\r\n\r\n`;
      content += `${options.text || ''}\r\n`;
    }

    return content;
  }

  private async sendCommand(command: string) {
    if (!this.conn) throw new Error('Not connected to SMTP server');
    
    logWithTimestamp('debug', `Sending SMTP command: ${command.substring(0, 20)}...`);
    await this.conn.write(this.encoder.encode(`${command}\r\n`));
    const response = await this.readResponse();
    logWithTimestamp('debug', `SMTP response received: ${response.substring(0, 100)}...`);
    return response;
  }

  private async writeData(data: string) {
    if (!this.conn) throw new Error('Not connected to SMTP server');
    await this.conn.write(this.encoder.encode(data));
  }

  private async readResponse(): Promise<string> {
    if (!this.conn) throw new Error('Not connected to SMTP server');
    
    const buffer = new Uint8Array(4096);
    const n = await this.conn.read(buffer);
    
    if (n === null) throw new Error('SMTP connection closed unexpectedly');
    
    const response = this.decoder.decode(buffer.subarray(0, n));
    
    // Check for SMTP error responses
    if (response.startsWith('4') || response.startsWith('5')) {
      throw new Error(`SMTP Error: ${response.trim()}`);
    }
    
    return response;
  }

  async close() {
    if (this.conn) {
      try {
        await this.sendCommand("QUIT");
        logWithTimestamp('info', 'SMTP connection closed gracefully');
      } catch (error) {
        logWithTimestamp('warn', 'Error during SMTP QUIT', { error: error.message });
      }
      this.conn.close();
      this.conn = null;
    }
  }
}

// Fallback: Enhanced console logging
function logEmailToConsole(options: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from: string;
}) {
  const separator = '='.repeat(80);
  const miniSeparator = '-'.repeat(40);
  
  console.log(separator);
  console.log('📧 EMAIL SIMULATION - NOT ACTUALLY SENT');
  console.log(separator);
  console.log(`📤 From: ${options.from}`);
  console.log(`📥 To: ${options.to}`);
  console.log(`📝 Subject: ${options.subject}`);
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  console.log(miniSeparator);
  console.log('📄 Email Content Preview:');
  if (options.html) {
    console.log('HTML Content (first 500 chars):');
    console.log(options.html.substring(0, 500) + (options.html.length > 500 ? '...' : ''));
  }
  if (options.text) {
    console.log('Text Content:');
    console.log(options.text);
  }
  console.log(separator);
  console.log('⚠️  THIS IS A SIMULATION - NO ACTUAL EMAIL WAS SENT');
  console.log('⚠️  Set up SMTP credentials to send real emails');
  console.log(separator);
  
  return { 
    success: true, 
    messageId: `simulation-${Date.now()}`,
    note: 'Email simulated - not actually sent'
  };
}

serve(async (req) => {
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  logWithTimestamp('info', `New email request received`, { requestId, method: req.method });

  if (req.method === 'OPTIONS') {
    logWithTimestamp('info', 'CORS preflight request', { requestId });
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    const { to, subject, html, text, type = 'general' } = requestBody;

    logWithTimestamp('info', 'Request payload parsed', {
      requestId,
      to,
      subject,
      type,
      hasHtml: !!html,
      hasText: !!text
    });

    // Validate input
    if (!to || !subject || (!html && !text)) {
      logWithTimestamp('error', 'Validation failed - missing required fields', {
        requestId,
        hasTo: !!to,
        hasSubject: !!subject,
        hasContent: !!(html || text)
      });
      
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, and html/text' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get environment variables
    const gmailUser = Deno.env.get("GMAIL_USER");
    const gmailPassword = Deno.env.get("GMAIL_APP_PASSWORD");
    
    logWithTimestamp('info', 'Environment check', {
      requestId,
      hasGmailUser: !!gmailUser,
      hasGmailPassword: !!gmailPassword,
      gmailUser: gmailUser || 'NOT_SET'
    });

    let result;
    let emailMethod = 'unknown';

    if (gmailUser && gmailPassword) {
      // Try real SMTP first
      emailMethod = 'smtp';
      logWithTimestamp('info', 'Attempting real SMTP email delivery', { requestId });
      
      try {
        const smtpClient = new RealSmtpClient();
        
        await smtpClient.connect({
          hostname: "smtp.gmail.com",
          port: 465,
          username: gmailUser,
          password: gmailPassword,
        });

        result = await smtpClient.sendEmail({
          from: gmailUser,
          to: to,
          subject: subject,
          html: html,
          text: text || (html ? html.replace(/<[^>]*>/g, '') : undefined),
        });

        await smtpClient.close();
        
        logWithTimestamp('success', 'SMTP email sent successfully', { requestId, result });
        
      } catch (smtpError) {
        logWithTimestamp('error', 'SMTP sending failed, falling back to console', {
          requestId,
          error: smtpError.message
        });
        
        // Fallback to console logging
        emailMethod = 'console-fallback';
        result = logEmailToConsole({
          to, subject, html, text, from: gmailUser
        });
      }
    } else {
      // No credentials - use console logging
      emailMethod = 'console-only';
      logWithTimestamp('info', 'No SMTP credentials - using console simulation', { requestId });
      
      result = logEmailToConsole({
        to, subject, html, text, from: gmailUser || 'no-sender@example.com'
      });
    }

    const response = {
      success: true,
      message: `Email ${emailMethod === 'smtp' ? 'sent' : 'simulated'} successfully to ${to}`,
      messageId: result.messageId,
      method: emailMethod,
      timestamp: new Date().toISOString(),
      requestId
    };

    logWithTimestamp('success', 'Email request completed', { requestId, response });

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    logWithTimestamp('error', 'Email request failed', {
      requestId,
      error: error.message,
      stack: error.stack
    });
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send email', 
        details: error.message,
        timestamp: new Date().toISOString(),
        requestId
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});