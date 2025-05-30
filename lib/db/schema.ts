import { pgTable, varchar, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core';
import { user, session, account, verification } from './auth-schema';

// Additional app-specific tables
export const subscriptions = pgTable('subscriptions', {
  id: varchar('id', { length: 255 }).primaryKey(),
  plan: varchar('plan', { length: 255 }).notNull(),
  referenceId: varchar('reference_id', { length: 255 }).notNull(),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
  status: varchar('status', { length: 255 }).notNull(),
  periodStart: timestamp('period_start'),
  periodEnd: timestamp('period_end'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  seats: integer('seats'),
  trialStart: timestamp('trial_start'),
  trialEnd: timestamp('trial_end'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// You can add more app-specific tables here
export const emailDomains = pgTable('email_domains', {
  id: varchar('id', { length: 255 }).primaryKey(),
  domain: varchar('domain', { length: 255 }).notNull().unique(),
  status: varchar('status', { length: 50 }).notNull(), // 'pending', 'verified', 'failed'
  verificationToken: varchar('verification_token', { length: 255 }),
  canReceiveEmails: boolean('can_receive_emails').default(false),
  hasMxRecords: boolean('has_mx_records').default(false),
  domainProvider: varchar('domain_provider', { length: 100 }),
  providerConfidence: varchar('provider_confidence', { length: 20 }), // 'high', 'medium', 'low'
  lastDnsCheck: timestamp('last_dns_check'),
  lastSesCheck: timestamp('last_ses_check'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  userId: varchar('user_id', { length: 255 }).notNull(),
});

export const emailAddresses = pgTable('email_addresses', {
  id: varchar('id', { length: 255 }).primaryKey(),
  address: varchar('address', { length: 255 }).notNull().unique(),
  domainId: varchar('domain_id', { length: 255 }).notNull(),
  webhookId: varchar('webhook_id', { length: 255 }), // Link to webhooks table
  isActive: boolean('is_active').default(true),
  isReceiptRuleConfigured: boolean('is_receipt_rule_configured').default(false),
  receiptRuleName: varchar('receipt_rule_name', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  userId: varchar('user_id', { length: 255 }).notNull(),
});

// Webhooks table - stores webhook configurations
export const webhooks = pgTable('webhooks', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(), // User-friendly name
  url: text('url').notNull(), // Webhook URL
  secret: varchar('secret', { length: 255 }), // For webhook verification
  isActive: boolean('is_active').default(true),
  description: text('description'), // Optional description
  headers: text('headers'), // JSON string for custom headers
  timeout: integer('timeout').default(30), // Timeout in seconds
  retryAttempts: integer('retry_attempts').default(3),
  lastUsed: timestamp('last_used'),
  totalDeliveries: integer('total_deliveries').default(0),
  successfulDeliveries: integer('successful_deliveries').default(0),
  failedDeliveries: integer('failed_deliveries').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  userId: varchar('user_id', { length: 255 }).notNull(),
});

// SES Events table - stores raw SES event data
export const sesEvents = pgTable('ses_events', {
  id: varchar('id', { length: 255 }).primaryKey(),
  eventSource: varchar('event_source', { length: 100 }).notNull(),
  eventVersion: varchar('event_version', { length: 50 }).notNull(),
  messageId: varchar('message_id', { length: 255 }).notNull(),
  source: varchar('source', { length: 255 }).notNull(),
  destination: text('destination').notNull(), // JSON array of recipients
  subject: text('subject'),
  timestamp: timestamp('timestamp').notNull(),
  receiptTimestamp: timestamp('receipt_timestamp').notNull(),
  processingTimeMillis: integer('processing_time_millis'),
  recipients: text('recipients').notNull(), // JSON array
  spamVerdict: varchar('spam_verdict', { length: 50 }),
  virusVerdict: varchar('virus_verdict', { length: 50 }),
  spfVerdict: varchar('spf_verdict', { length: 50 }),
  dkimVerdict: varchar('dkim_verdict', { length: 50 }),
  dmarcVerdict: varchar('dmarc_verdict', { length: 50 }),
  actionType: varchar('action_type', { length: 50 }),
  s3BucketName: varchar('s3_bucket_name', { length: 255 }),
  s3ObjectKey: varchar('s3_object_key', { length: 500 }),
  emailContent: text('email_content'), // Full email content from S3
  s3ContentFetched: boolean('s3_content_fetched').default(false),
  s3ContentSize: integer('s3_content_size'),
  s3Error: text('s3_error'),
  commonHeaders: text('common_headers'), // JSON object
  rawSesEvent: text('raw_ses_event').notNull(), // Complete SES event JSON
  lambdaContext: text('lambda_context'), // Lambda execution context
  webhookPayload: text('webhook_payload'), // Complete webhook payload
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const receivedEmails = pgTable('received_emails', {
  id: varchar('id', { length: 255 }).primaryKey(),
  sesEventId: varchar('ses_event_id', { length: 255 }).notNull(), // Reference to sesEvents table
  messageId: varchar('message_id', { length: 255 }).notNull(),
  from: varchar('from', { length: 255 }).notNull(),
  to: text('to').notNull(), // JSON string for multiple recipients
  recipient: varchar('recipient', { length: 255 }).notNull(), // Specific recipient for this record
  subject: text('subject'),
  receivedAt: timestamp('received_at').notNull(),
  processedAt: timestamp('processed_at'),
  status: varchar('status', { length: 50 }).notNull(), // 'received', 'processing', 'forwarded', 'failed'
  metadata: text('metadata'), // JSON string
  userId: varchar('user_id', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const webhookDeliveries = pgTable('webhook_deliveries', {
  id: varchar('id', { length: 255 }).primaryKey(),
  emailId: varchar('email_id', { length: 255 }),
  webhookId: varchar('webhook_id', { length: 255 }).notNull(), // Reference to webhooks table
  endpoint: varchar('endpoint', { length: 500 }).notNull(), // Keep for backward compatibility
  payload: text('payload'), // JSON payload sent
  status: varchar('status', { length: 50 }).notNull(), // 'pending', 'success', 'failed'
  attempts: integer('attempts').default(0),
  lastAttemptAt: timestamp('last_attempt_at'),
  responseCode: integer('response_code'),
  responseBody: text('response_body'),
  error: text('error'),
  deliveryTime: integer('delivery_time'), // Time in milliseconds
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const domainDnsRecords = pgTable('domain_dns_records', {
  id: varchar('id', { length: 255 }).primaryKey(),
  domainId: varchar('domain_id', { length: 255 }).notNull(),
  recordType: varchar('record_type', { length: 10 }).notNull(), // 'TXT', 'MX', etc.
  name: varchar('name', { length: 255 }).notNull(),
  value: text('value').notNull(),
  isRequired: boolean('is_required').default(true),
  isVerified: boolean('is_verified').default(false),
  lastChecked: timestamp('last_checked'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Export types for Better Auth tables (using the imported tables)
export { user, session, account, verification };

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type Session = typeof session.$inferSelect;
export type NewSession = typeof session.$inferInsert;
export type Account = typeof account.$inferSelect;
export type NewAccount = typeof account.$inferInsert;
export type Verification = typeof verification.$inferSelect;
export type NewVerification = typeof verification.$inferInsert;

// Export types for app-specific tables
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type EmailDomain = typeof emailDomains.$inferSelect;
export type NewEmailDomain = typeof emailDomains.$inferInsert;
export type EmailAddress = typeof emailAddresses.$inferSelect;
export type NewEmailAddress = typeof emailAddresses.$inferInsert;
export type Webhook = typeof webhooks.$inferSelect;
export type NewWebhook = typeof webhooks.$inferInsert;
export type SesEvent = typeof sesEvents.$inferSelect;
export type NewSesEvent = typeof sesEvents.$inferInsert;
export type ReceivedEmail = typeof receivedEmails.$inferSelect;
export type NewReceivedEmail = typeof receivedEmails.$inferInsert;
export type WebhookDelivery = typeof webhookDeliveries.$inferSelect;
export type NewWebhookDelivery = typeof webhookDeliveries.$inferInsert;
export type DomainDnsRecord = typeof domainDnsRecords.$inferSelect;
export type NewDomainDnsRecord = typeof domainDnsRecords.$inferInsert;

// Domain status enums
export const DOMAIN_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  FAILED: 'failed'
} as const;

export const SES_VERIFICATION_STATUS = {
  PENDING: 'Pending',
  SUCCESS: 'Success', 
  FAILED: 'Failed'
} as const;

export const PROVIDER_CONFIDENCE = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
} as const;

export const EMAIL_STATUS = {
  RECEIVED: 'received',
  PROCESSING: 'processing',
  FORWARDED: 'forwarded',
  FAILED: 'failed'
} as const;

export const WEBHOOK_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed'
} as const;

// Type definitions
export type DomainStatus = typeof DOMAIN_STATUS[keyof typeof DOMAIN_STATUS];
export type SesVerificationStatus = typeof SES_VERIFICATION_STATUS[keyof typeof SES_VERIFICATION_STATUS];
export type ProviderConfidence = typeof PROVIDER_CONFIDENCE[keyof typeof PROVIDER_CONFIDENCE];
export type EmailStatus = typeof EMAIL_STATUS[keyof typeof EMAIL_STATUS];
export type WebhookStatus = typeof WEBHOOK_STATUS[keyof typeof WEBHOOK_STATUS];
