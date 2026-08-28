# Onboardly

Client Onboarding & Operations Platform with Autonomous Revenue Recovery.

## 🤖 Revenue Recovery Agent

Onboardly includes an autonomous, bounded, explainable, and gated revenue recovery agent designed to recover failed, abandoned, and overdue payments for agency client portals while protecting client relationships.

For detailed documentation, architecture, and schema details, see [`src/recovery-agent/README.md`](src/recovery-agent/README.md).

### Quick Commands

- **Seed Demo Transactions**:
  ```bash
  npx tsx scripts/seed-batch.ts 40
  ```
- **Run Recovery Agent**:
  ```bash
  npx tsx scripts/run-batch.ts <batch_id>
  ```
