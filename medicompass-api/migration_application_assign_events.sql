-- 迁移：application 分配 + 流转历史
-- 1) application 加分配列（一次只分配给一个人：provider 或 doctor）
ALTER TABLE `application`
  ADD COLUMN `assigned_to_type` VARCHAR(16) NULL COMMENT '分配对象类型 provider|doctor|NULL' AFTER `status`,
  ADD COLUMN `assigned_to_id`   BIGINT UNSIGNED NULL COMMENT '分配对象ID(registration_provider.id 或 registration_doctor.id)' AFTER `assigned_to_type`;

-- 2) 流转历史事件表
CREATE TABLE IF NOT EXISTS `application_event` (
  `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键(自增)',
  `application_id` BIGINT UNSIGNED NOT NULL COMMENT '关联 application.id',
  `event_type`     VARCHAR(32)  NOT NULL COMMENT '事件类型 STATUS_CHANGED|ASSIGNED|NOTE_ADDED',
  `actor_type`     VARCHAR(16)  NOT NULL DEFAULT 'admin' COMMENT '操作方 admin|system',
  `actor_id`       BIGINT UNSIGNED NULL COMMENT '操作人ID(admin.id,可空)',
  `actor_name`     VARCHAR(191) NOT NULL DEFAULT '' COMMENT '操作人名称快照',
  `payload`        JSON         NULL COMMENT '事件数据 {from,to} 或 {type,id,name}',
  `note`           TEXT         NULL COMMENT '可选备注',
  `created_at`     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间(毫秒精度)',
  PRIMARY KEY (`id`),
  KEY `idx_app_event_app` (`application_id`),
  KEY `idx_app_event_created` (`created_at`),
  CONSTRAINT `fk_app_event_app` FOREIGN KEY (`application_id`)
    REFERENCES `application` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='application 流转历史事件';
