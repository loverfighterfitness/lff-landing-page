CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`goal` enum('lose_weight','build_muscle','comp_prep','strength','general_fitness','other') NOT NULL,
	`message` text,
	`source` varchar(64) NOT NULL DEFAULT 'landing_page',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
