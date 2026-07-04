import type { Session } from "./types";

export const demoSession: Session = {
  company: {
    id: "00000000-0000-0000-0000-000000000001",
    name: "Vasundhara Seeds",
    address: "52, Rajaswa Colony, Tanki Path, Freeganj, Ujjain, MP",
    phone: "0734-2530547, 9425332517",
    seedLicenseNumber: "1178",
    invoicePrefix: "VS"
  },
  user: {
    id: "00000000-0000-0000-0000-000000000101",
    companyId: "00000000-0000-0000-0000-000000000001",
    name: "Vasundhara Admin",
    role: "owner",
    preferredLanguage: "en"
  }
};
