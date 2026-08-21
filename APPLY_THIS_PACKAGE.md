# Apply Package — Stage 27

## Context
Latest repository history shows Stage 26 implementation commit:
`44b49dbe — feat(stage26): implement native infrastructure source of truth, physical topology, IPAM, and operational tools`.

The current official ROADMAP file may still show Stage 26 as planned. Reconcile that status before/with this documentation update.

## Add
- docs/06-product/STAGE_27_NETWORK_DEVICE_MONITORING_AND_WAN_CONTROL.md
- docs/02-implementation/27_NETWORK_DEVICE_MONITORING_AND_GOVERNED_WAN_ACTIONS.md
- docs/01-architecture/adr/ADR-020-network-device-driver-abstraction.md
- docs/01-architecture/adr/ADR-021-wan-change-safety-and-rollback.md
- docs/08-marketing/STAGE_27_MARKETING_IMPACT.md
- docs/08-marketing/campaigns/STAGE_27_CAMPAIGN_CONCEPTS.md
- docs/08-marketing/sales/STAGE_27_SALES_PITCH.md

## Merge patches
- docs/00-project/ROADMAP_STAGE27_PATCH.md → merge into official ROADMAP.md
- docs/08-marketing/MARKETING_CONCEPTS_STAGE27_PATCH.md → merge into official marketing summary

## Suggested commit
```bash
git add docs/
git commit -m "docs: plan stage 27 network monitoring and governed WAN actions"
git push
```

## Important implementation rule
Do not implement WAN switching by allowing the LLM to generate arbitrary RouterOS/pfSense commands. Use normalized typed Actions and vendor drivers.
