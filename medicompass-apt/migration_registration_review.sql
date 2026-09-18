-- 迁移：供应商/医生注册审核状态机 + 审核字段
-- status 扩到 VARCHAR(32)，默认 DRAFT；历史 new->DRAFT, reviewed->APPROVED
-- 新增 review_note / reviewed_at / reviewed_by
ALTER TABLE `registration_provider`
  MODIFY COLUMN `status` VARCHAR(32) NOT NULL DEFAULT 'DRAFT'
    COMMENT '审核状态 DRAFT|PENDING_REVIEW|APPROVED|REJECTED',
  ADD COLUMN `review_note` TEXT NULL COMMENT '审核备注/拒绝理由' AFTER `status`,
  ADD COLUMN `reviewed_at` DATETIME(3) NULL COMMENT '最后审核时间' AFTER `review_note`,
  ADD COLUMN `reviewed_by` BIGINT UNSIGNED NULL COMMENT '审核管理员 admin.id' AFTER `reviewed_at`;

UPDATE `registration_provider` SET `status`='DRAFT'    WHERE `status`='new';
UPDATE `registration_provider` SET `status`='APPROVED' WHERE `status`='reviewed';

ALTER TABLE `registration_doctor`
  MODIFY COLUMN `status` VARCHAR(32) NOT NULL DEFAULT 'DRAFT'
    COMMENT '审核状态 DRAFT|PENDING_REVIEW|APPROVED|REJECTED',
  ADD COLUMN `review_note` TEXT NULL COMMENT '审核备注/拒绝理由' AFTER `status`,
  ADD COLUMN `reviewed_at` DATETIME(3) NULL COMMENT '最后审核时间' AFTER `review_note`,
  ADD COLUMN `reviewed_by` BIGINT UNSIGNED NULL COMMENT '审核管理员 admin.id' AFTER `reviewed_at`;

UPDATE `registration_doctor` SET `status`='DRAFT'    WHERE `status`='new';
UPDATE `registration_doctor` SET `status`='APPROVED' WHERE `status`='reviewed';
