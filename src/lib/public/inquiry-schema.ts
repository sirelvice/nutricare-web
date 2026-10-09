import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(160, "Use 160 characters or fewer."),
  email: z.string().trim().email("Enter a valid email address.").max(320),
  phone: z.string().trim().max(80, "Use 80 characters or fewer.").nullable().optional(),
  message: z.string().trim().min(1, "Enter a message.").max(5000, "Use 5,000 characters or fewer."),
});
export const partnerInquirySchema = z.object({
  orgName: z.string().trim().min(2, "Enter your organisation name (at least 2 characters).").max(160),
  contactName: z.string().trim().min(2, "Enter your contact name (at least 2 characters).").max(160),
  email: z.string().trim().email("Enter a valid email address.").max(320),
  country: z.string().trim().max(120).optional(),
  interest: z.enum(["pilot", "donation", "research", "integration", "other"]),
  message: z.string().trim().min(10, "Add at least 10 characters of context.").max(5000, "Use 5,000 characters or fewer."),
});
