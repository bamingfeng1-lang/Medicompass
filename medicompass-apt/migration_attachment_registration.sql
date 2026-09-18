-- 迁移：attachment 表支持关联 provider/doctor 注册（证照上传）
-- 1) application_id 允许为空（证照附件不属于 application）
-- 2) 加多态关联列 registration_type + registration_id
ALTER TABLE `attachment`
  MODIFY COLUMN `application_id` BIGINT UNSIGNED NULL COMMENT '所属申请 id（二诊附件；证照附件为空）',
  ADD COLUMN `registration_type` VARCHAR(16) NULL COMMENT '注册主体类型 provider|doctor（证照附件）' AFTER `application_id`,
  ADD COLUMN `registration_id`   BIGINT UNSIGNED NULL COMMENT '注册主体 id（registration_provider.id 或 registration_doctor.id）' AFTER `registration_type`,
  ADD KEY `idx_attachment_reg` (`registration_type`, `registration_id`);
