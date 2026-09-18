-- 迁移：管理员与客户沟通历史表（邮件/电话/面谈等）
-- 记录管理员向客户发送的邮件，以及手动登记的电话/面谈等沟通记录。
CREATE TABLE IF NOT EXISTS `communication_log` (
  `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键(自增)',
  `application_id` BIGINT UNSIGNED NOT NULL COMMENT '关联 application.id',
  `channel`        VARCHAR(16)  NOT NULL DEFAULT 'email' COMMENT '沟通方式 email|phone|meeting|other',
  `direction`      VARCHAR(16)  NOT NULL DEFAULT 'outbound' COMMENT '方向 outbound|inbound',
  `subject`        VARCHAR(255) NULL COMMENT '主题(邮件主题或沟通标题)',
  `content`        TEXT         NULL COMMENT '正文/沟通内容',
  `recipients`     VARCHAR(512) NULL COMMENT '实际收件邮箱(逗号分隔,仅邮件)',
  `email_status`   VARCHAR(16)  NULL COMMENT '邮件发送结果 sent|failed|disabled(仅邮件)',
  `actor_name`     VARCHAR(191) NOT NULL DEFAULT '' COMMENT '操作人名称快照(管理员)',
  `created_at`     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间(毫秒精度)',
  PRIMARY KEY (`id`),
  KEY `idx_comm_log_app` (`application_id`),
  KEY `idx_comm_log_created` (`created_at`),
  CONSTRAINT `fk_comm_log_app` FOREIGN KEY (`application_id`)
    REFERENCES `application` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='管理员与客户沟通历史(邮件/电话/面谈等)';
