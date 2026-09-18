-- 迁移：为 application 增加二诊全流程状态机
-- status 由 VARCHAR(16)(new|reviewed|contacted) 升级为 VARCHAR(32),
-- 默认 PENDING_REVIEW；历史值统一归一为 PENDING_REVIEW。
ALTER TABLE `application`
  MODIFY COLUMN `status` VARCHAR(32) NOT NULL DEFAULT 'PENDING_REVIEW'
  COMMENT '二诊流程状态 PENDING_REVIEW|PENDING_ASSIGN|PROVIDER_PROCESSING|DOCTOR_PROCESSING|PROVIDER_TRANSLATING|ADMIN_QC|COMPLETED';

UPDATE `application`
  SET `status` = 'PENDING_REVIEW'
  WHERE `status` IN ('new', 'reviewed', 'contacted');
