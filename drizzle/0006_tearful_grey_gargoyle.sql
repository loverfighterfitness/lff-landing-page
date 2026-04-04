ALTER TABLE `calculator_leads` ADD `notes` text;--> statement-breakpoint
ALTER TABLE `calculator_leads` ADD `leadStatus` enum('new','contacted','converted','not_interested') DEFAULT 'new' NOT NULL;