-- =====================================================================
--  迁移脚本：新增统一用户账号表 user + 为三张注册表关联 user_id
--  适用于「库中已存在业务表」的增量升级（不重建已有表）。
--  在 MySQL 8.0+ / Medicompass 库上执行：
--    mysql -h 127.0.0.1 -u root -p Medicompass < migration_add_user.sql
-- =====================================================================
SET NAMES utf8mb4;

-- ---------------------------------------------------------------------
-- 1) 统一账号表：手机号唯一，密码只存这里；role 由关联的 registration_* 决定
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键(自增)',
  `phone`         VARCHAR(64)  NOT NULL COMMENT '登录标识(手机号，唯一)',
  `password_hash` VARCHAR(255) NOT NULL COMMENT 'bcrypt 密码哈希',
  `status`        VARCHAR(16)  NOT NULL DEFAULT 'active' COMMENT '状态 active|disabled',
  `created_at`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='统一用户账号(手机号登录)';

-- ---------------------------------------------------------------------
-- 2) 三张注册资料表各加 user_id 外键（可空，兼容历史数据；SET NULL 保留资料）
-- ---------------------------------------------------------------------
ALTER TABLE `registration_patient`
  ADD COLUMN `user_id` BIGINT UNSIGNED NULL COMMENT '关联 user.id' AFTER `id`,
  ADD KEY `idx_reg_patient_user` (`user_id`),
  ADD CONSTRAINT `fk_reg_patient_user`
    FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `registration_provider`
  ADD COLUMN `user_id` BIGINT UNSIGNED NULL COMMENT '关联 user.id' AFTER `id`,
  ADD KEY `idx_reg_provider_user` (`user_id`),
  ADD CONSTRAINT `fk_reg_provider_user`
    FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `registration_doctor`
  ADD COLUMN `user_id` BIGINT UNSIGNED NULL COMMENT '关联 user.id' AFTER `id`,
  ADD KEY `idx_reg_doctor_user` (`user_id`),
  ADD CONSTRAINT `fk_reg_doctor_user`
    FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;
