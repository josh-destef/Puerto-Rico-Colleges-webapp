export interface MajorsData {
  nursing: string | null;
  engineering: string | null;
  humanities: string | null;
  social_sciences: string | null;
  bench_sciences: string | null;
  business: string | null;
  pre_law: string | null;
  miscellaneous: string | null;
  grad_programs: string | null;
}

export interface FlagsData {
  has_nursing: boolean;
  has_engineering: boolean;
  has_humanities: boolean;
  has_business: boolean;
  has_grad: boolean;
  is_public: boolean;
  is_active: boolean;
  is_branch: boolean;
}

export interface InstitutionProperties {
  id: number | null;
  name: string;
  name_scorecard?: string;
  city: string;
  zip: string;
  website: string;
  is_main_campus: boolean;
  parent_id: number | null;
  ownership: 'Public' | 'Private Non-Profit' | 'Private For-Profit';
  level: '2-year' | '4-year';
  accreditor: string;
  enrollment: number | null;
  active: boolean;
  data_source?: string;
  majors: MajorsData;
  flags: FlagsData;
  admission_rate: number | null;
  completion_rate: number | null;
  tuition_in_state: number | null;
  tuition_out_state?: number | null;
  avg_net_price: number | null;
  median_debt: number | null;
  median_earnings_10yr: number | null;
  open_admission?: boolean;
}

export interface InstitutionFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: InstitutionProperties;
}

export interface InstitutionCollection {
  type: 'FeatureCollection';
  features: InstitutionFeature[];
}
