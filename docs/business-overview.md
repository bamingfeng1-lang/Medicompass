# Medicompass 业务流程与角色功能总览

> 跨国远程二次诊疗意见(second-opinion)咨询服务平台。中国患者通过平台向海外医疗服务机构(provider)发起咨询申请,机构整理结构化病历后转交海外专家医生(doctor)出具诊疗意见,最终生成双语报告交付患者。平台管理员(admin)负责审核、指派与终审质检。

## 一、技术架构概览

| 层 | 技术栈 | 说明 |
|---|---|---|
| 前端 | Next.js 14 (App Router) + TailwindCSS | 支持中英双语(zh/en),路由组 `app/[lang]/...` |
| 后端 | FastAPI (Python) | 位于 `medicompass-api/`,签发 JWT 并校验所有业务接口 |
| 鉴权 | Cookie + JWT | 管理员页面级守卫用 `mc_admin_session` cookie,实际鉴权由后端完成 |

关键文件:
- 前端路由守卫:[middleware.ts](file:///d:/vscode/Medicompass/middleware.ts)
- 当前用户与角色定义:[lib/api.ts](file:///d:/vscode/Medicompass/lib/api.ts#L49-L79)
- 后端角色计算:[medicompass-api/app/deps.py](file:///d:/vscode/Medicompass/medicompass-api/app/deps.py#L36-L45)
- 申请状态机:[medicompass-api/app/models/status.py](file:///d:/vscode/Medicompass/medicompass-api/app/models/status.py)

## 二、角色体系

共 4 类角色。角色由后端 `deps.py` 根据用户关联的注册记录动态赋予。

| 角色(中) | 标识 | 来源 | 说明 |
|---|---|---|---|
| 患者 | `patient` | 关联 `registration_patient` | 申请发起方,可编辑状态仅限 `PENDING_SUPPLEMENT` |
| 服务机构 | `provider` | 关联 `registration_provider` | 接受/拒绝申请、结构化病历、上传报告、翻译 |
| 专家医生 | `doctor` | 关联 `registration_doctor` | 阅读结构化病历,提交 3 项诊疗意见 |
| 平台管理员 | `admin` | 独立 session(`/api/admin/login`) | 审核、指派、终审,后台独立鉴权 |

## 三、核心业务流程:二次诊疗申请状态机

### 3.1 状态枚举

```
PENDING_REVIEW         # 待初审(患者刚提交)
PENDING_ASSIGN         # 待指派
PENDING_SUPPLEMENT     # 待补充资料(客户补传资料/修改信息)
PROVIDER_PROCESSING    # 服务商处理中
PENDING_DOCTOR_ASSIGN  # 待指派医生(供应商已提交结构化/问答)
DOCTOR_PROCESSING      # 专家看诊中
PROVIDER_TRANSLATING   # 报告翻译中
ADMIN_QC               # 平台终审中
COMPLETED              # 已交付
```

### 3.2 状态流转图

```
PENDING_REVIEW
   │
   ├─ admin 审核不通过 → REJECTED
   ├─ admin 要求补料 → PENDING_SUPPLEMENT(患者可编辑/补传附件)
   │        └─ 患者重新提交 → 回 PENDING_REVIEW
   │
   └─ admin 指派 provider(自动从 PENDING_REVIEW → PENDING_ASSIGN)→ PROVIDER_PROCESSING
              │
              ├─ provider 拒绝 → 回退
              └─ provider 提交结构化病历(病情摘要/化验/治疗/3 问) → PENDING_DOCTOR_ASSIGN
                          │
                          └─ admin 指派 doctor → DOCTOR_PROCESSING
                                     │
                                     └─ doctor 提交 3 项诊疗意见 → PROVIDER_TRANSLATING
                                                │
                                                └─ provider 上传最终双语 PDF 报告 + 翻译答案 → ADMIN_QC
                                                           │
                                                           ├─ admin 通过 → COMPLETED(已交付,患者可下载)
                                                           └─ admin 驳回 → 回 PROVIDER_TRANSLATING
```

### 3.3 机构/医生入驻注册状态机(独立)

```
DRAFT → PENDING_REVIEW → APPROVED | REJECTED
```

- `DRAFT`、`REJECTED` 状态下,注册人可编辑资料;
- 其余状态锁定,等待管理员审核。

### 3.4 客户可编辑状态集合

```
APPLICATION_CLIENT_EDITABLE = {"PENDING_SUPPLEMENT"}
REGISTRATION_EDITABLE = {"DRAFT", "REJECTED"}
```

指派/状态推进逻辑见 [admin.py#L445-L561](file:///d:/vscode/Medicompass/medicompass-api/app/api/routes/admin.py#L445-L561)。

## 四、各角色功能模块清单

### 4.1 患者(patient)

路由组:`app/[lang]/account/`

| 模块 | 路径 | 主要操作 |
|---|---|---|
| 我的申请 | `/account/applications` | 创建咨询申请、上传病历附件、查看进度、在 `PENDING_SUPPLEMENT` 时补料、下载最终双语报告 |
| 个人资料 | `/account/profile` | 维护患者档案(走 patient profile API) |

### 4.2 服务机构(provider)

路由组:`app/[lang]/account/`(侧边栏显示"我的任务")

| 模块 | 路径/组件 | 主要操作 |
|---|---|---|
| 我的任务 | `/account/assigned` | 查看指派给自己的申请 |
| 机构工作台 | [ProviderWorkbench.tsx](file:///d:/vscode/Medicompass/components/ProviderWorkbench.tsx) | 接受/拒绝申请、填写结构化病历(病情摘要、化验结果、当前治疗、3 个咨询问题)、上传最终 PDF 报告(≤50MB)、翻译医生解答为中文 |
| 个人资料 | `/account/profile` | 机构档案(走 provider profile API) |
| 注册入驻 | `/api/register` | 提交机构注册申请(DRAFT / PENDING_REVIEW / APPROVED / REJECTED) |

### 4.3 专家医生(doctor)

路由组:`app/[lang]/account/`(侧边栏显示"我的任务")

| 模块 | 路径/组件 | 主要操作 |
|---|---|---|
| 我的任务 | `/account/assigned` | 查看指派给自己的申请 |
| 医生工作台 | [DoctorWorkbench.tsx](file:///d:/vscode/Medicompass/components/DoctorWorkbench.tsx) | 在 `DOCTOR_PROCESSING` 状态下阅读只读的结构化病历、填写 3 项英文诊疗意见并提交、下载病历附件包 |
| 个人资料 | `/account/profile` | 医生档案(走 doctor profile API) |
| 注册入驻 | `/api/register` | 提交医生注册申请 |

### 4.4 平台管理员(admin)

路由组:`app/[lang]/admin/`(受 [middleware.ts](file:///d:/vscode/Medicompass/middleware.ts) 路由守卫保护)

| 模块 | 路径 | 主要操作 |
|---|---|---|
| 登录 | `/admin/login` | 用户名密码登录,后端签发 session token |
| 申请管理 | `/admin/applications` | 初审、驳回、要求补料、指派 provider/doctor、终审质检(通过 → COMPLETED / 驳回 → 回退翻译)、查看事件流转日志 |
| 询价管理 | `/admin/inquiries` | 处理用户咨询/询价 |
| 注册审核 | `/admin/registrations` | 审核机构/医生入驻申请(DRAFT/PENDING_REVIEW → APPROVED/REJECTED) |

## 五、后端 API 路由分组

位于 `medicompass-api/app/api/routes/`:

| 文件 | 职责 |
|---|---|
| [auth.py](file:///d:/vscode/Medicompass/medicompass-api/app/api/routes/auth.py) | 患者/provider/doctor 登录注册、`/api/auth/me`、客户补料 |
| [applications.py](file:///d:/vscode/Medicompass/medicompass-api/app/api/routes/applications.py) | 申请 CRUD、状态查询、附件 |
| [register.py](file:///d:/vscode/Medicompass/medicompass-api/app/api/routes/register.py) | 机构/医生入驻注册 |
| [inquiries.py](file:///d:/vscode/Medicompass/medicompass-api/app/api/routes/inquiries.py) | 前台询价/咨询提交 |
| [admin.py](file:///d:/vscode/Medicompass/medicompass-api/app/api/routes/admin.py) | 管理员登录、指派、终审、注册审核等全部后台操作 |

## 六、业务流程一句话概括

患者提交申请 → 管理员初审并指派给机构 → 机构整理结构化病历 → 管理员指派医生 → 医生出具 3 项意见 → 机构上传双语报告 → 管理员终审 → 患者下载。四类角色通过同一套状态机驱动协作,机构与医生在 `/account/assigned` 接收任务,管理员在 `/admin` 独立后台完成审核、指派与质检。
