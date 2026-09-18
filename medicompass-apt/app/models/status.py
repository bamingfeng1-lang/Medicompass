"""Application (second-opinion) workflow status enumeration.

Ordered list of the stages a second-opinion application goes through. The
constant (code) is stored in `application.status`; display labels live in the
frontend i18n dictionaries (`applicationStatus`).
"""

APPLICATION_STATUSES: list[str] = [
    "PENDING_REVIEW",         # 待初审
    "PENDING_ASSIGN",         # 待指派
    "PENDING_SUPPLEMENT",     # 待补充资料(客户补传资料/修改信息)
    "PROVIDER_PROCESSING",    # 服务商处理中
    "PENDING_DOCTOR_ASSIGN",  # 待指派医生(供应商已提交结构化/问答)
    "DOCTOR_PROCESSING",      # 专家看诊中
    "PROVIDER_TRANSLATING",   # 报告翻译中
    "ADMIN_QC",               # 平台终审中
    "COMPLETED",              # 已交付
]

APPLICATION_STATUS_SET: set[str] = set(APPLICATION_STATUSES)

# Statuses in which the client may edit their application info / upload more
# attachments. The admin puts a case into PENDING_SUPPLEMENT when more info is
# needed; once the client submits, it returns to PENDING_REVIEW.
APPLICATION_CLIENT_EDITABLE: set[str] = {"PENDING_SUPPLEMENT"}

DEFAULT_APPLICATION_STATUS = "PENDING_REVIEW"


# Registration (provider/doctor) review status machine.
#   DRAFT -> PENDING_REVIEW -> APPROVED | REJECTED
# DRAFT and REJECTED are editable by the owner; the others are locked.
REGISTRATION_STATUSES: list[str] = [
    "DRAFT",
    "PENDING_REVIEW",
    "APPROVED",
    "REJECTED",
]

REGISTRATION_STATUS_SET: set[str] = set(REGISTRATION_STATUSES)

# Statuses in which the owner may edit their registration profile.
REGISTRATION_EDITABLE = {"DRAFT", "REJECTED"}

DEFAULT_REGISTRATION_STATUS = "DRAFT"
