# Tasks: Footer Continuous Scrolling System

**Input**: Design documents from `/specs/005-zorg-ervoor-dat/`
**Prerequisites**: ✅ plan.md, ✅ research.md, ✅ data-model.md, ✅ contracts/, ✅ quickstart.md

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Single project**: `src/`, `tests/` at repository root
- All paths relative to `/Users/mistermeneer/Developer/team-pinas-signage/`

## Phase 3.1: Setup
- [ ] T001 Create component directory structure: `src/scripts/display/components/`
- [ ] T002 [P] Create CSS scrolling animation keyframes in `src/styles/components/scrolling-footer.css`

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [ ] T003 [P] Contract test for ScrollingFooter constructor in `tests/components/test-scrolling-footer-constructor.html`
- [ ] T004 [P] Contract test for ScrollingFooter.start() method in `tests/components/test-scrolling-footer-start.html`
- [ ] T005 [P] Contract test for ScrollingFooter.stop() method in `tests/components/test-scrolling-footer-stop.html`
- [ ] T006 [P] Contract test for ScrollingFooter events (animation-started, animation-stopped) in `tests/components/test-scrolling-footer-events.html`
- [ ] T007 [P] Contract test for performance requirements (60fps, <5MB memory) in `tests/components/test-scrolling-footer-performance.html`

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [ ] T008 [P] ScrollingFooter component class with constructor and basic structure in `src/scripts/display/components/ScrollingFooter.js`
- [ ] T009 Implement ScrollingFooter.start() method with animation initialization in `src/scripts/display/components/ScrollingFooter.js`
- [ ] T010 Implement ScrollingFooter.stop() method with cleanup logic in `src/scripts/display/components/ScrollingFooter.js`
- [ ] T011 Implement text measurement and duplication logic in `src/scripts/display/components/ScrollingFooter.js`
- [ ] T012 Implement CSS keyframe generation and injection in `src/scripts/display/components/ScrollingFooter.js`
- [ ] T013 Implement performance monitoring with PerformanceObserver in `src/scripts/display/components/ScrollingFooter.js`
- [ ] T014 Implement event dispatching (animation-started, animation-stopped, performance-warning) in `src/scripts/display/components/ScrollingFooter.js`

## Phase 3.4: Integration  
- [ ] T015 Integrate ScrollingFooter into MenuSignage.js footer rendering (lines ~740-750)
- [ ] T016 Add scroll_direction conditional logic to enable/disable scrolling in `src/scripts/display/MenuSignage.js`
- [ ] T017 Update footer separator conversion to work with ScrollingFooter in `src/scripts/display/MenuSignage.js`
- [ ] T018 Add fallback error handling to revert to static footer on animation failure in `src/scripts/display/MenuSignage.js`

## Phase 3.5: Polish & Validation
- [ ] T019 [P] Quickstart Test Scenario 1: Enable continuous scrolling and verify smooth animation
- [ ] T020 [P] Quickstart Test Scenario 2: Validate text duplication logic for short and long text
- [ ] T021 [P] Quickstart Test Scenario 3: Test fallback behavior for static mode and error conditions  
- [ ] T022 [P] Quickstart Test Scenario 4: Verify real-time configuration updates and performance benchmarks
- [ ] T023 Add JSDoc documentation to ScrollingFooter class and all public methods in `src/scripts/display/components/ScrollingFooter.js`
- [ ] T024 Optimize CSS for maximum performance (GPU acceleration verification) in `src/styles/components/scrolling-footer.css`

## Dependencies
- Setup (T001-T002) before tests (T003-T007)
- Tests (T003-T007) before implementation (T008-T014)
- T008 blocks T009, T010, T011, T012, T013, T014
- T014 blocks T015, T016, T017, T018
- Implementation (T008-T018) before validation (T019-T024)

## Parallel Example
```
# Phase 3.2 - Launch T003-T007 together (all test files):
Task: "Contract test ScrollingFooter constructor in tests/components/test-scrolling-footer-constructor.html"
Task: "Contract test ScrollingFooter.start() method in tests/components/test-scrolling-footer-start.html" 
Task: "Contract test ScrollingFooter.stop() method in tests/components/test-scrolling-footer-stop.html"
Task: "Contract test ScrollingFooter events in tests/components/test-scrolling-footer-events.html"
Task: "Contract test performance requirements in tests/components/test-scrolling-footer-performance.html"

# Phase 3.5 - Launch T019-T022 together (validation scenarios):
Task: "Quickstart Test Scenario 1: Enable continuous scrolling"
Task: "Quickstart Test Scenario 2: Validate text duplication logic"
Task: "Quickstart Test Scenario 3: Test fallback behavior"
Task: "Quickstart Test Scenario 4: Verify real-time configuration updates"
```

## Task Generation Rules Applied

1. **From Contracts** (scrolling-footer-component.md):
   - ScrollingFooter component → 5 contract test tasks [P] (T003-T007)
   - Constructor, start(), stop(), events, performance → implementation tasks (T008-T014)
   
2. **From Data Model** (data-model.md):
   - ScrollingFooter entity → component creation task [P] (T008)
   - AnimationState entity → runtime state logic (T011, T012, T013)
   
3. **From Quickstart** (quickstart.md):
   - 4 test scenarios → 4 validation tasks [P] (T019-T022)
   - Performance benchmarks → performance validation task (T022)

4. **Integration Points**:
   - MenuSignage.js integration → 4 integration tasks (T015-T018)
   - CSS keyframes → setup task [P] (T002)

## Validation Checklist ✅

- ✅ All contracts have corresponding tests (T003-T007)
- ✅ All entities have model tasks (T008 for ScrollingFooter, T011 for AnimationState) 
- ✅ All tests come before implementation (Phase 3.2 before 3.3)
- ✅ Parallel tasks truly independent (different files, no shared dependencies)
- ✅ Each task specifies exact file path
- ✅ No task modifies same file as another [P] task

## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing (RED-GREEN-Refactor)
- Commit after each task completion
- ScrollingFooter.js tasks are sequential (same file modifications)
- Test files are independent and can run in parallel
- Performance requirement: 60fps animation, <100ms initialization, <5MB memory footprint

---
*Tasks ready for execution - proceed with Phase 3.1*