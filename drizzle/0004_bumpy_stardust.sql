CREATE TABLE `purchases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`provider` varchar(64) NOT NULL,
	`providerTransactionId` varchar(255) NOT NULL,
	`leadId` int,
	`phone` varchar(20) NOT NULL,
	`email` varchar(320),
	`amountMinor` int NOT NULL,
	`currency` varchar(12) NOT NULL,
	`paymentStatus` enum('paid','refunded','failed') NOT NULL,
	`eventId` varchar(160) NOT NULL,
	`eventSourceUrl` text,
	`capiDeliveredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `purchases_id` PRIMARY KEY(`id`),
	CONSTRAINT `purchases_provider_transaction_unique` UNIQUE(`provider`,`providerTransactionId`)
);
