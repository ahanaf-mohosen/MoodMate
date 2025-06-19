import nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface CrisisAlertEmailData {
  userEmail: string;
  trustedPersonEmail: string;
  userName?: string;
  entryText: string;
  timestamp: Date;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    try {
      // Use environment variables for email configuration
      const emailConfig: EmailConfig = {
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER || process.env.GMAIL_USER || '',
          pass: process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD || '',
        },
      };

      if (!emailConfig.auth.user || !emailConfig.auth.pass) {
        console.warn('Email credentials not configured. Crisis alerts will not be sent.');
        return;
      }

      this.transporter = nodemailer.createTransporter(emailConfig);
    } catch (error) {
      console.error('Failed to initialize email transporter:', error);
    }
  }

  async sendCrisisAlert(data: CrisisAlertEmailData): Promise<boolean> {
    if (!this.transporter) {
      console.error('Email transporter not initialized. Cannot send crisis alert.');
      return false;
    }

    try {
      const emailContent = this.generateCrisisEmailContent(data);
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: data.trustedPersonEmail,
        subject: '🚨 Daily Journal Crisis Alert - Immediate Attention Needed',
        html: emailContent,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Crisis alert sent to ${data.trustedPersonEmail} for user ${data.userEmail}`);
      return true;
    } catch (error) {
      console.error('Failed to send crisis alert email:', error);
      return false;
    }
  }

  private generateCrisisEmailContent(data: CrisisAlertEmailData): string {
    const formattedDate = data.timestamp.toLocaleString();
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Crisis Alert - Daily Journal</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .alert-header { background: #ef4444; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .alert-body { background: #fef2f2; border: 2px solid #ef4444; border-top: none; padding: 30px; border-radius: 0 0 8px 8px; }
          .urgent { color: #dc2626; font-weight: bold; font-size: 18px; margin-bottom: 20px; }
          .details { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ef4444; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
          .action-button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="alert-header">
            <h1>🚨 CRISIS ALERT</h1>
            <p>Daily Journal Mental Health Monitoring System</p>
          </div>
          
          <div class="alert-body">
            <div class="urgent">
              URGENT: Someone you care about may need immediate support
            </div>
            
            <p>Hello,</p>
            
            <p>This is an automated crisis alert from Daily Journal. Our system has detected concerning content in a mood journal entry that suggests the person may be experiencing thoughts of self-harm or suicide.</p>
            
            <div class="details">
              <h3>Alert Details:</h3>
              <p><strong>User Email:</strong> ${data.userEmail}</p>
              <p><strong>Time:</strong> ${formattedDate}</p>
              <p><strong>Detected Risk Level:</strong> High - Crisis Keywords Detected</p>
            </div>
            
            <div class="urgent">
              IMMEDIATE ACTION RECOMMENDED:
            </div>
            
            <ul>
              <li><strong>Contact them immediately</strong> via phone, text, or in person</li>
              <li><strong>Listen without judgment</strong> and offer your support</li>
              <li><strong>Encourage professional help</strong> if needed</li>
              <li><strong>Stay with them</strong> or ensure they're not alone if possible</li>
            </ul>
            
            <h3>Crisis Resources:</h3>
            <ul>
              <li><strong>National Suicide Prevention Lifeline:</strong> 988 (US)</li>
              <li><strong>Crisis Text Line:</strong> Text HOME to 741741</li>
              <li><strong>International Association for Suicide Prevention:</strong> <a href="https://www.iasp.info/resources/Crisis_Centres/">https://www.iasp.info/resources/Crisis_Centres/</a></li>
            </ul>
            
            <div class="footer">
              <p>This alert was generated automatically by Daily Journal's AI-powered mood monitoring system. The system detected keywords and patterns that may indicate a mental health crisis.</p>
              
              <p><strong>Important:</strong> This is not a substitute for professional mental health care. If you believe someone is in immediate danger, please contact emergency services (911 in the US) immediately.</p>
              
              <p>You are receiving this email because you were designated as a trusted contact for crisis situations. To update your contact preferences, please have the user log into their Daily Journal account.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async testConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email connection test failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
