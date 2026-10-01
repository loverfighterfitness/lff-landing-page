CREATE TABLE `game_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`startsAt` timestamp NOT NULL,
	`endsAt` timestamp NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `game_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `game_run_tokens` (
	`id` varchar(36) NOT NULL,
	`seed` bigint NOT NULL,
	`character` varchar(16) NOT NULL,
	`issuedAt` timestamp NOT NULL,
	`usedAt` timestamp,
	CONSTRAINT `game_run_tokens_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `game_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`handle` varchar(31) NOT NULL,
	`email` varchar(320) NOT NULL,
	`marketingOptIn` boolean NOT NULL DEFAULT false,
	`character` varchar(16) NOT NULL,
	`benchScore` int NOT NULL,
	`squatScore` int NOT NULL,
	`deadliftScore` int NOT NULL,
	`total` int NOT NULL,
	`runTokenId` varchar(36) NOT NULL,
	`inputLog` text NOT NULL,
	`ipHash` varchar(64) NOT NULL,
	`removed` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `game_runs_id` PRIMARY KEY(`id`),
	CONSTRAINT `game_runs_runTokenId_unique` UNIQUE(`runTokenId`)
);
--> statement-breakpoint
CREATE INDEX `game_runs_event_removed_total_idx` ON `game_runs` (`eventId`,`removed`,`total`);