import { createServerSupabaseClient } from "@/lib/supabase";

// ── MODULE 1: PITCH PIPELINE ──────────────────────────────────

export async function getPitchFunnel(filters: {
  year?: number; event_type?: string; programme?: string;
} = {}) {
  const db = createServerSupabaseClient();
  let q = db.from("v_pitch_funnel").select("*");
  if (filters.year)       q = q.eq("year", filters.year);
  if (filters.event_type) q = q.eq("event_type", filters.event_type);
  if (filters.programme)  q = q.ilike("programme", `%${filters.programme}%`);
  const { data, error } = await q.order("year", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getPitchWinners(filters: {
  year?: number; event_type?: string; women_only?: boolean;
} = {}) {
  const db = createServerSupabaseClient();
  let q = db.from("v_pitch_winners").select("*");
  if (filters.year)       q = q.eq("year", filters.year);
  if (filters.event_type) q = q.eq("event_type", filters.event_type);
  if (filters.women_only) q = q.eq("is_woman", true);
  const { data, error } = await q.order("date_start", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getFirstFemaleWinnerPerProgramme() {
  const db = createServerSupabaseClient();
  const { data, error } = await db
    .from("v_pitch_winners")
    .select("*")
    .eq("is_woman", true)
    .eq("winner_flag", true)
    .order("date_start", { ascending: true });
  if (error) throw error;
  // Keep only the first (earliest) per event_type
  const seen = new Set<string>();
  return (data ?? []).filter((r) => {
    if (seen.has(r.event_type)) return false;
    seen.add(r.event_type);
    return true;
  });
}


// ── MODULE 2: YEAR-ON-YEAR ────────────────────────────────────

export async function getAnnualSummary(filters: {
  year?: number; event_type?: string;
} = {}) {
  const db = createServerSupabaseClient();
  let q = db.from("v_annual_programme_summary").select("*");
  if (filters.year)       q = q.eq("year", filters.year);
  if (filters.event_type) q = q.eq("event_type", filters.event_type);
  const { data, error } = await q.order("year", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getYearlyKpiTrend() {
  const db = createServerSupabaseClient();
  const { data, error } = await db
    .from("v_yearly_kpi_trend")
    .select("*")
    .order("year", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// Year comparison — two years side by side
export async function compareYears(yearA: number, yearB: number) {
  const [a, b] = await Promise.all([
    getAnnualSummary({ year: yearA }),
    getAnnualSummary({ year: yearB }),
  ]);
  return { yearA: a, yearB: b };
}


// ── MODULE 3: BENEFICIARY JOURNEY ─────────────────────────────

export async function getBeneficiaryJourney(filters: {
  min_score?: number; is_woman?: boolean; year?: number;
} = {}) {
  const db = createServerSupabaseClient();
  let q = db.from("v_beneficiary_journey").select("*");
  if (filters.min_score !== undefined) q = q.gte("journey_score", filters.min_score);
  if (filters.is_woman)                q = q.eq("is_woman", true);
  const { data, error } = await q
    .order("journey_score", { ascending: false })
    .order("total_events_attended", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data ?? [];
}

export async function getFullJourneyAlumni() {
  const db = createServerSupabaseClient();
  const { data, error } = await db
    .from("v_full_journey_alumni")
    .select("*");
  if (error) throw error;
  return data ?? [];
}

export async function getJourneyStats() {
  const db = createServerSupabaseClient();
  const { data, error } = await db
    .from("v_beneficiary_journey")
    .select("journey_score, is_woman, pitch_count, grant_count, cohort_count");
  if (error) throw error;
  const rows = data ?? [];
  return {
    total:              rows.length,
    score5:             rows.filter(r => r.journey_score === 5).length,
    score4:             rows.filter(r => r.journey_score === 4).length,
    score3:             rows.filter(r => r.journey_score === 3).length,
    score2:             rows.filter(r => r.journey_score === 2).length,
    score1:             rows.filter(r => r.journey_score === 1).length,
    has_pitched:        rows.filter(r => r.pitch_count > 0).length,
    has_grant:          rows.filter(r => r.grant_count > 0).length,
    has_incubated:      rows.filter(r => r.cohort_count > 0).length,
    female_multi:       rows.filter(r => r.is_woman && r.journey_score >= 2).length,
  };
}


// ── MODULE 4: INCUBATION ANALYTICS ────────────────────────────

export async function getCohortAnalytics(filters: {
  year?: number; funder?: string;
} = {}) {
  const db = createServerSupabaseClient();
  let q = db.from("v_cohort_analytics").select("*");
  if (filters.year)   q = q.eq("year", filters.year);
  if (filters.funder) q = q.ilike("funder", `%${filters.funder}%`);
  const { data, error } = await q.order("start_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getCohortTotals() {
  const db = createServerSupabaseClient();
  const { data, error } = await db
    .from("v_cohort_analytics")
    .select("total_startups,female_led_count,youth_led_count,graduated_count,jobs_created,capital_deployed_usd,duration_months,female_led_pct,graduation_rate_pct");
  if (error) throw error;
  const rows = data ?? [];
  return {
    total_cohorts:      rows.length,
    total_startups:     rows.reduce((a, r) => a + (r.total_startups ?? 0), 0),
    female_led:         rows.reduce((a, r) => a + (r.female_led_count ?? 0), 0),
    graduated:          rows.reduce((a, r) => a + (r.graduated_count ?? 0), 0),
    jobs_created:       rows.reduce((a, r) => a + (r.jobs_created ?? 0), 0),
    capital_usd:        rows.reduce((a, r) => a + (r.capital_deployed_usd ?? 0), 0),
    avg_duration_months: rows.length
      ? rows.reduce((a, r) => a + (r.duration_months ?? 0), 0) / rows.length
      : 0,
    avg_female_led_pct:  rows.length
      ? rows.reduce((a, r) => a + (r.female_led_pct ?? 0), 0) / rows.length
      : 0,
    avg_graduation_rate: rows.length
      ? rows.reduce((a, r) => a + (r.graduation_rate_pct ?? 0), 0) / rows.length
      : 0,
  };
}


// ── MODULE 5: DONOR INTELLIGENCE ──────────────────────────────

export async function getDonorRoi() {
  const db = createServerSupabaseClient();
  const { data, error } = await db
    .from("v_donor_roi")
    .select("*")
    .order("total_usd_in", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getEcosystemStrength() {
  const db = createServerSupabaseClient();
  const { data, error } = await db
    .from("v_ecosystem_strength")
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function getDonorBriefingData() {
  const db = createServerSupabaseClient();
  const { data, error } = await db
    .from("v_donor_briefing")
    .select("*")
    .single();
  if (error) throw error;
  return data;
}


// ── MODULE 6: SDG ALIGNMENT ────────────────────────────────────

export async function getSdgContributions() {
  const db = createServerSupabaseClient();
  const { data, error } = await db
    .from("v_sdg_contributions")
    .select("*");
  if (error) throw error;
  return data ?? [];
}


// ── MODULE 7: DATA QUALITY ─────────────────────────────────────

export async function getDataHealthSummary() {
  const db = createServerSupabaseClient();
  const { data, error } = await db
    .from("v_data_health_summary")
    .select("*");
  if (error) throw error;
  return data ?? [];
}

// Critical gaps — for data health page priority list
export async function getCriticalGaps() {
  const db = createServerSupabaseClient();

  // Compute gaps directly from live tables
  const [
    missingGender, missingAttendance, missingPrizeMoney,
    missingOsvp2021, cohortsNoRevenue,
  ] = await Promise.all([
    db.from("person").select("person_id", { count: "exact", head: true })
      .eq("gender", "Unknown"),
    db.from("event").select("event_id", { count: "exact", head: true })
      .or("total_attended.is.null,total_attended.eq.0"),
    db.from("pitch").select("pitch_id", { count: "exact", head: true })
      .eq("winner_flag", true).is("prize_amount", null),
    db.from("pitch").select("pitch_id", { count: "exact", head: true })
      .ilike("notes", "%OSVP2021%").is("person_id", null),
    db.from("cohort").select("cohort_id", { count: "exact", head: true })
      .is("revenue_post", null),
  ]);

  return [
    { priority: 1, gap: "Judge lists for all events", count: 29, severity: "Critical",
      impact: "Pitch analytics, donor credibility", how: "MD + team memory / email archive" },
    { priority: 2, gap: "OSVP 2021 coded applications (58 names unlinked)",
      count: 58, severity: "Critical",
      impact: "Pitch gender split, winner history", how: "Internal code-to-name mapping document" },
    { priority: 3, gap: "Revenue post-incubation", count: cohortsNoRevenue.count ?? 0,
      severity: "Critical",
      impact: "Capital ROI for World Bank/AfDB proposals", how: "Follow-up calls to cohort graduates" },
    { priority: 4, gap: "Gender field missing on persons", count: missingGender.count ?? 0,
      severity: "High",
      impact: "Equity dashboard, SDG 5 metrics", how: "Update at next event registration" },
    { priority: 5, gap: "Event attendance counts missing", count: missingAttendance.count ?? 0,
      severity: "High",
      impact: "Year-on-year comparison, reach metrics", how: "Export from Google Forms" },
    { priority: 6, gap: "Prize amounts not recorded on winners", count: missingPrizeMoney.count ?? 0,
      severity: "Medium",
      impact: "Capital deployed total, OSVP prize history", how: "MD to confirm from Orange records" },
    { priority: 7, gap: "GEW 2024 + FIW 2025 full registration exports",
      count: 700, severity: "High",
      impact: "Beneficiary count jumps by 700+ when imported", how: "Export from Google Forms → import CSV" },
    { priority: 8, gap: "VIP + judge contact records", count: 0, severity: "Medium",
      impact: "Partnership intelligence, ecosystem depth", how: "Extract from FIW/GEW/OSVP event reports" },
  ];
}


// ── COMBINED: DASHBOARD KPIs (enhanced) ────────────────────────

export async function getEnhancedDashboardKPIs() {
  const [briefing, trend, journey, cohortTotals, donorRoi, ecosys] = await Promise.all([
    getDonorBriefingData(),
    getYearlyKpiTrend(),
    getJourneyStats(),
    getCohortTotals(),
    getDonorRoi(),
    getEcosystemStrength(),
  ]);

  const totalCapital = donorRoi.reduce((a, r) => a + (r.total_usd_in ?? 0), 0);
  const thisYear     = new Date().getFullYear();
  const lastYearRow  = trend.find(r => r.year === thisYear - 1);
  const thisYearRow  = trend.find(r => r.year === thisYear);
  const yearDelta    = (thisYearRow?.total_beneficiaries ?? 0) - (lastYearRow?.total_beneficiaries ?? 0);

  return {
    briefing,
    trend,
    journey,
    cohortTotals,
    donorRoi,
    ecosys,
    totalCapital,
    yearDelta,
    costPerJob: cohortTotals.jobs_created > 0
      ? Math.round(totalCapital / cohortTotals.jobs_created)
      : null,
  };
}
