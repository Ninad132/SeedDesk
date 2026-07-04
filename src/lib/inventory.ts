import { demoSession } from "./session";
import type { SeedLot } from "./types";

export const initialSeedLots: SeedLot[] = [
  {
    id: "lot-001",
    companyId: demoSession.company.id,
    crop: "Wheat",
    varietyName: "GW-513",
    lotNumber: "MAR-25-12-763-20 (CI)",
    seedClass: "CI",
    packingKg: 40,
    openingBags: 300,
    soldBags: 0,
    holdBags: 0,
    rate: 5500,
    sourceState: "MP"
  },
  {
    id: "lot-002",
    companyId: demoSession.company.id,
    crop: "Wheat",
    varietyName: "HI-1650 (Pusa Ojaswi)",
    lotNumber: "MAR-25-12-763-40 (FII)",
    seedClass: "FII",
    packingKg: 40,
    openingBags: 162,
    soldBags: 12,
    holdBags: 5,
    rate: 5500,
    sourceState: "MP"
  },
  {
    id: "lot-003",
    companyId: demoSession.company.id,
    crop: "Gram",
    varietyName: "JKG 5 Kabuli",
    lotNumber: "40KG",
    seedClass: "TL",
    packingKg: 40,
    openingBags: 48,
    soldBags: 42,
    holdBags: 0,
    rate: 12000,
    sourceState: "GJ"
  }
];

export function availableBags(lot: SeedLot) {
  return lot.openingBags - lot.soldBags - lot.holdBags;
}

export function quantityQuintal(bags: number, packingKg: number) {
  return (bags * packingKg) / 100;
}

export function stockValue(lot: SeedLot) {
  return quantityQuintal(availableBags(lot), lot.packingKg) * lot.rate;
}
