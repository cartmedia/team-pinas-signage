# Tasks: Professional Configurable News Ticker Footer

**Input**: Design documents from `/specs/008-make-the-footer/`  
**Prerequisites**: plan.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

## Phase 3.1: Setup & Database Migration

- [ ] T001 Create database migration for enhanced footer configuration schema  
  **File**: `database/migrations/008-enhanced-footer-config.sql`  
  **Action**: Add new columns to footer_config table: is_visible, separator_type, custom_separator, separator_spacing, separator_color, animation_timing, pause_on_hover, reverse_on_complete, opacity, text_shadow, border_radius with constraints

- [ ] T002 [P] Set up contract testing environment for footer API endpoints  
  **File**: `tests/contract/footer-api.test.js`  
  **Action**: Initialize contract testing framework, create base test structure for OpenAPI validation

- [ ] T003 [P] Configure Jest test environment for footer components  
  **File**: `tests/setup/footer-test-setup.js`  
  **Action**: Set up JSDOM environment, mock database connections, create test utilities for footer testing

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

- [ ] T004 [P] Contract test GET /.netlify/functions/footer endpoint  
  **File**: `tests/contract/test-footer-get.js`  
  **Action**: Test 200 response with FooterConfiguration schema, 204 no active config, 404 not visible, validate all response fields

- [ ] T005 [P] Contract test PUT /.netlify/functions/footer endpoint  
  **File**: `tests/contract/test-footer-put.js`  
  **Action**: Test 200 update success, 400 validation errors, 401 unauthorized, validate request/response schemas

- [ ] T006 [P] Contract test POST /.netlify/functions/footer/preview endpoint  
  **File**: `tests/contract/test-footer-preview.js`  
  **Action**: Test 200 preview generation, validate FooterPreview schema, test segment parsing and HTML rendering

- [ ] T007 [P] Contract test GET /.netlify/functions/footer/configurations endpoint  
  **File**: `tests/contract/test-footer-configurations-get.js`  
  **Action**: Test 200 list response, include_inactive parameter, validate FooterConfigurationSummary schema

- [ ] T008 [P] Contract test POST /.netlify/functions/footer/configurations endpoint  
  **File**: `tests/contract/test-footer-configurations-post.js`  
  **Action**: Test 201 creation, 400 validation errors, validate FooterConfiguration creation

- [ ] T009 [P] Contract test POST /.netlify/functions/footer/configurations/{id}/activate endpoint  
  **File**: `tests/contract/test-footer-activate.js`  
  **Action**: Test 200 activation success, 404 not found, verify single active constraint

- [ ] T010 [P] Integration test: Basic footer configuration scenario  
  **File**: `tests/integration/test-basic-footer-config.js`  
  **Action**: Test complete flow from API call to signage display, verify footer appears with correct configuration

- [ ] T011 [P] Integration test: Real-time configuration update scenario  
  **File**: `tests/integration/test-realtime-config-update.js`  
  **Action**: Test admin update → API → cache invalidation → signage refresh, verify changes appear within 1 minute

- [ ] T012 [P] Integration test: Visibility toggle scenario  
  **File**: `tests/integration/test-visibility-toggle.js`  
  **Action**: Test footer hide/show functionality, verify complete removal/restoration of footer element

## Phase 3.3: Core Implementation (ONLY after tests are failing)

- [ ] T013 Implement database migration runner  
  **File**: `scripts/migrate-footer-schema.js`  
  **Action**: Execute T001 migration, verify schema changes, test rollback capability, update migration tracking

- [ ] T014 [P] Create FooterConfiguration data model validation  
  **File**: `server/models/FooterConfiguration.js`  
  **Action**: Implement validation rules, hex color validation, enum constraints, content length limits

- [ ] T015 [P] Create separator resolution service  
  **File**: `server/services/SeparatorService.js`  
  **Action**: Implement priority-based separator resolution: custom → crown → star → dot → dash → space

- [ ] T016 [P] Create footer content parsing service  
  **File**: `server/services/FooterContentService.js`  
  **Action**: Parse footer_text with <separator> tokens, generate ContentSegment objects, apply separator resolution

- [ ] T017 Enhance GET /.netlify/functions/footer endpoint  
  **File**: `server/functions/footer.js`  
  **Action**: Add support for new schema fields, implement visibility filtering, maintain backward compatibility

- [ ] T018 Implement PUT /.netlify/functions/footer endpoint enhancements  
  **File**: `server/functions/footer.js`  
  **Action**: Add validation for new fields, implement atomic active flag updates, cache invalidation

- [ ] T019 Implement POST /.netlify/functions/footer/preview endpoint  
  **File**: `server/functions/footer-preview.js`  
  **Action**: Create new endpoint for configuration preview, generate HTML representation, calculate estimated duration

- [ ] T020 Implement GET /.netlify/functions/footer/configurations endpoint  
  **File**: `server/functions/footer-configurations.js`  
  **Action**: Create new endpoint for listing all configurations, implement include_inactive parameter

- [ ] T021 Implement POST /.netlify/functions/footer/configurations endpoint  
  **File**: `server/functions/footer-configurations.js`  
  **Action**: Create configuration creation endpoint, default to inactive state, implement validation

- [ ] T022 Implement POST /.netlify/functions/footer/configurations/{id}/activate endpoint  
  **File**: `server/functions/footer-activate.js`  
  **Action**: Create activation endpoint, ensure single active constraint, implement atomic updates

## Phase 3.4: Frontend Component Updates

- [ ] T023 [P] Enhance ScrollingFooter component for new separator types  
  **File**: `src/scripts/display/components/ScrollingFooter.js`  
  **Action**: Add support for new separator types, implement custom separator handling, maintain backward compatibility

- [ ] T024 [P] Update footer CSS for enhanced styling options  
  **File**: `src/styles/components/scrolling-footer.css`  
  **Action**: Add CSS custom properties for new styling fields, implement opacity/shadow/border-radius support

- [ ] T025 [P] Create footer configuration preview component  
  **File**: `src/scripts/admin/components/FooterPreview.js`  
  **Action**: Create real-time preview component for admin interface, implement live rendering of configuration changes

- [ ] T026 Enhance admin footer interface for new configuration options  
  **File**: `src/scripts/admin/admin.js`  
  **Action**: Add UI controls for all new configuration fields, implement validation feedback, add preview integration

## Phase 3.5: Integration & Error Handling

- [ ] T027 Implement footer API error handling and logging  
  **File**: `server/functions/footer.js` (and related endpoints)  
  **Action**: Add structured logging, error context, request tracking, performance monitoring

- [ ] T028 Update footer component error handling and fallback modes  
  **File**: `src/scripts/display/components/ScrollingFooter.js`  
  **Action**: Enhance fallback mechanisms, add performance monitoring, implement graceful degradation

- [ ] T029 Implement cache management for footer configurations  
  **File**: `server/services/FooterCacheService.js`  
  **Action**: Create cache service for configuration data, implement invalidation on updates, optimize performance

- [ ] T030 Add footer configuration audit logging  
  **File**: `server/services/FooterAuditService.js`  
  **Action**: Log all configuration changes, track user actions, implement rollback data collection

## Phase 3.6: Polish & Documentation

- [ ] T031 [P] Unit tests for footer validation logic  
  **File**: `tests/unit/test-footer-validation.js`  
  **Action**: Test all validation rules, edge cases, error messages, ensure comprehensive coverage

- [ ] T032 [P] Unit tests for separator resolution logic  
  **File**: `tests/unit/test-separator-resolution.js`  
  **Action**: Test priority chain, custom separators, edge cases, performance with large content

- [ ] T033 [P] Performance tests for footer animation and API response times  
  **File**: `tests/performance/test-footer-performance.js`  
  **Action**: Verify 60fps animation, <200ms API responses, memory usage limits, stress testing

- [ ] T034 [P] E2E tests using Playwright for complete footer workflow  
  **File**: `tests/e2e/footer-complete-workflow.spec.js`  
  **Action**: Test admin configuration → API → signage display end-to-end, verify visual changes

- [ ] T035 Update footer API documentation  
  **File**: `docs/api/footer-endpoints.md`  
  **Action**: Document all new endpoints, provide examples, update OpenAPI specification

- [ ] T036 Execute quickstart validation scenarios  
  **File**: Follow `specs/008-make-the-footer/quickstart.md`  
  **Action**: Run all validation scenarios, verify success criteria, document any issues

## Dependencies

**Setup Phase (T001-T003)**:
- T001 must complete before any database-dependent tests
- T002, T003 can run in parallel

**Test Phase (T004-T012)**:  
- All contract tests (T004-T009) can run in parallel [P]
- All integration tests (T010-T012) can run in parallel [P] 
- ALL tests must be written and failing before proceeding to T013

**Implementation Phase (T013-T022)**:
- T013 (migration) blocks T017-T022 (all database operations)
- T014-T016 (services) can run in parallel [P]
- T017-T018 modify same file (sequential)
- T019-T022 each create new files (can be parallel if resources allow)

**Frontend Phase (T023-T026)**:
- T023-T025 modify different files [P]
- T026 depends on T025 (preview component)

**Integration Phase (T027-T030)**:
- All can run in parallel [P] as they create separate files

**Polish Phase (T031-T036)**:
- T031-T033 can run in parallel [P] (different test files)
- T034 depends on implementation completion
- T035-T036 can run in parallel [P]

## Parallel Execution Examples

### Launch Contract Tests (after T001-T003):
```bash
# Run all contract tests in parallel
Task: "Contract test GET /.netlify/functions/footer endpoint in tests/contract/test-footer-get.js"
Task: "Contract test PUT /.netlify/functions/footer endpoint in tests/contract/test-footer-put.js"  
Task: "Contract test POST /.netlify/functions/footer/preview endpoint in tests/contract/test-footer-preview.js"
Task: "Contract test GET /.netlify/functions/footer/configurations endpoint in tests/contract/test-footer-configurations-get.js"
Task: "Contract test POST /.netlify/functions/footer/configurations endpoint in tests/contract/test-footer-configurations-post.js"
```

### Launch Service Layer Development:
```bash
# Run service implementations in parallel (after T013)
Task: "Create FooterConfiguration data model validation in server/models/FooterConfiguration.js"
Task: "Create separator resolution service in server/services/SeparatorService.js"
Task: "Create footer content parsing service in server/services/FooterContentService.js"
```

### Launch Frontend Components:
```bash  
# Run frontend updates in parallel
Task: "Enhance ScrollingFooter component for new separator types in src/scripts/display/components/ScrollingFooter.js"
Task: "Update footer CSS for enhanced styling options in src/styles/components/scrolling-footer.css"
Task: "Create footer configuration preview component in src/scripts/admin/components/FooterPreview.js"
```

## Validation Checklist
*GATE: Must verify before marking complete*

- [x] All contracts (T004-T009) have corresponding tests  
- [x] FooterConfiguration entity has validation model (T014)
- [x] All tests (T004-T012) come before implementation (T013-T030)
- [x] Parallel tasks [P] are truly independent (different files)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task (except T017-T018 which are sequential)
- [x] Database migration (T001, T013) precedes all database operations
- [x] Error handling and logging included (T027-T028, T030)  
- [x] Performance requirements addressed (T033)
- [x] E2E validation included (T034, T036)

## Notes

- **[P] tasks** = different files, no dependencies, can run in parallel
- **Critical Path**: T001 → T013 → T017 → T026 → T034 → T036 
- **Verify tests fail** before implementing (TDD requirement)
- **Commit after each task** for clean git history
- **Cache invalidation** must be tested thoroughly (T011, T029)
- **Backward compatibility** maintained throughout (T017, T023)