# Luca Mirone Lead-Intelligence Dashboard

Private, aggregated GA4 reporting focused on qualified advisory and consultation intent.

## Architecture

- The public website remains on GitHub Pages.
- This `dashboard/` folder deploys as a separate Vercel project.
- `api/analytics.js` is a protected serverless function that calls the GA4 Data API.
- Google credentials are read only from Vercel environment variables.
- The dashboard is not linked from the public website and includes `noindex` directives.

## Required Environment Variables

Copy the names from `.env.example` into Vercel:

```text
GA_PROPERTY_ID=
GA_CLIENT_EMAIL=
GA_PRIVATE_KEY=
DASHBOARD_USERNAME=
DASHBOARD_PASSWORD=
```

`GA_PROPERTY_ID` is the numeric GA4 property ID, not the public measurement ID.

For `GA_PRIVATE_KEY`, paste the full service-account private key. Escaped `\n` newlines are supported.

## Google Analytics Setup

1. In Google Cloud, create or select a project.
2. Enable the **Google Analytics Data API**.
3. Create a service account and generate a JSON key.
4. In GA4, open **Admin → Property access management**.
5. Add the service-account email with **Viewer** access.
6. Add the numeric GA4 property ID and service-account values to Vercel.

Recommended GA4 key events:

- `assessment_submit`
- `form_success`
- `email_click`
- `phone_click`
- `vcard_download`
- `consultation_click`

Recommended event-scoped custom dimensions:

- `section_name`
- `button_text`
- `language`
- `form_step`
- `market_interest`
- `service_interest`
- `lead_tier`
- `signal_name`

Recommended custom metrics:

- `score_value`
- `score_points_added`
- `percent_scrolled`

Never create custom dimensions from names, email addresses, phone numbers, messages, or free-text form answers.

## Deploy to Vercel

1. Create a new Vercel project from this GitHub repository.
2. Set the project **Root Directory** to `dashboard`.
3. Keep the framework preset as **Other**.
4. Add all five required environment variables for Production and Preview.
5. Deploy.
6. Open the generated Vercel URL at `/dashboard`.

The dashboard login is checked by the serverless API. Use a strong, unique password. The browser stores the resulting Basic Authorization value only for the current tab session.

## Test the Tracking

Grant analytics consent on `lucamirone.com`, then verify these events in **GA4 → Admin → DebugView** or the Realtime report:

```text
contact_click
email_click
phone_click
linkedin_click
vcard_download
assessment_toggle_open
assessment_start
assessment_step_progress
assessment_submit
form_error
form_success
consultation_click
advisory_brief_click
approach_section_view
services_section_view
contact_section_view
scroll_50
scroll_75
scroll_90
long_session_2min
long_session_5min
return_visit
lead_score_update
```

GA4 standard reports can take up to 24 hours to populate. Realtime and DebugView usually show events sooner.

## Lead Scoring

The browser records anonymous session intent points and sends a `lead_score_update` event after weighted signals. The dashboard also computes aggregate weighted-intent proxies from event totals.

- Cold: `0–24`
- Warm: `25–59`
- Hot: `60+`

This model is designed for aggregate business decisions. It does not identify individual visitors.

## Local Validation

From the `dashboard/` directory:

```sh
node --check api/analytics.js
node --check lib/ga4.js
node --check lib/lead-scoring.js
node --check app.js
```

Testing live GA4 data requires valid environment variables and network access to Google APIs.
