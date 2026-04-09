CREATE TABLE `shop_order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`productName` varchar(255) NOT NULL,
	`variant` varchar(128),
	`quantity` int NOT NULL,
	`unitPrice` int NOT NULL,
	`priceId` varchar(128) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shop_order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shop_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stripeSessionId` varchar(255) NOT NULL,
	`stripePaymentIntent` varchar(255),
	`customerEmail` varchar(320) NOT NULL,
	`customerName` varchar(255) NOT NULL,
	`shippingAddress` text,
	`isShipping` boolean NOT NULL DEFAULT false,
	`shippingCost` int NOT NULL DEFAULT 0,
	`subtotal` int NOT NULL DEFAULT 0,
	`total` int NOT NULL DEFAULT 0,
	`status` enum('unfulfilled','shipped','delivered') NOT NULL DEFAULT 'unfulfilled',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shop_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `shop_orders_stripeSessionId_unique` UNIQUE(`stripeSessionId`)
);
--> statement-breakpoint
CREATE TABLE `shop_products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(128) NOT NULL,
	`price` int NOT NULL,
	`priceId` varchar(128) NOT NULL,
	`category` enum('socks','straps','cuffs','tee','bundle') NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shop_products_id` PRIMARY KEY(`id`),
	CONSTRAINT `shop_products_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `shop_variants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`colour` varchar(64),
	`size` varchar(16),
	`stock` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shop_variants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `leads` ADD `contact_method` varchar(20) DEFAULT 'text' NOT NULL;--> statement-breakpoint
ALTER TABLE `shop_order_items` ADD CONSTRAINT `shop_order_items_orderId_shop_orders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `shop_orders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shop_variants` ADD CONSTRAINT `shop_variants_productId_shop_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `shop_products`(`id`) ON DELETE no action ON UPDATE no action;