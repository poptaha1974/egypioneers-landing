CREATE TABLE `visitorEngagementEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`leadId` int,
	`eventName` enum('section_viewed','faq_opened','video_started','video_completed','cta_clicked','form_started') NOT NULL,
	`target` varchar(128) NOT NULL,
	`detail` varchar(255),
	`occurredAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `visitorEngagementEvents_id` PRIMARY KEY(`id`),
	CONSTRAINT `visitor_engagement_session_event_target_unique` UNIQUE(`sessionId`,`eventName`,`target`)
);
--> statement-breakpoint
ALTER TABLE `leads` ADD `visitorSessionId` varchar(64);--> statement-breakpoint
CREATE INDEX `visitor_engagement_session_idx` ON `visitorEngagementEvents` (`sessionId`);--> statement-breakpoint
CREATE INDEX `visitor_engagement_lead_idx` ON `visitorEngagementEvents` (`leadId`);--> statement-breakpoint
CREATE INDEX `leads_visitor_session_idx` ON `leads` (`visitorSessionId`);