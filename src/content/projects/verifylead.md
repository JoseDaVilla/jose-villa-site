---
title: "VerifyLead"
year: 2025
summary: "Lead platform that validates thousands of leads a day with real-time SMTP checks."
tags: ["Node.js", "PostgreSQL", "SMTP", "Twilio", "SendGrid"]
group: "featured"
order: 3
color: "sun"
role: "Lead engineer"
cover: "../../assets/projects/verifylead/01.png"
gallery:
  - "../../assets/projects/verifylead/02.png"
  - "../../assets/projects/verifylead/03.png"
---

A lead platform that ingests and validates **thousands of leads per day**. The differentiator is real-time SMTP validation: the system actually pings the destination mailbox to confirm a real inbox exists before passing the lead through, protecting the sender domain's reputation from bouncing into spam folders.

On top of validation:

- **OTP-verified embeddable forms** for partner sites
- Automated **email and SMS sequences** via SendGrid and Twilio
- An **intelligent lead scoring** layer that ranks incoming records by propensity to convert

PostgreSQL backs the data, Node.js handles the live validation pipeline.
