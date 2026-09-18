-- 迁移：inquiry 表关联登录用户(来源标记)
-- 仅给已存在库增量升级用；全新库请直接用 mysql_schema.sql。
ALTER TABLE `inquiry`
  ADD COLUMN `user_id` BIGINT UNSIGNED NULL COMMENT '关联 user.id(来源登录用户,可空)' AFTER `id`,
  ADD KEY `idx_inquiry_user` (`user_id`),
  ADD CONSTRAINT `fk_inquiry_user`
    FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;
