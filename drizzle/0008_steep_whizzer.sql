CREATE TABLE `sms_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`phone` varchar(30) NOT NULL,
	`message` text NOT NULL,
	`smsNumber` int NOT NULL,
	`sendAt` timestamp NOT NULL,
	`sentAt` timestamp,
	`status` enum('pending','sent','failed') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`messageId` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sms_jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `sms_jobs` ADD CONSTRAINT `sms_jobs_leadId_calculator_leads_id_fk` FOREIGN KEY (`leadId`) REFERENCES `calculator_leads`(`id`) ON DELETE no action ON UPDATE no action;