// Shared shaper for 就诊记录 (visit) API responses. Lives outside the route
// module because Next.js route files may only export request handlers.
// Never leaks storedPath — attachment bytes are served via the [attId] route.

export type VisitWithAttachments = {
  id: string; visitType: string; patientName: string; hospital: string; department: string;
  doctor: string; visitDate: Date; diagnosis: string; notes: string; createdAt: Date;
  attachments: {
    id: string; originalName: string; mimeType: string; size: number; createdAt: Date;
  }[];
};

export function shapeVisit(v: VisitWithAttachments) {
  return {
    id: v.id,
    visitType: v.visitType,
    patientName: v.patientName,
    hospital: v.hospital,
    department: v.department,
    doctor: v.doctor,
    visitDate: v.visitDate,
    diagnosis: v.diagnosis,
    notes: v.notes,
    createdAt: v.createdAt,
    attachments: v.attachments.map((a) => ({
      id: a.id,
      originalName: a.originalName,
      mimeType: a.mimeType,
      size: a.size,
      createdAt: a.createdAt,
    })),
  };
}
