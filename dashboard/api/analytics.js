import { metric, rows, runReport } from "../lib/ga4.js";
import { SCORE_WEIGHTS, scoreEventCounts, sourceQuality } from "../lib/lead-scoring.js";

const INTENT_EVENTS = Object.keys(SCORE_WEIGHTS);

function authorized(request) {
  if (!process.env.DASHBOARD_USERNAME || !process.env.DASHBOARD_PASSWORD) return false;
  const authorization = request.headers.authorization || "";
  if (!authorization.startsWith("Basic ")) return false;
  const [username, password] = Buffer.from(authorization.slice(6), "base64").toString().split(":");
  return username === process.env.DASHBOARD_USERNAME && password === process.env.DASHBOARD_PASSWORD;
}

function dateRange(query) {
  const allowed = new Set(["7daysAgo", "30daysAgo", "90daysAgo", "yesterday", "today"]);
  const startDate = allowed.has(query.startDate) || /^\d{4}-\d{2}-\d{2}$/.test(query.startDate || "")
    ? query.startDate
    : "30daysAgo";
  const endDate = /^\d{4}-\d{2}-\d{2}$/.test(query.endDate || "") ? query.endDate : "today";
  return [{ startDate, endDate }];
}

function eventFilter(events = INTENT_EVENTS) {
  return {
    filter: {
      fieldName: "eventName",
      inListFilter: { values: events }
    }
  };
}

async function reportSet(dates) {
  const base = { dateRanges: dates, limit: 100 };
  return Promise.all([
    runReport({
      ...base,
      metrics: [
        { name: "totalUsers" }, { name: "newUsers" }, { name: "sessions" },
        { name: "screenPageViews" }, { name: "averageSessionDuration" }, { name: "engagementRate" }
      ]
    }),
    runReport({
      ...base,
      dimensions: [{ name: "eventName" }],
      metrics: [{ name: "eventCount" }, { name: "totalUsers" }],
      dimensionFilter: eventFilter()
    }),
    runReport({
      ...base,
      dimensions: [{ name: "date" }, { name: "eventName" }],
      metrics: [{ name: "eventCount" }],
      dimensionFilter: eventFilter(),
      orderBys: [{ dimension: { dimensionName: "date" } }]
    }),
    runReport({
      ...base,
      dimensions: [{ name: "sessionSource" }, { name: "sessionDefaultChannelGroup" }],
      metrics: [{ name: "sessions" }, { name: "totalUsers" }, { name: "engagedSessions" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }]
    }),
    runReport({
      ...base,
      dimensions: [{ name: "sessionSource" }, { name: "sessionDefaultChannelGroup" }, { name: "eventName" }],
      metrics: [{ name: "eventCount" }],
      dimensionFilter: eventFilter()
    }),
    runReport({
      ...base,
      dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
      metrics: [
        { name: "screenPageViews" }, { name: "totalUsers" },
        { name: "userEngagementDuration" }, { name: "eventCount" }
      ],
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }]
    }),
    runReport({
      ...base,
      dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
      metrics: [{ name: "eventCount" }],
      dimensionFilter: eventFilter([
        "contact_click", "email_click", "phone_click", "linkedin_click",
        "vcard_download", "consultation_click", "assessment_submit"
      ])
    }),
    runReport({
      ...base,
      dimensions: [{ name: "country" }, { name: "region" }, { name: "city" }],
      metrics: [{ name: "totalUsers" }, { name: "engagedSessions" }, { name: "eventCount" }],
      orderBys: [{ metric: { metricName: "totalUsers" }, desc: true }]
    }),
    runReport({
      ...base,
      dimensions: [{ name: "deviceCategory" }, { name: "browser" }, { name: "operatingSystem" }],
      metrics: [{ name: "sessions" }, { name: "engagementRate" }, { name: "eventCount" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }]
    }),
    runReport({
      ...base,
      dimensions: [
        { name: "dateHourMinute" }, { name: "eventName" }, { name: "sessionDefaultChannelGroup" },
        { name: "deviceCategory" }, { name: "country" }, { name: "city" }, { name: "pagePath" }
      ],
      metrics: [{ name: "eventCount" }],
      dimensionFilter: eventFilter(["assessment_submit", "assessment_start", "email_click", "phone_click", "linkedin_click", "vcard_download"]),
      orderBys: [{ dimension: { dimensionName: "dateHourMinute" }, desc: true }],
      limit: 30
    })
  ]);
}

function eventMap(eventRows) {
  return Object.fromEntries(eventRows.map((row) => [row.eventName, row.eventCount]));
}

function recommendations(events, devices, sources) {
  const notes = [];
  const mobile = devices.find((row) => row.deviceCategory === "mobile");
  const starts = events.assessment_start || 0;
  const submits = events.assessment_submit || 0;
  if (starts > submits && starts >= 3) notes.push("Assessment starts exceed completions. Review form length and mobile friction.");
  if (mobile && mobile.engagementRate < 0.45) notes.push("Mobile engagement is below 45%. Prioritize mobile CTA and form usability.");
  if ((events.contact_section_view || 0) > (events.email_click || 0) * 5) notes.push("Many visitors reach Contact without clicking. Make the preferred contact action more explicit.");
  if (sources[0]) notes.push(`${sources[0].sessionSource || sources[0].sessionDefaultChannelGroup} currently has the strongest intent quality per session.`);
  if (!notes.length) notes.push("Collect more qualified-intent events before making a structural website change.");
  return notes;
}

export default async function handler(request, response) {
  if (!authorized(request)) {
    return response.status(401).json({ error: "Authentication required" });
  }

  try {
    const reports = await reportSet(dateRange(request.query));
    const [overview, eventsReport, trend, sourcesReport, sourceEvents, pagesReport, pageIntent, geography, devices, activity] = reports;
    const events = eventMap(rows(eventsReport));
    const weightedTotal = scoreEventCounts(events);
    const sourceIntent = rows(sourceEvents).reduce((result, row) => {
      const key = `${row.sessionSource}|${row.sessionDefaultChannelGroup}`;
      result[key] = (result[key] || 0)
        + (SCORE_WEIGHTS[row.eventName] || 0) * row.eventCount;
      return result;
    }, {});
    const sources = sourceQuality(rows(sourcesReport).map((row) => ({
      ...row,
      intentScore: sourceIntent[`${row.sessionSource}|${row.sessionDefaultChannelGroup}`] || 0
    })));
    const pageClicks = Object.fromEntries(rows(pageIntent).map((row) => [row.pagePath, row.eventCount]));
    const pages = rows(pagesReport).map((row) => ({
      ...row,
      ctaClicks: pageClicks[row.pagePath] || 0
    }));
    const totalUsers = metric(overview, "totalUsers");

    return response.status(200).json({
      generatedAt: new Date().toISOString(),
      overview: {
        totalUsers,
        newUsers: metric(overview, "newUsers"),
        returningUsers: Math.max(totalUsers - metric(overview, "newUsers"), 0),
        sessions: metric(overview, "sessions"),
        pageViews: metric(overview, "screenPageViews"),
        averageEngagementTime: metric(overview, "averageSessionDuration"),
        engagementRate: metric(overview, "engagementRate")
      },
      events,
      leadScore: {
        weightedIntentPoints: weightedTotal,
        averageScoreProxy: totalUsers ? Math.round(weightedTotal / totalUsers) : 0,
        note: "Lead tiers are aggregated intent proxies. Enable GA4 custom lead_score and lead_tier definitions for more precise tier reporting."
      },
      trend: rows(trend),
      sources,
      pages,
      geography: rows(geography),
      devices: rows(devices),
      activity: rows(activity),
      recommendations: recommendations(events, rows(devices), sources)
    });
  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
}
