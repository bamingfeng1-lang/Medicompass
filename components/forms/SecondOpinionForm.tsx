"use client";

import { useState, useRef, useEffect } from "react";
<<<<<<< HEAD
import { CheckCircle2, Upload, X, FileText } from "lucide-react";
=======
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
>>>>>>> f18247c (增加CART)
import Link from "next/link";
import type { Locale } from "@/lib/brand";
import type { Dictionary } from "@/lib/dictionaries";
import { clientApi } from "@/lib/api";
<<<<<<< HEAD

const MAX_FILE_BYTES = 15 * 1024 * 1024;
const ALLOWED = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
  "image/heif",
];
=======
import { FileDropzone } from "@/components/FileDropzone";
>>>>>>> f18247c (增加CART)

type Values = {
  fullName: string;
  email: string;
  phone: string;
  country: string;
<<<<<<< HEAD
=======
  serviceCategory: string;
>>>>>>> f18247c (增加CART)
  needType: string;
  destination: string;
  condition: string;
};

<<<<<<< HEAD
function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

=======
>>>>>>> f18247c (增加CART)
export function SecondOpinionForm({
  lang,
  dict,
  initialValues,
  hideAgree = false,
  isLoggedIn = false,
}: {
  lang: Locale;
  dict: Dictionary;
  initialValues?: Partial<Values>;
  hideAgree?: boolean;
  isLoggedIn?: boolean;
}) {
  const t = dict.register;
  const c = dict.common;
  const a = dict.apply;
  const f = t.fields;
  const ph = t.placeholders;
<<<<<<< HEAD

  const [values, setValues] = useState<Values>({
    fullName: initialValues?.fullName ?? "",
    email: initialValues?.email ?? "",
    phone: initialValues?.phone ?? "",
    country: initialValues?.country ?? "",
    needType: initialValues?.needType ?? f.needTypeOptions[0],
    destination: initialValues?.destination ?? "",
    condition: initialValues?.condition ?? "",
=======
  const router = useRouter();

  const [values, setValues] = useState<Values>(() => {
    // 根据 serviceCategory 获取对应的 needType 选项
    const getInitialNeedType = () => {
      if (initialValues?.needType) return initialValues.needType;
      if (initialValues?.serviceCategory) {
        const categoryMap: Record<string, string[]> = {
          "国际二诊服务": ["国际二诊"],
          "CAR-T": ["CAR-T"],
          "私人医生": ["健康档案建立"],
          "基础医疗": ["医疗预约"],
          "跨境国际医疗": ["医疗档案建立"],
          "长寿医学": ["医疗档案建立"],
          "Second Opinion Service": ["Second Opinion"],
          "Private Doctor": ["Health Record"],
          "Basic Medical": ["Outpatient Access"],
          "Cross-border Medical": ["Medical Record"],
          "Longevity Medical": ["Medical Record"],
        };
        const options = categoryMap[initialValues.serviceCategory];
        if (options && options.length > 0) return options[0];
      }
      return f.needTypeOptions[0];
    };

    return {
      fullName: initialValues?.fullName ?? "",
      email: initialValues?.email ?? "",
      phone: initialValues?.phone ?? "",
      country: initialValues?.country ?? "",
      serviceCategory: initialValues?.serviceCategory || f.serviceCategoryOptions[0],
      needType: getInitialNeedType(),
      destination: initialValues?.destination ?? "",
      condition: initialValues?.condition ?? "",
    };
>>>>>>> f18247c (增加CART)
  });
  const [files, setFiles] = useState<File[]>([]);
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fileError, setFileError] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");
<<<<<<< HEAD
  const inputRef = useRef<HTMLInputElement>(null);
=======
>>>>>>> f18247c (增加CART)
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "done") {
      successRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [status]);

  const set = (name: keyof Values, v: string) => {
    setValues((s) => ({ ...s, [name]: v }));
    setErrors((e) => ({ ...e, [name]: "" }));
  };

<<<<<<< HEAD
  // Only the "国际二诊" (second-opinion) need type collects medical attachments.
  // It is optional — the client may upload later when the admin requests it.
  const isSecondOpinion = values.needType === f.needTypeOptions[0];

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    setFileError("");
    const next: File[] = [...files];
    for (const file of Array.from(list)) {
      if (file.size > MAX_FILE_BYTES) {
        setFileError(`${a.fileTooLarge}${file.name}`);
        continue;
      }
      if (!ALLOWED.includes(file.type)) {
        setFileError(`${a.fileTypeError}${file.name}`);
        continue;
      }
      if (!next.some((x) => x.name === file.name && x.size === file.size)) next.push(file);
    }
    setFiles(next);
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeFile = (i: number) => setFiles((s) => s.filter((_, idx) => idx !== i));

  const validate = () => {
    const e: Record<string, string> = {};
    const req: (keyof Values)[] = ["fullName", "email", "phone", "country", "needType", "condition"];
=======
  // Only the "国际二诊服务" (second-opinion) and "CAR-T" service categories collect medical attachments.
  // It is optional — the client may upload later when the admin requests it.
  const isSecondOpinion = values.serviceCategory === f.serviceCategoryOptions[0] || 
                          values.serviceCategory === "Second Opinion Service" ||
                          values.serviceCategory === "CAR-T";

  // Show destination field only for "跨境国际医疗"
  const showDestination =
    values.serviceCategory === f.serviceCategoryOptions[4] ||
    values.serviceCategory === "Cross-border Medical";

  // Get need type options based on service category
  const getNeedTypeOptions = (category?: string) => {
    const cat = category ?? values.serviceCategory;
    const categoryMap: Record<string, string[]> = {
      "国际二诊服务": ["国际二诊"],
      "CAR-T": ["CAR-T"],
      "私人医生": ["健康档案建立", "体检套餐定制", "检测定制", "报告解读", "线上咨询", "多学科会诊", "慢病配药"],
      "基础医疗": ["医疗预约", "绿色就医通道", "住院 VIP 协调", "私人陪诊", "礼宾车服务", "24 小时就医协助", "智能穿戴监测"],
      "跨境国际医疗": ["医疗档案建立", "报告翻译", "全球找药", "多学科诊疗", "境外诊疗推荐", "入境诊疗推荐", "辅助生殖协调", "精密体检"],
      "长寿医学": ["医疗档案建立", "精准检测", "细胞焕活方案", "静脉输注", "营养素套餐", "体重管理", "中医辩证", "菌群移植", "运动康复", "心理健康", "血液净化", "氧舱疗法", "营养方案"],
      "Second Opinion Service": ["Second Opinion"],
      "Private Doctor": ["Health Record", "Screening Design", "Lab Tests", "Report Interpretation", "Online Consultation", "MDT Consultation", "Medication Service"],
      "Basic Medical": ["Outpatient Access", "VIP Green Channel", "Inpatient VIP", "Medical Chaperone", "Limousine Service", "24-hour Assistance", "Smart Monitoring"],
      "Cross-border Medical": ["Medical Record", "Report Translation", "Global Medicine", "MDT Service", "Overseas Recommendation", "China Medical Plan", "IVF Coordination", "Precision Screening"],
      "Longevity Medical": ["Medical Record", "Precision Testing", "Cellular Rejuvenation", "IV Health", "Nutritional Package", "Weight Management", "TCM", "Flora Transplant", "Exercise Rehab", "Psychological Health", "Blood Purification", "Hyperbaric Oxygen", "Dietitian Plan"],
    };
    return categoryMap[cat] || f.needTypeOptions;
  };

  const validate = () => {
    const e: Record<string, string> = {};
    const req: (keyof Values)[] = ["fullName", "email", "phone", "country", "serviceCategory", "needType", "condition"];
>>>>>>> f18247c (增加CART)
    for (const k of req) if (!values[k].trim()) e[k] = c.required;
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) e.email = c.invalidEmail;
    if (!hideAgree && !agree) e.__agree = c.agreeError;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setStatus("submitting");

    const fd = new FormData();
    fd.append("lang", lang);
<<<<<<< HEAD
    (Object.keys(values) as (keyof Values)[]).forEach((k) => fd.append(k, values[k]));
=======
    fd.append("fullName", values.fullName);
    fd.append("email", values.email);
    fd.append("phone", values.phone);
    fd.append("country", values.country);
    fd.append("serviceCategory", values.serviceCategory);
    fd.append("needType", values.needType);
    fd.append("destination", values.destination);
    fd.append("condition", values.condition);
>>>>>>> f18247c (增加CART)
    files.forEach((file) => fd.append("attachments", file));

    try {
      const res = await fetch(clientApi("/api/applications"), {
        method: "POST",
        credentials: "include",
        body: fd,
      });
<<<<<<< HEAD
      if (!res.ok) throw new Error("submit failed");
      setStatus("done");
    } catch {
=======
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Submit failed:", res.status, errorData);
        setFileError(`${a.submitError} (${res.status}: ${JSON.stringify(errorData)})`);
        setStatus("idle");
        return;
      }
      if (isLoggedIn) {
        router.push(`/${lang}/account/applications`);
        router.refresh();
      } else {
        setStatus("done");
      }
    } catch (err) {
      console.error("Submit error:", err);
>>>>>>> f18247c (增加CART)
      setFileError(a.submitError);
      setStatus("idle");
    }
  };

  if (status === "done") {
    return (
      <div ref={successRef} className="card mx-auto max-w-lg scroll-mt-24 text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-brand-deep" />
        <h2 className="mt-5 text-2xl font-bold text-brand-950">{c.successTitle}</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">{c.successDesc}</p>
        {!isLoggedIn && (
          <Link
            href={`/${lang}/register/quick?phone=${encodeURIComponent(values.phone)}&name=${encodeURIComponent(values.fullName)}&email=${encodeURIComponent(values.email)}&need=${encodeURIComponent(values.needType)}`}
            className="btn-secondary mt-6"
          >
            {a.registerLink}
          </Link>
        )}
        <Link href={`/${lang}`} className="btn-primary mt-4">
          {c.backHome}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="card">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="fullName" label={f.fullName} required error={errors.fullName}>
          <input id="fullName" className="field-input" placeholder={ph.fullName}
            value={values.fullName} onChange={(e) => set("fullName", e.target.value)} />
        </Field>
        <Field id="email" label={f.email} required error={errors.email}>
          <input id="email" type="email" className="field-input" placeholder={ph.email}
            value={values.email} onChange={(e) => set("email", e.target.value)} />
        </Field>
        <Field id="phone" label={f.phone} required error={errors.phone}>
          <input id="phone" type="tel" className="field-input" placeholder={ph.phone}
            value={values.phone} onChange={(e) => set("phone", e.target.value)} />
        </Field>
        <Field id="country" label={f.country} required error={errors.country}>
          <input id="country" className="field-input" placeholder={ph.country}
            value={values.country} onChange={(e) => set("country", e.target.value)} />
        </Field>
<<<<<<< HEAD
        <Field id="needType" label={f.needType} required error={errors.needType}>
          <select id="needType" className="field-input"
            value={values.needType} onChange={(e) => set("needType", e.target.value)}>
            {f.needTypeOptions.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </Field>
=======
        <Field id="serviceCategory" label={f.serviceCategory} required error={errors.serviceCategory}>
          <select id="serviceCategory" className="field-input"
            value={values.serviceCategory} onChange={(e) => {
              const newCat = e.target.value;
              set("serviceCategory", newCat);
              set("needType", getNeedTypeOptions(newCat)[0]);
              const needsDest =
                newCat === f.serviceCategoryOptions[4] ||
                newCat === "Cross-border Medical";
              if (!needsDest) set("destination", "");
            }}>
            {f.serviceCategoryOptions.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </Field>
        <Field id="needType" label={f.needType} required error={errors.needType}>
          <select id="needType" className="field-input"
            value={values.needType} onChange={(e) => set("needType", e.target.value)}>
            {getNeedTypeOptions().map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </Field>
        {showDestination && (
>>>>>>> f18247c (增加CART)
        <Field id="destination" label={f.destination} error={errors.destination}>
          <input id="destination" className="field-input" placeholder={ph.destination}
            value={values.destination} onChange={(e) => set("destination", e.target.value)} />
        </Field>
<<<<<<< HEAD
=======
        )}
>>>>>>> f18247c (增加CART)
        <div className="sm:col-span-2">
          <Field id="condition" label={f.condition} required error={errors.condition}>
            <textarea id="condition" rows={4} className="field-input resize-none" placeholder={ph.condition}
              value={values.condition} onChange={(e) => set("condition", e.target.value)} />
          </Field>
        </div>
      </div>

      {/* Attachments — only for second-opinion; optional */}
      {isSecondOpinion && (
      <div className="mt-6">
        <label className="field-label">{a.uploadLabel}</label>
<<<<<<< HEAD
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
          className="mt-1 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50/40 px-6 py-8 text-center transition hover:border-brand-deep hover:bg-brand-50"
        >
          <Upload className="h-7 w-7 text-brand-deep" />
          <p className="mt-2 text-sm font-medium text-brand-deep">{a.uploadCta}</p>
          <p className="mt-1 text-xs text-slate-500">{a.uploadHint}</p>
          <input ref={inputRef} type="file" multiple accept={ALLOWED.join(",")}
            className="hidden" onChange={(e) => addFiles(e.target.files)} />
        </div>
        {fileError && <p className="mt-2 text-xs text-red-500">{fileError}</p>}

        {files.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {files.map((file, i) => (
              <li key={`${file.name}-${i}`} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2">
                <FileText className="h-4 w-4 shrink-0 text-brand-deep" />
                <span className="flex-1 truncate text-sm text-slate-700">{file.name}</span>
                <span className="text-xs text-slate-400">{fmtSize(file.size)}</span>
                <button type="button" onClick={() => removeFile(i)}
                  className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-red-500"
                  aria-label={a.remove}>
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-slate-400">{a.uploadEmpty}</p>
        )}
=======
        <FileDropzone
          files={files}
          onChange={setFiles}
          accept="application/pdf,image/png,image/jpeg,image/webp,image/heic,image/heif"
          labels={{
            cta: a.uploadCta,
            hint: a.uploadHint,
            empty: a.uploadEmpty,
            remove: a.remove,
            fileTooLarge: a.fileTooLarge,
            fileTypeError: a.fileTypeError,
          }}
        />
        {fileError && <p className="mt-2 text-xs text-red-500">{fileError}</p>}
>>>>>>> f18247c (增加CART)
      </div>
      )}

      {!hideAgree && (
        <div className="mt-6">
          <label className="flex cursor-pointer items-start gap-3">
            <input type="checkbox" checked={agree}
              onChange={(e) => { setAgree(e.target.checked); setErrors((x) => ({ ...x, __agree: "" })); }}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-deep focus:ring-brand-sky" />
<<<<<<< HEAD
            <span className="text-sm text-slate-600">{t.consent}</span>
=======
            <span className="text-sm text-slate-600">
              {(() => {
                const text = t.consent;
                const match = text.match(/^(.*?)《[^》]+》(.*)$/);
                if (match) {
                  return (
                    <>
                      {match[1]}
                      <Link href={`/${lang}/disclaimer`} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-deep hover:underline">
                        《{t.disclaimerLink}》
                      </Link>
                      {match[2]}
                    </>
                  );
                }
                return text;
              })()}
            </span>
>>>>>>> f18247c (增加CART)
          </label>
          {errors.__agree && <p className="mt-1 text-xs text-red-500">{errors.__agree}</p>}
        </div>
      )}

      <button type="submit" disabled={status === "submitting"} className="btn-primary mt-8 w-full">
        {status === "submitting" ? c.submitting : c.submit}
      </button>
    </form>
  );
}

function Field({
  id, label, required, error, children,
}: {
  id: string; label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
