-- 迁移：放宽 registration_patient 的部分必填(用于"快速注册"最小资料)
-- country / need_type / condition 改为可空。正常注册页仍在前端强制这些项。
ALTER TABLE `registration_patient`
  MODIFY COLUMN `country`    VARCHAR(128) NULL COMMENT '国家/地区(完整注册必填;快速注册可空)',
  MODIFY COLUMN `need_type`  VARCHAR(64)  NULL COMMENT '需求类型(完整注册必填;快速注册可空)',
  MODIFY COLUMN `condition`  TEXT         NULL COMMENT '病情简述(完整注册必填;快速注册可空)';
