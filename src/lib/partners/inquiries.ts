export type PartnerInquiry = {
  id: string;
  createdAt: string;

  orgName: string;
  contactName: string;
  email: string;

  country?: string;
  interest: "pilot" | "donation" | "research" | "integration" | "other";
  message: string;
};

const KEY = "nutricare.partner_inquiries.v1";

function uid() {
  return Math.random().toString(36).slice(2) + "-" + Date.now().toString(36);
}

export function loadInquiries(): PartnerInquiry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PartnerInquiry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveInquiry(input: Omit<PartnerInquiry, "id" | "createdAt">) {
  if (typeof window === "undefined") return;

  const existing = loadInquiries();
  const record: PartnerInquiry = {
    id: uid(),
    createdAt: new Date().toISOString(),
    ...input,
  };
  const next = [record, ...existing];
  window.localStorage.setItem(KEY, JSON.stringify(next));
  return record;
}

export function clearInquiries() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
