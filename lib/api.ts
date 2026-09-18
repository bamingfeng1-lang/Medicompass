// Central place for talking to the Python (FastAPI) backend.
//
// Same-origin proxy setup (see next.config.mjs `rewrites`):
// - Client components call relative /api/... paths, which the Next.js server
//   proxies to the backend. Being same-origin, the session cookie is sent
//   automatically and there are no CORS/cookie issues.
// - Server components (RSC) run in Node and DON'T go through the browser or the
//   rewrite proxy, so they call the backend directly and forward the cookie.

// Client-side base is empty => requests hit the same origin (proxied by Next).
export const CLIENT_API_BASE = "";

// Server-side base: the backend origin (same value used by the rewrite proxy).
export const SERVER_API_BASE =
  process.env.API_PROXY_TARGET ||
  process.env.API_BASE_URL ||
  "http://localhost:8000";

/** Build a client-side (same-origin) API URL. */
export function clientApi(path: string): string {
  return path;
}

/** Build a full URL against the server-side API base (direct to backend). */
export function serverApi(path: string): string {
  return `${SERVER_API_BASE}${path}`;
}

/**
 * Server-side fetch to the backend that forwards the admin session cookie
 * from the incoming request (Next.js server components don't do this
 * automatically, and they bypass the rewrite proxy). Returns the Response;
 * callers handle status.
 */
export async function serverFetch(path: string, init?: RequestInit): Promise<Response> {
  // Imported lazily to keep this module usable from client components too.
  const { cookies } = await import("next/headers");
  const cookieHeader = cookies().toString();
  return fetch(serverApi(path), {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      cookie: cookieHeader,
    },
    cache: "no-store",
  });
}

export type CurrentUser = {
  userId: number;
  phone: string;
  displayName: string;
  roles: string[];
};

export type PatientProfile = {
  userId: number;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  needType: string;
  destination: string | null;
  condition: string;
};

/**
 * Server-side: resolve the currently logged-in user from the session cookie,
 * or null if not authenticated. Safe to call in server components / layouts.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const res = await serverFetch("/api/auth/me");
    if (!res.ok) return null;
    return (await res.json()) as CurrentUser;
  } catch {
    return null;
  }
}

export type CurrentAdmin = {
  username: string;
};

/**
 * Server-side: resolve the logged-in admin from the admin session cookie,
 * or null if not authenticated. Safe to call in server components / layouts.
 */
export async function getCurrentAdmin(): Promise<CurrentAdmin | null> {
  try {
    const res = await serverFetch("/api/admin/me");
    if (!res.ok) return null;
    return (await res.json()) as CurrentAdmin;
  } catch {
    return null;
  }
}

/** Server-side: the logged-in user's patient registration profile, or null. */
export async function getCurrentUserProfile(): Promise<PatientProfile | null> {
  try {
    const res = await serverFetch("/api/auth/profile");
    if (!res.ok) return null;
    return (await res.json()) as PatientProfile;
  } catch {
    return null;
  }
}

export type MyApplicationListItem = {
  id: number;
  applicationNo: string | null;
  fullName: string;
  email: string;
  needType: string;
  serviceName: string | null;
  country: string | null;
  message: string | null;
  attachmentCount: number;
  aiSummaryStatus: string;
  status: string;
  createdAt: string;
};

export type MyAttachment = {
  id: number;
  originalName: string;
  mimeType: string;
  size: number;
  kind: string;
  createdAt: string;
};

export type MyApplicationDetail = {
  id: number;
  userId: number | null;
  patientId: number | null;
  patientNo: string | null;
  applicationNo: string | null;
  fullName: string;
  email: string;
  phone: string;
  country: string | null;
  needType: string;
  serviceCategory: string | null;
  serviceSlug: string | null;
  serviceName: string | null;
  destination: string | null;
  condition: string | null;
  message: string | null;
  lang: string;
  status: string;
  assignedToType: string | null;
  assignedToId: number | null;
  assignedName: string | null;
  assignedDoctorId: number | null;
  assignedDoctorName: string | null;
  assignedProviderId: number | null;
  assignedProviderName: string | null;
  acceptedAt: string | null;
  rejectReason: string | null;
  medicalSummary: string | null;
  labResults: string | null;
  currentTreatment: string | null;
  question1: string | null;
  question2: string | null;
  question3: string | null;
  doctorAnswer1: string | null;
  doctorAnswer2: string | null;
  doctorAnswer3: string | null;
  translatedAnswer1: string | null;
  translatedAnswer2: string | null;
  translatedAnswer3: string | null;
  finalBilingualReportUrl: string | null;
  // CAR-T specific fields
  hospital: string | null;
  expertDoctor: string | null;
  arrivalDatetime: string | null;
  flightNumber: string | null;
  consultationDatetime: string | null;
  createdAt: string;
  attachments: MyAttachment[];
};

/** Server-side: applications/enquiries owned by the logged-in user. */
export async function getMyApplications(): Promise<MyApplicationListItem[]> {
  try {
    const res = await serverFetch("/api/auth/applications");
    if (!res.ok) return [];
    return (await res.json()) as MyApplicationListItem[];
  } catch {
    return [];
  }
}

/** Server-side: one of the logged-in user's applications, or null if not owned. */
export async function getMyApplication(id: string | number): Promise<MyApplicationDetail | null> {
  try {
    const res = await serverFetch(`/api/auth/applications/${id}`);
    if (!res.ok) return null;
    return (await res.json()) as MyApplicationDetail;
  } catch {
    return null;
  }
}

/** Server-side: applications assigned to the logged-in provider/doctor. */
export async function getAssignedApplications(): Promise<MyApplicationListItem[]> {
  try {
    const res = await serverFetch("/api/auth/applications/assigned");
    if (!res.ok) return [];
    return (await res.json()) as MyApplicationListItem[];
  } catch {
    return [];
  }
}

/** Server-side: an application assigned to the logged-in provider/doctor, or null. */
export async function getAssignedApplication(
  id: string | number,
): Promise<MyApplicationDetail | null> {
  try {
    const res = await serverFetch(`/api/auth/applications/assigned/${id}`);
    if (!res.ok) return null;
    return (await res.json()) as MyApplicationDetail;
  } catch {
    return null;
  }
}

/** Client-side: provider accepts an application. */
export async function acceptApplication(id: number): Promise<boolean> {
  const res = await fetch(clientApi(`/api/auth/applications/${id}/accept`), { method: "POST", credentials: "include" });
  return res.ok;
}

/** Client-side: provider rejects an application with a required reason. */
export async function rejectApplication(id: number, reason: string): Promise<boolean> {
  const res = await fetch(clientApi(`/api/auth/applications/${id}/reject`), {
    method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
    body: JSON.stringify({ reason }),
  });
  return res.ok;
}

type StructurePayload = {
  medicalSummary: string;
  labResults: string;
  currentTreatment: string;
  question1: string;
  question2: string;
  question3: string;
};

/** Client-side: provider submits the structured medical summary + questions. */
export async function structureApplication(id: number, payload: StructurePayload): Promise<boolean> {
  const res = await fetch(clientApi(`/api/auth/applications/${id}/structure`), {
    method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
    body: JSON.stringify(payload),
  });
  return res.ok;
}

/** Client-side: provider uploads the final bilingual report PDF. */
export async function uploadFinalReport(id: number, file: File): Promise<boolean> {
  const fd = new FormData();
  fd.append("reportFile", file);
  const res = await fetch(clientApi(`/api/auth/applications/${id}/report`), {
    method: "POST", credentials: "include", body: fd,
  });
  return res.ok;
}

type TranslatePayload = {
  translatedAnswer1: string;
  translatedAnswer2: string;
  translatedAnswer3: string;
};

/** Client-side: provider submits Chinese translations -> ADMIN_QC. */
export async function translateApplication(id: number, payload: TranslatePayload): Promise<boolean> {
  const res = await fetch(clientApi(`/api/auth/applications/${id}/translate`), {
    method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
    body: JSON.stringify(payload),
  });
  return res.ok;
}

type OpinionPayload = { answer1: string; answer2: string; answer3: string };

/** Client-side: doctor submits their three answers -> PROVIDER_TRANSLATING. */
export async function submitOpinion(id: number, payload: OpinionPayload): Promise<boolean> {
  const res = await fetch(clientApi(`/api/auth/applications/${id}/opinion`), {
    method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
    body: JSON.stringify(payload),
  });
  return res.ok;
}

/** Client-side: URL to download all source attachments as a zip. */
export function attachmentsArchiveUrl(id: number): string {
  return clientApi(`/api/auth/applications/${id}/attachments/archive`);
}

export type RegistrationAttachment = {
  id: number;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
};

export type ProviderProfile = {
  id: number;
  orgName: string;
  orgType: string;
  country: string;
  contactPerson: string;
  phone: string;
  email: string;
  cooperation: string;
  status: string;
  reviewNote: string | null;
  editable: boolean;
  attachments: RegistrationAttachment[];
};

export type DoctorProfile = {
  id: number;
  fullName: string;
  specialty: string;
  hospital: string;
  country: string;
  title: string;
  years: string | null;
  languages: string;
  remote: string;
  email: string;
  phone: string;
  status: string;
  reviewNote: string | null;
  editable: boolean;
  attachments: RegistrationAttachment[];
};

export type RegistrationListItem = {
  id: number;
  name: string;
  subtitle: string | null;
  country: string;
  status: string;
  attachmentCount: number;
  createdAt: string;
};

/** Server-side: the logged-in user's provider registration, or null. */
export async function getMyProviderProfile(): Promise<ProviderProfile | null> {
  try {
    const res = await serverFetch("/api/auth/registration/provider");
    if (!res.ok) return null;
    return (await res.json()) as ProviderProfile;
  } catch {
    return null;
  }
}

/** Server-side: the logged-in user's doctor registration, or null. */
export async function getMyDoctorProfile(): Promise<DoctorProfile | null> {
  try {
    const res = await serverFetch("/api/auth/registration/doctor");
    if (!res.ok) return null;
    return (await res.json()) as DoctorProfile;
  } catch {
    return null;
  }
}

/** Server-side: admin — list provider/doctor registrations, optional status filter. */
export async function getRegistrations(
  type: "providers" | "doctors",
  status?: string,
): Promise<RegistrationListItem[]> {
  try {
    const qs = status ? `?status=${encodeURIComponent(status)}` : "";
    const res = await serverFetch(`/api/admin/registrations/${type}${qs}`);
    if (!res.ok) return [];
    return (await res.json()) as RegistrationListItem[];
  } catch {
    return [];
  }
}




