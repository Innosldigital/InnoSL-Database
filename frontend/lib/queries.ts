import { createAdminClient } from "./supabase";
import type {
  Person, Event, Pitch, GrantCapital, Diagnostic,
  EquityDashboard, BeneficiaryByYear, CapitalSummary,
  Cohort, TrainingSession, ESOPartner, VipContact,
  PeopleFilters, EventFilters, StagingImport
} from "@/types";

// ============================================================
//  PEOPLE
// ============================================================

export async function getPeople(filters: PeopleFilters = {}) {
  const supabase = createAdminClient();
  const { search, gender, age_group, district, year, programme,
          is_woman, is_youth, is_repeat, winner, page = 1, per_page = 20 } = filters;

  let query = supabase
    .from("person")
    .select(`
      *,
      attendance!left(
        event_id,
        role_at_event,
        attended,
        event!left(name, event_type, edition_year, programme)
      ),
      pitch!left(winner_flag, prize_amount, prize_type)
    `, { count: "exact" })
    .eq("record_status", "Active")
    .order("first_engagement_date", { ascending: false })
    .range((page - 1) * per_page, page * per_page - 1);

  if (search)     query = query.or(`full_name.ilike.%${search}%,email_primary.ilike.%${search}%,phone_primary.ilike.%${search}%`);
  if (gender)     query = query.eq("gender", gender);
  if (age_group)  query = query.eq("age_group", age_group);
  if (district)   query = query.eq("district", district);
  if (is_woman)   query = query.eq("is_woman", true);
  if (is_youth)   query = query.eq("is_youth", true);
  if (is_repeat)  query = query.eq("is_repeat_beneficiary", true);

  const { data, error, count } = await query;
  if (error) throw error;
  return { data: data as Person[], count: count ?? 0 };
}

export async function getPersonById(person_id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("person")
    .select(`
      *,
      organisation!left(*),
      attendance!left(
        *,
        event!left(*)
      ),
      pitch!left(
        *,
        event!left(*),
        organisation!left(name, sector)
      ),
      event_role!left(
        *,
        event!left(*)
      ),
      grant_capital!left(*),
      vip_contact!left(*)
    `)
    .eq("person_id", person_id)
    .single();
  if (error) throw error;
  return data;
}

export async function getFemaleBeneficiaries(filters: PeopleFilters = {}) {
  return getPeople({ ...filters, is_woman: true });
}

export async function getFirstFemaleWinners() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("v_first_female_winners")
    .select("*")
    .order("event_date", { ascending: true });
  if (error) throw error;
  return data;
}

export async function getRepeatBeneficiaries() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("v_repeat_beneficiaries")
    .select("*")
    .order("total_events_attended", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data;
}

// ============================================================
//  EVENTS
// ============================================================

export async function getEvents(filters: EventFilters = {}) {
  const supabase = createAdminClient();
  const { search, event_type, year, funder, page = 1, per_page = 20 } = filters;

  let query = supabase
    .from("event")
    .select("*", { count: "exact" })
    .order("date_start", { ascending: false })
    .range((page - 1) * per_page, page * per_page - 1);

  if (search)     query = query.ilike("name", `%${search}%`);
  if (event_type) query = query.eq("event_type", event_type);
  if (year)       query = query.eq("edition_year", year);
  if (funder)     query = query.ilike("funder", `%${funder}%`);

  const { data, error, count } = await query;
  if (error) throw error;
  return { data: data as Event[], count: count ?? 0 };
}

export async function getEventById(event_id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("event")
    .select(`
      *,
      attendance!left(*, person!left(full_name, gender, is_woman, is_youth, location)),
      event_role!left(*, person!left(full_name, gender)),
      pitch!left(*, person!left(full_name, gender, is_woman), organisation!left(name, sector)),
      training_session!left(*)
    `)
    .eq("event_id", event_id)
    .single();
  if (error) throw error;
  return data;
}

// ============================================================
//  PITCHES
// ============================================================

export async function getPitches(filters: { year?: number; event_type?: string; winner?: boolean } = {}) {
  const supabase = createAdminClient();
  let query = supabase
    .from("pitch")
    .select(`
      *,
      person!left(full_name, gender, is_woman, location),
      organisation!left(name, sector),
      event!left(name, event_type, edition_year)
    `)
    .order("created_at", { ascending: false });

  if (filters.winner)     query = query.eq("winner_flag", true);
  if (filters.event_type) query = query.eq("event.event_type", filters.event_type);

  const { data, error } = await query;
  if (error) throw error;

  let rows = (data ?? []) as Pitch[];
  if (filters.year) rows = rows.filter((row) => row.event?.edition_year === filters.year);
  return rows;
}

export async function getPitchById(pitch_id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("pitch")
    .select(`
      *,
      person!left(*),
      organisation!left(*),
      event!left(*)
    `)
    .eq("pitch_id", pitch_id)
    .single();
  if (error) throw error;
  return data;
}

// ============================================================
//  GRANTS & CAPITAL
// ============================================================

export async function getGrants(filters: { funder?: string; year?: number } = {}) {
  const supabase = createAdminClient();
  let query = supabase
    .from("grant_capital")
    .select(`
      *,
      person!left(full_name, gender),
      organisation!left(name, sector, woman_led)
    `)
    .order("disbursement_date", { ascending: false });

  if (filters.funder) query = query.ilike("funder", `%${filters.funder}%`);
  if (filters.year) {
    query = query
      .gte("disbursement_date", `${filters.year}-01-01`)
      .lt("disbursement_date", `${filters.year + 1}-01-01`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as GrantCapital[];
}

export async function getCapitalSummary() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("v_capital_summary").select("*");
  if (error) throw error;
  return data as CapitalSummary[];
}

// ============================================================
//  DIAGNOSTICS
// ============================================================

export async function getDiagnostics() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("diagnostic")
    .select(`*, organisation!left(name, sector, woman_led)`)
    .order("diag_date", { ascending: false });
  if (error) throw error;
  return data as Diagnostic[];
}

export async function getDiagnosticById(diag_id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("diagnostic")
    .select(`
      *,
      organisation!left(*),
      cohort!left(*)
    `)
    .eq("diag_id", diag_id)
    .single();
  if (error) throw error;
  return data;
}

// ============================================================
//  COHORTS / TRAINING / ESOS / VIPS
// ============================================================

export async function getCohorts() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("cohort")
    .select(`
      *,
      cohort_member(count)
    `)
    .order("year", { ascending: false, nullsFirst: false })
    .order("cohort_number", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as Cohort[];
}

export async function getTrainingSessions() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("training_session")
    .select(`
      *,
      event!left(name, event_type, edition_year)
    `)
    .order("session_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as TrainingSession[];
}

export async function getEsoPartners() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("eso_partner")
    .select("*")
    .order("active_partner", { ascending: false })
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ESOPartner[];
}

export async function getVipContacts() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("vip_contact")
    .select(`
      *,
      person!left(full_name, email_primary, phone_primary)
    `)
    .order("last_engaged", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as VipContact[];
}

// ============================================================
//  DASHBOARD — ANALYTICS VIEWS
// ============================================================

export async function getEquityDashboard(): Promise<EquityDashboard> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("v_equity_dashboard")
    .select("*")
    .single();
  if (error) throw error;
  return data as EquityDashboard;
}

export async function getBeneficiariesByYear(): Promise<BeneficiaryByYear[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("v_beneficiaries_by_year")
    .select("*")
    .order("year", { ascending: true });
  if (error) throw error;
  return data as BeneficiaryByYear[];
}

export async function getSectorBreakdown() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("organisation")
    .select("sector")
    .eq("active", true);
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const s = row.sector ?? "Other";
    counts[s] = (counts[s] ?? 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([sector, count]) => ({ sector, count }));
}

export async function getMonthlyActivity(year: number) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("event")
    .select("date_start, total_attended")
    .eq("edition_year", year)
    .not("date_start", "is", null);
  if (error) throw error;
  const events       = Array(12).fill(0);
  const participants = Array(12).fill(0);
  for (const row of data ?? []) {
    const m = new Date(row.date_start as string).getMonth();
    events[m]++;
    participants[m] += row.total_attended ?? 0;
  }
  return { events, participants };
}

export async function getDashboardKPIs() {
  const supabase = createAdminClient();
  const year = new Date().getFullYear();

  const [equity, byYear, capital, sectors, monthly] = await Promise.all([
    getEquityDashboard(),
    getBeneficiariesByYear(),
    getCapitalSummary(),
    getSectorBreakdown(),
    getMonthlyActivity(year),
  ]);

  const [eventsRes, totalOrgsRes, womenLedOrgsRes] = await Promise.all([
    supabase.from("event").select("event_id", { count: "exact", head: true }),
    supabase.from("organisation").select("org_id", { count: "exact", head: true }),
    supabase.from("organisation").select("org_id", { count: "exact", head: true }).eq("woman_led", true),
  ]);

  const totalUSD        = capital.reduce((acc, r) => acc + (r.total_usd    ?? 0), 0);
  const usdToWomen      = capital.reduce((acc, r) => acc + (r.usd_to_women ?? 0), 0);
  const capitalToWomenPct = totalUSD > 0 ? Math.round((usdToWomen / totalUSD) * 100) : 0;
  const womenLedPct       = (totalOrgsRes.count ?? 0) > 0
    ? Math.round(((womenLedOrgsRes.count ?? 0) / (totalOrgsRes.count ?? 1)) * 100)
    : 0;

  return {
    equity,
    byYear,
    capital,
    sectors,
    monthly,
    events_count:          eventsRes.count ?? 0,
    total_usd:             totalUSD,
    capital_to_women_pct:  capitalToWomenPct,
    women_led_pct:         womenLedPct,
  };
}

// ============================================================
//  IMPORT / STAGING
// ============================================================

export async function getStagingQueue(status?: string) {
  const supabase = createAdminClient();
  let query = supabase
    .from("staging_import")
    .select("*")
    .order("created_at", { ascending: false });
  if (status) query = query.eq("import_status", status);
  const { data, error } = await query;
  if (error) throw error;
  return data as StagingImport[];
}

export async function approveStagingRecord(staging_id: string, reviewed_by: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("staging_import")
    .update({ import_status: "Approved", reviewed_by, reviewed_at: new Date().toISOString() })
    .eq("staging_id", staging_id);
  if (error) throw error;
}

export async function rejectStagingRecord(staging_id: string, reviewed_by: string, notes: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("staging_import")
    .update({ import_status: "Rejected", reviewed_by, reviewed_at: new Date().toISOString(), notes })
    .eq("staging_id", staging_id);
  if (error) throw error;
}
