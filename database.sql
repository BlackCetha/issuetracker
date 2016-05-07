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


/* ADD PERMISSIONS */
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";
CREATE DATABASE IF NOT EXISTS `issuetracker` DEFAULT CHARACTER SET latin1 COLLATE latin1_swedish_ci;
USE `issuetracker`;

INSERT INTO `groups` (`id`, `name`, `alias`, `color`) VALUES
(1, 'admin', 'Administrator', '#AA0000'),
(2, 'mod', 'Moderator', '#00AA00'),
(5, 'testgroup', 'TestGroup', '#444');

INSERT INTO `groups_permissions` (`id`, `group_id`, `permission_id`) VALUES
(2, 1, 1),
(4, 1, 2),
(5, 1, 3),
(6, 1, 4),
(7, 1, 5),
(8, 1, 6),
(9, 1, 7),
(10, 1, 8),
(11, 1, 9),
(12, 1, 10),
(13, 1, 11),
(14, 1, 12),
(15, 1, 13),
(16, 1, 14),
(17, 1, 15),
(18, 1, 16),
(19, 1, 18),
(20, 1, 20),
(21, 1, 19),
(23, 1, 29),
(26, 1, 32),
(27, 1, 33),
(28, 1, 34);

INSERT INTO `permissions` (`id`, `string`, `description`) VALUES
(1, 'service_create', 'Create a new service'),
(2, 'service_edit', 'Edit a service'),
(3, 'service_delete', 'Delete a service'),
(4, 'report_create', 'Create a report'),
(5, 'report_edit', 'Edit a report'),
(6, 'report_delete', 'Delete a report'),
(7, 'report_view', 'View the list of all reports'),
(8, 'report_detail', 'View details of one report'),
(9, 'service_view', 'View the list of all services'),
(10, 'service_detail', 'View details of one service'),
(11, 'report_edit_own', 'Edit own reports'),
(12, 'answer_create', 'Create a answer'),
(13, 'answer_delete', 'Delete a answer'),
(14, 'user_detail', 'View details about one user'),
(15, 'user_reports', 'List reports of a user'),
(16, 'user_groups', 'List the groups of a user'),
(17, 'user_add_group', 'General permission to add users to groups'),
(18, 'user_add_group_master', 'Absolute permission to add users to groups, ignores individual group settings'),
(19, 'user_rm_group_master', 'Absolute permission to remove users from groups, ignores individual group permissions'),
(20, 'user_password', 'Set a new password for a user'),
(21, 'answer_edit', 'Edit a answer'),
(22, 'answer_edit_own', 'Edit own answer'),
(23, 'answer_delete_own', 'Delete own answer'),
(24, 'user_rm_group', 'General permission to remove a user from a group'),
(25, 'user_edit', 'Edit profile of a user'),
(26, 'user_edit_own', 'Edit own profile'),
(27, 'user_password', 'Set the password of a user'),
(28, 'user_password_own', 'Edit own password'),
(29, 'perm_list', 'View all permissions'),
(32, 'group_create', 'Create a new group'),
(33, 'group_edit', 'Edit a group'),
(34, 'group_delete', 'Delete a group');
