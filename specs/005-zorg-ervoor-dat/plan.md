# Implementation Plan: Footer Continuous Scrolling System

**Branch**: `005-zorg-ervoor-dat` | **Date**: 2025-01-14 | **Spec**: [specs/005-zorg-ervoor-dat/spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-zorg-ervoor-dat/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
4. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
5. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, or `GEMINI.md` for Gemini CLI).
6. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
7. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
8. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Implement continuous scrolling footer system that displays multiple text segments as a seamless ticker-tape animation. Text segments are separated by visual dividers (kroon icons) and automatically repeat to fill screen width. The system replaces the current static footer with dynamic CSS animations and intelligent text duplication logic.

## Technical Context
**Language/Version**: JavaScript ES6+, HTML5, CSS3  
**Primary Dependencies**: CSS Transforms, RequestAnimationFrame, Intersection Observer API  
**Storage**: Neon PostgreSQL via footer_config table (existing)  
**Testing**: Manual validation, performance testing with Chrome DevTools  
**Target Platform**: Digital signage displays (16:9 aspect ratio), modern browsers  
**Project Type**: Web - frontend component enhancement  
**Performance Goals**: 60fps smooth animation, <16ms frame time, GPU-accelerated  
**Constraints**: Must work on low-power displays, no animation stuttering, fallback to static  
**Scale/Scope**: Single display component, affects 1 file (MenuSignage.js), replaces 20 lines of footer logic

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 1 (frontend component only)
- Using framework directly? (vanilla JS, native CSS transforms)
- Single data model? (uses existing footer_config schema)
- Avoiding patterns? (no complex state management, direct DOM manipulation)

**Architecture**:
- EVERY feature as library? (N/A - component enhancement)
- Libraries listed: ScrollingFooter class (encapsulates animation logic)
- CLI per library: (N/A - frontend component)
- Library docs: JSDoc comments in source code

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? (manual validation first - component must fail to scroll)
- Git commits show tests before implementation? (validation script before component)
- Order: Contract→Integration→E2E→Unit strictly followed? (visual validation → performance → unit)
- Real dependencies used? (actual API endpoints, real footer data)
- Integration tests for: animation performance, text duplication logic, separator handling
- FORBIDDEN: Implementation before test, skipping RED phase

**Observability**:
- Structured logging included? (console.log for animation events)
- Frontend logs → backend? (N/A - client-side component)
- Error context sufficient? (fallback to static footer on animation failure)

**Versioning**:
- Version number assigned? (Component v1.0.0)
- BUILD increments on every change? (Git commit versioning)
- Breaking changes handled? (backwards compatible - fallback to existing footer)

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure]
```

**Structure Decision**: Option 1 (Single project) - Frontend component enhancement only

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `/scripts/update-agent-context.sh [claude|gemini|copilot]` for your AI assistant
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: ✅ data-model.md, ✅ /contracts/*, quickstart.md, ✅ CLAUDE.md updated

*Status: Phase 1 complete - all design artifacts generated successfully*

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- ScrollingFooter component → contract test task [P]
- AnimationState entity → model creation task [P] 
- Each quickstart scenario → integration test task
- Implementation tasks following TDD order (tests first, then component)
- Performance validation tasks for 60fps requirement

**Ordering Strategy**:
- TDD order: Contract tests → Integration tests → Component implementation
- Dependency order: CSS definitions → ScrollingFooter class → MenuSignage integration
- Mark [P] for parallel execution (CSS and test files are independent)
- Performance testing runs after basic implementation

**Estimated Output**: 12-15 numbered, ordered tasks in tasks.md

*Task Categories*:
- 3 contract test tasks (component methods, events, performance)
- 2 CSS implementation tasks (keyframes, classes) [P]
- 1 ScrollingFooter component implementation 
- 3 MenuSignage integration tasks
- 4 quickstart validation tasks (scrolling, fallback, config updates, performance)
- 2 documentation tasks (JSDoc, performance benchmarks)

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [x] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS (no new violations)
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none required)

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*