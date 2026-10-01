---
title: "Spa Management & POS"
year: 2025
summary: "Full operations and point-of-sale system in daily use across 30+ US spa locations."
tags: ["Next.js", "Node.js", "PostgreSQL", "MySQL", "Docker"]
group: "featured"
order: 2
color: "sky"
role: "Lead engineer"
cover: "../../assets/projects/spa-pos/01.png"
gallery:
  - "../../assets/projects/spa-pos/02.png"
  - "../../assets/projects/spa-pos/03.png"
  - "../../assets/projects/spa-pos/04.png"
  - "../../assets/projects/spa-pos/05.png"
---

A full operations + point-of-sale system in active daily use across **30+ US spa locations**. Handles inventory, multi-location pricing, checkout, discount logic, sales tracking, and the HR automations the chain relies on for staffing, shift management, and payroll inputs.

The defining constraint is uptime. The POS sits in front of customers in real-world locations, so latency and reliability matter more than features. Every transaction has to clear in milliseconds, and every back-office report has to reconcile against the same source of truth.

Backed by PostgreSQL and MySQL behind a containerised Node.js service, fronted by a Next.js admin and operator UI. Deployed via Docker.
