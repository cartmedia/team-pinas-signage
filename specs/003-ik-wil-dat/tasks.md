# Tasks: Dedicated Footer Content Endpoint

**Input**: Design documents from `/Users/mistermeneer/Developer/team-pinas-signage/specs/003-ik-wil-dat/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/footer-api.yaml, quickstart.md

## Execution Flow (main)
```
1. Load plan.md from feature directory ✅
   → Tech stack: JavaScript/Node.js, Netlify Functions, Neon PostgreSQL
   → Structure: Web app, adding to /server/functions/
2. Load design documents: ✅
   → data-model.md: FooterConfig entity
   → contracts/footer-api.yaml: GET/POST/PUT /footer endpoints
   → quickstart.md: 7 test scenarios
3. Generate tasks by category:
   → Setup: database migration, dependencies check
   → Tests: contract tests, integration tests
   → Core: database model, API endpoint implementation
   → Integration: frontend updates, migration
   → Polish: performance tests, documentation
4. Apply task rules:
   → Database and API files = sequential (same server/functions/ directory)
   → Contract tests = parallel [P] (different test files)
   → Frontend and backend = parallel [P] (different directories)
5. Number tasks sequentially (T001-T025)
6. Dependency analysis: Tests → Database → API → Frontend → Validation
7. SUCCESS (25 tasks ready for TDD execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Existing web app structure**: `/server/functions/` for API, `/src/scripts/` for frontend
- Database migrations in root directory, tests follow existing patterns
- Paths are absolute from repository root

## Phase 3.1: Setup
- [ ] T001 Create database migration script at `/Users/mistermeneer/Developer/team-pinas-signage/database/migrations/003-footer-config-table.sql`
- [ ] T002 Run database migration to create footer_config table with constraints and triggers
- [ ] T003 [P] Verify existing dependencies support new footer functionality (Neon PostgreSQL driver, auth middleware)

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [ ] T004 [P] Contract test GET /.netlify/functions/footer in `/Users/mistermeneer/Developer/team-pinas-signage/tests/contract/test_footer_get.js`
- [ ] T005 [P] Contract test POST /.netlify/functions/footer in `/Users/mistermeneer/Developer/team-pinas-signage/tests/contract/test_footer_post.js`
- [ ] T006 [P] Contract test PUT /.netlify/functions/footer in `/Users/mistermeneer/Developer/team-pinas-signage/tests/contract/test_footer_put.js`
- [ ] T007 [P] Integration test footer configuration retrieval in `/Users/mistermeneer/Developer/team-pinas-signage/tests/integration/test_footer_retrieval.js`
- [ ] T008 [P] Integration test footer admin management in `/Users/mistermeneer/Developer/team-pinas-signage/tests/integration/test_footer_admin.js`
- [ ] T009 [P] Integration test database constraints in `/Users/mistermeneer/Developer/team-pinas-signage/tests/integration/test_footer_database.js`
- [ ] T010 [P] Integration test frontend footer loading in `/Users/mistermeneer/Developer/team-pinas-signage/tests/integration/test_footer_frontend.js`

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [ ] T011 Create footer endpoint function at `/Users/mistermeneer/Developer/team-pinas-signage/server/functions/footer.js`
- [ ] T012 Implement GET /footer endpoint with active configuration retrieval and 5-minute caching
- [ ] T013 Implement POST /footer endpoint with admin authentication and input validation  
- [ ] T014 Implement PUT /footer endpoint with partial update support and admin authentication
- [ ] T015 Add footer data validation (hex colors, scroll speed limits, font size format)
- [ ] T016 Add error handling and structured logging following existing endpoint patterns
- [ ] T017 Implement database unique active constraint handling (auto-deactivate old configs)

## Phase 3.4: Integration  
- [ ] T018 Update frontend API service at `/Users/mistermeneer/Developer/team-pinas-signage/src/scripts/shared/api-service.js` to include footer endpoint
- [ ] T019 Update MenuSignage.js at `/Users/mistermeneer/Developer/team-pinas-signage/src/scripts/display/MenuSignage.js` to use footer endpoint with fallback
- [ ] T020 Create data migration script to transfer existing footer settings from settings table to footer_config table
- [ ] T021 Update admin interface at `/Users/mistermeneer/Developer/team-pinas-signage/src/scripts/admin/admin.js` to manage footer via new endpoint
- [ ] T022 Add footer endpoint to Netlify build configuration in `/Users/mistermeneer/Developer/team-pinas-signage/netlify.toml`

## Phase 3.5: Polish
- [ ] T023 [P] Performance test footer endpoint response time (<500ms) in `/Users/mistermeneer/Developer/team-pinas-signage/tests/performance/test_footer_performance.js`
- [ ] T024 [P] Update CLAUDE.md documentation with detailed footer endpoint usage patterns  
- [ ] T025 Execute manual testing scenarios from quickstart.md and verify all success criteria

## Dependencies
- Database setup (T001-T002) before all other tasks
- Tests (T004-T010) before implementation (T011-T017)
- T011 (footer function creation) blocks T012-T017 (endpoint implementations)
- T012-T017 (API complete) before T018-T022 (frontend integration)
- All implementation before T023-T025 (polish)

## Parallel Example
```bash
# Launch contract tests together (T004-T006):
Task: "Contract test GET /.netlify/functions/footer in tests/contract/test_footer_get.js"
Task: "Contract test POST /.netlify/functions/footer in tests/contract/test_footer_post.js" 
Task: "Contract test PUT /.netlify/functions/footer in tests/contract/test_footer_put.js"

# Launch integration tests together (T007-T010):
Task: "Integration test footer configuration retrieval in tests/integration/test_footer_retrieval.js"
Task: "Integration test footer admin management in tests/integration/test_footer_admin.js"
Task: "Integration test database constraints in tests/integration/test_footer_database.js"
Task: "Integration test frontend footer loading in tests/integration/test_footer_frontend.js"

# Launch frontend updates together (T018, T021):
Task: "Update frontend API service to include footer endpoint"
Task: "Update admin interface to manage footer via new endpoint"
```

## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing (TDD requirement)
- Follow existing code patterns in /server/functions/settings.js and /server/functions/products.js
- Maintain backward compatibility during migration
- Use existing auth middleware from /server/functions/auth-middleware.js
- Commit after each task completion

## Task Generation Rules Applied

1. **From Contracts (footer-api.yaml)**:
   - GET /footer → T004 contract test, T012 implementation
   - POST /footer → T005 contract test, T013 implementation
   - PUT /footer → T006 contract test, T014 implementation
   
2. **From Data Model (FooterConfig entity)**:
   - Database table → T001 migration script, T002 migration execution
   - Validation rules → T015 validation implementation
   - Constraints → T009 database constraint tests, T017 constraint handling
   
3. **From Quickstart Scenarios**:
   - Test scenario 1 (GET public) → T007 integration test
   - Test scenario 2 (POST admin) → T008 integration test
   - Test scenario 4 (Frontend) → T010 integration test
   - Test scenario 5 (Database) → T009 integration test
   - Test scenario 6 (Performance) → T023 performance test

4. **From Research Decisions**:
   - Migration strategy → T020 data migration
   - Frontend integration → T018 API service, T019 MenuSignage update
   - Admin interface → T021 admin panel integration

## Validation Checklist ✅

- [x] All contracts have corresponding tests (T004-T006 for GET/POST/PUT)
- [x] FooterConfig entity has model tasks (T001 migration, T015 validation)
- [x] All tests come before implementation (T004-T010 before T011-T017)
- [x] Parallel tasks truly independent (different files/directories)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] TDD order enforced: Tests → Implementation → Integration → Polish