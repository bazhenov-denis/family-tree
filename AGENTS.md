# AGENTS.md

проект собирай всегда через docker

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

**Family Tree** — a genealogy web app ("Семейное Древо") with multi-tree workspaces, person/relationship management, events, media, comments, GEDCOM import/export, and SVG-based graph visualization. UI is in Russian.

Monorepo layout:
- `backend/` — Spring Boot (Java 17) REST API
- `frontend/` — React 19 + Vite SPA (JSX, not TypeScript)
- `nginx/` — reverse proxy config
- `docker-compose.yml` — full stack (postgres, redis, minio, backend, frontend, nginx)

## Commands

### Backend
```
cd backend && ./mvnw spring-boot:run          # run dev server (port 8080)
cd backend && ./mvnw clean package -DskipTests # build JAR
cd backend && ./mvnw test                      # run tests (none exist yet)
```

### Frontend
```
cd frontend && npm run dev      # Vite dev server
cd frontend && npm run build    # tsc -b && vite build
cd frontend && npm run lint     # eslint
```

### Docker (full stack)
```
docker compose up              # start all 7 services
docker compose down            # stop all
```

### Infrastructure
- PostgreSQL: port 5434 (external) → 5432 (internal), DB=`family_tree`, user=`family`, pass=`family`
- Redis: port 6379
- MinIO: port 9000 (API), 9001 (console), bucket=`family-tree-media`
- Nginx proxies `/` → frontend, `/api/` → backend:8080, `/media/` → minio:9000

## Backend Architecture

**Root package**: `com.example.backend`

Each domain module follows the same layered structure:
```
api/          — @RestController (HTTP layer)
application/  — @Service (business logic)
dto/          — Request/Response DTOs
entity/       — JPA @Entity classes
repository/   — Spring Data JPA interfaces
```

### Domain Modules

| Module | Key Entities | Notes |
|---|---|---|
| `auth` | `User` | JWT login/registration, profile management |
| `person` | `Person` | CRUD for family members |
| `relationship` | `Relationship` | Parent/Spouse/Guardian/Adopted links |
| `event` | `Event`, `EventPerson` | Life events attached to persons |
| `comment` | `Comment` | Comments on any entity |
| `tree` | `FamilyTree`, `TreeMember` | Multi-tree with roles (owner/editor/viewer/commentator) |
| `tree/invite` | `InviteToken`, `TreeInvite` | Email-based invitation system |
| `graph` | — | Graph layout algorithms for visualization |
| `media` | `Media` | File storage via MinIO (photos + documents) |
| `gedcom` | — | GEDCOM import/export, JSON export |
| `audit` | `AuditLog` | Audit logging |
| `shared` | `BaseEntity` | Global exception handling, MinIO config, email |

### Security
- JWT stateless auth via `JwtAuthenticationFilter` + `JwtTokenProvider`
- Public endpoints: `/api/auth/**`, `/api/ping`, `/api/invites/**`
- All other endpoints require authentication
- CORS allows all origins in dev

### Database
- Schema managed by Hibernate `ddl-auto: update` (Flyway is disabled)
- Migration directory exists at `backend/src/main/resources/db/migration/` but is empty

## Frontend Architecture

**Stack**: React 19 + Vite 7 + React Router 7, plain JSX (no TypeScript in source files)
**Styling**: Pure CSS in `frontend/src/index.css` (~1800 lines, CSS variables, dark mode, responsive)

### Routing (`frontend/src/App.jsx`)

| Route | Component |
|---|---|
| `/` | HomeRedirect → `/trees` (auth) or LandingPage |
| `/login`, `/register` | Auth pages |
| `/invite/:token` | Invite acceptance |
| `/trees` | List of user's trees |
| `/trees/:treeId` | Tree detail (graph view) |
| `/trees/:treeId/members` | Tree members management |
| `/trees/:treeId/persons` | Persons list |
| `/invites` | Sent invites |
| `/profile` | User profile |

### API Layer
- `frontend/src/api/client.js` — core fetch wrapper with auth headers, 401 redirect
- Individual API modules per domain: `auth.js`, `trees.js`, `persons.js`, `relationships.js`, `events.js`, `comments.js`, `media.js`, `invites.js`, `members.js`, `graph.js`, `audit.js`, `gedcom.js`, `upload.js`, `users.js`, `tokens.js`

### Key Components
- `components/Layout.jsx` — sidebar navigation, dark mode toggle, mobile drawer
- `components/tree/TreeGraph.jsx` — SVG-based genealogy visualization
- `components/tree/TreeSearch.jsx` — search within tree
- `components/person/PersonPanel.jsx` — 4-tab side panel (Обзор/События/Фото/Связи)
- `components/person/MediaGallery.jsx` — photo + document gallery
- `components/person/CommentSection.jsx` — comments on entities
- `components/ui/Modal.jsx`, `ConfirmModal.jsx`, `Spinner.jsx`, `ToastContainer.jsx`

### Utils
- `utils/genealogyLayout.js` — graph layout constants: CARD_W=155, CARD_H=180, H_GAP=60, COUPLE_GAP=28, V_GAP=80
- `utils/findRelationPath.js` — BFS relationship pathfinding
- `utils/treeStats.js` — tree statistics computation
- `utils/exportTree.js` — tree data export

## Key Conventions

- **Russian language** UI throughout
- **No TypeScript** in source — plain JSX only (despite TS devDependencies)
- **Green primary color**: `#16a34a`
- **Lombok** used on backend — don't write boilerplate getters/setters
- **No tests** exist yet on either side, but test infrastructure is declared in pom.xml
- **Layout.jsx** accepts `fill` prop → adds `.main-content--fill` (overflow:hidden, flex column) for full-viewport pages
