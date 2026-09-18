// Health-management service catalog. Each service renders its own detail page
// at /[lang]/services/[slug] with an inquiry form, except entries with an
// `external` link (国际二诊 reuses the dedicated /second-opinion page).
//
// Source of truth for the "健康管理服务" section. Bilingual content lives here so
// the strongly-typed dictionaries stay focused on UI chrome.

export type ServiceCategory = "basic" | "critical" | "wellness" | "private-doctor" | "basic-medical" | "cross-border" | "longevity";

export type ServiceCopy = {
  name: string;
  tagline: string; // short one-liner shown under the title
  summary: string; // card description on the hub page
  overview: string; // opening paragraph on the detail page
  highlights: string[]; // what the service includes
  audience: string[]; // who it is for
};

export type Service = {
  slug: string;
  category: ServiceCategory;
  icon: string; // lucide-react icon name (mapped in the page)
  external?: string; // if set, the hub card links here instead of a detail page
  zh: ServiceCopy;
  en: ServiceCopy;
};

export const SERVICE_CATEGORIES: {
  key: ServiceCategory;
  zh: string;
  en: string;
  zhDesc: string;
  enDesc: string;
}[] = [
  {
    key: "basic",
    zh: "基础医疗保障",
    en: "Everyday Medical Care",
    zhDesc: "从线上问诊到住院陪护，覆盖日常就医的每一个环节。",
    enDesc: "From online consultation to inpatient care — coverage for every step of everyday care.",
  },
  {
    key: "critical",
    zh: "重症与全球资源",
    en: "Critical Care & Global Resources",
    zhDesc: "面对重大疾病，链接全球顶尖专家、医院与用药资源。",
    enDesc: "For major illness — access world-class specialists, hospitals and medication.",
  },
  {
    key: "wellness",
    zh: "健康管理与抗衰",
    en: "Health Management & Longevity",
    zhDesc: "从私人医生到功能医学与抗衰方案，主动管理长期健康。",
    enDesc: "From a private doctor to functional medicine and longevity plans.",
  },
  {
    key: "private-doctor",
    zh: "私人医生",
    en: "Private Doctor",
    zhDesc: "为您和家人提供专属的私人医生服务，从健康档案建立到日常咨询、多学科会诊。",
    enDesc: "Dedicated private doctor services for you and your family — from health records to daily consultations and multidisciplinary care.",
  },
  {
    key: "basic-medical",
    zh: "基础医疗",
    en: "Basic Medical",
    zhDesc: "提供从预约就诊到住院陪护的全流程基础医疗服务，让您的就医体验更加便捷、舒适。",
    enDesc: "End-to-end basic medical services from appointment to inpatient care — making healthcare access seamless and comfortable.",
  },
  {
    key: "cross-border",
    zh: "跨境国际医疗",
    en: "Cross-border Medical",
    zhDesc: "链接全球顶尖医疗资源，为您提供跨境就医、国际二诊、全球找药等一站式国际医疗服务。",
    enDesc: "Connecting you to world-class medical resources — one-stop international healthcare including cross-border treatment, second opinions, and global medication access.",
  },
  {
    key: "longevity",
    zh: "长寿医学",
    en: "Longevity Medical",
    zhDesc: "融合前沿长寿医学科技，从精准检测、细胞 rejuvenation 到个性化健康管理，助您延缓衰老、提升生命质量。",
    enDesc: "Integrating cutting-edge longevity science — from precision testing and cellular rejuvenation to personalized health management.",
  },
];

export const SERVICES: Service[] = [
  // ── 一、基础医疗保障 ──────────────────────────────────────────────
  {
    slug: "text-consultation",
    category: "basic",
    icon: "MessageSquare",
    zh: {
      name: "图文问诊",
      tagline: "随时随地，文字与图片在线问医生",
      summary: "通过文字与图片描述病情，权威医生在线解答，快速获得专业建议。",
      overview:
        "图文问诊让您无需奔波，通过文字和图片（如检查单、患处照片、用药清单）向医生描述病情，由平台匹配的执业医生在线给出专业解读与就医建议。适合病情咨询、报告解读、用药指导等非紧急场景。",
      highlights: [
        "上传检查报告、患处照片、用药记录，医生结合材料解答",
        "覆盖内科、外科、儿科、皮肤科等常见科室",
        "沟通记录可保存回看，便于后续就诊参考",
        "必要时协助升级为视频问诊或线下就医安排",
      ],
      audience: [
        "有轻症或慢性病咨询、复诊续方需求的人群",
        "拿到检查报告后希望有医生解读的人群",
        "希望在决定线下就医前先获得专业初步判断",
      ],
    },
    en: {
      name: "Text Consultation",
      tagline: "Message a doctor with text and images, anytime",
      summary: "Describe your condition with text and images and get professional advice from qualified doctors online.",
      overview:
        "Text consultation lets you reach a doctor without traveling. Share your symptoms with text and images — lab reports, photos, medication lists — and a matched licensed physician provides an expert interpretation and guidance. Ideal for non-urgent questions, report interpretation and medication advice.",
      highlights: [
        "Upload reports, photos and medication records for a grounded answer",
        "Covers internal medicine, surgery, pediatrics, dermatology and more",
        "Conversation history is saved for later reference",
        "Escalation to video consultation or in-person care when needed",
      ],
      audience: [
        "People with minor or chronic conditions, or follow-up and refill needs",
        "Anyone wanting a doctor to interpret their test reports",
        "Those seeking an initial opinion before booking in-person care",
      ],
    },
  },
  {
    slug: "video-consultation",
    category: "basic",
    icon: "Video",
    zh: {
      name: "视频问诊",
      tagline: "面对面视频，与医生实时沟通",
      summary: "预约视频连线权威医生，实时问诊沟通，如同面诊般深入。",
      overview:
        "视频问诊支持与医生实时视频连线，医生可通过观察、问询更全面地了解病情，给出更贴近面诊的诊疗建议。适合需要更深入沟通、直观查看或涉及多问题的复杂咨询。",
      highlights: [
        "预约制视频连线，一对一充分沟通",
        "可提前上传病历资料，医生问诊更有针对性",
        "支持中英双语医生与医学翻译陪同",
        "问诊后可获得建议小结，衔接后续检查或治疗",
      ],
      audience: [
        "希望与医生深入沟通、当面确认方案的人群",
        "涉及多个症状或需要医生直观观察的情况",
        "跨境或异地，无法到场却需要专业面诊的人群",
      ],
    },
    en: {
      name: "Video Consultation",
      tagline: "Face-to-face video time with your doctor",
      summary: "Book a live video call with a qualified doctor for an in-depth, face-to-face style consultation.",
      overview:
        "Video consultation connects you with a doctor over live video, allowing closer observation and dialogue for advice that comes near an in-person visit. Best for deeper conversations, visual assessment or complex questions.",
      highlights: [
        "Scheduled one-on-one video call with ample time",
        "Upload records beforehand for a focused consultation",
        "Bilingual doctors and medical interpreters available",
        "A written summary afterwards links to next steps",
      ],
      audience: [
        "People wanting an in-depth talk and plan confirmation",
        "Cases with multiple symptoms or a need for visual assessment",
        "Cross-border patients who cannot attend in person",
      ],
    },
  },
  {
    slug: "critical-illness-fast-track",
    category: "basic",
    icon: "Zap",
    zh: {
      name: "重疾绿通",
      tagline: "重大疾病，快速对接权威专家与床位",
      summary: "为重大疾病患者开通就医绿色通道，加速专家门诊、检查与住院安排。",
      overview:
        "重疾绿色通道（绿通）面向确诊或疑似重大疾病的患者，依托合作医院与专家资源，协助快速预约知名专家门诊、加急检查与住院床位，缩短从确诊到治疗的等待时间。",
      highlights: [
        "优先预约三甲医院及知名专家门诊",
        "协助加急安排关键检查（影像、病理等）",
        "协调住院床位与手术排期",
        "全程专属顾问跟进，减少反复奔波",
      ],
      audience: [
        "确诊或高度怀疑肿瘤等重大疾病、需尽快就医的人群",
        "自行挂号难以约到专家、等待时间长的患者",
        "希望有人协调检查与住院流程的家庭",
      ],
    },
    en: {
      name: "Critical Illness Fast Track",
      tagline: "Fast access to top specialists and beds for serious illness",
      summary: "A green channel for serious illness — expedited specialist appointments, tests and admission.",
      overview:
        "The critical-illness fast track serves patients with a confirmed or suspected major diagnosis. Through partner hospitals and specialists, we help secure priority specialist appointments, urgent tests and inpatient beds, shortening the wait from diagnosis to treatment.",
      highlights: [
        "Priority appointments with top hospitals and renowned specialists",
        "Expedited scheduling of key tests (imaging, pathology, etc.)",
        "Coordination of hospital beds and surgery slots",
        "A dedicated coordinator follows the whole process",
      ],
      audience: [
        "Patients with a confirmed or suspected major illness needing prompt care",
        "Those unable to secure specialist appointments on their own",
        "Families wanting help coordinating tests and admission",
      ],
    },
  },
  {
    slug: "hospitalization",
    category: "basic",
    icon: "BedDouble",
    zh: {
      name: "住院安排",
      tagline: "从床位到手续，住院全流程协助",
      summary: "协助安排住院床位、办理入院手续，衔接主治团队，省心省时。",
      overview:
        "住院安排服务协助患者对接合适的医院与科室，落实床位、办理入院手续，并衔接主治医生团队。让患者与家属免于反复排队与流程奔波，安心入院治疗。",
      highlights: [
        "匹配合适医院与科室，落实住院床位",
        "协助办理入院、缴费、医保/商保对接等手续",
        "衔接主治团队，同步治疗计划与注意事项",
        "可搭配院内陪诊/陪护，住院期间全程照护",
      ],
      audience: [
        "需要住院治疗但不熟悉流程的患者与家属",
        "希望缩短入院等待、尽快开始治疗的人群",
        "异地或跨境就医、需要落地协助的患者",
      ],
    },
    en: {
      name: "Hospitalization Support",
      tagline: "From beds to paperwork — end-to-end admission help",
      summary: "Help securing hospital beds, completing admission paperwork and connecting with the treating team.",
      overview:
        "Hospitalization support matches you to the right hospital and department, secures a bed, handles admission paperwork and connects you with the treating team — sparing patients and families the queues and logistics of getting admitted.",
      highlights: [
        "Match to the right hospital and department, with a bed secured",
        "Assistance with admission, payment and insurance coordination",
        "Connection to the treating team and care plan briefing",
        "Optional in-hospital companion or care throughout the stay",
      ],
      audience: [
        "Patients and families unfamiliar with the admission process",
        "Those wanting to shorten the wait and start treatment sooner",
        "Out-of-town or cross-border patients needing on-the-ground help",
      ],
    },
  },
  {
    slug: "in-hospital-companion",
    category: "basic",
    icon: "UserPlus",
    zh: {
      name: "院内陪诊",
      tagline: "专人陪同就诊，看病不再手忙脚乱",
      summary: "专业陪诊员全程陪同挂号、就诊、检查与取药，省心又安心。",
      overview:
        "院内陪诊由专业陪诊员全程陪同患者完成挂号、候诊、就诊、检查、缴费、取药等环节，协助与医生沟通、记录医嘱，尤其适合老人、异地就医或独自就诊者。",
      highlights: [
        "全程陪同挂号、就诊、检查、缴费、取药",
        "协助与医生沟通、记录并解释医嘱",
        "熟悉院内流程与布局，减少排队与走冤枉路",
        "就诊结束提供就医小结，便于家属了解",
      ],
      audience: [
        "独自就医、行动不便或年长的患者",
        "异地就医、不熟悉医院流程的人群",
        "子女无法陪同、需要专人照护的老人",
      ],
    },
    en: {
      name: "In-Hospital Companion",
      tagline: "A dedicated escort through every clinic step",
      summary: "A professional companion accompanies you through registration, visits, tests and pharmacy.",
      overview:
        "An in-hospital companion guides the patient through registration, waiting, the consultation, tests, payment and pharmacy, helping communicate with doctors and record instructions — especially valuable for elderly, out-of-town or solo patients.",
      highlights: [
        "Full escort through registration, visits, tests, payment and pharmacy",
        "Help communicating with doctors and recording instructions",
        "Familiarity with hospital flow to cut queues and detours",
        "A visit summary afterwards to keep family informed",
      ],
      audience: [
        "Patients attending alone, with limited mobility, or elderly",
        "Out-of-town patients unfamiliar with the hospital",
        "Elderly whose children cannot accompany them",
      ],
    },
  },
  {
    slug: "in-hospital-care",
    category: "basic",
    icon: "HeartHandshake",
    zh: {
      name: "院内陪护",
      tagline: "住院期间，专业护工贴心照护",
      summary: "为住院患者提供专业护工陪护，日常生活照料与病情观察一手包办。",
      overview:
        "院内陪护为住院患者配备专业护工，负责日常生活照料（饮食、翻身、清洁等）、协助康复活动与基础病情观察，减轻家属负担，让患者在住院期间得到持续、专业的照护。",
      highlights: [
        "经培训护工提供 24 小时或日间陪护",
        "协助进食、翻身、清洁、如厕等日常照料",
        "观察基础生命体征，异常及时通知医护",
        "配合护士完成康复与护理配合工作",
      ],
      audience: [
        "术后或重症住院、需要专人照料的患者",
        "家属无法长时间陪护的家庭",
        "行动不便、需协助日常起居的老人",
      ],
    },
    en: {
      name: "In-Hospital Care",
      tagline: "Professional caregivers by the bedside",
      summary: "Trained caregivers provide daily-living care and basic monitoring for inpatients.",
      overview:
        "In-hospital care assigns a trained caregiver to an inpatient for daily-living support (feeding, repositioning, hygiene), rehabilitation assistance and basic monitoring — easing the family's burden and ensuring continuous, professional care during the stay.",
      highlights: [
        "Trained caregivers for 24-hour or daytime coverage",
        "Help with feeding, repositioning, hygiene and toileting",
        "Monitoring of basic vitals with prompt escalation",
        "Support to nurses with rehabilitation and nursing tasks",
      ],
      audience: [
        "Post-surgical or seriously ill inpatients needing dedicated care",
        "Families unable to provide long hours of bedside care",
        "Elderly needing help with daily activities",
      ],
    },
  },
  {
    slug: "home-care",
    category: "basic",
    icon: "Home",
    zh: {
      name: "院外护理",
      tagline: "把专业护理，带回家中",
      summary: "出院后在家享受专业上门护理，衔接康复、换药、护理等居家医疗需求。",
      overview:
        "院外护理为出院或居家患者提供上门护理服务，包括伤口换药、导管护理、康复指导、生命体征监测等，让患者在熟悉的家中获得专业、连续的医疗照护，平稳过渡康复期。",
      highlights: [
        "专业护士上门，提供换药、导管、注射等护理",
        "术后与慢病居家康复指导与随访",
        "生命体征监测与用药管理提醒",
        "与主治团队保持信息衔接，异常及时反馈",
      ],
      audience: [
        "出院后仍需专业护理与康复的患者",
        "长期卧床、慢病居家管理的人群",
        "希望在家康复、减少往返医院的家庭",
      ],
    },
    en: {
      name: "Home Care",
      tagline: "Professional nursing, brought to your home",
      summary: "Professional in-home nursing after discharge — wound care, rehab guidance and monitoring.",
      overview:
        "Home care brings professional nursing to discharged or homebound patients — wound and catheter care, rehabilitation guidance, vitals monitoring and more — so patients recover in familiar surroundings with continuous, professional support.",
      highlights: [
        "Nurses visit for wound care, catheters, injections and more",
        "Post-op and chronic-disease home rehabilitation and follow-up",
        "Vitals monitoring and medication reminders",
        "Ongoing coordination with the treating team",
      ],
      audience: [
        "Patients needing professional care and rehab after discharge",
        "Long-term bedridden or chronic-disease home management",
        "Families preferring recovery at home with fewer hospital trips",
      ],
    },
  },
  {
    slug: "branded-drug-discount",
    category: "basic",
    icon: "BadgePercent",
    zh: {
      name: "原研药折扣",
      tagline: "正品原研药，更优价格",
      summary: "协助获取正品原研药，享受合作渠道优惠价格与合规购药支持。",
      overview:
        "原研药折扣服务依托合作药企与正规渠道，协助患者以更优价格获取正品原研药（含部分进口药），并提供用药合规、真伪保障与配送支持，减轻长期用药的经济负担。",
      highlights: [
        "对接正规渠道，保障原研药正品与合规",
        "合作渠道优惠价格，降低长期用药成本",
        "协助处方对接与购药流程",
        "配送到家，用药疑问可咨询药师/医生",
      ],
      audience: [
        "需长期使用原研药或进口药的慢病、肿瘤患者",
        "希望降低正品药物购买成本的人群",
        "对购药渠道正规性与真伪有顾虑的患者",
      ],
    },
    en: {
      name: "Branded Drug Discount",
      tagline: "Genuine originator drugs at better prices",
      summary: "Help sourcing genuine originator medicines through partner channels at preferential prices.",
      overview:
        "The branded-drug service works with pharmaceutical partners and legitimate channels to help patients obtain genuine originator medicines (including some imported drugs) at better prices, with compliance, authenticity assurance and delivery support to ease the burden of long-term medication.",
      highlights: [
        "Legitimate channels ensuring genuine, compliant originator drugs",
        "Preferential partner pricing to lower long-term costs",
        "Help with prescription coordination and purchase",
        "Home delivery with pharmacist/doctor support for questions",
      ],
      audience: [
        "Chronic or cancer patients on long-term originator or imported drugs",
        "Anyone wanting to lower the cost of genuine medicines",
        "Patients concerned about channel legitimacy and authenticity",
      ],
    },
  },

  // ── 二、重症与全球资源 ────────────────────────────────────────────
  {
    slug: "mdt",
    category: "critical",
    icon: "Users",
    zh: {
      name: "MDT 会诊",
      tagline: "多学科专家，同桌为您定方案",
      summary: "组织多学科专家团队联合会诊，为复杂病例制定协同、最优的诊疗方案。",
      overview:
        "MDT（多学科团队）会诊组织来自不同科室的专家（如外科、肿瘤内科、放疗、影像、病理等）就同一病例联合讨论，综合各方意见形成协同、系统的诊疗方案，尤其适合诊断复杂、涉及多学科的重大疾病。",
      highlights: [
        "跨科室专家联合讨论，避免单一视角局限",
        "综合影像、病理、临床信息形成系统方案",
        "输出明确的诊疗建议与优先级",
        "可衔接国际二诊、海外就医等后续服务",
      ],
      audience: [
        "诊断复杂、涉及多个学科的重大疾病患者",
        "不同医生意见不一、需要综合决策的患者",
        "希望在治疗前获得系统、协同方案的家庭",
      ],
    },
    en: {
      name: "MDT Consultation",
      tagline: "Multiple specialists, one coordinated plan",
      summary: "A multidisciplinary team reviews complex cases together for a coordinated, optimal plan.",
      overview:
        "An MDT (multidisciplinary team) consultation brings specialists from different departments — surgery, oncology, radiotherapy, radiology, pathology and more — to discuss one case together and form a coordinated, systematic plan. Especially valuable for complex, multi-specialty major illness.",
      highlights: [
        "Cross-department specialists discuss together, avoiding blind spots",
        "Imaging, pathology and clinical data synthesized into one plan",
        "Clear recommendations with priorities",
        "Links to international second opinion and overseas care",
      ],
      audience: [
        "Patients with complex, multi-specialty major illness",
        "Patients facing conflicting opinions who need a unified decision",
        "Families wanting a systematic, coordinated plan before treatment",
      ],
    },
  },
  {
    slug: "international-second-opinion",
    category: "critical",
    icon: "Stethoscope",
    external: "/second-opinion",
    zh: {
      name: "国际二诊",
      tagline: "全球权威专家的独立第二诊疗意见",
      summary: "整合全球权威专家资源，对诊断与治疗方案给出独立评估，交付中英双语报告。",
      overview:
        "国际二诊由海外权威医院与专家，对您现有的诊断与治疗方案进行独立评估与建议，帮助确认诊断、优化方案、避免不必要的治疗，并交付中英双语专业报告。",
      highlights: [
        "全球权威专家的独立第二诊疗意见",
        "专业医学翻译，交付中英双语报告",
        "标准化流程，全程时效透明",
        "支持在线上传病历资料，AI 辅助归纳",
      ],
      audience: [
        "被诊断为肿瘤、罕见病或重大疾病，希望确认诊断",
        "面临重大治疗决策，希望获得独立意见",
        "计划赴海外就医，需要权威专家评估可行性",
      ],
    },
    en: {
      name: "International Second Opinion",
      tagline: "Independent second opinions from world-class specialists",
      summary: "Independent assessment of your diagnosis and plan from global specialists, delivered as a bilingual report.",
      overview:
        "An international second opinion has renowned overseas hospitals and specialists independently review your diagnosis and treatment plan — helping confirm the diagnosis, refine the plan and avoid unnecessary treatment — delivered as a professional bilingual report.",
      highlights: [
        "Independent second opinions from world-class specialists",
        "Professional medical translation and a bilingual report",
        "A standardized process with transparent timelines",
        "Online record upload with AI-assisted summarization",
      ],
      audience: [
        "Those diagnosed with cancer, rare or major disease seeking confirmation",
        "Patients facing major treatment decisions who want an independent view",
        "Those planning overseas care needing a feasibility assessment",
      ],
    },
  },
  {
    slug: "overseas-treatment",
    category: "critical",
    icon: "Plane",
    zh: {
      name: "海外就医安排",
      tagline: "赴海外就医，全程一站式安排",
      summary: "从医院专家匹配到签证行程、翻译支付，海外就医全流程一站式安排。",
      overview:
        "海外就医安排为需要赴海外治疗的患者提供一站式服务：AI 匹配合适的海外医院与专家、协助病历翻译与预约、办理签证与行程、安排医学翻译与支付协助，并提供全程双语陪伴，让跨境就医安心顺畅。",
      highlights: [
        "AI 匹配海外医院与专家，预约就诊",
        "病历翻译、签证与行程规划一站搞定",
        "医学翻译陪同与费用支付协助",
        "全程双语顾问陪伴，衔接回国随访",
      ],
      audience: [
        "希望赴海外获得更优治疗资源的重症患者",
        "需要跨境就医但缺乏渠道与经验的家庭",
        "追求前沿疗法、临床试验机会的患者",
      ],
    },
    en: {
      name: "Overseas Treatment",
      tagline: "End-to-end arrangements for care abroad",
      summary: "One-stop overseas care — specialist matching, visas, travel, translation and payment support.",
      overview:
        "Overseas treatment arrangement is a one-stop service for patients seeking care abroad: AI-matched hospitals and specialists, record translation and appointments, visa and travel logistics, medical interpreters, payment assistance and bilingual companionship throughout — making cross-border care smooth and reassuring.",
      highlights: [
        "AI-matched overseas hospitals and specialists, with appointments",
        "Record translation, visa and travel planning in one place",
        "Medical interpreter escort and payment assistance",
        "Bilingual coordinator throughout, into home-country follow-up",
      ],
      audience: [
        "Seriously ill patients seeking better treatment resources abroad",
        "Families needing cross-border care but lacking channels",
        "Patients pursuing cutting-edge therapies or clinical trials",
      ],
    },
  },
  {
    slug: "global-direct-billing",
    category: "critical",
    icon: "CreditCard",
    zh: {
      name: "全球直付",
      tagline: "就医费用，保险直付更省心",
      summary: "对接保险与合作医院，实现就医费用直接结算，减少垫付与理赔烦恼。",
      overview:
        "全球直付服务对接商业保险与合作医疗机构，协助实现就医费用的直接结算（Direct Billing），让患者在符合条件的情况下免于大额垫付、简化理赔流程，安心专注于治疗本身。",
      highlights: [
        "对接保险公司与合作医院，实现费用直付",
        "减少患者大额垫付与繁琐理赔",
        "协助核对保障范围与理赔材料",
        "费用结算全程透明可追溯",
      ],
      audience: [
        "持有商业医疗/高端医疗保险的就医人群",
        "希望避免大额垫付、简化理赔的患者",
        "跨境就医、需要费用结算协助的家庭",
      ],
    },
    en: {
      name: "Global Direct Billing",
      tagline: "Insurance direct billing, less out of pocket",
      summary: "Direct settlement between insurers and partner hospitals — less upfront payment and claims hassle.",
      overview:
        "Global direct billing connects private insurance with partner hospitals to enable direct settlement of medical costs — sparing eligible patients large upfront payments and simplifying claims, so they can focus on treatment.",
      highlights: [
        "Direct billing between insurers and partner hospitals",
        "Less upfront payment and less claims paperwork",
        "Help verifying coverage and claim documents",
        "Transparent, traceable settlement",
      ],
      audience: [
        "Patients with private or premium medical insurance",
        "Those wanting to avoid large upfront payments",
        "Cross-border patients needing settlement assistance",
      ],
    },
  },
  {
    slug: "overseas-drug-sourcing",
    category: "critical",
    icon: "Search",
    zh: {
      name: "海外找药",
      tagline: "国内买不到的药，帮您全球寻源",
      summary: "为国内尚未上市或难以获取的药物提供全球寻源与合规获取支持。",
      overview:
        "海外找药服务面向国内尚未上市、断供或难以获取的药物，协助在全球范围内寻源，并提供合规获取路径、真伪保障与用药指导，帮助患者及时用上所需药物。",
      highlights: [
        "全球寻源国内未上市 / 断供 / 稀缺药物",
        "提供合规获取路径与真伪保障",
        "协助处方、用药方案与剂量指导",
        "衔接医生随访，跟踪用药反应",
      ],
      audience: [
        "需要国内尚未上市或断供药物的患者",
        "使用罕见病、肿瘤等特殊药物的人群",
        "希望有合规渠道与专业指导购药的家庭",
      ],
    },
    en: {
      name: "Overseas Drug Sourcing",
      tagline: "Global sourcing for drugs you can't find at home",
      summary: "Global sourcing and compliant access for medicines unavailable or hard to obtain locally.",
      overview:
        "Overseas drug sourcing helps patients find medicines that are not yet approved, out of stock or hard to obtain locally — providing compliant access routes, authenticity assurance and usage guidance so patients get what they need in time.",
      highlights: [
        "Global sourcing of unapproved, out-of-stock or scarce drugs",
        "Compliant access routes with authenticity assurance",
        "Help with prescriptions, regimens and dosing guidance",
        "Doctor follow-up to track response",
      ],
      audience: [
        "Patients needing drugs not yet approved or out of stock locally",
        "Those on rare-disease or oncology specialty medicines",
        "Families wanting compliant channels and professional guidance",
      ],
    },
  },

  // ── 三、健康管理与抗衰 ────────────────────────────────────────────
  {
    slug: "private-doctor",
    category: "wellness",
    icon: "UserRound",
    zh: {
      name: "私人医生",
      tagline: "您的专属健康管家，随时在线",
      summary: "配备专属私人医生，提供长期、连续、个性化的健康咨询与就医协调。",
      overview:
        "私人医生服务为您与家庭配备专属医生，长期了解您的健康状况，提供日常健康咨询、慢病管理、就医指导与转诊协调，成为您可信赖、随时可及的健康管家。",
      highlights: [
        "专属私人医生，长期跟踪您的健康档案",
        "日常健康咨询与慢病管理随访",
        "就医指导、专家转诊与资源协调",
        "家庭成员健康统筹与提醒",
      ],
      audience: [
        "希望有长期专属医生随时咨询的个人与家庭",
        "有慢病管理、健康统筹需求的人群",
        "重视健康、追求高品质医疗服务的人士",
      ],
    },
    en: {
      name: "Private Doctor",
      tagline: "Your dedicated health steward, always on call",
      summary: "A dedicated private doctor for long-term, continuous, personalized health guidance and coordination.",
      overview:
        "The private doctor service pairs you and your family with a dedicated physician who knows your health over time — offering everyday health advice, chronic-disease management, care guidance and referral coordination as a trusted, always-reachable health steward.",
      highlights: [
        "A dedicated doctor tracking your health record over time",
        "Everyday health advice and chronic-disease follow-up",
        "Care guidance, specialist referrals and resource coordination",
        "Whole-family health oversight and reminders",
      ],
      audience: [
        "Individuals and families wanting an always-available doctor",
        "People with chronic-disease or health-management needs",
        "Those valuing health and premium medical service",
      ],
    },
  },
  {
    slug: "health-checkup",
    category: "wellness",
    icon: "ClipboardList",
    zh: {
      name: "体检方案定制及报告解读",
      tagline: "量身定制体检，读懂每一项指标",
      summary: "根据个人情况定制体检方案，并由医生专业解读报告，给出健康建议。",
      overview:
        "体检方案定制服务结合您的年龄、家族史、生活方式与健康关注点，量身设计精准的体检项目，避免漏检与过度检查；体检后由医生逐项解读报告，指出重点关注与后续建议，让体检真正转化为健康行动。",
      highlights: [
        "结合个人风险因素定制精准体检项目",
        "对接优质体检机构与高端影像设备",
        "医生逐项解读报告，标注重点与异常",
        "给出随访、复查与健康管理建议",
      ],
      audience: [
        "希望做一次真正有针对性体检的人群",
        "拿到体检报告却看不懂、不知如何行动的人",
        "有家族史或特定健康顾虑、需要精准筛查的人",
      ],
    },
    en: {
      name: "Health Checkup & Report Reading",
      tagline: "A tailored checkup, every result explained",
      summary: "A checkup plan tailored to you, with a doctor interpreting the report and advising next steps.",
      overview:
        "The custom checkup service designs the right screening based on your age, family history, lifestyle and concerns — avoiding both missed and excessive tests. Afterwards a doctor interprets the report item by item, flagging what matters and what to do next, turning a checkup into real health action.",
      highlights: [
        "Precise checkup items tailored to your risk factors",
        "Access to quality centers and advanced imaging",
        "Doctor's item-by-item interpretation, flagging abnormals",
        "Follow-up, re-check and health-management advice",
      ],
      audience: [
        "People wanting a genuinely targeted checkup",
        "Those with a report they can't interpret or act on",
        "People with family history or concerns needing precise screening",
      ],
    },
  },
  {
    slug: "overseas-domestic-landing",
    category: "wellness",
    icon: "PlaneLanding",
    external: "/overseas-domestic",
    zh: {
      name: "海外诊疗国内落地",
      tagline: "海外方案，回国也能延续执行",
      summary: "将海外专家的诊疗方案在国内落地执行，衔接本地医院、用药与随访。",
      overview:
        "海外诊疗国内落地服务帮助已获得海外诊断或治疗方案的患者，在国内延续执行：协助对接本地医院与医生、翻译并解读方案、安排相应检查、用药与康复随访，让海外方案在国内平稳、连续地落地。",
      highlights: [
        "翻译并解读海外方案，转化为可执行的本地路径",
        "对接国内合适医院与医生延续治疗",
        "协助安排检查、用药与康复随访",
        "海外与国内团队信息衔接，保障连续性",
      ],
      audience: [
        "已在海外就诊、需回国延续治疗的患者",
        "持有海外方案但不知如何在国内执行的人",
        "希望减少海外往返、就近随访的家庭",
      ],
    },
    en: {
      name: "Overseas Care, Domestic Follow-through",
      tagline: "Carry an overseas plan through back home",
      summary: "Execute an overseas treatment plan at home — local hospitals, medication and follow-up.",
      overview:
        "This service helps patients who have an overseas diagnosis or plan carry it through domestically: connecting with local hospitals and doctors, translating and interpreting the plan, arranging tests, medication and rehabilitation follow-up — so the overseas plan continues smoothly at home.",
      highlights: [
        "Translate and interpret the overseas plan into a local pathway",
        "Connect with suitable domestic hospitals and doctors",
        "Arrange tests, medication and rehabilitation follow-up",
        "Bridge overseas and domestic teams for continuity",
      ],
      audience: [
        "Patients treated abroad needing to continue care at home",
        "Those holding an overseas plan unsure how to execute it locally",
        "Families wanting fewer overseas trips and local follow-up",
      ],
    },
  },
  {
    slug: "functional-medicine",
    category: "wellness",
    icon: "Activity",
    zh: {
      name: "功能医学深度评估",
      tagline: "追根溯源，评估身体深层功能状态",
      summary: "通过功能医学检测深入评估身体机能，找出亚健康与慢病的深层根源。",
      overview:
        "功能医学深度评估通过系统的功能医学检测（如代谢、激素、肠道、营养、炎症、氧化应激等），从根源层面评估身体机能状态，帮助识别亚健康与慢病风险的深层原因，并给出个性化的干预与调理方向。",
      highlights: [
        "系统功能医学检测，覆盖代谢、激素、肠道等维度",
        "从根源分析亚健康与慢病风险",
        "输出个性化干预与生活方式调理方案",
        "可衔接抗衰方案、营养与私人医生服务",
      ],
      audience: [
        "长期疲劳、亚健康却查不出明确病因的人群",
        "重视预防、希望从根源管理健康的人",
        "有慢病风险、想主动干预的人士",
      ],
    },
    en: {
      name: "Functional Medicine Assessment",
      tagline: "Get to the root of how your body functions",
      summary: "In-depth functional-medicine testing to find the root causes behind sub-health and chronic risk.",
      overview:
        "The functional-medicine assessment uses systematic testing — metabolism, hormones, gut, nutrition, inflammation, oxidative stress and more — to evaluate how your body functions at a root level, identifying the deeper drivers of sub-health and chronic-disease risk and pointing to personalized interventions.",
      highlights: [
        "Systematic testing across metabolism, hormones, gut and more",
        "Root-cause analysis of sub-health and chronic risk",
        "Personalized intervention and lifestyle plan",
        "Links to longevity, nutrition and private-doctor services",
      ],
      audience: [
        "People with chronic fatigue or sub-health but no clear diagnosis",
        "Those focused on prevention and root-cause health management",
        "People with chronic-disease risk wanting to act early",
      ],
    },
  },
  {
    slug: "anti-aging-plan",
    category: "wellness",
    icon: "Sparkles",
    zh: {
      name: "个性化抗衰年度方案定制",
      tagline: "科学抗衰，定制您的年度健康计划",
      summary: "基于评估数据定制年度抗衰方案，系统管理身体机能与衰老进程。",
      overview:
        "个性化抗衰年度方案基于全面的健康与功能医学评估数据，为您量身定制涵盖营养、运动、激素、睡眠、心理与医美医疗等维度的年度抗衰计划，并动态跟踪调整，帮助科学延缓衰老、提升生命质量。",
      highlights: [
        "基于评估数据的个性化年度抗衰规划",
        "涵盖营养、运动、激素、睡眠等多维干预",
        "阶段性复评与方案动态调整",
        "专属团队跟踪执行，衔接营养与医疗资源",
      ],
      audience: [
        "重视健康管理、追求延缓衰老的人群",
        "希望有系统、长期抗衰计划而非零散尝试的人",
        "有条件投入年度健康管理的人士",
      ],
    },
    en: {
      name: "Personalized Annual Longevity Plan",
      tagline: "Science-based longevity, tailored by the year",
      summary: "An annual longevity plan built on your assessment data, managing function and aging systematically.",
      overview:
        "The personalized annual longevity plan uses your comprehensive health and functional-medicine data to tailor a year-long program across nutrition, exercise, hormones, sleep, psychology and medical aesthetics — tracked and adjusted over time to slow aging scientifically and improve quality of life.",
      highlights: [
        "Personalized annual longevity plan built on assessment data",
        "Multi-dimensional intervention: nutrition, exercise, hormones, sleep",
        "Periodic re-assessment and dynamic adjustment",
        "A dedicated team tracking execution and resources",
      ],
      audience: [
        "People focused on health management and slowing aging",
        "Those wanting a systematic long-term plan, not scattered attempts",
        "Individuals able to invest in annual health management",
      ],
    },
  },
  {
    slug: "medical-nutrients",
    category: "wellness",
    icon: "Leaf",
    zh: {
      name: "医疗级营养素",
      tagline: "医疗品质营养补充，精准而可靠",
      summary: "提供医疗级营养素产品与个性化补充方案，科学补足身体所需。",
      overview:
        "医疗级营养素服务基于个人营养评估，提供品质与纯度更高的医疗级营养补充产品，并由专业人员制定个性化补充方案，避免盲目进补，科学、精准地满足身体的营养需求。",
      highlights: [
        "医疗级品质与纯度的营养素产品",
        "基于评估的个性化补充方案，避免盲目进补",
        "专业人员指导用量、搭配与周期",
        "定期复评调整，跟踪补充效果",
      ],
      audience: [
        "存在营养失衡、需精准补充的人群",
        "术后、慢病或抗衰人群的营养支持需求",
        "希望在专业指导下科学补剂的人",
      ],
    },
    en: {
      name: "Medical-Grade Nutrients",
      tagline: "Medical-quality supplementation, precise and reliable",
      summary: "Medical-grade nutrient products with personalized supplementation plans for your body's real needs.",
      overview:
        "The medical-grade nutrient service is based on individual nutritional assessment, offering higher-quality, higher-purity medical-grade supplements with personalized plans designed by professionals — avoiding guesswork and meeting your body's nutritional needs precisely.",
      highlights: [
        "Medical-grade quality and purity nutrient products",
        "Assessment-based personalized plans, no blind supplementing",
        "Professional guidance on dosage, combinations and cycles",
        "Periodic re-assessment tracking the effect",
      ],
      audience: [
        "People with nutritional imbalances needing precise supplementation",
        "Nutritional support for post-op, chronic or longevity needs",
        "Those wanting science-based supplements under guidance",
      ],
    },
  },
  {
    slug: "iv-nutrition",
    category: "wellness",
    icon: "Droplet",
    zh: {
      name: "静脉营养疗程",
      tagline: "静脉输注营养，高效直达吸收",
      summary: "在专业医疗环境下提供静脉营养输注疗程，高效补充所需营养素。",
      overview:
        "静脉营养疗程在专业医疗环境与医护监护下，通过静脉输注方式补充维生素、矿物质、氨基酸等营养素，绕过消化吸收环节、更高效直达，适合特定营养支持、术后恢复或功能调理需求，需经专业评估后个性化实施。",
      highlights: [
        "医护监护下的静脉营养输注疗程",
        "个性化配方，针对性补充所需营养素",
        "适合术后恢复、功能调理与营养支持",
        "疗程前专业评估，保障安全与适配",
      ],
      audience: [
        "术后恢复、需要高效营养支持的人群",
        "存在特定营养缺乏、口服吸收不佳者",
        "在专业评估下寻求功能调理的人士",
      ],
    },
    en: {
      name: "IV Nutrition Therapy",
      tagline: "Intravenous nutrition for efficient, direct absorption",
      summary: "Medically supervised IV nutrition therapy to replenish key nutrients efficiently.",
      overview:
        "IV nutrition therapy delivers vitamins, minerals and amino acids intravenously under professional medical supervision, bypassing digestive absorption for more efficient, direct uptake. Suited to specific nutritional support, post-op recovery or functional needs, it is delivered individually after professional assessment.",
      highlights: [
        "Medically supervised IV nutrition sessions",
        "Personalized formulas targeting your nutrient needs",
        "Suited to post-op recovery and functional support",
        "Professional assessment before therapy for safety and fit",
      ],
      audience: [
        "People in post-op recovery needing efficient nutritional support",
        "Those with specific deficiencies or poor oral absorption",
        "People seeking functional support under professional assessment",
      ],
    },
  },
  //  私人医生服务 ─────────────────────────────────────────────
  {
    slug: "medical-record",
    category: "private-doctor",
    icon: "FileText",
    zh: {
      name: "数字化个人医疗电子档案建立",
      tagline: "建立完整的数字化健康档案，便于长期管理",
      summary: "为您建立完整的数字化个人医疗电子档案，便于长期健康管理。",
      overview: "通过系统化收集您的病史、检查报告、用药记录等信息，建立完整的数字化个人医疗电子档案，便于医生全面了解您的健康状况，为后续诊疗提供可靠依据。",
      highlights: ["系统化收集病史与检查报告", "数字化存储便于长期管理", "医生可快速全面了解健康状况", "为后续诊疗提供可靠依据"],
      audience: ["需要长期健康管理的个人", "慢性病患者", "希望建立完整健康档案的家庭"],
    },
    en: {
      name: "Digitized Personal Medical Record",
      tagline: "Complete digital health profile for long-term management",
      summary: "Build a complete digital medical record for comprehensive long-term health management.",
      overview: "Systematically collect your medical history, test reports, and medication records to build a complete digital medical record, enabling doctors to fully understand your health status and providing a reliable basis for future care.",
      highlights: ["Systematic collection of medical history and reports", "Digital storage for long-term management", "Doctors can quickly understand your health status", "Reliable basis for future treatment"],
      audience: ["Individuals needing long-term health management", "Chronic disease patients", "Families wanting complete health records"],
    },
  },
  {
    slug: "screening-design",
    category: "private-doctor",
    icon: "ClipboardList",
    zh: {
      name: "医疗级别体检套餐定制",
      tagline: "根据个人情况量身定制体检方案",
      summary: "根据个人健康状况和需求，定制医疗级别的体检套餐。",
      overview: "基于您的年龄、性别、家族史、生活习惯等因素，由专业医生为您量身定制医疗级别的体检套餐，确保检查项目精准覆盖您的健康风险点。",
      highlights: ["基于个人情况量身定制", "医疗级别检查标准", "精准覆盖健康风险点", "专业医生指导方案"],
      audience: ["关注健康管理的个人", "有家族病史需要针对性筛查", "希望获得专业体检建议"],
    },
    en: {
      name: "Customized Medical Screening",
      tagline: "Personalized medical-grade health screening package",
      summary: "Medical-grade screening packages tailored to your individual health profile and needs.",
      overview: "Based on your age, gender, family history, and lifestyle, a professional doctor customizes a medical-grade screening package to precisely cover your health risk points.",
      highlights: ["Tailored to individual health profile", "Medical-grade screening standards", "Precisely covers health risks", "Professional doctor guidance"],
      audience: ["Health-conscious individuals", "Those with family history needing targeted screening", "People seeking professional screening advice"],
    },
  },
  {
    slug: "lab-tests-plan",
    category: "private-doctor",
    icon: "FlaskConical",
    zh: {
      name: "医疗级别检测定制",
      tagline: "定制医疗级别的实验室检测方案",
      summary: "根据个人健康需求，定制医疗级别的实验室检测方案。",
      overview: "根据您的健康状况和医生的专业建议，定制包含血液、尿液、影像学等在内的医疗级别实验室检测方案，为健康评估提供精准数据支持。",
      highlights: ["医疗级别实验室检测", "基于专业建议定制方案", "覆盖血液、影像等多项检测", "为健康评估提供精准数据"],
      audience: ["需要全面健康评估", "有特定检测需求", "希望获得精准健康数据"],
    },
    en: {
      name: "Customized Lab Tests Plan",
      tagline: "Medical-grade laboratory testing tailored to you",
      summary: "Medical-grade lab testing plans customized based on your health needs and doctor's advice.",
      overview: "Based on your health status and professional medical advice, customize a medical-grade lab testing plan including blood, urine, and imaging tests to provide precise data for health assessment.",
      highlights: ["Medical-grade laboratory testing", "Customized based on professional advice", "Covers blood, imaging and more", "Precise data for health assessment"],
      audience: ["Those needing comprehensive health assessment", "People with specific testing needs", "Those seeking precise health data"],
    },
  },
  {
    slug: "report-interpretation",
    category: "private-doctor",
    icon: "Microscope",
    zh: {
      name: "私人医生专项报告解读",
      tagline: "由您的私人医生专业解读各类报告",
      summary: "由您的私人医生专业解读各类医疗检查报告。",
      overview: "由您的私人医生对各类医疗检查报告进行专业解读，包括血液检查、影像学报告、病理报告等，帮助您准确理解检查结果和临床意义。",
      highlights: ["私人医生专业解读", "覆盖各类检查报告", "准确理解检查结果", "了解临床意义和后续建议"],
      audience: ["拿到检查报告需要解读", "希望了解报告临床意义", "需要后续就医建议"],
    },
    en: {
      name: "Report Interpretation",
      tagline: "Your doctor explains your medical reports",
      summary: "Professional interpretation of medical reports by your private doctor.",
      overview: "Your private doctor professionally interprets various medical reports including blood tests, imaging reports, and pathology reports, helping you accurately understand results and clinical significance.",
      highlights: ["Professional interpretation by your doctor", "Covers all types of reports", "Accurate understanding of results", "Clinical significance and next steps"],
      audience: ["Those with reports needing interpretation", "People wanting to understand clinical significance", "Those needing follow-up advice"],
    },
  },
  {
    slug: "online-consultation",
    category: "private-doctor",
    icon: "MessageSquare",
    zh: {
      name: "私人医生线上咨询",
      tagline: "随时随地与您的私人医生进行线上咨询",
      summary: "随时随地与您的私人医生进行线上咨询。",
      overview: "通过视频或电话与您的私人医生进行线上咨询，讨论健康问题、解读报告、调整用药方案等，享受便捷的专属医疗服务。",
      highlights: ["视频或电话线上咨询", "讨论健康问题和报告", "调整用药方案", "便捷的专属医疗服务"],
      audience: ["需要定期健康咨询", "希望随时联系医生", "需要用药指导"],
    },
    en: {
      name: "Online Consultation",
      tagline: "Consult your private doctor anytime, anywhere",
      summary: "Online consultations with your private doctor via video or phone.",
      overview: "Consult your private doctor via video or phone to discuss health issues, interpret reports, adjust medication plans, and enjoy convenient exclusive medical services.",
      highlights: ["Video or phone consultations", "Discuss health issues and reports", "Adjust medication plans", "Convenient exclusive service"],
      audience: ["Those needing regular health consultation", "People wanting doctor access", "Those needing medication guidance"],
    },
  },
  {
    slug: "mdt-consultation",
    category: "private-doctor",
    icon: "Users",
    zh: {
      name: "私人医生及多学科会诊",
      tagline: "由私人医生协调多学科专家进行会诊",
      summary: "由私人医生协调多学科专家进行会诊。",
      overview: "由您的私人医生协调相关科室的多学科专家进行会诊，针对复杂病情制定综合治疗方案，确保您获得全面、专业的医疗服务。",
      highlights: ["私人医生协调多学科专家", "针对复杂病情综合会诊", "制定全面治疗方案", "确保专业医疗服务"],
      audience: ["患有复杂疾病", "需要多学科协作", "希望获得综合治疗方案"],
    },
    en: {
      name: "Multidisciplinary Consultation",
      tagline: "Coordinated care from multiple specialists",
      summary: "Your private doctor coordinates multidisciplinary specialists for comprehensive care.",
      overview: "Your private doctor coordinates specialists from relevant departments for multidisciplinary consultation, developing comprehensive treatment plans for complex conditions.",
      highlights: ["Private doctor coordinates specialists", "Comprehensive consultation for complex cases", "Develops full treatment plans", "Ensures professional care"],
      audience: ["Those with complex conditions", "People needing multidisciplinary care", "Those seeking comprehensive treatment plans"],
    },
  },
  {
    slug: "medication-service",
    category: "private-doctor",
    icon: "Pill",
    zh: {
      name: "慢病配药服务",
      tagline: "为慢性病患者提供长期配药和用药管理",
      summary: "为慢性病患者提供长期配药和用药管理服务。",
      overview: "为慢性病患者提供长期配药服务，包括处方续方、用药指导、药物相互作用检查等，确保用药安全和治疗效果。",
      highlights: ["长期配药服务", "处方续方便捷", "用药指导和监测", "药物相互作用检查"],
      audience: ["慢性病患者需要长期用药", "需要处方续方服务", "希望获得用药指导"],
    },
    en: {
      name: "Chronic Disease Medication",
      tagline: "Long-term medication management for chronic conditions",
      summary: "Long-term medication service for chronic disease patients including prescription refills and guidance.",
      overview: "Provides long-term medication service for chronic disease patients, including prescription refills, medication guidance, drug interaction checks, ensuring medication safety and treatment effectiveness.",
      highlights: ["Long-term medication service", "Convenient prescription refills", "Medication guidance and monitoring", "Drug interaction checks"],
      audience: ["Chronic disease patients needing long-term medication", "Those needing prescription refills", "People wanting medication guidance"],
    },
  },
  //  基础医疗服务 ──────────────────────────────────────────────
  {
    slug: "outpatient-access",
    category: "basic-medical",
    icon: "Hospital",
    zh: {
      name: "私立医院医疗预约服务",
      tagline: "快速预约私立医院门诊，享受优质医疗服务",
      summary: "快速预约私立医院门诊，享受优质医疗服务。",
      overview: "为您提供私立医院门诊快速预约服务，避免长时间等待，享受舒适、高效的就医体验。",
      highlights: ["快速预约私立医院门诊", "避免长时间等待", "舒适高效的就医体验", "专业医疗团队服务"],
      audience: ["希望快速就诊", "追求优质就医体验", "需要私立医院服务"],
    },
    en: {
      name: "Outpatient Access",
      tagline: "Quick access to private hospital outpatient care",
      summary: "Fast-track appointment booking at private hospitals for quality medical care.",
      overview: "Provides fast-track appointment booking at private hospitals, avoiding long waits and ensuring a comfortable, efficient medical experience.",
      highlights: ["Quick private hospital appointments", "Avoid long waiting times", "Comfortable efficient experience", "Professional medical team"],
      audience: ["Those wanting quick access", "People seeking quality care", "Those needing private hospital services"],
    },
  },
  {
    slug: "vip-green-channel",
    category: "basic-medical",
    icon: "ShieldCheck",
    zh: {
      name: "尊贵绿色就医通道（门诊）",
      tagline: "VIP 绿色就医通道，享受优先就诊服务",
      summary: "VIP绿色就医通道，享受优先就诊服务。",
      overview: "为您提供VIP绿色就医通道，享受优先挂号、优先就诊、专属客服等尊贵服务。",
      highlights: ["VIP优先挂号就诊", "专属客服全程陪同", "优先检查和治疗", "尊贵就医体验"],
      audience: ["追求尊贵就医体验", "需要优先就诊", "希望专属服务"],
    },
    en: {
      name: "VIP Green Channel",
      tagline: "Priority outpatient care with VIP service",
      summary: "VIP green channel for priority registration, consultation, and exclusive service.",
      overview: "Provides VIP green channel service with priority registration, consultation, exclusive customer service, and premium medical experience.",
      highlights: ["VIP priority registration", "Exclusive customer service", "Priority tests and treatment", "Premium medical experience"],
      audience: ["Those seeking premium experience", "People needing priority care", "Those wanting exclusive service"],
    },
  },
  {
    slug: "inpatient-vip",
    category: "basic-medical",
    icon: "Bed",
    zh: {
      name: "住院VIP协调服务",
      tagline: "住院 VIP 协调服务，确保住院期间获得优质照护",
      summary: "住院VIP协调服务，确保住院期间获得优质照护。",
      overview: "为您协调住院期间的各项服务，包括病房安排、护理协调、家属沟通等，确保住院期间获得优质照护。",
      highlights: ["协调病房安排", "护理服务协调", "家属沟通支持", "确保优质住院体验"],
      audience: ["需要住院服务", "希望优质住院体验", "需要护理协调"],
    },
    en: {
      name: "Inpatient VIP Coordination",
      tagline: "Coordinated VIP inpatient care",
      summary: "VIP coordination service ensuring quality care during hospitalization.",
      overview: "Coordinates all inpatient services including room arrangement, nursing coordination, and family communication to ensure quality care during hospitalization.",
      highlights: ["Room arrangement coordination", "Nursing service coordination", "Family communication support", "Quality inpatient experience"],
      audience: ["Those needing inpatient services", "People wanting quality hospital stay", "Those needing nursing coordination"],
    },
  },
  {
    slug: "medical-chaperone",
    category: "basic-medical",
    icon: "UserPlus",
    zh: {
      name: "私人陪诊服务",
      tagline: "专业陪诊人员全程陪同就医",
      summary: "专业陪诊人员全程陪同就医。",
      overview: "提供专业陪诊人员全程陪同就医，协助挂号、就诊、取药等，特别适合老年人或行动不便者。",
      highlights: ["专业陪诊人员全程陪同", "协助挂号就诊取药", "适合老年人和行动不便者", "减轻家属负担"],
      audience: ["老年人就医", "行动不便者", "需要陪诊服务"],
    },
    en: {
      name: "Medical Chaperone",
      tagline: "Professional companion for your medical visits",
      summary: "Professional chaperone accompanying you throughout your medical visit.",
      overview: "Provides professional chaperone service accompanying you throughout your medical visit, assisting with registration, consultation, and medication pickup, especially suitable for elderly or mobility-impaired.",
      highlights: ["Professional chaperone throughout", "Assists registration and consultation", "Suitable for elderly and mobility-impaired", "Reduces family burden"],
      audience: ["Elderly patients", "Mobility-impaired individuals", "Those needing chaperone service"],
    },
  },
  {
    slug: "limousine-service",
    category: "basic-medical",
    icon: "Car",
    zh: {
      name: "私人礼宾车服务",
      tagline: "提供就医接送的私人礼宾车服务",
      summary: "提供就医接送的私人礼宾车服务。",
      overview: "提供就医接送的私人礼宾车服务，确保您舒适、准时到达医院，特别适合行动不便或需要特殊照顾的患者。",
      highlights: ["就医接送服务", "舒适准时到达", "适合行动不便者", "特殊照顾需求"],
      audience: ["需要就医接送", "行动不便者", "需要特殊照顾"],
    },
    en: {
      name: "Limousine Service",
      tagline: "Private car service for medical transport",
      summary: "Private limousine service for comfortable medical transport.",
      overview: "Provides private limousine service for medical transport, ensuring comfortable and punctual arrival at the hospital, especially suitable for mobility-impaired or special care patients.",
      highlights: ["Medical transport service", "Comfortable punctual arrival", "Suitable for mobility-impaired", "Special care needs"],
      audience: ["Those needing medical transport", "Mobility-impaired individuals", "Those needing special care"],
    },
  },
  {
    slug: "24h-assistance",
    category: "basic-medical",
    icon: "Ambulance",
    zh: {
      name: "24小时就医协助服务",
      tagline: "全天候 24 小时就医协助服务",
      summary: "全天候24小时就医协助服务。",
      overview: "提供全天候24小时就医协助服务，包括紧急就医指导、医院推荐、预约协助等，随时为您提供医疗支持。",
      highlights: ["24小时全天候服务", "紧急就医指导", "医院推荐和预约", "随时医疗支持"],
      audience: ["需要24小时医疗支持", "可能有紧急就医需求", "希望随时获得帮助"],
    },
    en: {
      name: "24-Hour Medical Assistance",
      tagline: "Round-the-clock medical support",
      summary: "24/7 medical assistance service for emergency guidance and support.",
      overview: "Provides 24/7 medical assistance service including emergency guidance, hospital recommendations, and appointment assistance, ready to support you anytime.",
      highlights: ["24/7 round-the-clock service", "Emergency medical guidance", "Hospital recommendations", "Anytime medical support"],
      audience: ["Those needing 24/7 support", "People with emergency needs", "Those wanting anytime help"],
    },
  },
  {
    slug: "smart-monitoring",
    category: "basic-medical",
    icon: "Watch",
    zh: {
      name: "智能穿戴设备监测",
      tagline: "通过智能穿戴设备持续监测健康数据",
      summary: "通过智能穿戴设备持续监测健康数据。",
      overview: "通过智能穿戴设备持续监测您的健康数据，包括心率、血压、血氧等，实时掌握健康状况，及时发现异常。",
      highlights: ["智能穿戴设备监测", "持续健康数据监测", "实时掌握健康状况", "及时发现异常"],
      audience: ["关注健康数据", "需要持续监测", "希望及时发现异常"],
    },
    en: {
      name: "Smart Device Monitoring",
      tagline: "Continuous health data monitoring via wearables",
      summary: "Continuous health monitoring through smart wearable devices.",
      overview: "Monitors your health data continuously through smart wearable devices including heart rate, blood pressure, and blood oxygen, helping you track health status and detect abnormalities early.",
      highlights: ["Smart wearable monitoring", "Continuous health data", "Real-time health tracking", "Early abnormality detection"],
      audience: ["Health-conscious individuals", "Those needing continuous monitoring", "People wanting early detection"],
    },
  },
  //  跨境国际医疗服务 ──────────────────────────────────────────────
  {
    slug: "cross-border-record",
    category: "cross-border",
    icon: "FileText",
    zh: {
      name: "数字化个人医疗电子档案建立",
      tagline: "为跨境就医建立完整的数字化医疗档案",
      summary: "为跨境就医建立完整的数字化医疗档案。",
      overview: "为跨境就医患者建立完整的数字化医疗档案，便于海外医生快速了解病情，提高诊疗效率。",
      highlights: ["完整数字化医疗档案", "便于海外医生了解病情", "提高跨境诊疗效率", "多语言支持"],
      audience: ["计划跨境就医", "需要海外诊疗", "希望提高就诊效率"],
    },
    en: {
      name: "Cross-border Medical Record",
      tagline: "Digital record for international care",
      summary: "Complete digital medical record for efficient cross-border treatment.",
      overview: "Builds complete digital medical records for cross-border patients, enabling overseas doctors to quickly understand conditions and improve treatment efficiency.",
      highlights: ["Complete digital records", "Helps overseas doctors understand", "Improves cross-border efficiency", "Multi-language support"],
      audience: ["Those planning cross-border care", "People needing overseas treatment", "Those wanting efficient care"],
    },
  },
  {
    slug: "medical-translation",
    category: "cross-border",
    icon: "Languages",
    zh: {
      name: "医疗报告翻译及随行翻译",
      tagline: "专业医疗翻译服务，包括报告翻译和随行翻译",
      summary: "专业医疗翻译服务，包括报告翻译和随行翻译。",
      overview: "提供专业医疗翻译服务，包括医疗报告翻译和就医随行翻译，确保跨境就医沟通无障碍。",
      highlights: ["专业医疗报告翻译", "就医随行翻译", "确保沟通无障碍", "多语种支持"],
      audience: ["需要医疗翻译", "计划海外就医", "需要随行翻译"],
    },
    en: {
      name: "Medical Translation",
      tagline: "Professional medical translation service",
      summary: "Professional medical translation including reports and accompanying interpretation.",
      overview: "Provides professional medical translation service including report translation and accompanying interpretation, ensuring barrier-free communication for cross-border care.",
      highlights: ["Professional report translation", "Accompanying interpretation", "Barrier-free communication", "Multi-language support"],
      audience: ["Those needing medical translation", "People planning overseas care", "Those needing accompanying translator"],
    },
  },
  {
    slug: "global-medicine",
    category: "cross-border",
    icon: "Globe",
    zh: {
      name: "全球找药",
      tagline: "帮助寻找全球范围内的特效药物",
      summary: "帮助寻找全球范围内的特效药物。",
      overview: "帮助患者寻找全球范围内的特效药物和罕见药物，包括药物信息、获取渠道和用药指导。",
      highlights: ["全球药物搜索", "特效药和罕见药", "药物信息和渠道", "用药指导"],
      audience: ["需要特效药物", "罕见病患者", "需要全球找药"],
    },
    en: {
      name: "Global Medicine Search",
      tagline: "Finding specialty medicines worldwide",
      summary: "Helping patients find specialty and rare medicines globally.",
      overview: "Helps patients find specialty and rare medicines worldwide, including drug information, access channels, and medication guidance.",
      highlights: ["Global drug search", "Specialty and rare medicines", "Drug information and access", "Medication guidance"],
      audience: ["Those needing specialty drugs", "Rare disease patients", "People needing global drug search"],
    },
  },
  {
    slug: "international-second-opinion",
    category: "cross-border",
    icon: "Stethoscope",
    zh: {
      name: "国际专家第二诊疗意见服务",
      tagline: "获取国际专家的第二诊疗意见",
      summary: "获取国际专家的第二诊疗意见。",
      overview: "为您链接国际顶尖专家，获取第二诊疗意见，帮助确认诊断、优化治疗方案。",
      highlights: ["国际顶尖专家", "第二诊疗意见", "确认诊断", "优化治疗方案"],
      audience: ["需要第二诊疗意见", "希望国际专家评估", "复杂病例"],
    },
    en: {
      name: "International Second Opinion",
      tagline: "Second opinion from global experts",
      summary: "Second opinion service from international top experts.",
      overview: "Connects you with international top experts for second opinions, helping confirm diagnoses and optimize treatment plans.",
      highlights: ["International top experts", "Second opinion", "Confirm diagnosis", "Optimize treatment"],
      audience: ["Those needing second opinion", "People wanting international assessment", "Complex cases"],
    },
  },
  {
    slug: "international-mdt",
    category: "cross-border",
    icon: "Users",
    zh: {
      name: "国际专家多学科诊疗意见服务",
      tagline: "国际专家多学科诊疗意见服务",
      summary: "国际专家多学科会诊服务。",
      overview: "协调国际多学科专家进行会诊，为复杂病例提供综合诊疗意见。",
      highlights: ["国际多学科专家", "综合会诊", "复杂病例", "综合诊疗意见"],
      audience: ["复杂病例", "需要多学科会诊", "希望国际专家意见"],
    },
    en: {
      name: "International MDT",
      tagline: "Multidisciplinary consultation from global experts",
      summary: "International multidisciplinary consultation service for complex cases.",
      overview: "Coordinates international multidisciplinary experts for consultation, providing comprehensive treatment opinions for complex cases.",
      highlights: ["International multidisciplinary experts", "Comprehensive consultation", "Complex cases", "Comprehensive opinions"],
      audience: ["Complex cases", "Those needing MDT", "People wanting international opinions"],
    },
  },
  {
    slug: "overseas-recommendation",
    category: "cross-border",
    icon: "Plane",
    zh: {
      name: "境外诊疗推荐服务",
      tagline: "推荐适合的境外医疗机构和专家",
      summary: "推荐适合的境外医疗机构和专家。",
      overview: "根据病情推荐适合的境外医疗机构和专家，包括医院介绍、专家背景、治疗方案等。",
      highlights: ["病情评估", "医院和专家推荐", "治疗方案对比", "就医指导"],
      audience: ["计划境外就医", "需要医院推荐", "希望专家评估"],
    },
    en: {
      name: "Overseas Medical Recommendation",
      tagline: "Recommending suitable overseas hospitals and experts",
      summary: "Recommending suitable overseas medical institutions and specialists based on your condition.",
      overview: "Recommends suitable overseas medical institutions and specialists based on your condition, including hospital introductions, expert backgrounds, and treatment plans.",
      highlights: ["Condition assessment", "Hospital and expert recommendations", "Treatment plan comparison", "Medical guidance"],
      audience: ["Those planning overseas care", "People needing hospital recommendations", "Those wanting expert assessment"],
    },
  },
  {
    slug: "china-medical-plan",
    category: "cross-border",
    icon: "Hospital",
    zh: {
      name: "入境诊疗推荐服务",
      tagline: "为境外患者推荐中国大陆的医疗服务",
      summary: "为境外患者推荐中国大陆的医疗服务。",
      overview: "为境外患者推荐中国大陆的优质医疗机构和专家，提供入境就医全程规划。",
      highlights: ["优质医疗机构推荐", "专家背景介绍", "入境就医规划", "全程协助"],
      audience: ["境外患者", "计划来华就医", "需要入境医疗规划"],
    },
    en: {
      name: "China Medical Service Plan",
      tagline: "Medical service planning for patients coming to China",
      summary: "Recommending quality medical services in Mainland China for overseas patients.",
      overview: "Recommends quality medical institutions and specialists in Mainland China for overseas patients, providing complete medical travel planning.",
      highlights: ["Quality institution recommendations", "Expert background introduction", "Medical travel planning", "Full assistance"],
      audience: ["Overseas patients", "Those planning China medical travel", "People needing入境 medical planning"],
    },
  },
  {
    slug: "ivf-coordination",
    category: "cross-border",
    icon: "HeartPulse",
    zh: {
      name: "辅助生殖协调服务",
      tagline: "辅助生殖技术的协调服务",
      summary: "辅助生殖技术的协调服务。",
      overview: "为需要辅助生殖技术的家庭提供协调服务，包括医院推荐、专家咨询、流程指导等。",
      highlights: ["医院和专家推荐", "流程指导", "咨询支持", "全程协调"],
      audience: ["需要辅助生殖", "计划IVF治疗", "需要生殖协调"],
    },
    en: {
      name: "IVF Coordination",
      tagline: "Coordination service for assisted reproduction",
      summary: "Coordination service for families needing assisted reproductive technology.",
      overview: "Provides coordination service for families needing assisted reproductive technology, including hospital recommendations, expert consultation, and process guidance.",
      highlights: ["Hospital and expert recommendations", "Process guidance", "Consultation support", "Full coordination"],
      audience: ["Those needing IVF", "People planning IVF treatment", "Those needing reproductive coordination"],
    },
  },
  {
    slug: "overseas-screening",
    category: "cross-border",
    icon: "Scan",
    zh: {
      name: "海外精密体检方案设计及预约服务",
      tagline: "海外精密体检方案设计及预约服务",
      summary: "海外精密体检方案设计和预约。",
      overview: "为您设计海外精密体检方案并协助预约，包括体检项目定制、医院预约、行程规划等。",
      highlights: ["体检方案定制", "医院预约协助", "行程规划", "精密体检"],
      audience: ["计划海外体检", "需要精密体检", "希望定制方案"],
    },
    en: {
      name: "Overseas Precision Screening",
      tagline: "Precision screening plan design and booking overseas",
      summary: "Designing and booking precision medical screening plans overseas.",
      overview: "Designs precision medical screening plans and assists with booking overseas, including customized screening items, hospital appointments, and travel planning.",
      highlights: ["Customized screening plans", "Hospital appointment assistance", "Travel planning", "Precision screening"],
      audience: ["Those planning overseas screening", "People needing precision screening", "Those wanting customized plans"],
    },
  },
  //  长寿医学服务 ──────────────────────────────────────────────
  {
    slug: "longevity-record",
    category: "longevity",
    icon: "FileText",
    zh: {
      name: "数字化个人医疗电子档案建立",
      tagline: "为长寿医学管理建立完整的数字化健康档案",
      summary: "为长寿医学管理建立完整的数字化健康档案。",
      overview: "为长寿医学管理建立完整的数字化健康档案，便于长期跟踪健康变化和干预效果。",
      highlights: ["完整健康档案", "长期跟踪", "干预效果评估", "数据驱动管理"],
      audience: ["关注长寿医学", "需要长期健康管理", "希望数据驱动"],
    },
    en: {
      name: "Longevity Medical Record",
      tagline: "Digital record for longevity management",
      summary: "Complete digital health record for longevity medicine management.",
      overview: "Builds complete digital health records for longevity medicine management, enabling long-term tracking of health changes and intervention effects.",
      highlights: ["Complete health records", "Long-term tracking", "Intervention effect assessment", "Data-driven management"],
      audience: ["Those focused on longevity", "People needing long-term management", "Those wanting data-driven care"],
    },
  },
  {
    slug: "precision-testing",
    category: "longevity",
    icon: "Microscope",
    zh: {
      name: "专项定制精准检测",
      tagline: "医疗级别的精准检测项目",
      summary: "医疗级别的精准检测项目。",
      overview: "提供医疗级别的精准检测项目，包括基因检测、代谢组学、微生物组等，为个性化干预提供数据支持。",
      highlights: ["医疗级别检测", "基因和代谢检测", "微生物组分析", "个性化数据支持"],
      audience: ["需要精准检测", "希望了解基因风险", "需要代谢分析"],
    },
    en: {
      name: "Precision Testing",
      tagline: "Medical-grade precision testing items",
      summary: "Medical-grade precision testing including genomics, metabolomics, and microbiome.",
      overview: "Provides medical-grade precision testing including genomics, metabolomics, and microbiome analysis, providing data support for personalized interventions.",
      highlights: ["Medical-grade testing", "Genomics and metabolomics", "Microbiome analysis", "Personalized data support"],
      audience: ["Those needing precision testing", "People wanting genetic risk assessment", "Those needing metabolic analysis"],
    },
  },
  {
    slug: "cellular-rejuvenation",
    category: "longevity",
    icon: "Sparkles",
    zh: {
      name: "细胞新生活力焕发方案设计（含NAD+治疗）及预约服务",
      tagline: "细胞新生活力焕发方案设计（含 NAD+ 治疗）及预约服务",
      summary: "细胞 rejuvenation 方案设计和预约服务。",
      overview: "为您设计细胞 rejuvenation 方案，包括NAD+静脉输注等，帮助恢复细胞活力，延缓衰老。",
      highlights: ["细胞 rejuvenation 方案", "NAD+静脉输注", "恢复细胞活力", "延缓衰老"],
      audience: ["希望细胞 rejuvenation", "需要NAD+治疗", "关注抗衰老"],
    },
    en: {
      name: "Cellular Rejuvenation",
      tagline: "Cellular revitalization plan with NAD+ IV",
      summary: "Cellular rejuvenation plan design and booking including NAD+ IV therapy.",
      overview: "Designs cellular rejuvenation plans including NAD+ IV therapy to help restore cellular vitality and slow aging.",
      highlights: ["Cellular rejuvenation plans", "NAD+ IV therapy", "Restore cellular vitality", "Slow aging"],
      audience: ["Those wanting cellular rejuvenation", "People needing NAD+ therapy", "Those focused on anti-aging"],
    },
  },
  {
    slug: "iv-health",
    category: "longevity",
    icon: "Syringe",
    zh: {
      name: "静脉输注个性化健康提升服务",
      tagline: "静脉输注个性化健康提升服务",
      summary: "个性化静脉输注健康提升服务。",
      overview: "提供个性化静脉输注服务，包括维生素、矿物质、氨基酸等，高效补充所需营养素，提升健康水平。",
      highlights: ["个性化静脉输注", "维生素和矿物质", "高效补充营养素", "提升健康水平"],
      audience: ["需要静脉营养", "希望高效补充", "关注健康提升"],
    },
    en: {
      name: "IV Health Enhancement",
      tagline: "Personalized IV health enhancement service",
      summary: "Personalized IV infusion service for efficient nutrient supplementation.",
      overview: "Provides personalized IV infusion service including vitamins, minerals, and amino acids for efficient nutrient supplementation and health enhancement.",
      highlights: ["Personalized IV infusion", "Vitamins and minerals", "Efficient nutrient supplementation", "Health enhancement"],
      audience: ["Those needing IV nutrition", "People wanting efficient supplementation", "Those focused on health enhancement"],
    },
  },
  {
    slug: "nutritional-package",
    category: "longevity",
    icon: "Salad",
    zh: {
      name: "医疗级别营养素套餐：提供个人定制的功能修复营养素餐包",
      tagline: "医疗级别营养素套餐，个人定制",
      summary: "医疗级别营养素套餐，个人定制。",
      overview: "提供医疗级别营养素套餐，根据个人健康需求定制功能修复营养素餐包。",
      highlights: ["医疗级别营养素", "个人定制", "功能修复", "营养餐包"],
      audience: ["需要营养补充", "希望定制方案", "关注功能修复"],
    },
    en: {
      name: "Nutritional Package",
      tagline: "Medical-grade customized nutritional package",
      summary: "Medical-grade nutritional supplement package customized for individual needs.",
      overview: "Provides medical-grade nutritional supplement packages customized for individual health needs with functional repair nutrients.",
      highlights: ["Medical-grade nutrients", "Individual customization", "Functional repair", "Nutritional packages"],
      audience: ["Those needing nutritional supplementation", "People wanting customized plans", "Those focused on functional repair"],
    },
  },
  {
    slug: "weight-management",
    category: "longevity",
    icon: "Scale",
    zh: {
      name: "体重管理服务",
      tagline: "专业体重管理服务",
      summary: "专业体重管理服务。",
      overview: "提供专业体重管理服务，包括营养指导、运动方案、行为干预等，帮助实现健康体重。",
      highlights: ["专业体重管理", "营养指导", "运动方案", "行为干预"],
      audience: ["需要体重管理", "希望健康减重", "需要专业指导"],
    },
    en: {
      name: "Weight Management",
      tagline: "Professional weight management service",
      summary: "Professional weight management service with nutrition, exercise, and behavioral guidance.",
      overview: "Provides professional weight management service including nutrition guidance, exercise plans, and behavioral intervention to help achieve healthy weight.",
      highlights: ["Professional weight management", "Nutrition guidance", "Exercise plans", "Behavioral intervention"],
      audience: ["Those needing weight management", "People wanting healthy weight loss", "Those needing professional guidance"],
    },
  },
  {
    slug: "tcm-differentiation",
    category: "longevity",
    icon: "Leaf",
    zh: {
      name: "中医辩证",
      tagline: "中医辩证施治服务",
      summary: "中医辩证施治服务。",
      overview: "提供中医辩证施治服务，根据个人体质和症状，制定个性化中医调理方案。",
      highlights: ["中医辩证", "个性化调理", "体质评估", "中医方案"],
      audience: ["相信中医调理", "需要辩证施治", "希望个性化方案"],
    },
    en: {
      name: "TCM Syndrome Differentiation",
      tagline: "Traditional Chinese Medicine syndrome differentiation",
      summary: "TCM syndrome differentiation and personalized treatment plans.",
      overview: "Provides TCM syndrome differentiation service, developing personalized TCM conditioning plans based on individual constitution and symptoms.",
      highlights: ["TCM syndrome differentiation", "Personalized conditioning", "Constitution assessment", "TCM plans"],
      audience: ["Those believing in TCM", "People needing syndrome differentiation", "Those wanting personalized plans"],
    },
  },
  {
    slug: "flora-transplant",
    category: "longevity",
    icon: "Activity",
    zh: {
      name: "肠道菌群移植服务",
      tagline: "肠道菌群移植协调服务",
      summary: "肠道菌群移植协调服务。",
      overview: "提供肠道菌群移植协调服务，包括供体筛选、移植手术协调、术后跟踪等。",
      highlights: ["供体筛选", "移植协调", "术后跟踪", "专业医疗"],
      audience: ["需要菌群移植", "关注肠道健康", "需要专业协调"],
    },
    en: {
      name: "Flora Transplantation",
      tagline: "Intestinal flora transplantation coordination",
      summary: "Coordination service for intestinal flora transplantation.",
      overview: "Provides coordination service for intestinal flora transplantation including donor screening, procedure coordination, and post-op tracking.",
      highlights: ["Donor screening", "Procedure coordination", "Post-op tracking", "Professional medical care"],
      audience: ["Those needing flora transplant", "People focused on gut health", "Those needing professional coordination"],
    },
  },
  {
    slug: "exercise-rehab",
    category: "longevity",
    icon: "Bike",
    zh: {
      name: "私人专属运动方案定制及运动康复服务",
      tagline: "私人专属运动方案定制及运动康复服务",
      summary: "私人运动方案定制和运动康复服务。",
      overview: "为您定制私人运动方案，提供运动康复服务，包括运动处方、康复训练、运动损伤预防等。",
      highlights: ["私人运动方案", "运动康复", "运动处方", "损伤预防"],
      audience: ["需要运动方案", "希望运动康复", "关注运动健康"],
    },
    en: {
      name: "Exercise & Rehabilitation",
      tagline: "Customized exercise plan and sports rehabilitation",
      summary: "Personalized exercise plan and sports medicine rehabilitation service.",
      overview: "Customizes private exercise plans and provides sports rehabilitation service including exercise prescriptions, rehabilitation training, and injury prevention.",
      highlights: ["Personalized exercise plans", "Sports rehabilitation", "Exercise prescriptions", "Injury prevention"],
      audience: ["Those needing exercise plans", "People wanting sports rehab", "Those focused on exercise health"],
    },
  },
  {
    slug: "psychological-health",
    category: "longevity",
    icon: "Brain",
    zh: {
      name: "心理健康管理服务",
      tagline: "心理健康管理服务",
      summary: "心理健康管理服务。",
      overview: "提供心理健康管理服务，包括心理评估、心理咨询、压力管理等，维护心理健康。",
      highlights: ["心理评估", "心理咨询", "压力管理", "心理健康"],
      audience: ["需要心理支持", "希望压力管理", "关注心理健康"],
    },
    en: {
      name: "Psychological Health",
      tagline: "Psychological health management service",
      summary: "Psychological health management including assessment, counseling, and stress management.",
      overview: "Provides psychological health management service including psychological assessment, counseling, and stress management to maintain mental health.",
      highlights: ["Psychological assessment", "Counseling", "Stress management", "Mental health"],
      audience: ["Those needing psychological support", "People wanting stress management", "Those focused on mental health"],
    },
  },
  {
    slug: "blood-purification",
    category: "longevity",
    icon: "Droplet",
    zh: {
      name: "高能活氧血液净化疗法",
      tagline: "高能活氧血液净化疗法",
      summary: "高能活氧血液净化疗法。",
      overview: "提供高能活氧血液净化疗法，帮助清除血液中的有害物质，改善血液循环。",
      highlights: ["血液净化", "活氧疗法", "清除有害物质", "改善循环"],
      audience: ["需要血液净化", "希望改善循环", "关注血管健康"],
    },
    en: {
      name: "Blood Purification",
      tagline: "High-energy active oxygen blood purification",
      summary: "High-energy active oxygen blood purification therapy.",
      overview: "Provides high-energy active oxygen blood purification therapy to help remove harmful substances from blood and improve circulation.",
      highlights: ["Blood purification", "Active oxygen therapy", "Remove harmful substances", "Improve circulation"],
      audience: ["Those needing blood purification", "People wanting circulation improvement", "Those focused on vascular health"],
    },
  },
  {
    slug: "hyperbaric-oxygen",
    category: "longevity",
    icon: "Wind",
    zh: {
      name: "氧舱疗法",
      tagline: "高压氧舱疗法",
      summary: "高压氧舱疗法。",
      overview: "提供高压氧舱疗法，在高压环境下吸入纯氧，促进组织修复和细胞再生。",
      highlights: ["高压氧舱", "纯氧吸入", "组织修复", "细胞再生"],
      audience: ["需要氧疗", "希望促进修复", "关注细胞健康"],
    },
    en: {
      name: "Hyperbaric Oxygen",
      tagline: "Hyperbaric oxygen chamber therapy",
      summary: "Hyperbaric oxygen chamber therapy for tissue repair and cellular regeneration.",
      overview: "Provides hyperbaric oxygen chamber therapy, inhaling pure oxygen in high-pressure environment to promote tissue repair and cellular regeneration.",
      highlights: ["Hyperbaric chamber", "Pure oxygen inhalation", "Tissue repair", "Cellular regeneration"],
      audience: ["Those needing oxygen therapy", "People wanting repair promotion", "Those focused on cellular health"],
    },
  },
  {
    slug: "dietitian-plan",
    category: "longevity",
    icon: "Salad",
    zh: {
      name: "私人专属营养师定制营养方案",
      tagline: "私人专属营养师定制营养方案",
      summary: "私人营养师定制营养方案。",
      overview: "由私人营养师为您定制个性化营养方案，包括饮食计划、营养补充、健康指导等。",
      highlights: ["私人营养师", "个性化方案", "饮食计划", "健康指导"],
      audience: ["需要营养指导", "希望定制饮食", "关注营养健康"],
    },
    en: {
      name: "Dietitian Plan",
      tagline: "Customized nutritional plan by private dietitian",
      summary: "Personalized nutritional plan customized by private dietitian.",
      overview: "Private dietitian customizes personalized nutritional plan including diet plans, nutritional supplementation, and health guidance.",
      highlights: ["Private dietitian", "Personalized plans", "Diet plans", "Health guidance"],
      audience: ["Those needing nutritional guidance", "People wanting customized diets", "Those focused on nutritional health"],
    },
  },
];

export function getService(slug: string): Service | undefined {
  return SERVICES.find((s) => s.slug === slug);
}

export function servicesByCategory(category: ServiceCategory): Service[] {
  return SERVICES.filter((s) => s.category === category);
}
