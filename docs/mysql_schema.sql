-- =====================================================================
--  Medicompass (迈蒂康) — MySQL 业务库建表脚本
--  目标后端：Python + MySQL 8.0+
--  引擎/字符集：InnoDB + utf8mb4 (utf8mb4_general_ci)，完整支持中文/emoji
--
--  字段来源：由前端 Next.js 项目 (prisma/schema.prisma + 各 API 路由 +
--  注册页表单字段) 逐一梳理而来，枚举取值均从代码核实，非推测。
--
--  主键方案：各表使用 BIGINT UNSIGNED AUTO_INCREMENT 自增主键。
--  注意：原前端为字符串 cuid，如需迁移历史数据，请另行建立 ID 映射。
-- =====================================================================
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================================
--  一、当前项目已在使用的业务表 (3 张)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. application —— 国际二诊申请 (主表)
--    写入: POST /api/applications、lib/ai.ts(AI 总结)
--    读取: 后台列表/详情、附件下载、AI 归纳
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `application`;
CREATE TABLE `application` (
  `id`                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键(自增)',
  `user_id`            BIGINT UNSIGNED NULL COMMENT '关联 user.id(来源登录用户,可空)',
  `patient_id`         BIGINT UNSIGNED NULL COMMENT '关联 registration_patient.id(客户档案,可空)',
  `application_no`     VARCHAR(64)   NULL     UNIQUE COMMENT '申请编号(客户编号+NNN,如PT260914001001)',
  `full_name`          VARCHAR(191)  NOT NULL COMMENT '客户姓名',
  `email`              VARCHAR(191)  NOT NULL COMMENT '邮箱(服务端已校验格式)',
  `phone`              VARCHAR(64)   NOT NULL COMMENT '联系电话',
  `country`            VARCHAR(128)  NULL     COMMENT '国家/地区(二诊必填;咨询可空)',
  `need_type`          VARCHAR(64)   NOT NULL COMMENT '需求类型(国际二诊/海外就医/健康体检/医疗养生/来华手术 或英文)',
  `service_slug`       VARCHAR(128)  NULL     COMMENT '来源业务线标识(如 medical-package;二诊申请为空)',
  `service_name`       VARCHAR(191)  NULL     COMMENT '服务名称(咨询类按 slug 派生;二诊为空)',
  `destination`        VARCHAR(191)  NULL     COMMENT '期望目的地(可空)',
  `condition`          TEXT          NULL     COMMENT '客户自述病情(二诊必填;咨询可空)',
  `message`            TEXT          NULL     COMMENT '留言(咨询类,可空)',
  `lang`               VARCHAR(8)    NOT NULL DEFAULT 'zh' COMMENT '提交语言 zh|en',
  `status`             VARCHAR(32)   NOT NULL DEFAULT 'PENDING_REVIEW' COMMENT '二诊流程状态 PENDING_REVIEW|PENDING_ASSIGN|PROVIDER_PROCESSING|DOCTOR_PROCESSING|PROVIDER_TRANSLATING|ADMIN_QC|COMPLETED',
  `assigned_to_type`   VARCHAR(16)   NULL     COMMENT '分配对象类型 provider|doctor|NULL',
  `assigned_to_id`     BIGINT UNSIGNED NULL   COMMENT '分配对象ID(registration_provider.id 或 registration_doctor.id)',
  `ai_summary`         MEDIUMTEXT    NULL     COMMENT 'AI 生成的病历归纳(仅二诊类)',
  `ai_summary_status`  VARCHAR(16)   NOT NULL DEFAULT 'pending' COMMENT 'AI 状态 pending|done|failed',
  `ai_summary_error`   TEXT          NULL     COMMENT 'AI 失败时的错误信息',
  `accepted_at`        DATETIME(3)   NULL     COMMENT '供应商接单时间(可空)',
  `reject_reason`      TEXT          NULL     COMMENT '供应商拒单原因',
  `medical_summary`    MEDIUMTEXT    NULL     COMMENT 'Patient History 英文现病史',
  `lab_results`        MEDIUMTEXT    NULL     COMMENT 'Lab & Test Results 英文临床检查',
  `current_treatment`  MEDIUMTEXT    NULL     COMMENT 'Current Treatment 英文当前方案',
  `question1`          TEXT          NULL     COMMENT '咨询问题1(英文)',
  `question2`          TEXT          NULL     COMMENT '咨询问题2(英文)',
  `question3`          TEXT          NULL     COMMENT '咨询问题3(英文)',
  `doctor_answer1`     TEXT          NULL     COMMENT '医生解答1(英文,医生端填)',
  `doctor_answer2`     TEXT          NULL     COMMENT '医生解答2(英文,医生端填)',
  `doctor_answer3`     TEXT          NULL     COMMENT '医生解答3(英文,医生端填)',
  `translated_answer1` TEXT          NULL     COMMENT '中文翻译1(商家填)',
  `translated_answer2` TEXT          NULL     COMMENT '中文翻译2(商家填)',
  `translated_answer3` TEXT          NULL     COMMENT '中文翻译3(商家填)',
  `final_bilingual_report_url` VARCHAR(512) NULL COMMENT '最终双语报告附件路径(attachment.kind=final_report)',
  `assigned_doctor_id` BIGINT UNSIGNED NULL COMMENT '指派的具体医生 registration_doctor.id',
  `created_at`         DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间(毫秒精度)',
  PRIMARY KEY (`id`),
  KEY `idx_application_created_at` (`created_at`),
  KEY `idx_application_user` (`user_id`),
  KEY `idx_application_patient` (`patient_id`),
  CONSTRAINT `fk_application_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_application_patient` FOREIGN KEY (`patient_id`) REFERENCES `registration_patient` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='统一申请/咨询主表(国际二诊 + 服务/套餐咨询,按 need_type 区分)';

-- ---------------------------------------------------------------------
-- 2. attachment —— 二诊申请附件元数据
--    文件实体存磁盘(data/uploads/<appId>/) 或对象存储；本表仅存元数据。
--    与 application 为一对多，随申请级联删除(对应 Prisma onDelete: Cascade)。
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `attachment`;
CREATE TABLE `attachment` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键(自增)',
  `application_id`  BIGINT UNSIGNED NULL COMMENT '所属申请 id(二诊附件;证照附件为空)',
  `registration_type` VARCHAR(16)  NULL COMMENT '注册主体类型 provider|doctor(证照附件)',
  `registration_id`   BIGINT UNSIGNED NULL COMMENT '注册主体 id(registration_provider.id 或 registration_doctor.id)',
  `kind`              VARCHAR(16)   NOT NULL DEFAULT 'source' COMMENT '附件类型 source|final_report',
  `original_name`   VARCHAR(255)  NOT NULL COMMENT '原始文件名',
  `stored_path`     VARCHAR(512)  NOT NULL COMMENT '存储路径(本地路径或对象存储 key/URL)',
  `mime_type`       VARCHAR(128)  NOT NULL COMMENT 'MIME 类型(application/pdf、image/png|jpeg|webp|heic|heif)',
  `size`            INT           NOT NULL COMMENT '文件字节数(单文件上限 15MB)',
  `created_at`      DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_attachment_application_id` (`application_id`),
  KEY `idx_attachment_reg` (`registration_type`, `registration_id`),
  CONSTRAINT `fk_attachment_application`
    FOREIGN KEY (`application_id`) REFERENCES `application` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='附件(二诊申请附件 + 供应商/医生证照,仅元数据)';

-- ---------------------------------------------------------------------
-- 2b. application_event —— 申请流转历史事件
--    每次状态变更/分配/备注写一条；详情页按时间线展示。随申请级联删除。
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `application_event`;
CREATE TABLE `application_event` (
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

-- ---------------------------------------------------------------------
-- 4. admin —— 后台管理员
--    写入: prisma/seed.cjs(种子)   读取: 登录校验 lib/auth.ts
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `admin`;
CREATE TABLE `admin` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键(自增)',
  `username`      VARCHAR(64)   NOT NULL COMMENT '登录用户名(唯一)',
  `password_hash` VARCHAR(255)  NOT NULL COMMENT 'bcrypt 密码哈希(Python 端可用 bcrypt/passlib 校验)',
  `created_at`    DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_admin_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='后台管理员';

-- ---------------------------------------------------------------------
-- 4b. user —— 统一用户账号(手机号登录；密码只存这里)
--     role 由该 user 关联了哪些 registration_* 记录隐式决定(支持多角色)。
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键(自增)',
  `phone`         VARCHAR(64)  NOT NULL COMMENT '登录标识(手机号，唯一)',
  `password_hash` VARCHAR(255) NOT NULL COMMENT 'bcrypt 密码哈希',
  `status`        VARCHAR(16)  NOT NULL DEFAULT 'active' COMMENT '状态 active|disabled',
  `created_at`    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='统一用户账号(手机号登录)';


-- =====================================================================
--  二、注册相关表 (3 张) —— 需后端补齐接口
--
--  说明：前端三类注册页(客户/供应商/医生)当前仅将数据写入浏览器
--  localStorage，并未落库(见 components/forms/RegisterForm.tsx:
--  "// MVP: persist locally. TODO: replace with POST /api/register")。
--  三类角色的表单字段差异较大，故拆分为三张独立表，字段精确对应各注册页。
--  是否启用由后端团队决定。
-- =====================================================================

-- ---------------------------------------------------------------------
-- 5. registration_patient —— 客户注册
--    字段来源: app/[lang]/register/patient/page.tsx
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `registration_patient`;
CREATE TABLE `registration_patient` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键(自增)',
  `patient_no`   VARCHAR(32)  NULL     UNIQUE COMMENT '客户编号 PT+YYMMDD+NNN',
  `user_id`      BIGINT UNSIGNED NULL COMMENT '关联 user.id(账号)',
  `full_name`    VARCHAR(191) NOT NULL COMMENT '姓名(必填)',
  `email`        VARCHAR(191) NOT NULL COMMENT '邮箱(必填,校验格式)',
  `phone`        VARCHAR(64)  NOT NULL COMMENT '联系电话(必填)',
  `country`      VARCHAR(128) NULL     COMMENT '国家/地区(完整注册必填;快速注册可空)',
  `need_type`    VARCHAR(64)  NULL     COMMENT '需求类型(完整注册必填;快速注册可空)',
  `destination`  VARCHAR(191) NULL     COMMENT '期望目的地(可空)',
  `condition`    TEXT         NULL     COMMENT '病情简述(完整注册必填;快速注册可空)',
  `lang`         VARCHAR(8)   NOT NULL DEFAULT 'zh' COMMENT '提交语言 zh|en',
  `status`       VARCHAR(16)  NOT NULL DEFAULT 'new' COMMENT '处理状态 new|reviewed',
  `created_at`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_reg_patient_created_at` (`created_at`),
  KEY `idx_reg_patient_user` (`user_id`),
  CONSTRAINT `fk_reg_patient_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='客户注册(前端当前仅存 localStorage,需后端新增接口)';

-- ---------------------------------------------------------------------
-- 6. registration_provider —— 供应商/机构注册
--    字段来源: app/[lang]/register/provider/page.tsx
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `registration_provider`;
CREATE TABLE `registration_provider` (
  `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键(自增)',
  `user_id`        BIGINT UNSIGNED NULL COMMENT '关联 user.id(账号)',
  `org_name`       VARCHAR(191) NOT NULL COMMENT '机构名称(必填)',
  `org_type`       VARCHAR(32)  NOT NULL COMMENT '机构类型(必填,下拉:医院/诊所/中介机构/服务商)',
  `country`        VARCHAR(128) NOT NULL COMMENT '国家/地区(必填)',
  `contact_person` VARCHAR(191) NOT NULL COMMENT '联系人(必填)',
  `phone`          VARCHAR(64)  NOT NULL COMMENT '联系电话(必填)',
  `email`          VARCHAR(191) NOT NULL COMMENT '邮箱(必填,校验格式)',
  `license`        VARCHAR(255) NULL     COMMENT '资质/证照(可稍后上传,可空)',
  `cooperation`    TEXT         NOT NULL COMMENT '合作意向(必填)',
  `lang`           VARCHAR(8)   NOT NULL DEFAULT 'zh' COMMENT '提交语言 zh|en',
  `status`         VARCHAR(16)  NOT NULL DEFAULT 'new' COMMENT '审核状态 new|reviewed',
  `created_at`     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_reg_provider_created_at` (`created_at`),
  KEY `idx_reg_provider_user` (`user_id`),
  CONSTRAINT `fk_reg_provider_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='供应商/机构注册(前端当前仅存 localStorage,需后端新增接口)';

-- ---------------------------------------------------------------------
-- 7. registration_doctor —— 医生注册
--    字段来源: app/[lang]/register/doctor/page.tsx
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `registration_doctor`;
CREATE TABLE `registration_doctor` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键(自增)',
  `user_id`     BIGINT UNSIGNED NULL COMMENT '关联 user.id(账号)',
  `full_name`   VARCHAR(191) NOT NULL COMMENT '姓名(必填)',
  `specialty`   VARCHAR(128) NOT NULL COMMENT '专科(必填,如 肿瘤内科/骨科)',
  `hospital`    VARCHAR(191) NOT NULL COMMENT '执业医院(必填)',
  `country`     VARCHAR(128) NOT NULL COMMENT '国家/地区(必填)',
  `title`       VARCHAR(32)  NOT NULL COMMENT '职称(必填,下拉:主治医师/副主任医师/主任医师/教授)',
  `years`       VARCHAR(16)  NULL     COMMENT '执业年限(可空,前端为文本输入,如 10)',
  `languages`   VARCHAR(191) NOT NULL COMMENT '语言能力(必填,如 中文、英语)',
  `remote`      VARCHAR(16)  NOT NULL COMMENT '可提供远程二诊(必填,下拉:可以/不可以)',
  `email`       VARCHAR(191) NOT NULL COMMENT '邮箱(必填,校验格式)',
  `phone`       VARCHAR(64)  NOT NULL COMMENT '联系电话(必填)',
  `license`     VARCHAR(255) NULL     COMMENT '资质/证照(可空)',
  `lang`        VARCHAR(8)   NOT NULL DEFAULT 'zh' COMMENT '提交语言 zh|en',
  `status`      VARCHAR(16)  NOT NULL DEFAULT 'new' COMMENT '审核状态 new|reviewed',
  `created_at`  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_reg_doctor_created_at` (`created_at`),
  KEY `idx_reg_doctor_user` (`user_id`),
  CONSTRAINT `fk_reg_doctor_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='医生注册(前端当前仅存 localStorage,需后端新增接口)';

-- ---------------------------------------------------------------------
-- 8. communication_log —— 管理员与客户沟通历史
--    「后台发送邮件」自动写入 email 记录；电话/面谈等由管理员手动登记。
--    随申请级联删除。
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `communication_log`;
CREATE TABLE `communication_log` (
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

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
--  备注
--  1) 主键：各表 id 均为 BIGINT UNSIGNED AUTO_INCREMENT 自增主键；
--     attachment.application_id 亦为 BIGINT UNSIGNED，与 application.id 类型一致。
--  2) 状态/枚举：为与前端字符串比较逻辑一致，采用 VARCHAR 而非 MySQL ENUM；
--     如需数据库层强约束，可改为 ENUM(...)。
--  3) VARCHAR(191)：兼容 utf8mb4 下的索引长度上限，用于可能加索引的字段。
--  4) DATETIME(3)：对应 Prisma DateTime 毫秒精度；无需毫秒可用 DATETIME。
--  5) 附件/证照文件本身不入库，仅存路径/URL；迁移到对象存储时改写
--     stored_path / license 语义即可。
-- =====================================================================

