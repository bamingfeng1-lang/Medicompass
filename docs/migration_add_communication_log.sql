-- =====================================================================
--  迁移脚本：新增沟通历史表 communication_log
--  记录管理员与客户针对某笔 application 的沟通历史；
--  渠道支持邮件(email)/电话(phone)/面谈(meeting)/其他(other)。
--  「发送邮件」功能自动写入 email 记录；其他渠道由管理员手动登记。
--  适用于「库中已存在业务表」的增量升级（不重建已有表）。
--  在 MySQL 8.0+ / Medicompass 库上执行：
--    mysql -h 127.0.0.1 -u root -p Medicompass < migration_add_communication_log.sql
-- =====================================================================
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `communication_log` (
  `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键(自增)',
  `application_id` BIGINT UNSIGNED NOT NULL COMMENT '关联 application.id',
  `channel`        VARCHAR(16)  NOT NULL DEFAULT 'email' COMMENT '沟通渠道 email|phone|meeting|other',
  `direction`      VARCHAR(16)  NOT NULL DEFAULT 'outbound' COMMENT '沟通方向 outbound|inbound',
  `subject`        VARCHAR(255) NULL COMMENT '主题/摘要(邮件主题或沟通标题)',
  `content`        TEXT         NULL COMMENT '沟通内容正文',
  `recipients`     VARCHAR(512) NULL COMMENT '实际收件邮箱(逗号分隔,去重后)',
  `email_status`   VARCHAR(16)  NULL COMMENT '邮件发送状态 sent|failed|disabled(非邮件渠道为空)',
  `actor_name`     VARCHAR(191) NOT NULL DEFAULT '' COMMENT '操作人(管理员用户名快照)',
  `created_at`     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间(毫秒精度)',
  PRIMARY KEY (`id`),
  KEY `idx_comm_log_app` (`application_id`),
  KEY `idx_comm_log_created` (`created_at`),
  CONSTRAINT `fk_comm_log_app` FOREIGN KEY (`application_id`)
    REFERENCES `application` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='管理员与客户沟通历史(邮件/电话/面谈等)';
