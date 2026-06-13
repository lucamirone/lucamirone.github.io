# Internal Analytics Privacy Note

## Safe to Track

Track actions and categorical context that help evaluate website performance:

- Page and section viewed
- CTA type and non-personal button label
- Assessment opened, started, progressed, submitted, or successfully confirmed
- Scroll milestones and session-duration milestones
- Broad predefined market or service-interest categories
- Device, traffic source, and approximate geography supplied by GA4

## Do Not Send to GA4

Never send:

- Names
- Email addresses
- Phone numbers
- Company names when they can identify a person
- LinkedIn profile URLs
- Messages or free-text answers
- Form answers containing confidential, financial, legal, or personal information
- Any stable identifier intended to recognize a specific visitor

## Why Form Answers Stay Out of Analytics

GA4 is an analytics platform, not a client-record or confidential-intake system. Sending personal assessment answers to GA4 creates unnecessary privacy, access-control, retention, and compliance risk. The website therefore reports only predefined categorical interests and form-status events.

## Operating Rules

- Keep GA4 consent controls enabled.
- Keep the service-account key only in Vercel environment variables.
- Never commit `.env` files or service-account JSON.
- Use aggregate insights for website decisions.
- Limit dashboard access to authorized administrators.
- Review GA4 retention, access, and consent settings periodically.
- Delete or disable any event parameter that begins collecting unexpected personal data.
