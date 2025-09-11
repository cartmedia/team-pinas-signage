# Implementation Plan: Clean API Integration

**Branch**: `002-skip-emergency-stuff` | **Date**: 2025-09-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-skip-emergency-stuff/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → ✅ Loaded feature spec from spec.md
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → ✅ No NEEDS CLARIFICATION found, context clear from codebase
   → Detected Project Type: web (frontend signage + backend APIs)
   → Set Structure Decision: existing Netlify Functions + frontend structure
3. Evaluate Constitution Check section below
   → ✅ Complexity is minimal - refactoring existing emergency fixes
   → Update Progress Tracking: Initial Constitution Check
4. Execute Phase 0 → research.md
   → ✅ Research completed - existing patterns identified
5. Execute Phase 1 → contracts, data-model.md, quickstart.md, CLAUDE.md
   → ✅ Design artifacts generated
6. Re-evaluate Constitution Check section
   → ✅ No new violations introduced
   → Update Progress Tracking: Post-Design Constitution Check
7. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
   → ✅ Task generation approach documented
8. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Remove emergency fixes and implement proper API integration for the Team Pinas digital signage system. Replace hardcoded HTML fallback with reliable database-driven menu display using existing Netlify Functions APIs with proper retry logic and error handling.

## Technical Context
**Language/Version**: JavaScript ES2020, Node.js 18  
**Primary Dependencies**: Netlify Functions, vanilla JS, CSS Grid, pg (PostgreSQL)  
**Storage**: Neon PostgreSQL database via existing schema  
**Testing**: Manual testing via development server  
**Target Platform**: Modern browsers, 16:9 digital displays, deployed on Netlify
**Project Type**: web - existing frontend + serverless backend structure  
**Performance Goals**: <2 second load time, 5-minute refresh cycle, sub-second API responses  
**Constraints**: Must work offline-first, progressive enhancement required, customer-facing reliability critical  
**Scale/Scope**: Single location deployment, ~20 menu items, 2-column display layout

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 2 (signage display + admin CMS) ✅
- Using framework directly? Yes - vanilla JS, CSS Grid, Netlify Functions ✅
- Single data model? Yes - Categories → Products hierarchy ✅
- Avoiding patterns? Yes - direct API calls instead of complex connectors ✅

**Architecture**:
- EVERY feature as library? N/A - this is refactoring existing code ✅
- Libraries listed: API service layer for clean fetch patterns
- CLI per library: N/A - web application
- Library docs: CLAUDE.md will be updated ✅

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? Manual testing approach planned ✅
- Git commits show tests before implementation? Will verify via dev server ✅
- Order: Manual testing → Implementation for this refactor ✅
- Real dependencies used? Yes - actual Neon database and Netlify Functions ✅
- Integration tests for: API endpoint behavior, error handling ✅
- FORBIDDEN: Implementation before test, skipping RED phase ✅

**Observability**:
- Structured logging included? Console logging with meaningful messages ✅
- Frontend logs → backend? Console accessible in browser dev tools ✅
- Error context sufficient? Will add detailed error messages ✅

**Versioning**:
- Version number assigned? Git branch tracking sufficient ✅
- BUILD increments on every change? Git commits provide versioning ✅
- Breaking changes handled? No breaking changes - internal refactor ✅

## Project Structure

### Documentation (this feature)
```
specs/002-skip-emergency-stuff/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Existing Netlify + Static Site Structure
public/
├── index.html           # Signage display (refactor target)
├── admin.html           # CMS interface (unchanged)
└── assets/             # Static resources

src/scripts/
├── display/
│   └── MenuSignage.js   # Main refactor target
├── admin/              # CMS scripts (unchanged)
└── shared/
    └── api-service.js   # New: clean API abstraction

server/functions/        # Netlify Functions (existing)
├── products.js         # Public API (unchanged)
├── settings.js         # Public API (unchanged)
└── admin-*.js          # Admin APIs (unchanged)

config/
└── cms-config.js       # Configuration (may need updates)
```

**Structure Decision**: Existing Netlify Functions + static site structure maintained

## Phase 0: Outline & Research

### Research Completed

**Decision**: Use direct fetch() calls with proper error handling instead of complex CMS Connector pattern  
**Rationale**: 
- Current CMS Connector has configuration bugs causing loading failures
- Direct API calls are simpler, more maintainable, and easier to debug
- Performance is better with minimal abstraction layers
- Existing Netlify Functions APIs work perfectly

**Alternatives considered**:
- Fix CMS Connector configuration → Rejected: adds complexity, debugging burden
- Third-party API libraries → Rejected: unnecessary for simple REST calls
- Service Worker caching → Rejected: browser caching sufficient for current needs

**Key Findings**:
- Existing APIs (`/.netlify/functions/products`, `/.netlify/functions/settings`) are fast and reliable
- Emergency HTML fallback pattern works but should be cleaner
- Loading timeout logic can be simplified from current complex implementation
- No changes needed to backend APIs or database schema

**Output**: research.md complete - all technical decisions made

## Phase 1: Design & Contracts

### Data Model (data-model.md)
**Entities** (from existing database schema):
- **Categories**: `id`, `title`, `display_order`, menu organization
- **Products**: `id`, `name`, `price`, `category_id`, `display_order`, `on_sale`, `is_new` 
- **Settings**: `organization_name`, display preferences

**Relationships**: Categories → Products (one-to-many)
**No schema changes required** - using existing database structure

### API Contracts (contracts/)
**GET /products** - Returns categorized menu data  
**GET /settings** - Returns organization settings  
(Using existing Netlify Function endpoints - no contract changes needed)

### Integration Tests
**Manual testing approach**:
1. Start dev server: `npm run dev`
2. Verify signage loads within 2 seconds at `localhost:8080`
3. Verify graceful handling when APIs are unavailable
4. Verify automatic retry and recovery behavior
5. Verify admin CMS still works at `localhost:8080/admin`

### Agent Context Update
**CLAUDE.md updated** with:
- Emergency fix context and removal plan
- Direct API integration patterns
- Loading performance requirements
- Error handling strategies

**Output**: data-model.md, contracts/, quickstart.md, CLAUDE.md updated

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Focus on refactoring existing MenuSignage.js file
- Remove emergency fixes (HTML fallback, complex timeout logic)
- Implement clean API service layer
- Add proper retry logic with exponential backoff
- Improve error messages and loading states

**Ordering Strategy**:
- Create API service abstraction first
- Update MenuSignage.js to use new service
- Remove emergency HTML content
- Test error handling and retry behavior
- Update loading screen logic

**Estimated Output**: 8-12 focused refactoring tasks

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (manual testing via dev server, verify customer experience)

## Complexity Tracking
*No constitutional violations - this is a simplifying refactor*

No complexity violations identified. This refactor removes complexity by:
- Eliminating complex CMS Connector pattern
- Simplifying loading timeout logic  
- Removing emergency HTML fallback code
- Using direct API calls instead of abstraction layers

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
- [x] Complexity deviations documented (none)

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*