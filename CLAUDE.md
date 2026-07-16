# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Angular 18 (standalone components, signals) frontend for a school administration system: students, employees, attendance, fees, exams, transport, library, hostel, inventory, payroll, admissions, etc. Uses Angular Material + Bootstrap grid + Tailwind utilities together, and talks to a separate ASP.NET Core backend.

**The backend lives in a sibling-but-unrelated-looking directory**: `c:\Users\AjaySaini\Desktop\SchoolManagement` (solution `SRS.sln`, projects `SRS.Api`/`SRS.Bal`/`SRS.Dal`, its own git repo and CLAUDE.md). Run it with `dotnet run --project SRS.Api`; it serves at `http://localhost:5029` (see `src/environments/environment.ts`). Before adding or changing any Angular service that calls the API, read the matching controller in `SRS.Api/Controllers/*.cs` and its DTOs in `SRS.Bal/DTO/**` rather than guessing the shape — there is a stale, unused duplicate of the DataTable request/response types in `SRS.Bal/DTO/DataTable/` that controllers do NOT use; the real ones are in `SRS.Bal/Modal/CommonResponse.cs`.

## Commands

- `npm start` / `ng serve` — dev server at `http://localhost:4200` (requires the backend running at `:5029`)
- `ng build` — production build to `dist/school-management-ui`
- `ng build --watch --configuration development` — dev-mode watch build
- `ng test` — Karma/Jasmine unit tests (very few exist: `app.component.spec.ts`, `master.service.spec.ts`, `file-upload.component.spec.ts`). No e2e runner is configured. There is no committed Playwright suite — ad hoc verification for past features used a scratch script with a fake JWT (see project memory) rather than a checked-in test.
- `ng generate component features/<area>/<name>` etc. for scaffolding — the project follows Angular CLI defaults (standalone, SCSS).

There is no lint script wired into `package.json`; don't assume `npm run lint` exists.

## Architecture

### Request/response envelope — every controller call follows this shape

- `BaseResponse<T>` (`core/models/base-response.model.ts`): `{ isSuccess, data, message, errorMessage, statusCode }`. Always unwrap `.data`.
- `BaseRequest<T>`: `{ data: T }` — wrap simple POST bodies in this.
- Server-side-paged grids use `DataTableRequest<T>` / `DataTableResponse<T>` (`core/models/data-table.model.ts`), a DataTables-style envelope: `dataTableParameters` (`draw`/`start`/`length`/`searchValue`/`sortColumn`/`sortDirection`) + a `requestModal` filter payload, returning `{ draw, recordsTotal, recordsFiltered, data, fileDirectoryPath }`.
- Controllers route as `api/{Controller}/{ActionName}` (not REST resource routes), use default ASP.NET Core camelCase JSON serialization, and case-insensitive model binding — so TypeScript interfaces use camelCase even though the C# DTOs are PascalCase.
- List-typed query params (`[FromQuery] List<T>`) must be sent as the same key repeated (`?KeyList=1&KeyList=2`), not comma-joined — `ApiBaseService.buildParams` already does this for arrays.

### Service layer — one service per backend controller

`core/services/*.service.ts` each `extends ApiBaseService` (`core/services/api-base.service.ts`) and set `protected readonly controllerName = 'X'` matching the controller name. `ApiBaseService` provides `get`/`post`/`postForm` that build the `api/{controllerName}/{action}` URL and handle query params. Use `postForm` + `toFormData()` (`core/utils/form-data.util.ts`) for endpoints accepting file uploads. Do not call `HttpClient` directly from components — go through a service.

Auth: `core/services/auth.service.ts` + `core/interceptors/auth.interceptor.ts` attach the JWT bearer token, redirect to `/login` on 401, and toast on 403. `core/utils/jwt.util.ts` decodes the token client-side for role/claims. Roles are the fixed set in `core/constants/roles.ts` (`Admin`/`Employee`/`Student`/`Teacher`/`Accountant`), mirroring seeded `usr.Tb_Roles` rows — there is no anonymous role-lookup endpoint for the login form to call.

`core/services/session-context.service.ts` caches the active school-year session (`SetupService.getActiveSession()`) behind a signal, loaded lazily by the shell after login (not at bootstrap, since the endpoint requires auth). **Any feature that depends on "the active session" must read it reactively** (e.g. `effect()` off `sessionContext.activeSession`, with `allowSignalWrites: true` if needed) rather than snapshotting it once in `ngOnInit` — several past bugs were exactly this (Dashboard, Students, Attendance, Fee, Exam, Transport all needed this fix). Watch out for Angular's NG0600 when writing signals inside `effect()`.

### Routing

Top-level routes are in `app.routes.ts`, all `loadComponent`/`loadChildren` (lazy). The `''` shell route (`layout/shell/shell.component.ts`) wraps everything behind `authGuard`; children use `adminGuard` / `staffGuard` / `roleGuard(ROLE.X, ROLE.Y)` from `core/guards/role.guard.ts` to mirror (not replace) server-side `[AuthorizeRoles(...)]` checks.

Modules that need Chart.js get **their own `<feature>.routes.ts`** file (e.g. `features/fee/fee.routes.ts`) with `providers: [provideCharts({ registerables: [...] })]` on the route, referenced from `app.routes.ts` via `loadChildren`. Chart.js/ng2-charts must never be registered in `app.config.ts` or `app.routes.ts` directly — that would pull charting into the initial bundle for users who never visit a charted page.

Route-ordering matters for parameterized routes: literal sibling paths (e.g. `students/new`, `students/promote`) must be declared before the `:id` catch-all (`students/:id`), or the catch-all swallows them.

Print/receipt/ID-card views are dedicated routes, not modals (e.g. `students/transfer-certificate-print`, `fee/receipt`, `payroll/payslip-print`, `students/id-card`, `employees/id-card`) — they're meant to be opened and printed via browser print, not shown in-app.

### Shared UI kit (`shared/`)

- `data-table/` — `DataTableComponent` wraps the server-paged grid pattern above. Its `[filter]` input must be passed as a **stable object reference** — recreating a new object each change-detection cycle re-triggers fetches.
- `toast/toast.service.ts` — app-wide toast notifications (used by the auth interceptor on 403, etc).
- `confirm-dialog/confirm-dialog.service.ts` — Material-dialog-backed confirm() helper.
- `file-upload/` — `FileUploadComponent` supports `existingFileUrl`/`existingFileName` inputs so edit forms can show an already-uploaded file instead of an empty picker.
- `credentials-dialog/` — reusable "show generated username/password" dialog (used after creating Students/Employees with login accounts).
- `skeleton/`, `empty-state/`, `field-error/`, `stat-tile/` — loading/empty/validation/dashboard-tile primitives.
- `breakpoints.ts` — shared responsive breakpoint constants (not Tailwind's).
- `validators/password.validator.ts` — exists but is not currently wired into any form; check before assuming password rules are enforced.

### Styling

Three systems are layered deliberately: Angular Material (component theming), Bootstrap 5 (grid/utilities in SCSS), and Tailwind (utility classes for one-off layout). Tailwind's `preflight` is disabled in `tailwind.config.js` specifically so it doesn't fight Material/Bootstrap base element styles — don't re-enable it without checking both.

### Feature module shape

Each `features/<area>/` typically has a top-level `<area>.component.ts` (often tabbed, e.g. Setup's 6 master-data tabs, Attendance's Mark/Register tabs, Fee's Collect/Report tabs, Exam's Marks-Entry/Report-Card tabs) plus sibling folders for sub-flows (`<area>/<sub-flow>/`). Student and Employee use different form shapes on purpose: Students is a 5-step wizard, Employees is a flat single-page form — don't force one pattern onto the other. `MasterService`/Setup module owns generic key-list lookups (classes, sections, exam types, houses, pay modes, bus stoppages, sessions); most other feature services (Employees, Attendance, etc.) use local/non-KeyList lookups instead — check the existing service before assuming `MasterService` is the source for a given dropdown.

### Cross-cutting notes worth knowing before changing related code

- `GetStudentList`/`GetEmployeeList`/`GetUserList`-style grid endpoints were previously backed by SQL stored procedures that either didn't exist or produced duplicate rows; they were rewritten as EF Core queries scoped to the active session on the backend. If a grid endpoint looks wrong, check whether it's still on a stored procedure.
- Uploaded documents (Student/Employee) round-trip through `IFormFile`; property-name mismatches between the Angular `FormData` field names and the backend DTO silently discard the file rather than erroring — verify field names match exactly when touching upload code.
- Notification sends (welcome emails, fee/exam notices) go through `SendMultiChannelNotification` on the backend and require a matching seeded `Tb_Notification_Master` row for each `NotificationType`; there is no job scheduler, so fee/exam notifications are manual triggers, not automatic.
- The backend's own CLAUDE.md may describe JWT auth as fully disabled — that is stale; auth is live (`Program.cs` has `AddAuthentication`/`AddJwtBearer`, `BaseAuthController` is `[Authorize]`). Verify directly in the backend repo rather than trusting that doc.
