CREATE TABLE `webinarMessageLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`messageType` enum('welcome','reminder_24h','reminder_3h') NOT NULL,
	`webinarStartAt` timestamp NOT NULL,
	`status` enum('queued','sent','failed','skipped') NOT NULL DEFAULT 'queued',
	`providerMessageId` varchar(255),
	`errorMessage` text,
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `webinarMessageLogs_id` PRIMARY KEY(`id`),
	CONSTRAINT `webinar_message_log_delivery_unique` UNIQUE(`leadId`,`messageType`,`webinarStartAt`)
);
--> statement-breakpoint
ALTER TABLE `leads` ADD `whatsappConsent` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `leads` ADD `whatsappConsentAt` timestamp;