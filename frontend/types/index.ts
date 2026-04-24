// ============================================================
//  INNOVATION SL — SHARED TYPE DEFINITIONS
// ============================================================

export type GenderType    = "Male" | "Female" | "Non-binary" | "Prefer not to say" | "Unknown";
export type AgeGroupType  = "Girl" | "Youth" | "Adult" | "Aged" | "Unknown";
export type EventType     = "FPN" | "FIW" | "GEW" | "OSVP" | "Dare2Aspire" | "EWC" | "SLEDP" | "NYEFF" | "Other";
export type RoleAtEvent   = "Pitcher" | "Exhibitor" | "Speaker" | "Judge" | "Host" | "Panelist" | "Volunteer" | "VIP" | "Delegate" | "Participant" | "Staff";
export type GrantType     = "Grant" | "Prize" | "Seed_capital" | "Loan" | "In-kind" | "Other";
export type DiagTool      = "ISL_Scorecard" | "SME_TA_Diagnosis" | "ILO_Acceleration" | "Lendability_Index" | "VIRAL_Assessment" | "Other";
export type RecordStatus  = "Active" | "Inactive" | "Merged" | "Quarantined";
export type ImportStatus  = "Staging" | "Clean" | "Approved" | "Rejected" | "Needs_review";
export type VipType       = "Investor" | "Diplomat" | "Government" | "Media" | "Corporate" | "Academic" | "Development_partner";

// ── PERSON ──────────────────────────────────────────────────
export interface Person {
  person_id:              string;
  isl_ref:                string;
  full_name:              string;
  preferred_name?:        string;
  gender:                 GenderType;
  date_of_birth?:         string;
  age_group:              AgeGroupType;
  nationality:            string;
  nin?:                   string;
  phone_primary?:         string;
  phone_secondary?:       string;
  email_primary?:         string;
  email_secondary?:       string;
  location?:              string;
  district?:              string;
  region?:                string;
  // equity flags
  is_woman:               boolean;
  is_girl:                boolean;
  is_youth:               boolean;
  is_aged:                boolean;
  is_pwd:                 boolean;
  is_repeat_beneficiary:  boolean;
  is_outside_freetown:    boolean;
  // engagement summary
  first_engagement_date?: string;
  first_programme?:       string;
  total_events_attended:  number;
  total_programmes:       number;
  completeness_score:     number;
  record_status:          RecordStatus;
  import_status:          ImportStatus;
  data_sources?:          string[];
  notes?:                 string;
  created_at:             string;
  updated_at:             string;
}

// ── ORGANISATION ────────────────────────────────────────────
export interface Organisation {
  org_id:             string;
  isl_ref:            string;
  founder_person_id?: string;
  name:               string;
  sector?:            string;
  sub_sector?:        string;
  stage?:             string;
  org_type?:          string;
  reg_number?:        string;
  founded_date?:      string;
  location?:          string;
  district?:          string;
  website?:           string;
  description?:       string;
  woman_led:          boolean;
  youth_led:          boolean;
  diaspora_led:       boolean;
  active:             boolean;
  completeness_score: number;
  created_at:         string;
  updated_at:         string;
}

// ── EVENT ───────────────────────────────────────────────────
export interface Event {
  event_id:              string;
  isl_ref:               string;
  name:                  string;
  event_type:            EventType;
  programme:             string;
  edition_year:          number;
  edition_number?:       number;
  theme?:                string;
  date_start?:           string;
  date_end?:             string;
  venue?:                string;
  city:                  string;
  funder?:               string;
  partner_organisations?: string[];
  total_registered:      number;
  total_attended:        number;
  vip_count:             number;
  female_count:          number;
  male_count:            number;
  youth_count:           number;
  aged_count:            number;
  report_doc_link?:      string;
  drive_folder_link?:    string;
  notes?:                string;
  created_at:            string;
}

// ── ATTENDANCE ──────────────────────────────────────────────
export interface Attendance {
  attendance_id:  string;
  person_id:      string;
  event_id:       string;
  role_at_event:  RoleAtEvent;
  registered:     boolean;
  attended:       boolean;
  day_number?:    number;
  source_form?:   string;
  import_batch?:  string;
  notes?:         string;
  created_at:     string;
  // joined
  person?:        Pick<Person, "full_name" | "gender" | "is_woman" | "is_youth" | "location">;
  event?:         Pick<Event, "name" | "event_type" | "edition_year">;
}

// ── PITCH ───────────────────────────────────────────────────
export interface Pitch {
  pitch_id:           string;
  isl_ref:            string;
  event_id:           string;
  person_id:          string;
  org_id?:            string;
  application_code?:  string;
  theme?:             string;
  category?:          string;
  idea_description?:  string;
  pitch_stage?:       string;
  score?:             number;
  rank?:              number;
  winner_flag:        boolean;
  finalist_flag:      boolean;
  prize_amount?:      number;
  prize_currency:     string;
  prize_type?:        GrantType;
  first_female_flag:  boolean;
  first_time_flag:    boolean;
  repeat_pitcher_flag:boolean;
  pitch_deck_link?:   string;
  feedback_doc_link?: string;
  notes?:             string;
  created_at:         string;
  // joined
  person?:            Pick<Person, "full_name" | "gender" | "is_woman" | "location">;
  organisation?:      Pick<Organisation, "name" | "sector">;
  event?:             Pick<Event, "name" | "event_type" | "edition_year">;
}

// ── GRANT / CAPITAL ─────────────────────────────────────────
export interface GrantCapital {
  grant_id:           string;
  isl_ref:            string;
  org_id?:            string;
  person_id?:         string;
  funder:             string;
  programme?:         string;
  grant_type:         GrantType;
  amount_local?:      number;
  amount_usd?:        number;
  currency:           string;
  disbursement_date?: string;
  recipient_gender?:  GenderType;
  recipient_youth:    boolean;
  woman_led_business: boolean;
  milestone_1?:       string;
  milestone_2?:       string;
  milestone_3?:       string;
  outcome_jobs?:      number;
  outcome_revenue?:   number;
  repayment_status?:  string;
  notes?:             string;
  created_at:         string;
  // joined
  person?:            Pick<Person, "full_name" | "gender">;
  organisation?:      Pick<Organisation, "name" | "sector">;
}

// ── DIAGNOSTIC ──────────────────────────────────────────────
export interface Diagnostic {
  diag_id:              string;
  isl_ref:              string;
  org_id:               string;
  assessor?:            string;
  diag_date:            string;
  tool_used:            DiagTool;
  strategic_score?:     number;
  process_score?:       number;
  support_score?:       number;
  overall_score?:       number;
  tier?:                string;
  lendability_score?:   number;
  gap_priority?:        string;
  ta_recommended?:      string;
  woman_led_flag:       boolean;
  youth_led_flag:       boolean;
  scorecard_doc_link?:  string;
  notes?:               string;
  created_at:           string;
  organisation?:        Pick<Organisation, "name" | "sector">;
}

export interface TrainingSession {
  training_id:          string;
  event_id?:            string;
  programme_funder?:    string;
  session_type?:        string;
  topic:                string;
  facilitator?:         string;
  session_date?:        string;
  duration_hours?:      number;
  format:               string;
  total_registered:     number;
  total_attended:       number;
  female_count:         number;
  male_count:           number;
  youth_count:          number;
  satisfaction_score?:  number;
  pre_score?:           number;
  post_score?:          number;
  notes?:               string;
  created_at:           string;
  event?:               Pick<Event, "name" | "event_type" | "edition_year">;
}

export interface Cohort {
  cohort_id:            string;
  isl_ref?:             string;
  programme_name:       string;
  funder?:              string;
  cohort_number?:       number;
  year?:                number;
  start_date?:          string;
  end_date?:            string;
  sector_focus?:        string;
  stage_focus?:         string;
  total_startups:       number;
  female_led_count:     number;
  youth_led_count:      number;
  regional_count:       number;
  graduated_count:      number;
  jobs_created:         number;
  revenue_post?:        number;
  eso_trained_flag:     boolean;
  notes?:               string;
  created_at:           string;
  cohort_member?:       Array<{ count: number | null }> | null;
}

export interface ESOPartner {
  eso_id:               string;
  name:                 string;
  eso_type?:            string;
  country:              string;
  city?:                string;
  trained_by_isl:       boolean;
  training_date?:       string;
  active_partner:       boolean;
  funder?:              string;
  contact_person?:      string;
  website?:             string;
  notes?:               string;
  created_at:           string;
}

export interface VipContact {
  contact_id:           string;
  person_id:            string;
  title?:               string;
  organisation?:        string;
  contact_type:         VipType;
  country?:             string;
  events_attended:      number;
  last_engaged?:        string;
  relationship_owner?:  string;
  engagement_notes?:    string;
  notes?:               string;
  created_at:           string;
  person?:              Pick<Person, "full_name" | "email_primary" | "phone_primary">;
}

// ── STAGING IMPORT ──────────────────────────────────────────
export interface StagingImport {
  staging_id:            string;
  source_name:           string;
  source_file?:          string;
  import_batch:          string;
  target_table:          string;
  raw_data:              Record<string, unknown>;
  mapped_data?:          Record<string, unknown>;
  validation_errors?:    ValidationError[];
  duplicate_match_id?:   string;
  duplicate_confidence?: number;
  import_status:         ImportStatus;
  reviewed_by?:          string;
  reviewed_at?:          string;
  notes?:                string;
  created_at:            string;
}

export interface ValidationError {
  field:    string;
  message:  string;
  severity: "error" | "warning" | "info";
  value?:   unknown;
}

// ── DASHBOARD VIEWS ─────────────────────────────────────────
export interface EquityDashboard {
  total_beneficiaries:    number;
  female_beneficiaries:   number;
  girls_under_18:         number;
  youth_beneficiaries:    number;
  aged_beneficiaries:     number;
  pwd_beneficiaries:      number;
  regional_beneficiaries: number;
  repeat_beneficiaries:   number;
  pct_female:             number;
}

export interface BeneficiaryByYear {
  year:   number;
  total:  number;
  female: number;
  male:   number;
  youth:  number;
}

export interface CapitalSummary {
  funder:          string;
  grant_type:      string;
  disbursements:   number;
  total_usd:       number;
  to_women_led:    number;
  usd_to_women:    number;
}

// ── FILTER PARAMS ───────────────────────────────────────────
export interface PeopleFilters {
  search?:     string;
  gender?:     GenderType;
  age_group?:  AgeGroupType;
  district?:   string;
  year?:       number;
  programme?:  EventType;
  is_woman?:   boolean;
  is_youth?:   boolean;
  is_repeat?:  boolean;
  winner?:     boolean;
  page?:       number;
  per_page?:   number;
}

export interface EventFilters {
  search?:      string;
  event_type?:  EventType;
  year?:        number;
  funder?:      string;
  page?:        number;
  per_page?:    number;
}

// ── USER ROLES (Clerk metadata) ──────────────────────────────
export type UserRole = "superadmin" | "admin" | "management" | "staff" | "donor" | "public";

export interface UserMetadata {
  role:       UserRole;
  full_name:  string;
  department?: string;
}
