-- 迁移：合并 inquiry 到 application(统一申请/咨询主表)
-- 库为空时执行；给 application 增列 + 放宽 condition/country + 删除 inquiry 表。
SET FOREIGN_KEY_CHECKS = 0;

ALTER TABLE `application`
  ADD COLUMN `service_slug` VARCHAR(128) NULL COMMENT '来源业务线标识(如 medical-package;二诊申请为空)' AFTER `need_type`,
  ADD COLUMN `service_name` VARCHAR(191) NULL COMMENT '服务名称(咨询类按 slug 派生;二诊为空)' AFTER `service_slug`,
  ADD COLUMN `message` TEXT NULL COMMENT '留言(咨询类)' AFTER `condition`,
  MODIFY COLUMN `country` VARCHAR(128) NULL COMMENT '国家/地区(二诊必填;咨询可空)',
  MODIFY COLUMN `condition` TEXT NULL COMMENT '客户自述病情(二诊必填;咨询可空)';

DROP TABLE IF EXISTS `inquiry`;

SET FOREIGN_KEY_CHECKS = 1;
