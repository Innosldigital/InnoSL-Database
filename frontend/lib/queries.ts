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

export async function getGrants(filters: { funder?: string; year?: number; programme?: string } = {}) {
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
  if (filters.programme && filters.programme !== "All")
    query = (query as any).ilike("programme", `%${filters.programme}%`);
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

export async function getDiagnostics(filters: { year?: number } = {}) {
  const supabase = createAdminClient();
  let query = supabase
    .from("diagnostic")
    .select(`*, organisation!left(name, sector, woman_led)`)
    .order("diag_date", { ascending: false });
  if (filters.year)
    query = query.gte("diag_date", `${filters.year}-01-01`).lt("diag_date", `${filters.year + 1}-01-01`);
  const { data, error } = await query;
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

export async function getCohorts(filters: { year?: number; programme?: string } = {}) {
  const supabase = createAdminClient();
  let query = supabase
    .from("cohort")
    .select(`*, cohort_member(count)`)
    .order("year", { ascending: false, nullsFirst: false })
    .order("cohort_number", { ascending: false, nullsFirst: false });
  if (filters.year) query = query.eq("year", filters.year);
  if (filters.programme && filters.programme !== "All")
    query = (query as any).ilike("programme_name", `%${filters.programme}%`);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Cohort[];
}

export async function getTrainingSessions(filters: { year?: number; programme?: string } = {}) {
  const supabase = createAdminClient();
  let query = supabase
    .from("training_session")
    .select(`*, event!left(name, event_type, edition_year)`)
    .order("session_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (filters.year)
    query = query.gte("session_date", `${filters.year}-01-01`).lt("session_date", `${filters.year + 1}-01-01`);
  if (filters.programme && filters.programme !== "All")
    query = (query as any).ilike("programme_funder", `%${filters.programme}%`);
  const { data, error } = await query;
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

// Maps YearFilter programme names to event_type enum values
const EVENT_TYPE_MAP: Record<string, string> = {
  FPN: "FPN", FIW: "FIW", GEW: "GEW", OSVP: "OSVP",
  Dare2Aspire: "Dare2Aspire", SLEDP: "SLEDP", EWC: "EWC", NYEFF: "NYEFF",
};

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

export async function getMonthlyActivity(year: number, eventType?: string) {
  const supabase = createAdminClient();
  let query = supabase
    .from("event")
    .select("date_start, total_attended")
    .eq("edition_year", year)
    .not("date_start", "is", null);
  if (eventType) query = query.eq("event_type", eventType);
  const { data, error } = await query;
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

const EQUITY_ZERO: EquityDashboard = {
  total_beneficiaries: 0, female_beneficiaries: 0, girls_under_18: 0,
  youth_beneficiaries: 0, aged_beneficiaries: 0, pwd_beneficiaries: 0,
  regional_beneficiaries: 0, repeat_beneficiaries: 0, pct_female: 0,
};

// Compute equity stats filtered by year and/or programme
async function computeFilteredEquity(
  supabase: ReturnType<typeof createAdminClient>,
  year?: number, programme?: string
): Promise<EquityDashboard> {
  // Incubation: measure through cohort member orgs
  if (programme === "Incubation") {
    let q = supabase.from("cohort").select("cohort_id");
    if (year) q = q.eq("year", year);
    const { data: cohorts } = await q;
    const cIds = (cohorts ?? []).map((c: any) => c.cohort_id);
    if (!cIds.length) return EQUITY_ZERO;
    const { data: members } = await supabase.from("cohort_member").select("org_id").in("cohort_id", cIds);
    const oIds = [...new Set((members ?? []).map((m: any) => m.org_id))];
    if (!oIds.length) return EQUITY_ZERO;
    const { data: orgs } = await supabase.from("organisation").select("org_id,woman_led,youth_led").in("org_id", oIds);
    const total  = orgs?.length ?? 0;
    const female = (orgs ?? []).filter((o: any) => o.woman_led).length;
    const youth  = (orgs ?? []).filter((o: any) => o.youth_led).length;
    return { ...EQUITY_ZERO, total_beneficiaries: total, female_beneficiaries: female, youth_beneficiaries: youth,
      pct_female: total > 0 ? Math.round(female / total * 100) : 0 };
  }

  // Training: sum attendance counts from training_session
  if (programme === "Training") {
    let q = supabase.from("training_session").select("total_attended,female_count,youth_count");
    if (year) q = q.gte("session_date", `${year}-01-01`).lt("session_date", `${year + 1}-01-01`);
    const { data: sessions } = await q;
    if (!sessions?.length) return EQUITY_ZERO;
    const total  = sessions.reduce((s: number, r: any) => s + (r.total_attended ?? 0), 0);
    const female = sessions.reduce((s: number, r: any) => s + (r.female_count   ?? 0), 0);
    const youth  = sessions.reduce((s: number, r: any) => s + (r.youth_count    ?? 0), 0);
    return { ...EQUITY_ZERO, total_beneficiaries: total, female_beneficiaries: female, youth_beneficiaries: youth,
      pct_female: total > 0 ? Math.round(female / total * 100) : 0 };
  }

  // Event-based or year-only: resolve through attendance → person
  const eventType = programme && programme !== "All" ? EVENT_TYPE_MAP[programme] : undefined;
  let evQ = supabase.from("event").select("event_id");
  if (year) evQ = evQ.eq("edition_year", year);
  if (eventType) evQ = evQ.eq("event_type", eventType);
  const { data: events } = await evQ;
  const eventIds = (events ?? []).map((e: any) => e.event_id);
  if (!eventIds.length) return EQUITY_ZERO;

  const { data: atts } = await supabase.from("attendance").select("person_id").in("event_id", eventIds);
  const personIds = [...new Set((atts ?? []).map((a: any) => a.person_id))];
  if (!personIds.length) return EQUITY_ZERO;

  const { data: people } = await supabase
    .from("person")
    .select("person_id,is_woman,is_youth,is_pwd,is_aged,is_repeat_beneficiary")
    .in("person_id", personIds);
  const total  = people?.length ?? 0;
  const female = (people ?? []).filter((p: any) => p.is_woman).length;
  const youth  = (people ?? []).filter((p: any) => p.is_youth).length;
  const aged   = (people ?? []).filter((p: any) => p.is_aged).length;
  const pwd    = (people ?? []).filter((p: any) => p.is_pwd).length;
  const repeat = (people ?? []).filter((p: any) => p.is_repeat_beneficiary).length;
  return { ...EQUITY_ZERO, total_beneficiaries: total, female_beneficiaries: female,
    youth_beneficiaries: youth, aged_beneficiaries: aged, pwd_beneficiaries: pwd,
    repeat_beneficiaries: repeat, pct_female: total > 0 ? Math.round(female / total * 100) : 0 };
}

// Compute sector breakdown filtered by year and/or programme
async function computeFilteredSectors(
  supabase: ReturnType<typeof createAdminClient>,
  year?: number, programme?: string
): Promise<{ sector: string; count: number }[]> {
  const eventType = programme && programme !== "All" ? EVENT_TYPE_MAP[programme] : undefined;
  let orgIds: string[] = [];

  if (programme === "Incubation") {
    let q = supabase.from("cohort").select("cohort_id");
    if (year) q = q.eq("year", year);
    const { data: cohorts } = await q;
    const cIds = (cohorts ?? []).map((c: any) => c.cohort_id);
    if (cIds.length) {
      const { data: members } = await supabase.from("cohort_member").select("org_id").in("cohort_id", cIds);
      orgIds = [...new Set((members ?? []).map((m: any) => m.org_id))];
    }
  } else {
    let evQ = supabase.from("event").select("event_id");
    if (year) evQ = evQ.eq("edition_year", year);
    if (eventType) evQ = evQ.eq("event_type", eventType);
    const { data: events } = await evQ;
    const eIds = (events ?? []).map((e: any) => e.event_id);
    if (eIds.length) {
      const { data: pitches } = await supabase.from("pitch").select("org_id").in("event_id", eIds).not("org_id", "is", null);
      orgIds = [...new Set((pitches ?? []).map((p: any) => p.org_id as string).filter(Boolean))];
    }
  }

  if (!orgIds.length) return [];
  const { data: orgs } = await supabase.from("organisation").select("sector").in("org_id", orgIds);
  const counts: Record<string, number> = {};
  for (const row of orgs ?? []) {
    const s = (row as any).sector ?? "Other";
    counts[s] = (counts[s] ?? 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([sector, count]) => ({ sector, count }));
}

// Compute capital summary filtered by year and/or programme
async function computeFilteredCapital(
  supabase: ReturnType<typeof createAdminClient>,
  year?: number, programme?: string
): Promise<CapitalSummary[]> {
  let q = supabase.from("grant_capital").select("funder,grant_type,amount_usd,recipient_gender,woman_led_business");
  if (year) q = q.gte("disbursement_date", `${year}-01-01`).lt("disbursement_date", `${year + 1}-01-01`);
  if (programme && programme !== "All") q = (q as any).ilike("programme", `%${programme}%`);
  const { data: grants } = await q;
  const grouped: Record<string, { total_usd: number; usd_to_women: number; count: number; grant_type: string }> = {};
  for (const g of grants ?? []) {
    const f = (g as any).funder ?? "Unknown";
    if (!grouped[f]) grouped[f] = { total_usd: 0, usd_to_women: 0, count: 0, grant_type: (g as any).grant_type ?? "Grant" };
    grouped[f].total_usd += Number((g as any).amount_usd) || 0;
    grouped[f].count++;
    if ((g as any).recipient_gender === "Female" || (g as any).woman_led_business === true)
      grouped[f].usd_to_women += Number((g as any).amount_usd) || 0;
  }
  return Object.entries(grouped).map(([funder, v]) => ({
    funder, grant_type: v.grant_type, disbursements: v.count,
    total_usd: v.total_usd, to_women_led: 0, usd_to_women: v.usd_to_women,
  }));
}

export async function getDashboardKPIs(filters: { year?: number; programme?: string } = {}) {
  const supabase = createAdminClient();
  const { year, programme } = filters;
  const eventType  = programme && programme !== "All" ? EVENT_TYPE_MAP[programme] : undefined;
  const isFiltered = !!year || (!!programme && programme !== "All");
  const activeYear = year ?? new Date().getFullYear();

  // Always keep full historical byYear trend (powers the bar chart)
  const byYearPromise = getBeneficiariesByYear().catch(() => [] as BeneficiaryByYear[]);

  // All other data respects active filters
  const equityPromise = isFiltered
    ? computeFilteredEquity(supabase, year, programme).catch(() => EQUITY_ZERO)
    : getEquityDashboard().catch(() => EQUITY_ZERO);

  const capitalPromise = isFiltered
    ? computeFilteredCapital(supabase, year, programme).catch(() => [] as CapitalSummary[])
    : getCapitalSummary().catch(() => [] as CapitalSummary[]);

  const sectorsPromise = isFiltered
    ? computeFilteredSectors(supabase, year, programme).catch(() => [] as { sector: string; count: number }[])
    : getSectorBreakdown().catch(() => [] as { sector: string; count: number }[]);

  const monthlyPromise = getMonthlyActivity(activeYear, eventType)
    .catch(() => ({ events: Array(12).fill(0), participants: Array(12).fill(0) }));

  // Events count filtered
  let eventsQ = supabase.from("event").select("event_id", { count: "exact", head: true });
  if (year) eventsQ = eventsQ.eq("edition_year", year);
  if (eventType) eventsQ = eventsQ.eq("event_type", eventType);

  const [equity, byYear, capital, sectors, monthly, eventsRes] = await Promise.all([
    equityPromise, byYearPromise, capitalPromise, sectorsPromise, monthlyPromise, eventsQ,
  ]);

  const totalUSD          = capital.reduce((acc, r) => acc + (r.total_usd    ?? 0), 0);
  const usdToWomen        = capital.reduce((acc, r) => acc + (r.usd_to_women ?? 0), 0);
  const capitalToWomenPct = totalUSD > 0 ? Math.round((usdToWomen / totalUSD) * 100) : 0;

  // Women-led % is structural — doesn't change with year/programme filter
  const [totalOrgsRes, womenLedOrgsRes] = await Promise.all([
    supabase.from("organisation").select("org_id", { count: "exact", head: true }),
    supabase.from("organisation").select("org_id", { count: "exact", head: true }).eq("woman_led", true),
  ]);
  const womenLedPct = (totalOrgsRes.count ?? 0) > 0
    ? Math.round(((womenLedOrgsRes.count ?? 0) / (totalOrgsRes.count ?? 1)) * 100)
    : 0;

  return {
    equity, byYear, capital, sectors, monthly,
    events_count:         eventsRes.count ?? 0,
    total_usd:            totalUSD,
    capital_to_women_pct: capitalToWomenPct,
    women_led_pct:        womenLedPct,
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
