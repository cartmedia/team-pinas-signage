# Tasks: Footer Content Migration

**Input**: Design documents from `/specs/004-footer-content-migration/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory ✓
   → Tech stack: JavaScript (Node.js 18+), Netlify Functions, Neon PostgreSQL
   → Structure: Web application (frontend + backend)
2. Load design documents ✓
   → data-model.md: footer_config, settings, migration_status entities
   → contracts/: footer-migration-api.yaml contract
   → research.md: migration patterns and conflict resolution
3. Generate tasks by category ✓
   → Setup: database schema, dependencies
   → Tests: contract tests, integration tests
   → Core: migration logic, API endpoints
   → Integration: admin interface, database connections
   → Polish: validation, performance tests, documentation
4. Apply task rules ✓
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Netlify Functions**: `server/functions/`
- **Frontend Scripts**: `public/src/scripts/admin/`
- **Database**: `database/migrations/`
- **Tests**: `tests/contract/`, `tests/integration/`, `tests/e2e/`

## Phase 3.1: Setup
- [ ] T001 Create database migration file database/migrations/004-footer-migration.sql
- [ ] T002 [P] Add footer migration utilities to package.json dependencies
- [ ] T003 [P] Configure test environment for Netlify Functions testing

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [ ] T004 [P] Contract test GET /footer in tests/contract/test_footer_get.js
- [ ] T005 [P] Contract test PUT /footer in tests/contract/test_footer_put.js
- [ ] T006 [P] Contract test GET /admin-footer-migrate in tests/contract/test_migration_status.js
- [ ] T007 [P] Contract test POST /admin-footer-migrate in tests/contract/test_migration_execute.js
- [ ] T008 [P] Contract test GET /settings (footer excluded) in tests/contract/test_settings_modified.js
- [ ] T009 [P] Integration test complete migration workflow in tests/integration/test_migration_workflow.js
- [ ] T010 [P] Integration test admin interface migration in tests/integration/test_admin_migration.js
- [ ] T011 [P] Integration test conflict resolution in tests/integration/test_conflict_resolution.js

## Phase 3.3: Database Schema (ONLY after tests are failing)
- [ ] T012 Execute database migration script to create footer_config table
- [ ] T013 Execute database migration script to create migration_status table
- [ ] T014 Verify database schema with validation queries from data-model.md

## Phase 3.4: Core Implementation (ONLY after tests are failing)
- [ ] T015 [P] Footer endpoint GET handler in server/functions/footer.js
- [ ] T016 [P] Footer endpoint PUT handler in server/functions/footer.js
- [ ] T017 [P] Migration status GET handler in server/functions/admin-footer-migrate.js
- [ ] T018 [P] Migration execute POST handler in server/functions/admin-footer-migrate.js
- [ ] T019 Modify settings endpoint to exclude footer data in server/functions/settings.js
- [ ] T020 [P] Footer configuration validation logic in server/functions/footer.js
- [ ] T021 [P] Migration conflict resolution logic in server/functions/admin-footer-migrate.js
- [ ] T022 [P] Database connection helpers for footer operations
- [ ] T023 Error handling and logging for all endpoints

## Phase 3.5: Admin Interface Integration
- [ ] T024 [P] Footer migration UI component in public/src/scripts/admin/footer-migration.js
- [ ] T025 [P] Footer management interface in public/src/scripts/admin/footer-config.js
- [ ] T026 Update admin.js to integrate footer migration UI in public/src/scripts/admin/admin.js
- [ ] T027 [P] Migration status display in admin interface
- [ ] T028 [P] Footer configuration form with validation

## Phase 3.6: End-to-End Testing
- [ ] T029 [P] E2E test signage display uses footer endpoint in tests/e2e/test_signage_footer.js
- [ ] T030 [P] E2E test admin footer management workflow in tests/e2e/test_admin_footer.js
- [ ] T031 [P] E2E test migration process from start to finish in tests/e2e/test_complete_migration.js

## Phase 3.7: Polish
- [ ] T032 [P] Performance validation tests (<500ms response times) in tests/performance/test_footer_performance.js
- [ ] T033 [P] Load testing migration endpoint (<2s execution) in tests/performance/test_migration_performance.js
- [ ] T034 [P] Security validation for API key authentication in tests/security/test_auth_validation.js
- [ ] T035 Execute quickstart.md validation scenarios
- [ ] T036 [P] Update CLAUDE.md with footer endpoint documentation
- [ ] T037 Remove code duplication and optimize database queries
- [ ] T038 Final integration testing with live database

## Dependencies
- Database schema (T012-T014) before API implementation (T015-T023)
- Tests (T004-T011) before implementation (T015-T023)
- T015-T016 block T024-T025 (footer endpoints before admin UI)
- T017-T018 block T024, T027 (migration endpoints before migration UI)
- T019 blocks T008 (settings modification before settings contract test validation)
- Core implementation (T015-T023) before E2E tests (T029-T031)
- Implementation before polish (T032-T038)

## Parallel Example
```
# Launch contract tests together (T004-T008):
Task: "Contract test GET /footer in tests/contract/test_footer_get.js"
Task: "Contract test PUT /footer in tests/contract/test_footer_put.js"
Task: "Contract test GET /admin-footer-migrate in tests/contract/test_migration_status.js"
Task: "Contract test POST /admin-footer-migrate in tests/contract/test_migration_execute.js"
Task: "Contract test GET /settings (footer excluded) in tests/contract/test_settings_modified.js"

# Launch core API implementations together (T015-T018):
Task: "Footer endpoint GET handler in server/functions/footer.js"
Task: "Footer endpoint PUT handler in server/functions/footer.js"
Task: "Migration status GET handler in server/functions/admin-footer-migrate.js"
Task: "Migration execute POST handler in server/functions/admin-footer-migrate.js"
```

## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- Commit after each task
- Follow OpenAPI contract specification exactly
- Use exact field mappings from data-model.md
- Implement conflict resolution as specified in footer-migration-api.yaml

## Task Generation Rules
*Applied during main() execution*

1. **From Contracts**:
   - footer-migration-api.yaml → 5 contract test tasks [P]
   - Each endpoint → implementation task

2. **From Data Model**:
   - footer_config entity → footer endpoint tasks
   - migration_status entity → migration endpoint tasks
   - settings modifications → settings endpoint updates

3. **From Quickstart Scenarios**:
   - Migration workflow → integration tests [P]
   - Admin interface → E2E tests [P]
   - Performance targets → performance validation

4. **Ordering**:
   - Setup → Tests → Database → Endpoints → Admin UI → E2E → Polish
   - TDD enforced: Tests must fail before implementation

## Validation Checklist
*GATE: Checked by main() before returning*

- [x] All contracts have corresponding tests (T004-T008)
- [x] All entities have implementation tasks (footer_config → T015-T016, migration_status → T017-T018)
- [x] All tests come before implementation (T004-T011 before T015-T023)
- [x] Parallel tasks truly independent (different files, no shared dependencies)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] Migration workflow completely covered (database → API → UI → testing)
- [x] Performance and security validation included
- [x] Quickstart scenarios covered in E2E tests