# Implementation Plan: Professional Configurable News Ticker Footer

**Branch**: `008-make-the-footer` | **Date**: 2025-09-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-make-the-footer/spec.md`

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
Implement a comprehensive configurable news ticker footer system allowing administrators complete control over content, appearance, and behavior. The system extends the existing footer infrastructure with enhanced configuration options, real-time preview, and professional-grade animation performance targeting 60 FPS hardware acceleration.

## Technical Context
**Language/Version**: JavaScript ES2020+ (Node.js 18+)  
**Primary Dependencies**: PostgreSQL via pg library, Netlify Functions, vanilla JavaScript DOM APIs  
**Storage**: Neon PostgreSQL database with existing footer_config table  
**Testing**: Jest for unit/integration tests, Playwright for E2E testing  
**Target Platform**: Web browsers on 16:9 digital signage displays
**Project Type**: web - frontend+backend integration  
**Performance Goals**: 60 FPS hardware-accelerated animations, <200ms API response, <500ms configuration updates  
**Constraints**: <50MB additional memory, real-time updates within 5-minute cache TTL, graceful fallback for performance issues  
**Scale/Scope**: Single restaurant deployment, 1-2 concurrent admin users, unlimited content segments up to 2000 chars each

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 2 (frontend display + admin interface, backend API)
- Using framework directly? Yes - vanilla JavaScript with direct DOM manipulation
- Single data model? Yes - FooterConfiguration entity with embedded components
- Avoiding patterns? Yes - direct database queries, no ORM abstraction layer

**Architecture**:
- EVERY feature as library? No - integrated into existing signage system
- Libraries listed: ScrollingFooter.js (display component), FooterAPI (backend functions), AdminFooter (configuration UI)
- CLI per library: N/A - web-based admin interface replaces CLI
- Library docs: Existing patterns - inline JSDoc + README sections

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? Yes - contract tests must fail before implementation
- Git commits show tests before implementation? Yes - API contract tests, then component tests, then implementation
- Order: Contract→Integration→E2E→Unit strictly followed? Yes - API contracts, database integration, Playwright E2E, Jest unit tests
- Real dependencies used? Yes - actual Neon PostgreSQL database, real Netlify Functions
- Integration tests for: footer API endpoints, admin interface, ScrollingFooter component integration
- FORBIDDEN: Implementation before test, skipping RED phase - all new endpoints require failing contract tests first

**Observability**:
- Structured logging included? Yes - JSON logs for API requests, configuration changes, performance metrics
- Frontend logs → backend? Yes - critical errors sent to backend logging endpoint
- Error context sufficient? Yes - request IDs, user context, configuration state included in all logs

**Versioning**:
- Version number assigned? Yes - Footer API v1.0.0 (semantic versioning)
- BUILD increments on every change? Yes - automated via git hooks
- Breaking changes handled? Yes - database migrations with rollback plan, API versioning for future changes

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

**Structure Decision**: Option 2 (Web application) - frontend signage display + backend API endpoints with admin interface

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

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (data-model.md, footer-api.yaml, quickstart.md)
- Each API endpoint → contract test task [P]
- Database schema changes → migration task [P] 
- Each user story from spec → integration test task
- Frontend component updates → component test task [P]
- Admin interface enhancements → UI test task
- Implementation tasks to make tests pass

**Ordering Strategy**:
- TDD order: Contract tests → Integration tests → E2E tests → Implementation 
- Dependency order: Database migration → API updates → Frontend components → Admin UI
- Mark [P] for parallel execution (independent files/components)
- Critical path: Database → API → ScrollingFooter → Admin Interface

**Estimated Task Breakdown**:
1. Database Migration (2 tasks)
2. API Contract Tests (5 tasks) [P]
3. Backend Implementation (6 tasks)
4. Frontend Component Updates (4 tasks) [P] 
5. Admin Interface Enhancement (8 tasks)
6. Integration & E2E Tests (5 tasks)
7. Documentation & Deployment (2 tasks)

**Estimated Output**: 32 numbered, ordered tasks in tasks.md

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
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [ ] Complexity deviations documented (none required - meets constitutional principles)

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*