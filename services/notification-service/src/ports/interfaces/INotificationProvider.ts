export interface SendEmailRequest {
  to: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  fromEmail?: string;
  fromName?: string;
  metadata?: Record<string, any>;
}

export interface SendEmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  providerResponse?: Record<string, any>;
}

export interface SendSmsRequest {
  to: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface SendSmsResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  providerResponse?: Record<string, any>;
}

export interface SendPushRequest {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface SendPushResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  providerResponse?: Record<string, any>;
}

export interface INotificationProvider {
  getName(): string;
  sendEmail(request: SendEmailRequest): Promise<SendEmailResponse>;
  sendSms(request: SendSmsRequest): Promise<SendSmsResponse>;
  sendPush(request: SendPushRequest): Promise<SendPushResponse>;
}



