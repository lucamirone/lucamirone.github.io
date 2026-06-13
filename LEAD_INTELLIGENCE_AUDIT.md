# Lead-Intelligence Website Audit

## Current Architecture

- **Site structure:** Static HTML, CSS, and JavaScript.
- **Hosting:** GitHub Pages, served from the repository root at `lucamirone.com`.
- **Backend:** None. The public site has no secure server or serverless runtime.
- **Forms:** The consultation and Initial Advisory Assessment forms submit to `formsubmit.co`.
- **Analytics:** Consent-aware GA4 is installed with measurement ID `G-3RNHB3J5TY`.

## Existing Analytics Before This Change

The site loaded GA4 only after a visitor granted analytics consent. Existing custom tracking was limited to:

- Contact card downloads
- Generic lead-form submissions

There was no structured tracking for assessment progress, section engagement, direct contact actions, long sessions, return visits, or lead scoring.

## High-Intent Website Areas

The following areas now produce privacy-safe intent events:

- Hero and header consultation actions
- Approach section
- Engagement/services section
- Advisory Brief content
- Initial Advisory Assessment toggle, start, progress, and submission
- Contact section
- Email, phone, LinkedIn, and vCard actions
- Scroll depth, long sessions, and return visits

## Secure Dashboard Recommendation

GitHub Pages cannot securely call the Google Analytics Data API because it has no private server runtime. Placing Google service-account credentials in frontend code would expose them publicly.

The selected architecture is:

1. Keep the public website on GitHub Pages.
2. Deploy the `dashboard/` folder as a separate Vercel project.
3. Store Google Analytics and dashboard credentials as Vercel environment variables.
4. Allow only the protected Vercel API route to call the GA4 Data API.

Vercel was selected because it is the smallest change to the current static architecture and provides a secure serverless function without rewriting the website.

## Files Changed

- `index.html`: Updates the analytics script version so browsers load the new tracking.
- `script.js`: Adds consent-aware, privacy-safe lead-intent tracking and scoring.
- `dashboard/`: Adds the private dashboard, GA4 API route, scoring utilities, and deployment documentation.

## Known Limitations

- GA4 standard reporting is aggregated. It cannot reliably show an identified person's activity or exact person-level lead score.
- Lead tiers in the first version are aggregate behavioral proxies.
- Newly added events are not historical; data begins after the tracking code is deployed and consent is granted.
- The current form provider confirms submissions by redirect. GA4 records the success state after the visitor returns to the site.
- Detailed form-step drop-off reporting requires registering `form_step` as a GA4 custom dimension.
