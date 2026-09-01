CREATE TABLE `crmInteractions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`crmRecordId` int NOT NULL,
	`channel` enum('whatsapp','call','email','meeting','note') NOT NULL,
	`direction` enum('in','out','internal') NOT NULL DEFAULT 'internal',
	`summary` text NOT NULL,
	`stageAfter` varchar(32),
	`agentUserId` int,
	`occurredAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crmInteractions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crmRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int,
	`studentId` int,
	`displayName` varchar(255) NOT NULL,
	`phone` varchar(20),
	`stage` enum('new','contacted','qualified','enrolled','onboarding','active','at_risk','recovered','churned') NOT NULL DEFAULT 'new',
	`status` enum('open','waiting','closed_won','closed_lost') NOT NULL DEFAULT 'open',
	`ownerUserId` int,
	`nextActionAt` timestamp,
	`lastContactAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `crmRecords_id` PRIMARY KEY(`id`),
	CONSTRAINT `crm_record_lead_unique` UNIQUE(`leadId`)
);
--> statement-breakpoint
CREATE TABLE `sheetSyncOutbox` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tabName` varchar(64) NOT NULL,
	`rowKey` varchar(190) NOT NULL,
	`payload` json NOT NULL,
	`status` enum('pending','sent','failed','skipped') NOT NULL DEFAULT 'pending',
	`attempts` int NOT NULL DEFAULT 0,
	`lastError` text,
	`availableAt` timestamp NOT NULL DEFAULT (now()),
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sheetSyncOutbox_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `studentDailyEntries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`entryDate` date NOT NULL,
	`ordersPlaced` int,
	`ordersConfirmed` int,
	`ordersDelivered` int,
	`ordersReturned` int,
	`collectedRevenueMinor` int,
	`productCostMinor` int,
	`adSpendMinor` int,
	`shippingMinor` int,
	`collectionFeesMinor` int,
	`returnCostMinor` int,
	`variableOpsMinor` int,
	`leadsCount` int,
	`sessionsCount` int,
	`notes` text,
	`source` enum('student','admin','import') NOT NULL DEFAULT 'student',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `studentDailyEntries_id` PRIMARY KEY(`id`),
	CONSTRAINT `student_daily_entry_unique` UNIQUE(`studentId`,`entryDate`)
);
--> statement-breakpoint
CREATE TABLE `studentDailyEntryRevisions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`entryDate` date NOT NULL,
	`revision` int NOT NULL,
	`payload` json NOT NULL,
	`changeReason` varchar(255),
	`recordedByUserId` int,
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `studentDailyEntryRevisions_id` PRIMARY KEY(`id`),
	CONSTRAINT `student_daily_revision_unique` UNIQUE(`studentId`,`entryDate`,`revision`)
);
--> statement-breakpoint
CREATE TABLE `students` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`leadId` int,
	`fullName` varchar(255) NOT NULL,
	`phone` varchar(20),
	`email` varchar(320),
	`cohort` varchar(64),
	`storeName` varchar(255),
	`market` varchar(8) NOT NULL DEFAULT 'EG',
	`status` enum('active','paused','graduated','churned') NOT NULL DEFAULT 'active',
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `students_id` PRIMARY KEY(`id`),
	CONSTRAINT `students_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `thincEvaluations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`periodStart` date NOT NULL,
	`periodEnd` date NOT NULL,
	`decision` enum('RESEARCH','TEST','FIX','HOLD','REPOSITION','SCALE','KILL') NOT NULL,
	`gates` json NOT NULL,
	`engines` json NOT NULL,
	`missing` json NOT NULL,
	`decisionReasons` json NOT NULL,
	`schemaVersion` varchar(32) NOT NULL,
	`modelVersion` varchar(32) NOT NULL,
	`evidenceAsOf` timestamp NOT NULL,
	`dataQualityStatus` enum('OK','PARTIAL','INSUFFICIENT') NOT NULL,
	`uncertainty` enum('LOW','MEDIUM','HIGH') NOT NULL,
	`reviewStatus` enum('draft','human_reviewed') NOT NULL DEFAULT 'draft',
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `thincEvaluations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `crm_interaction_record_idx` ON `crmInteractions` (`crmRecordId`,`occurredAt`);--> statement-breakpoint
CREATE INDEX `crm_record_stage_idx` ON `crmRecords` (`stage`,`status`);--> statement-breakpoint
CREATE INDEX `sheet_sync_dispatch_idx` ON `sheetSyncOutbox` (`status`,`availableAt`);--> statement-breakpoint
CREATE INDEX `sheet_sync_rowkey_idx` ON `sheetSyncOutbox` (`tabName`,`rowKey`);--> statement-breakpoint
CREATE INDEX `student_daily_entry_student_date_idx` ON `studentDailyEntries` (`studentId`,`entryDate`);--> statement-breakpoint
CREATE INDEX `student_daily_revision_recall_idx` ON `studentDailyEntryRevisions` (`studentId`,`recordedAt`);--> statement-breakpoint
CREATE INDEX `thinc_eval_student_period_idx` ON `thincEvaluations` (`studentId`,`periodEnd`);