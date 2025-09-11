# Tasks: Clean API Integration

**Input**: Design documents from `/specs/002-skip-emergency-stuff/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → ✅ Loaded implementation plan - refactoring emergency fixes
   → Extracted: JavaScript ES2020, vanilla JS, Netlify Functions, existing structure
2. Load optional design documents:
   → data-model.md: No new entities (using existing schema) ✅
   → contracts/: Products & Settings API contracts ✅
   → research.md: Direct API calls decision ✅
3. Generate tasks by category:
   → Setup: Remove emergency code, create API service
   → Tests: Manual testing per quickstart scenarios
   → Core: API service, error handling, retry logic
   → Integration: Update MenuSignage.js, remove HTML fallback
   → Polish: Performance verification, logging
4. Apply task rules:
   → Different files = mark [P] for parallel ✅
   → Same file = sequential (no [P]) ✅
   → Tests before implementation (manual testing approach) ✅
5. Number tasks sequentially (T001, T002...) ✅
6. Generate dependency graph ✅
7. Create parallel execution examples ✅
8. Validate task completeness:
   → All contracts covered? ✅ (products & settings)
   → All refactoring targets? ✅ (MenuSignage.js, index.html)
   → Emergency fix removal? ✅
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Existing Netlify structure**: `public/`, `src/scripts/`, `server/functions/`
- Refactoring existing files rather than creating new project structure

## Phase 3.1: Setup & Preparation
- [ ] T001 [P] Create API service abstraction in `src/scripts/shared/api-service.js`
- [ ] T002 [P] Backup current emergency fixes in MenuSignage.js (for rollback safety)
- [ ] T003 [P] Document current loading behavior in dev tools for baseline comparison

## Phase 3.2: Manual Tests First (TDD Approach) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be performed and MUST show current emergency behavior before ANY implementation**
- [ ] T004 [P] Test current loading behavior - verify 30+ minute hang exists (baseline)
- [ ] T005 [P] Test products API contract - verify `curl http://localhost:8080/.netlify/functions/products` returns valid JSON
- [ ] T006 [P] Test settings API contract - verify `curl http://localhost:8080/.netlify/functions/settings` returns valid JSON  
- [ ] T007 [P] Document current emergency HTML fallback content in browser (what shows when APIs fail)

## Phase 3.3: Core API Service Implementation (ONLY after tests confirm current behavior)
- [ ] T008 [P] Implement exponential backoff retry logic in `src/scripts/shared/api-service.js`
- [ ] T009 [P] Add proper error handling with meaningful messages in `src/scripts/shared/api-service.js`
- [ ] T010 [P] Create products API wrapper function with timeout in `src/scripts/shared/api-service.js`
- [ ] T011 [P] Create settings API wrapper function with timeout in `src/scripts/shared/api-service.js`
- [ ] T012 Add loadProducts() function to replace CMS Connector in `src/scripts/display/MenuSignage.js`
- [ ] T013 Add loadSettings() function to replace hardcoded settings in `src/scripts/display/MenuSignage.js`

## Phase 3.4: Emergency Fix Removal
- [ ] T014 Remove CMS Connector usage from `src/scripts/display/MenuSignage.js`
- [ ] T015 Replace complex timeout logic with simple 2-second maximum in `src/scripts/display/MenuSignage.js`
- [ ] T016 Remove emergency HTML fallback content from `public/index.html`
- [ ] T017 Update loading screen to show proper error messages on API failure in `src/scripts/display/MenuSignage.js`
- [ ] T018 Remove complex DOM calculation logic - use fixed item counts in `src/scripts/display/MenuSignage.js`

## Phase 3.5: Integration & Error Handling
- [ ] T019 Wire new API service into MenuSignage startup sequence in `src/scripts/display/MenuSignage.js`
- [ ] T020 Implement automatic recovery on network reconnection in `src/scripts/display/MenuSignage.js`
- [ ] T021 Add structured logging for debugging API failures in `src/scripts/display/MenuSignage.js`
- [ ] T022 Update loading screen text to use dynamic organization name from settings API in `src/scripts/display/MenuSignage.js`

## Phase 3.6: Validation & Polish
- [ ] T023 [P] Run quickstart manual test: Verify <2 second load time requirement
- [ ] T024 [P] Run quickstart manual test: Verify error handling (stop server, check clear error message)
- [ ] T025 [P] Run quickstart manual test: Verify recovery behavior (restart server, check auto-reload)
- [ ] T026 [P] Run quickstart manual test: Verify admin CMS still works at `/admin`
- [ ] T027 [P] Verify no "undefined is not an object" errors in browser console
- [ ] T028 Performance validation: Measure actual load times vs 2-second target
- [ ] T029 Remove any remaining emergency code comments and TODO markers
- [ ] T030 Update CLAUDE.md to reflect completed refactoring

## Dependencies
- Setup (T001-T003) before tests (T004-T007)
- Tests (T004-T007) before implementation (T008-T013)
- API service (T008-T011) before MenuSignage updates (T012-T013)
- Core implementation (T008-T013) before emergency removal (T014-T018)
- T012 and T013 before integration tasks (T019-T022)
- All implementation before validation (T023-T030)

## Parallel Example
```
# Phase 3.1 - Can run together (different files):
Task: "Create API service abstraction in src/scripts/shared/api-service.js"
Task: "Backup current emergency fixes in MenuSignage.js"
Task: "Document current loading behavior in dev tools"

# Phase 3.2 - Manual tests (can run in parallel):
Task: "Test current loading behavior - verify 30+ minute hang exists"
Task: "Test products API contract via curl"
Task: "Test settings API contract via curl"
Task: "Document current emergency HTML fallback content"

# Phase 3.3 - API service tasks (all same file, sequential):
# T008 → T009 → T010 → T011 (build API service incrementally)
```

## Critical Success Criteria
- **Performance**: Menu loads within 2 seconds (not 30+ minutes)
- **Reliability**: No infinite loading states or silent failures
- **Error Handling**: Clear messages when APIs unavailable, automatic retry
- **Data Accuracy**: Live database content, no hardcoded HTML fallback
- **Admin Compatibility**: CMS functionality preserved at `/admin`
- **Code Quality**: No emergency fixes, no CMS Connector complexity

## Rollback Safety
- T002 creates backup for immediate rollback if any test fails
- Can revert to main branch: `git checkout main` if issues occur
- Emergency fixes remain in main branch until this refactor proven successful

## Notes
- [P] tasks = different files, no dependencies between them
- MenuSignage.js tasks are sequential (same file modifications)
- Manual testing approach used due to existing emergency situation
- Focus on removing complexity rather than adding features
- API service is new file, can be developed in parallel with testing

## Task Generation Rules Applied
1. **From Contracts**: Products & Settings APIs → wrapper functions (T010-T011)
2. **From Research**: Direct API calls decision → remove CMS Connector (T014)  
3. **From Quickstart**: Manual test scenarios → validation tasks (T023-T026)
4. **From Plan**: Emergency fix removal → specific removal tasks (T014-T018)

## Validation Checklist
- [x] All contracts have corresponding implementation (products/settings API wrappers)
- [x] All refactoring targets identified (MenuSignage.js, index.html)
- [x] Manual tests come before implementation changes
- [x] Parallel tasks truly independent (different files)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task