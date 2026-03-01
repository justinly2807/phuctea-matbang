export interface LocationInfo {
  addressStreet: string;
  addressWard: string;
  addressDistrict: string;
  addressCity: string;
  landlordName?: string;
  landlordPhone?: string;
  rentPrice?: string;
  rentUnit?: string; // 'month' | 'year'
  areaSqm?: string;
  competitorNotes?: string;
  surveyorName?: string;
  surveyDate?: string;
  latitude?: number;
  longitude?: number;
}

export interface CriterionOption {
  score: number;
  label: string;
}

export interface Criterion {
  id: number;
  name: string;
  description: string;
  hint?: string;
  category: string;
  categoryId: number;
  options: CriterionOption[];
}

export interface EvaluationScores {
  [criterionId: string]: number;
}

export interface Evaluation {
  id: string;
  address_street: string;
  address_ward: string;
  address_district: string;
  address_city: string;
  landlord_name: string | null;
  landlord_phone: string | null;
  rent_price: string | null;
  rent_unit: string | null;
  area_sqm: string | null;
  competitor_notes: string | null;
  surveyor_name: string | null;
  survey_date: string | null;
  latitude: number | null;
  longitude: number | null;
  images: string[];
  scores: EvaluationScores;
  total_score: number;
  verdict: 'feasible' | 'potential' | 'risky';
  created_at: string;
}

export type VerdictType = 'feasible' | 'potential' | 'risky';

export interface CategoryScore {
  categoryId: number;
  categoryName: string;
  score: number;
  maxScore: number;
  percentage: number;
}

export function getVerdict(totalScore: number): VerdictType {
  if (totalScore >= 80) return 'feasible';
  if (totalScore >= 65) return 'potential';
  return 'risky';
}

export function getVerdictLabel(verdict: VerdictType): string {
  switch (verdict) {
    case 'feasible': return 'KHẢ THI';
    case 'potential': return 'CÓ TIỀM NĂNG';
    case 'risky': return 'NHIỀU RỦI RO';
  }
}

export function getVerdictColor(verdict: VerdictType): string {
  switch (verdict) {
    case 'feasible': return '#22C55E';
    case 'potential': return '#EAB308';
    case 'risky': return '#EF4444';
  }
}

export function getVerdictDescription(verdict: VerdictType): string {
  switch (verdict) {
    case 'feasible': return 'Mặt bằng đạt yêu cầu, có thể triển khai';
    case 'potential': return 'Có tiềm năng, nhưng cần thương lượng/điều chỉnh';
    case 'risky': return 'Nhiều rủi ro, nên thẩm định thêm hoặc tìm mặt bằng khác';
  }
}

export function getFullAddress(e: Evaluation | LocationInfo): string {
  if ('address_street' in e) {
    return `${e.address_street}, ${e.address_ward}, ${e.address_district}, ${e.address_city}`;
  }
  return `${e.addressStreet}, ${e.addressWard}, ${e.addressDistrict}, ${e.addressCity}`;
}
