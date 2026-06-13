export const SCORE_WEIGHTS = {
  page_view: 5,
  approach_section_view: 10,
  services_section_view: 10,
  contact_section_view: 10,
  consultation_click: 10,
  advisory_brief_click: 10,
  scroll_50: 10,
  scroll_75: 15,
  assessment_toggle_open: 15,
  assessment_start: 25,
  assessment_submit: 50,
  email_click: 35,
  phone_click: 35,
  vcard_download: 30,
  linkedin_click: 20,
  return_visit: 20,
  long_session_2min: 15,
  long_session_5min: 25
};

export function scoreEventCounts(eventCounts = {}) {
  return Object.entries(SCORE_WEIGHTS).reduce(
    (score, [event, points]) => score + (Number(eventCounts[event]) || 0) * points,
    0
  );
}

export function classifyScore(score) {
  if (score >= 60) return "hot";
  if (score >= 25) return "warm";
  return "cold";
}

export function sourceQuality(rows = []) {
  return rows.map((row) => {
    const sessions = Number(row.sessions) || 0;
    const intentScore = Number(row.intentScore) || 0;
    return {
      ...row,
      qualityScore: sessions ? Math.round(intentScore / sessions) : 0
    };
  }).sort((a, b) => b.qualityScore - a.qualityScore);
}
