// lib/emailService.ts - Updated to call Supabase Edge Function

import { supabase } from './supabase';

interface PayslipData {
  staffName: string;
  staffEmail: string;
  payPeriod: string;
  grossPay: number;
  netPay: number;
  regularHours: number;
  overtimeHours?: number;
  regularPay: number;
  overtimePay?: number;
  taxWithheld: number;
  superannuation: number;
}

interface RosterData {
  staffEmail: string;
  staffName: string;
  rosterName: string;
  rosterPeriod: string;
  shifts: Array<{
    date: string;
    startTime: string;
    endTime: string;
    location: string;
    totalHours: number;
  }>;
}

class EmailService {
  private async sendEmail(emailData: {
    to: string;
    subject: string;
    html: string;
    type: string;
  }): Promise<void> {
    console.log(`🚀 Calling Supabase Edge Function to send ${emailData.type} email to:`, emailData.to);
    console.log(`📧 Subject:`, emailData.subject);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: emailData.to,
          subject: emailData.subject,
          html: emailData.html,
          type: emailData.type
        }
      });

      console.log('📬 Supabase Function Response:', data);

      if (error) {
        console.error('❌ Supabase Function Error:', error);
        throw new Error(`Email service error: ${error.message}`);
      }

      if (!data?.success) {
        console.error('❌ Email sending failed:', data);
        throw new Error(data?.error || 'Email sending failed');
      }

      console.log('✅ Email sent successfully via Edge Function:', {
        messageId: data.messageId,
        method: data.method,
        provider: data.provider
      });

      // Show user-friendly message based on method used
      if (data.method === 'smtp') {
        console.log('📧 Real email delivered via SMTP');
      } else {
        console.log('⚠️ Email was simulated (check Supabase logs for details)');
      }

    } catch (error) {
      console.error('💥 Email sending error:', error);
      throw error;
    }
  }

  async sendPayslip(payrollRecord: any, staff: any, calculation: any): Promise<void> {
    console.log('💰 Preparing payslip email for:', staff.full_name);
    
    const emailData = {
      to: staff.email,
      subject: `Payslip - ${staff.full_name} - ${new Date(payrollRecord.pay_period_start).toLocaleDateString()} to ${new Date(payrollRecord.pay_period_end).toLocaleDateString()}`,
      html: this.generatePayslipHTML(payrollRecord, staff, calculation),
      type: 'payslip'
    };

    console.log('📄 Generated payslip HTML (preview):', emailData.html.substring(0, 200) + '...');
    
    await this.sendEmail(emailData);
  }

  async sendRoster(rosterData: RosterData): Promise<void> {
    console.log('📅 Preparing roster email for:', rosterData.staffName);
    
    const emailData = {
      to: rosterData.staffEmail,
      subject: `Your Roster - ${rosterData.rosterName}`,
      html: this.generateRosterHTML(rosterData),
      type: 'roster'
    };

    await this.sendEmail(emailData);
  }

  async sendExpiringCertificationAlert(staff: any, certifications: any[]): Promise<void> {
    console.log('⚠️ Preparing certification alert for:', staff.full_name);
    
    const emailData = {
      to: staff.email,
      subject: '⚠️ Certification Expiry Alert - Action Required',
      html: this.generateCertificationAlertHTML(staff, certifications),
      type: 'certification_alert'
    };

    await this.sendEmail(emailData);
  }

  private generatePayslipHTML(payrollRecord: any, staff: any, calculation: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payslip</title>
        <style>
          body { 
            font-family: 'Helvetica Neue', Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background-color: #f8f9fa;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px; 
            text-align: center; 
          }
          .header h1 { margin: 0; font-size: 28px; font-weight: 300; }
          .header h2 { margin: 10px 0 0 0; font-size: 24px; }
          .header p { margin: 10px 0 0 0; opacity: 0.9; }
          .content { padding: 30px; }
          .section { margin-bottom: 30px; }
          .section h3 { 
            color: #333; 
            border-bottom: 2px solid #e9ecef; 
            padding-bottom: 10px; 
            margin-bottom: 20px;
          }
          .row { 
            display: flex; 
            justify-content: space-between; 
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #f8f9fa;
          }
          .row:last-child { border-bottom: none; }
          .row .label { font-weight: 500; color: #666; }
          .row .value { font-weight: 600; color: #333; }
          .total-section { 
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            padding: 20px; 
            border-radius: 8px;
            margin: 20px 0;
          }
          .total-section .row { border-bottom: 1px solid rgba(255,255,255,0.2); }
          .total-section .row:last-child { 
            border-bottom: none; 
            font-size: 18px;
            font-weight: bold;
          }
          .deductions-section {
            background: #fff3cd;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #ffc107;
          }
          .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 14px;
          }
          @media (max-width: 600px) {
            .container { margin: 10px; }
            .content { padding: 20px; }
            .row { flex-direction: column; align-items: flex-start; gap: 5px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💰 Payslip</h1>
            <h2>${staff.full_name}</h2>
            <p><strong>Pay Period:</strong> ${new Date(payrollRecord.pay_period_start).toLocaleDateString()} - ${new Date(payrollRecord.pay_period_end).toLocaleDateString()}</p>
            <p><strong>Position:</strong> ${staff.position} | <strong>Employment:</strong> ${staff.employment_type}</p>
          </div>
          
          <div class="content">
            <div class="section">
              <h3>📊 Hours Summary</h3>
              <div class="row">
                <span class="label">Regular Hours:</span>
                <span class="value">${calculation.regularHours.toFixed(2)}h @ $${staff.hourly_rate.toFixed(2)}/hr</span>
              </div>
              ${calculation.overtimeHours > 0 ? `
              <div class="row">
                <span class="label">Overtime Hours:</span>
                <span class="value">${calculation.overtimeHours.toFixed(2)}h @ $${(staff.hourly_rate * 1.5).toFixed(2)}/hr</span>
              </div>
              ` : ''}
              ${calculation.doubleTimeHours > 0 ? `
              <div class="row">
                <span class="label">Double Time Hours:</span>
                <span class="value">${calculation.doubleTimeHours.toFixed(2)}h @ $${(staff.hourly_rate * 2).toFixed(2)}/hr</span>
              </div>
              ` : ''}
              ${calculation.publicHolidayHours > 0 ? `
              <div class="row">
                <span class="label">Public Holiday Hours:</span>
                <span class="value">${calculation.publicHolidayHours.toFixed(2)}h @ $${(staff.hourly_rate * 2.5).toFixed(2)}/hr</span>
              </div>
              ` : ''}
              <div class="row">
                <span class="label"><strong>Total Hours:</strong></span>
                <span class="value"><strong>${(calculation.regularHours + calculation.overtimeHours + calculation.doubleTimeHours + calculation.publicHolidayHours).toFixed(2)}h</strong></span>
              </div>
            </div>

            <div class="section">
              <h3>💵 Earnings Breakdown</h3>
              <div class="row">
                <span class="label">Regular Pay:</span>
                <span class="value">$${calculation.regularPay.toFixed(2)}</span>
              </div>
              ${calculation.overtimePay > 0 ? `
              <div class="row">
                <span class="label">Overtime Pay:</span>
                <span class="value">$${calculation.overtimePay.toFixed(2)}</span>
              </div>
              ` : ''}
              ${calculation.doubleTimePay > 0 ? `
              <div class="row">
                <span class="label">Double Time Pay:</span>
                <span class="value">$${calculation.doubleTimePay.toFixed(2)}</span>
              </div>
              ` : ''}
              ${calculation.publicHolidayPay > 0 ? `
              <div class="row">
                <span class="label">Public Holiday Pay:</span>
                <span class="value">$${calculation.publicHolidayPay.toFixed(2)}</span>
              </div>
              ` : ''}
              ${payrollRecord.bonuses > 0 ? `
              <div class="row">
                <span class="label">Bonuses/Allowances:</span>
                <span class="value">$${payrollRecord.bonuses.toFixed(2)}</span>
              </div>
              ` : ''}
              <div class="total-section">
                <div class="row">
                  <span>Gross Pay:</span>
                  <span>$${calculation.grossPay.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="deductions-section">
                <h3>📉 Deductions</h3>
                <div class="row">
                  <span class="label">Income Tax Withheld:</span>
                  <span class="value">$${calculation.taxWithheld.toFixed(2)}</span>
                </div>
                ${payrollRecord.deductions > 0 ? `
                <div class="row">
                  <span class="label">Other Deductions:</span>
                  <span class="value">$${payrollRecord.deductions.toFixed(2)}</span>
                </div>
                ` : ''}
              </div>
            </div>

            <div class="section">
              <h3>🏦 Employer Contributions</h3>
              <div class="row">
                <span class="label">Superannuation (11%):</span>
                <span class="value">$${calculation.superannuation.toFixed(2)}</span>
              </div>
            </div>

            <div class="total-section">
              <div class="row">
                <span>💰 NET PAY:</span>
                <span>$${calculation.netPay.toFixed(2)}</span>
              </div>
            </div>

            ${payrollRecord.notes ? `
            <div class="section">
              <h3>📝 Notes</h3>
              <p style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 0;">${payrollRecord.notes}</p>
            </div>
            ` : ''}
          </div>

          <div class="footer">
            <p>This payslip was generated automatically on ${new Date().toLocaleDateString()}</p>
            <p>If you have any questions about your payslip, please contact management.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateRosterHTML(rosterData: RosterData): string {
    const shiftsHTML = rosterData.shifts.map(shift => `
      <tr style="border-bottom: 1px solid #e9ecef;">
        <td style="padding: 12px; border-right: 1px solid #e9ecef;">
          <strong>${new Date(shift.date).toLocaleDateString('en-AU', { 
            weekday: 'short', 
            day: '2-digit', 
            month: 'short' 
          })}</strong>
        </td>
        <td style="padding: 12px; border-right: 1px solid #e9ecef;">${shift.startTime}</td>
        <td style="padding: 12px; border-right: 1px solid #e9ecef;">${shift.endTime}</td>
        <td style="padding: 12px; border-right: 1px solid #e9ecef;">${shift.location}</td>
        <td style="padding: 12px; text-align: center; font-weight: bold;">${shift.totalHours.toFixed(1)}h</td>
      </tr>
    `).join('');

    const totalHours = rosterData.shifts.reduce((sum, shift) => sum + shift.totalHours, 0);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Roster</title>
        <style>
          body { 
            font-family: 'Helvetica Neue', Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background-color: #f8f9fa;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .header { 
            background: linear-gradient(135deg, #17a2b8 0%, #6f42c1 100%);
            color: white;
            padding: 30px; 
            text-align: center; 
          }
          .header h1 { margin: 0; font-size: 28px; font-weight: 300; }
          .header h2 { margin: 10px 0 0 0; font-size: 24px; }
          .header p { margin: 10px 0 0 0; opacity: 0.9; }
          .content { padding: 30px; }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          th { 
            background: linear-gradient(135deg, #495057 0%, #343a40 100%);
            color: white;
            padding: 15px 12px;
            text-align: left;
            font-weight: 600;
          }
          td { 
            padding: 12px; 
            background: white;
          }
          tr:nth-child(even) td { background: #f8f9fa; }
          .summary {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
          }
          .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 14px;
          }
          @media (max-width: 600px) {
            .container { margin: 10px; }
            .content { padding: 20px; }
            table { font-size: 14px; }
            th, td { padding: 8px 6px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📅 Your Roster</h1>
            <h2>${rosterData.staffName}</h2>
            <p><strong>${rosterData.rosterName}</strong></p>
            <p>Period: ${rosterData.rosterPeriod}</p>
          </div>
          
          <div class="content">
            <table>
              <thead>
                <tr>
                  <th>📅 Date</th>
                  <th>🕐 Start Time</th>
                  <th>🕕 End Time</th>
                  <th>📍 Location</th>
                  <th>⏰ Hours</th>
                </tr>
              </thead>
              <tbody>
                ${shiftsHTML}
              </tbody>
            </table>
            
            <div class="summary">
              <h3 style="margin: 0 0 10px 0;">📊 Weekly Summary</h3>
              <p style="margin: 0; font-size: 24px; font-weight: bold;">
                Total Hours: ${totalHours.toFixed(1)}h
              </p>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">
                ${rosterData.shifts.length} shifts scheduled
              </p>
            </div>
          </div>

          <div class="footer">
            <p>📧 This roster was sent automatically on ${new Date().toLocaleDateString()}</p>
            <p>If you have any questions or need to make changes, please contact management as soon as possible.</p>
            <p><strong>Remember:</strong> Please arrive 10 minutes before your scheduled start time.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateCertificationAlertHTML(staff: any, certifications: any[]): string {
    const certsHTML = certifications.map(cert => {
      const isExpired = cert.days_until_expiry < 0;
      const isCritical = cert.days_until_expiry <= 7 && cert.days_until_expiry >= 0;
      
      return `
        <tr style="border-bottom: 1px solid #e9ecef; ${isExpired ? 'background-color: #f8d7da;' : isCritical ? 'background-color: #fff3cd;' : ''}">
          <td style="padding: 12px; border-right: 1px solid #e9ecef;">
            ${isExpired ? '🔴' : isCritical ? '🟡' : '🟠'} ${cert.certification_name}
          </td>
          <td style="padding: 12px; border-right: 1px solid #e9ecef;">
            ${new Date(cert.expiry_date).toLocaleDateString()}
          </td>
          <td style="padding: 12px; text-align: center; font-weight: bold; color: ${isExpired ? '#721c24' : isCritical ? '#856404' : '#fd7e14'};">
            ${isExpired ? 'EXPIRED' : `${cert.days_until_expiry} days`}
          </td>
        </tr>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Certification Expiry Alert</title>
        <style>
          body { 
            font-family: 'Helvetica Neue', Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background-color: #f8f9fa;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .header { 
            background: linear-gradient(135deg, #fd7e14 0%, #e83e8c 100%);
            color: white;
            padding: 30px; 
            text-align: center; 
          }
          .header h1 { margin: 0; font-size: 28px; font-weight: 300; }
          .header h2 { margin: 10px 0 0 0; font-size: 24px; }
          .content { padding: 30px; }
          .alert-box {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-left: 4px solid #fd7e14;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          th { 
            background: linear-gradient(135deg, #495057 0%, #343a40 100%);
            color: white;
            padding: 15px 12px;
            text-align: left;
            font-weight: 600;
          }
          td { padding: 12px; background: white; }
          .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 14px;
          }
          .action-required {
            background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Certification Expiry Alert</h1>
            <h2>${staff.full_name}</h2>
          </div>
          
          <div class="content">
            <div class="alert-box">
              <h3 style="margin: 0 0 10px 0; color: #856404;">🚨 Action Required</h3>
              <p style="margin: 0;">The following certifications are expiring soon or have already expired. Please renew them immediately to maintain compliance.</p>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>📋 Certification</th>
                  <th>📅 Expiry Date</th>
                  <th>⏰ Status</th>
                </tr>
              </thead>
              <tbody>
                ${certsHTML}
              </tbody>
            </table>
            
            <div class="action-required">
              <h3 style="margin: 0 0 10px 0;">🎯 Next Steps</h3>
              <p style="margin: 0; font-size: 16px;">
                Please contact management or HR to discuss renewal of these certifications.<br>
                <strong>Expired certifications may affect your work schedule.</strong>
              </p>
            </div>
          </div>

          <div class="footer">
            <p>📧 This alert was sent automatically on ${new Date().toLocaleDateString()}</p>
            <p>For questions about certification renewals, please contact management.</p>
            <p><strong>Important:</strong> Some certifications may be required by law for your position.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export const emailService = new EmailService();