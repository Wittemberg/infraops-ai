# Apply Package — Stage 28

## Purpose
This package documents the UX/product/frontend restructuring required to make InfraOps AI more accessible to small IT providers/MEIs without reducing technical depth.

## Read order
1. AGENTS.md
2. docs/00-project/ROADMAP_STAGE28_PATCH.md
3. docs/06-product/STAGE_28_SIMPLE_EXPERIENCE_AND_GUIDED_OPERATIONS.md
4. docs/02-implementation/28_SIMPLE_EXPERIENCE_FRONTEND_REFACTOR_IMPLEMENTATION.md
5. ADR-023
6. ADR-024
7. UI terminology standard
8. usability acceptance scenarios
9. rollout plan

## Files to add
- docs/06-product/STAGE_28_SIMPLE_EXPERIENCE_AND_GUIDED_OPERATIONS.md
- docs/06-product/UI_TERMINOLOGY_AND_STATUS_STANDARD.md
- docs/06-product/STAGE_28_USABILITY_ACCEPTANCE_SCENARIOS.md
- docs/02-implementation/28_SIMPLE_EXPERIENCE_FRONTEND_REFACTOR_IMPLEMENTATION.md
- docs/01-architecture/adr/ADR-023-progressive-disclosure-and-simple-mode.md
- docs/01-architecture/adr/ADR-024-frontend-feature-modularization-and-zero-state-ui.md
- docs/05-operations/STAGE_28_ROLLOUT_AND_REGRESSION_PLAN.md
- docs/08-marketing/STAGE_28_MARKETING_AND_POSITIONING_IMPACT.md
- docs/08-marketing/campaigns/STAGE_28_CAMPAIGN_CONCEPTS.md
- docs/08-marketing/sales/STAGE_28_SALES_GUIDE.md

## Merge
Merge ROADMAP_STAGE28_PATCH.md into official ROADMAP.md after review.

## Suggested first commit
```bash
git add docs/
git commit -m "docs: define stage 28 simple experience and frontend refactor"
git push
```

## Important
Do not implement Stage 28 in a single giant commit.
Follow the substage gates from 28A to 28J.
