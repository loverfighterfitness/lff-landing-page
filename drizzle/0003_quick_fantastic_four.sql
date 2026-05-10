ALTER TABLE `leads` RENAME COLUMN `email` TO `phone`;--> statement-breakpoint
ALTER TABLE `leads` MODIFY COLUMN `phone` varchar(30) NOT NULL;