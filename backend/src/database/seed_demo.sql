-- ====================================================================
-- Freethink Canonical Demo Database Seed Dump
-- Project: Smart Project Task Management & Resource Scheduling System
-- Generated: 2026-09-05T08:42:11.616Z
-- ====================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- Table: users
DELETE FROM `users`;
INSERT INTO `users` (`user_id`, `name`, `username`, `email`, `password_hash`, `role`, `non_working_days`, `daily_working_hours`, `schedule_configured`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Shlok Zambreker', 'shlok', 'shlok@freethink.com', '$2b$10$G7Hg/LbiTfAZc/00gYCKn.rrwLppuIJmOdhNXQlFYJL2NqaLuVF4K', 'PROJECT_MANAGER', NULL, '8.00', 0, 1, '2026-09-05 14:12:11', '2026-09-05 14:12:11'),
(2, 'Chinmay Gadgil', 'chinmay', 'chinmay@freethink.com', '$2b$10$G7Hg/LbiTfAZc/00gYCKn.rrwLppuIJmOdhNXQlFYJL2NqaLuVF4K', 'RESOURCE', 'SATURDAY,SUNDAY', '8.00', 1, 1, '2026-09-05 14:12:11', '2026-09-05 14:12:11'),
(3, 'Sana Shaikh', 'sana', 'sana@freethink.com', '$2b$10$G7Hg/LbiTfAZc/00gYCKn.rrwLppuIJmOdhNXQlFYJL2NqaLuVF4K', 'RESOURCE', 'SATURDAY,SUNDAY', '8.00', 1, 1, '2026-09-05 14:12:11', '2026-09-05 14:12:11'),
(4, 'Shikhaa Prabhudesai', 'shikhaa', 'shikhaa@freethink.com', '$2b$10$G7Hg/LbiTfAZc/00gYCKn.rrwLppuIJmOdhNXQlFYJL2NqaLuVF4K', 'RESOURCE', 'SATURDAY,SUNDAY', '8.00', 1, 1, '2026-09-05 14:12:11', '2026-09-05 14:12:11'),
(5, 'Tanvi Khandeparkar', 'tanvi', 'tanvi@freethink.com', '$2b$10$G7Hg/LbiTfAZc/00gYCKn.rrwLppuIJmOdhNXQlFYJL2NqaLuVF4K', 'RESOURCE', 'SATURDAY,SUNDAY', '8.00', 1, 1, '2026-09-05 14:12:11', '2026-09-05 14:12:11'),
(6, 'Hridham Chimulkar', 'hridham', 'hridham@freethink.com', '$2b$10$G7Hg/LbiTfAZc/00gYCKn.rrwLppuIJmOdhNXQlFYJL2NqaLuVF4K', 'RESOURCE', 'SATURDAY,SUNDAY', '8.00', 1, 1, '2026-09-05 14:12:11', '2026-09-05 14:12:11');

-- Table: holidays
DELETE FROM `holidays`;
INSERT INTO `holidays` (`holiday_id`, `holiday_date`, `description`) VALUES
(1, '2026-01-26', 'Republic Day'),
(2, '2026-03-03', 'Holi'),
(3, '2026-03-19', 'Gudi Padava'),
(4, '2026-03-21', 'Id-Ul Fitr'),
(5, '2026-03-26', 'Ram Navami'),
(6, '2026-04-03', 'Good Friday'),
(7, '2026-04-14', 'Birth Anniversary of Dr. Babasaheb Ambedkar'),
(8, '2026-05-01', 'May Day'),
(9, '2026-08-15', 'Independence Day'),
(10, '2026-09-14', 'Ganesh Chaturthi (1st Day)'),
(11, '2026-09-15', 'Ganesh Chaturthi (2nd Day)'),
(12, '2026-10-02', 'Gandhi Jayanti'),
(13, '2026-11-08', 'Diwali (Deepavali)'),
(14, '2026-12-19', 'Goa Liberation Day'),
(15, '2026-12-25', 'Christmas Day');

-- Table: user_leaves
DELETE FROM `user_leaves`;
INSERT INTO `user_leaves` (`leave_id`, `request_id`, `user_id`, `leave_date`, `leave_hours`, `leave_type`, `status`, `approver_id`, `rejection_reason`, `approved_at`, `created_at`) VALUES
(1, '4237d698-36f8-4729-8bdd-15f670ae0bc0', 6, '2026-09-06', '8.00', 'FULL_DAY', 'APPROVED', 1, NULL, '2026-09-04 10:30:00', '2026-09-05 14:12:11'),
(2, '59f8fe8f-32b4-4ce0-badb-badbc46c6d44', 4, '2026-09-09', '4.00', 'FULL_DAY', 'APPROVED', 1, NULL, '2026-09-03 14:00:00', '2026-09-05 14:12:11'),
(3, '8fca7b7a-b6b9-4cad-8473-90560d81f641', 3, '2026-09-08', '8.00', 'FULL_DAY', 'PENDING', NULL, NULL, NULL, '2026-09-05 14:12:11');

-- Table: projects
DELETE FROM `projects`;
INSERT INTO `projects` (`project_id`, `project_manager_id`, `name`, `description`, `status`, `priority`, `start_date`, `deadline`, `progress`, `created_at`, `updated_at`) VALUES
(1, 1, 'Smart Project Task Management & Resource Scheduling System', 'Freethink flagship system featuring CPM-based automated resource scheduling, DHTMLX Gantt timeline visualization, dynamic holiday and leave capacity constraints, and real-time task progress tracking.', 'IN_PROGRESS', 'CRITICAL', '2026-08-11', '2026-09-25', '68.00', '2026-09-05 14:12:11', '2026-09-05 14:12:11'),
(2, 1, 'Simple Login System', 'A Vue-based login and authentication learning project using Pinia for state management and Quasar for modern UI components.', 'COMPLETED', 'HIGH', '2026-07-17', '2026-08-10', '100.00', '2026-09-05 14:12:11', '2026-09-05 14:12:11'),
(3, 1, 'Booking System', 'A comprehensive booking and reservation management system featuring schedule coordination, customer booking workflows, and real-time availability management.', 'NOT_STARTED', 'MEDIUM', '2026-09-06', '2026-10-20', '0.00', '2026-09-05 14:12:11', '2026-09-05 14:12:11');

-- Table: project_members
DELETE FROM `project_members`;
INSERT INTO `project_members` (`project_id`, `user_id`, `joined_at`) VALUES
(1, 2, '2026-09-05 14:12:11'),
(1, 3, '2026-09-05 14:12:11'),
(1, 4, '2026-09-05 14:12:11'),
(1, 5, '2026-09-05 14:12:11'),
(1, 6, '2026-09-05 14:12:11'),
(2, 2, '2026-09-05 14:12:11'),
(2, 3, '2026-09-05 14:12:11'),
(2, 4, '2026-09-05 14:12:11'),
(2, 5, '2026-09-05 14:12:11'),
(2, 6, '2026-09-05 14:12:11');

-- Table: tasks
DELETE FROM `tasks`;
INSERT INTO `tasks` (`task_id`, `project_id`, `created_by`, `title`, `description`, `priority`, `status`, `deadline`, `planned_start`, `planned_end`, `actual_start`, `actual_end`, `expected_effort`, `actual_effort`, `progress`, `is_schedule_at_risk`, `is_deadline_at_risk`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 'Critical Path Scheduling Engine & Urgency Scoring', 'Implement CPM topological sort, cycle detection, urgency score sorting, and hourly precision allocation.', 'CRITICAL', 'COMPLETED', '2026-08-26', NULL, NULL, '2026-08-12 09:00:00', '2026-08-26 17:00:00', '32.00', '32.00', '100.00', 0, 0, '2026-09-05 14:12:11', '2026-09-05 14:12:11'),
(2, 1, 1, 'Task Sessions & Live Tracking Engine', 'Schema and backend service for live start/stop task tracking sessions, active session sync, and elapsed time calculation.', 'HIGH', 'IN_PROGRESS', '2026-09-13', '2026-09-07 10:00:00', '2026-09-07 16:00:00', '2026-08-31 09:30:00', NULL, '24.00', '18.00', '75.00', 0, 0, '2026-09-05 14:12:11', '2026-09-05 14:12:11'),
(3, 1, 1, 'Bottleneck Task Detection & Impact Analysis', 'Service to calculate task slack time and alert on bottleneck tasks delaying downstream milestones.', 'HIGH', 'SCHEDULED', '2026-09-23', '2026-09-07 16:00:00', '2026-09-09 16:00:00', NULL, NULL, '16.00', '0.00', '0.00', 0, 0, '2026-09-05 14:12:11', '2026-09-05 14:12:11'),
(4, 1, 1, 'Interactive Segmented Gantt Chart Timeline', 'DHTMLX Gantt timeline rendering with segmented task_schedules, custom zoom scales, and column scrolling.', 'CRITICAL', 'COMPLETED', '2026-08-28', NULL, NULL, '2026-08-14 10:00:00', '2026-08-28 18:00:00', '32.00', '32.00', '100.00', 0, 0, '2026-09-05 14:12:11', '2026-09-05 14:12:11'),
(5, 1, 1, 'Resource Workload & Availability Engine', 'Dynamic capacity calculation, 8h workday normalization, resource schedule locking, and workload KPIs.', 'HIGH', 'IN_PROGRESS', '2026-09-15', '2026-09-07 10:00:00', '2026-09-09 11:00:00', '2026-09-02 09:00:00', NULL, '24.00', '15.00', '60.00', 0, 0, '2026-09-05 14:12:11', '2026-09-05 14:12:11'),
(6, 1, 1, 'PM Dashboard Workflows & Health Metrics', 'PM dashboard overview, project health calculation algorithms, and project edit/update dialogs.', 'HIGH', 'COMPLETED', '2026-08-31', NULL, NULL, '2026-08-18 09:00:00', '2026-08-31 17:30:00', '20.00', '20.00', '100.00', 0, 0, '2026-09-05 14:12:11', '2026-09-05 14:12:11'),
(7, 1, 1, 'Authentication UI & Password Reset Workflows', 'Responsive login/signup forms, auth layout, reset password flow, and Pinia auth store integration.', 'HIGH', 'COMPLETED', '2026-08-24', NULL, NULL, '2026-08-11 09:00:00', '2026-08-24 16:00:00', '24.00', '24.00', '100.00', 0, 0, '2026-09-05 14:12:11', '2026-09-05 14:12:11'),
(8, 1, 1, 'Resource Leave Management & Requests System', 'LeavesPage UI, leave request modal, leave deletion, and employee leave balance display.', 'HIGH', 'IN_PROGRESS', '2026-09-12', '2026-09-07 10:00:00', '2026-09-07 16:00:00', '2026-09-01 11:00:00', NULL, '20.00', '14.00', '70.00', 0, 0, '2026-09-05 14:12:11', '2026-09-05 14:12:11'),
(9, 1, 1, 'PM Resource Directory & Details Visualization', 'Resource card listing, resource detail pages, skill cards, and assigned tasks view.', 'MEDIUM', 'COMPLETED', '2026-08-30', NULL, NULL, '2026-08-20 09:00:00', '2026-08-30 17:00:00', '16.00', '16.00', '100.00', 0, 0, '2026-09-05 14:12:11', '2026-09-05 14:12:11'),
(10, 1, 1, 'Holiday Calendar Management & Non-Working Days', 'Quasar QCalendar integration, official holiday management, weekend off, and non-working day indicators.', 'HIGH', 'COMPLETED', '2026-08-29', NULL, NULL, '2026-08-16 09:00:00', '2026-08-29 18:00:00', '24.00', '24.00', '100.00', 0, 0, '2026-09-05 14:12:11', '2026-09-05 14:12:11'),
(11, 1, 1, 'Daily Progress Reporting & Automated Status Sync', 'Daily update modal, work log submissions, status badge transitions based on progress percentage.', 'HIGH', 'IN_PROGRESS', '2026-09-14', '2026-09-07 10:00:00', '2026-09-08 12:00:00', '2026-09-03 10:00:00', NULL, '20.00', '10.00', '50.00', 0, 0, '2026-09-05 14:12:11', '2026-09-05 14:12:11'),
(12, 1, 1, 'Resource Dashboard & Self-Assigned Tasks', 'Resource dashboard UI, task specs view, self-assign task toggle, and session progress bar.', 'MEDIUM', 'COMPLETED', '2026-09-01', NULL, NULL, '2026-08-21 09:00:00', '2026-09-01 17:00:00', '18.00', '18.00', '100.00', 0, 0, '2026-09-05 14:12:11', '2026-09-05 14:12:11'),
(13, 1, 1, 'JWT Security, Route Guards & User Schema', 'MySQL user table setup, JWT generation/validation, role-based route protection, login by username.', 'CRITICAL', 'COMPLETED', '2026-08-22', NULL, NULL, '2026-08-11 09:00:00', '2026-08-22 18:00:00', '24.00', '24.00', '100.00', 0, 0, '2026-09-05 14:12:11', '2026-09-05 14:12:11'),
(14, 1, 1, 'Task Dependency Graph & Cycle Prevention Service', 'Dependency deletion, cycle validation engine, and including dependency graphs in task responses.', 'HIGH', 'COMPLETED', '2026-08-27', NULL, NULL, '2026-08-17 10:00:00', '2026-08-27 17:30:00', '16.00', '16.00', '100.00', 0, 0, '2026-09-05 14:12:11', '2026-09-05 14:12:11'),
(15, 1, 1, 'Leave Approval Workflow & Project Archival', 'PM leave approval/rejection endpoints, project archiving and unarchiving logic.', 'HIGH', 'IN_PROGRESS', '2026-09-11', '2026-09-07 16:00:00', '2026-09-08 12:00:00', '2026-09-02 09:00:00', NULL, '20.00', '16.00', '80.00', 0, 0, '2026-09-05 14:12:11', '2026-09-05 14:12:11'),
(16, 1, 1, 'Global Search & Command Palette (Ctrl+K)', 'Fast keyboard navigation and command palette search across tasks, projects, and resources.', 'MEDIUM', 'SCHEDULED', '2026-09-20', '2026-09-08 12:00:00', '2026-09-10 12:00:00', NULL, NULL, '16.00', '0.00', '0.00', 0, 0, '2026-09-05 14:12:11', '2026-09-05 14:12:11'),
(17, 2, 1, 'Initial Database Schema & Connection Pool', 'Configured MySQL database connection pooling and base tables.', 'HIGH', 'COMPLETED', '2026-08-01', NULL, NULL, '2026-07-17 09:00:00', '2026-08-01 18:00:00', '20.00', '20.00', '100.00', 0, 0, '2026-09-05 14:12:11', '2026-09-05 14:12:11'),
(18, 2, 1, 'Baseline User Registration & Password Hashing', 'User registration endpoints, bcrypt password encryption, and validation rules.', 'HIGH', 'COMPLETED', '2026-08-09', NULL, NULL, '2026-08-01 09:00:00', '2026-08-09 18:00:00', '24.00', '24.00', '100.00', 0, 0, '2026-09-05 14:12:11', '2026-09-05 14:12:11');

-- Table: task_assignments
DELETE FROM `task_assignments`;
INSERT INTO `task_assignments` (`task_id`, `user_id`, `created_at`) VALUES
(1, 2, '2026-09-05 14:12:11'),
(2, 2, '2026-09-05 14:12:11'),
(3, 2, '2026-09-05 14:12:11'),
(4, 3, '2026-09-05 14:12:11'),
(5, 3, '2026-09-05 14:12:11'),
(6, 3, '2026-09-05 14:12:11'),
(7, 4, '2026-09-05 14:12:11'),
(8, 4, '2026-09-05 14:12:11'),
(9, 4, '2026-09-05 14:12:11'),
(10, 5, '2026-09-05 14:12:11'),
(11, 5, '2026-09-05 14:12:11'),
(12, 5, '2026-09-05 14:12:11'),
(13, 6, '2026-09-05 14:12:11'),
(14, 6, '2026-09-05 14:12:11'),
(15, 6, '2026-09-05 14:12:11'),
(16, 6, '2026-09-05 14:12:11'),
(17, 2, '2026-09-05 14:12:11'),
(17, 6, '2026-09-05 14:12:11'),
(18, 3, '2026-09-05 14:12:11'),
(18, 4, '2026-09-05 14:12:11'),
(18, 5, '2026-09-05 14:12:11');

-- Table: task_dependencies
DELETE FROM `task_dependencies`;
INSERT INTO `task_dependencies` (`task_id`, `predecessor_task_id`) VALUES
(3, 1),
(15, 8),
(5, 10),
(16, 13);

-- Table: work_logs
DELETE FROM `work_logs`;
INSERT INTO `work_logs` (`log_id`, `task_id`, `user_id`, `hours_logged`, `progress_logged`, `status`, `notes`, `blockers`, `log_date`, `created_at`) VALUES
(1, 1, 2, '32.00', '100.00', 'COMPLETED', 'Implemented topological sorting, cycle detection, urgency scoring and hourly allocation.', NULL, '2026-08-26', '2026-09-05 14:12:11'),
(2, 2, 2, '18.00', '75.00', 'IN_PROGRESS', 'Configured task sessions schema and live start/stop session sync.', NULL, '2026-09-05', '2026-09-05 14:12:11'),
(3, 4, 3, '32.00', '100.00', 'COMPLETED', 'Integrated DHTMLX Gantt chart with task_schedules timeline segmentation.', NULL, '2026-08-28', '2026-09-05 14:12:11'),
(4, 5, 3, '15.00', '60.00', 'IN_PROGRESS', 'Implemented capacity calculation formulas and non-working day locking.', NULL, '2026-09-04', '2026-09-05 14:12:11'),
(5, 6, 3, '20.00', '100.00', 'COMPLETED', 'PM dashboard metric cards and project update dialogs completed.', NULL, '2026-08-31', '2026-09-05 14:12:11'),
(6, 7, 4, '24.00', '100.00', 'COMPLETED', 'Login, signup, forgot password, and reset password UI completed with Pinia store.', NULL, '2026-08-24', '2026-09-05 14:12:11'),
(7, 8, 4, '14.00', '70.00', 'IN_PROGRESS', 'LeavesPage component, leave creation modal, and status display completed.', NULL, '2026-09-05', '2026-09-05 14:12:11'),
(8, 9, 4, '16.00', '100.00', 'COMPLETED', 'PM resource cards and individual resource details page connected.', NULL, '2026-08-30', '2026-09-05 14:12:11'),
(9, 10, 5, '24.00', '100.00', 'COMPLETED', 'QCalendar integration, official holiday dataset, and non-working day grid styling.', NULL, '2026-08-29', '2026-09-05 14:12:11'),
(10, 11, 5, '10.00', '50.00', 'IN_PROGRESS', 'Added daily task update modal with status badge auto-transition based on progress percentage.', NULL, '2026-09-05', '2026-09-05 14:12:11'),
(11, 12, 5, '18.00', '100.00', 'COMPLETED', 'Resource personal dashboard, my tasks list, and session progress bar completed.', NULL, '2026-09-01', '2026-09-05 14:12:11'),
(12, 13, 6, '24.00', '100.00', 'COMPLETED', 'JWT authentication, token verification middleware, and route guard protection completed.', NULL, '2026-08-22', '2026-09-05 14:12:11'),
(13, 14, 6, '16.00', '100.00', 'COMPLETED', 'Task dependency deletion and cyclic check validation logic added.', NULL, '2026-08-27', '2026-09-05 14:12:11'),
(14, 15, 6, '16.00', '80.00', 'IN_PROGRESS', 'PM leave approval/rejection endpoints and project archival workflows implemented.', NULL, '2026-09-04', '2026-09-05 14:12:11');

-- Table: task_sessions
DELETE FROM `task_sessions`;
INSERT INTO `task_sessions` (`session_id`, `task_id`, `user_id`, `start_time`, `end_time`, `is_active`) VALUES
(1, 2, 2, '2026-09-05 14:12:11', NULL, 1);

-- Table: task_schedules
DELETE FROM `task_schedules`;
INSERT INTO `task_schedules` (`schedule_id`, `task_id`, `user_id`, `schedule_date`, `allocated_hours`, `schedule_version`, `created_at`) VALUES
(1, 8, 4, '2026-09-07', '6.00', 1, '2026-09-05 14:12:11'),
(2, 15, 6, '2026-09-07', '2.00', 1, '2026-09-05 14:12:11'),
(3, 15, 6, '2026-09-08', '2.00', 1, '2026-09-05 14:12:11'),
(4, 2, 2, '2026-09-07', '6.00', 1, '2026-09-05 14:12:11'),
(5, 11, 5, '2026-09-07', '8.00', 1, '2026-09-05 14:12:11'),
(6, 11, 5, '2026-09-08', '2.00', 1, '2026-09-05 14:12:11'),
(7, 5, 3, '2026-09-07', '8.00', 1, '2026-09-05 14:12:11'),
(8, 5, 3, '2026-09-09', '1.00', 1, '2026-09-05 14:12:11'),
(9, 3, 2, '2026-09-07', '2.00', 1, '2026-09-05 14:12:11'),
(10, 3, 2, '2026-09-08', '8.00', 1, '2026-09-05 14:12:11'),
(11, 3, 2, '2026-09-09', '6.00', 1, '2026-09-05 14:12:11'),
(12, 16, 6, '2026-09-08', '6.00', 1, '2026-09-05 14:12:11'),
(13, 16, 6, '2026-09-09', '8.00', 1, '2026-09-05 14:12:11'),
(14, 16, 6, '2026-09-10', '2.00', 1, '2026-09-05 14:12:11');

SET FOREIGN_KEY_CHECKS = 1;
