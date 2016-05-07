SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

CREATE DATABASE IF NOT EXISTS `issuetracker` DEFAULT CHARACTER SET latin1 COLLATE latin1_swedish_ci;
USE `issuetracker`;

CREATE TABLE IF NOT EXISTS `answers` (
`id` int(11) NOT NULL,
  `user` int(11) NOT NULL,
  `report` int(11) NOT NULL,
  `text` text NOT NULL,
  `updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00'
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS `flags` (
`id` int(11) NOT NULL,
  `title` text NOT NULL,
  `color` tinytext NOT NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS `groups` (
`id` int(11) NOT NULL,
  `name` text NOT NULL,
  `alias` text NOT NULL COMMENT 'public name',
  `color` tinytext NOT NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS `groups_permissions` (
`id` int(11) NOT NULL,
  `group_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS `permissions` (
`id` int(11) NOT NULL,
  `string` text NOT NULL,
  `description` text NOT NULL
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS `reports` (
`id` int(11) NOT NULL,
  `title` text NOT NULL,
  `creator` int(11) NOT NULL,
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` int(11) NOT NULL DEFAULT '0'
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS `reports_flags` (
`id` int(11) NOT NULL,
  `report_id` int(11) NOT NULL,
  `flag_id` int(11) NOT NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS `reports_services` (
`id` int(11) NOT NULL,
  `report_id` int(11) NOT NULL,
  `service_id` int(11) NOT NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS `services` (
`id` int(11) NOT NULL,
  `title` text NOT NULL,
  `description` text NOT NULL,
  `color` tinytext NOT NULL
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS `sessions` (
`id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `shared_id` tinytext NOT NULL,
  `lastuse` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `browser` text NOT NULL,
  `language` text NOT NULL
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS `users` (
`id` int(11) NOT NULL,
  `username` tinytext NOT NULL,
  `password_hash` text NOT NULL,
  `password_salt` text NOT NULL,
  `email` text NOT NULL,
  `gravatar_url` text NOT NULL,
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `banned` tinyint(1) NOT NULL DEFAULT '0'
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=latin1;
DELIMITER //
CREATE TRIGGER `Generate Gravatar-URL` BEFORE INSERT ON `users`
 FOR EACH ROW SET NEW.gravatar_url = CONCAT("http://www.gravatar.com/avatar", MD5(TRIM(LOWER(NEW.email))), "?identicon")
//
DELIMITER ;
DELIMITER //
CREATE TRIGGER `Update Gravatar-URL` BEFORE UPDATE ON `users`
 FOR EACH ROW SET NEW.gravatar_url = CONCAT("http://www.gravatar.com/avatar/", MD5(TRIM(LOWER(NEW.email))), "?d=identicon")
//
DELIMITER ;

CREATE TABLE IF NOT EXISTS `users_groups` (
`id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `group_id` int(11) NOT NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=latin1;


ALTER TABLE `answers`
 ADD PRIMARY KEY (`id`);

ALTER TABLE `flags`
 ADD PRIMARY KEY (`id`);

ALTER TABLE `groups`
 ADD PRIMARY KEY (`id`);

ALTER TABLE `groups_permissions`
 ADD PRIMARY KEY (`id`);

ALTER TABLE `permissions`
 ADD PRIMARY KEY (`id`);

ALTER TABLE `reports`
 ADD PRIMARY KEY (`id`);

ALTER TABLE `reports_flags`
 ADD PRIMARY KEY (`id`);

ALTER TABLE `reports_services`
 ADD PRIMARY KEY (`id`);

ALTER TABLE `services`
 ADD PRIMARY KEY (`id`);

ALTER TABLE `sessions`
 ADD PRIMARY KEY (`id`);

ALTER TABLE `users`
 ADD PRIMARY KEY (`id`);

ALTER TABLE `users_groups`
 ADD PRIMARY KEY (`id`);


ALTER TABLE `answers`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=6;
ALTER TABLE `flags`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=4;
ALTER TABLE `groups`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=6;
ALTER TABLE `groups_permissions`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=29;
ALTER TABLE `permissions`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=35;
ALTER TABLE `reports`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=4;
ALTER TABLE `reports_flags`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=6;
ALTER TABLE `reports_services`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=4;
ALTER TABLE `services`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=11;
ALTER TABLE `sessions`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=50;
ALTER TABLE `users`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=8;
ALTER TABLE `users_groups`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=6;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;