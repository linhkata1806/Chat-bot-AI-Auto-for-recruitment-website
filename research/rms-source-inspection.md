# RMS source inspection

Inspection date: 2026-10-19 (Asia/Saigon). Source was read without changing RMS files.

The inspected checkout is `D:\KÌ 5\SWP\hireflow-api\RetireManagement\SWP_RMS_Group-2`, not the older duplicate under `Doc\SWP_RMS_Group-2`. Paths below are relative to that checkout. No applicable `AGENTS.md` was found. The repository README and `docs/architecture/UI/{README,UI_RULES,UI_CATALOG}.md` were read before selecting the widget insertion point.

## Verified data model and publication rules

| Concern | Source evidence |
| --- | --- |
| Public posting entity | `src/main/java/com/group2/rms/jobposting/entity/JobPosting.java:28-101`: table `JobPosting`, key `JobPostingId`, requisition association, public title, description, requirements, benefits, display salary, location, posting date and deadline |
| Exact SQL schema | `database/schema/db.sql:257-292`: public posting columns and statuses `Draft`, `Published`, `Paused`, `Closed` |
| Department relationship | `database/schema/db.sql:121-150`: `JobRequisition.RequisitionId`, `DepartmentId`, `EmploymentType`; `database/schema/db.sql:38-45`: `Department.DepartmentId`, `DepartmentName` |
| Public list filter | `src/main/java/com/group2/rms/jobposting/repository/JobPostingRepository.java:184-195`: Published; posting date null or reached; deadline null or not passed |
| Public list service | `src/main/java/com/group2/rms/career/service/CareerPortalService.java:42-61`: invokes the filtered repository and maps public fields; the homepage uses the same query |
| Job detail service | `src/main/java/com/group2/rms/career/service/CareerPortalService.java:76-108`: includes description, requirements, benefits, department, employment type, location and display salary |

The public list condition is exactly:

```sql
PostingStatus = N'Published'
AND (PostingDate IS NULL OR PostingDate <= CURRENT_TIMESTAMP)
AND (ApplicationDeadline IS NULL OR ApplicationDeadline >= CURRENT_TIMESTAMP)
```

Scheduled postings use `Published` plus a future `PostingDate`. Published status alone is insufficient. The detail page can still display an expired Published posting, with `isAcceptingApplications=false`; detail visibility alone must not be treated as active hiring.

## Existing public routes and integration choice

`src/main/java/com/group2/rms/career/controller/CareerPortalController.java:49-97` implements anonymous HTML GET routes `/`, `/jobs`, `/jobs/{id}`. It does not expose a public JSON job API. `/public/jobs` appears in SecurityConfig permit rules, but no corresponding implemented controller was found.

The recommended source uses native n8n **HTTP Request** and **HTML** nodes against those existing public pages. This keeps the public list's existing publication/deadline filtering, obtains real job descriptions, needs no database credential, adds no Java endpoint, and changes no SQL schema.

SQL was considered. A fixed SELECT can mirror the public filter, but granting SELECT on JobPosting does not constrain which rows the SQL login can read: the credential could still read Draft, Paused or Closed rows outside the configured query. No existing filtered public view/procedure was found in the supplied schema. A view, row-level security policy, or stored procedure would require database schema changes, which the task forbids. Therefore a bare table SELECT account cannot truthfully be described as a database-enforced public-row-only account. Public HTML retrieval avoids this conflict.

For reference only, this is a source-grounded read query; it has not been executed and the integration does not require it:

```sql
SELECT jp.JobPostingId, jp.PostingTitle, jp.JobDescription,
       jp.JobRequirements, jp.Benefits, jp.WorkLocation,
       jp.SalaryDisplay, jp.NumberOfPositionsDisplay,
       jp.PostingDate, jp.ApplicationDeadline,
       d.DepartmentName, r.EmploymentType
FROM dbo.JobPosting AS jp
JOIN dbo.JobRequisition AS r ON r.RequisitionId = jp.RequisitionId
JOIN dbo.Department AS d ON d.DepartmentId = r.DepartmentId
WHERE jp.PostingStatus = N'Published'
  AND (jp.PostingDate IS NULL OR jp.PostingDate <= CURRENT_TIMESTAMP)
  AND (jp.ApplicationDeadline IS NULL
       OR jp.ApplicationDeadline >= CURRENT_TIMESTAMP)
ORDER BY jp.JobPostingId ASC;
```

## Source-verified HTML selectors

| Value | CSS selector | Extraction |
| --- | --- | --- |
| Active job links | `.jb-grid .job-card-link` | Attribute `href`; relative `/jobs/{id}` |
| Total active results | `.jb-results__count strong` | Text integer |
| Next board page | `.pagination-controls a[aria-label="Trang sau"]` | Attribute `href`; absent on final page |
| Title | `.job-detail-title` | Text |
| Department | `.job-department-name` | Text |
| Employment type | `.job-header-badges .badge--neutral:nth-child(2)` | Text |
| Location | `.job-header-badges .badge--neutral:nth-child(3)` | Text |
| Accepting applications | `.job-header-badges .badge--success` | Must exist before recommending a detail |
| Expired/closed banner | `.job-header-badges .badge--danger` | Reject detail when present |
| JD, requirements, benefits | `.job-content .job-section-card .rich-text` | Text array, in that order; benefits optional |

Sources: `templates/candidate/job-board.html:61-83`, `templates/fragments/ui/cards.html:9-16`, `templates/fragments/ui/pagination.html:69-78`, `templates/candidate/job-detail.html:42-88`, all under `src/main/resources`.

Use a fixed configured RMS origin and only GET requests. Fetch `/jobs?size=100&sort=jobPostingId,asc&page=0`; the controller's default is 6 rows (`CareerPortalController.java:37,61`), and its Pageable argument allows a fixed size override. No project-specific maximum page-size configuration or custom Pageable resolver was found; a framework maximum has not been verified here.

Use bounded native pagination, such as at most 5 pages. Stop at no next-page link or an empty board. Compare the extracted board total with fetched results and report any truncation; do not silently describe a partial list as the complete catalog. Fetch detail URLs only from board-derived links matching `^/jobs/[1-9][0-9]*$`, against the fixed origin. Do not accept LLM-selected URLs, arbitrary frontend job IDs, authentication cookies, or user-supplied request headers. Recheck accepting status on every detail because a job can expire between board and detail requests.

## Authentication and scope

`src/main/java/com/group2/rms/core/config/SecurityConfig.java:80-91` permits public GET requests to `/` and job pages. `/jobs/*/apply` requires `ROLE_CANDIDATE` and must never be called by this integration. Form login remains at `/login` (`:162-172`), and the existing account session guard is at `:174-175`.

`src/main/java/com/group2/rms/core/security/DatabaseUserDetailsService.java:25-55` authenticates username/email, maps the role to an authority, and rejects inactive accounts. The chatbot does not need these credentials and must not trust role/user ID metadata from a frontend.

## Minimal single widget insertion point

`src/main/resources/templates/fragments/layout/public-topbar.html:55` is the existing shared public header script location. Add one scoped chatbot fragment/include or loader here. This source is used by:

- The standalone homepage: `src/main/resources/templates/candidate/landing.html:24`.
- Job board and detail: `src/main/resources/templates/layout/public.html:15`.

The homepage does **not** decorate `layout/public` or `layout/base`. A change only in those layouts would miss the homepage. A shared header include avoids duplicating widget initialization in multiple templates. Any widget root can be attached to the document body by the loader to avoid inheriting header styling.

`docs/architecture/UI/UI_RULES.md:29-47` protects shared layouts/header and requires coordination; the user's explicit request already authorizes a minimal chatbot embed into the appropriate shared fragment. Do not use this task to redesign that header or authentication flow.

The actual existing UI is Vietnamese (`lang="vi"`, Vietnamese navigation and job headings), while the request describes English RMS. Preserve existing RMS copy and provide the new widget greeting, prompts and errors in English.

Brand evidence: `src/main/resources/static/css/tokens.css:12-15` defines green `#3e7157`, dark `#2e5a45`, soft `#e7f0e8`. `src/main/resources/static/css/topbar.css:39` defines Inter / Source Sans 3 / Segoe UI fallbacks. Style only the widget's scoped CSS variables/selectors; do not modify shared token files.

## Build and runtime limits

`pom.xml:10,23` specifies Spring Boot 3.5.16 and Java 21. README documents `mvn clean compile spring-boot:run` and `mvnw.cmd spring-boot:run`.

`src/main/resources/application.properties:13,15,20,28-29` specifies the SQL Server driver, local SQL Server port 1433, database `RitirementManagement2`, Hibernate `ddl-auto=validate`, default HTTP port 8080 and context `/`. The README documents typical local port 8082. A local override file exists; only its property names were inspected, and passwords/tokens were not printed. The actual runtime HTTP port must be verified from the running process or browser.

Read-only HTTP probes to localhost ports 8082 and 8080 were rejected by the execution socket sandbox. This is **not evidence that RMS is stopped**. No live public response, database state, build success, or chatbot behavior was established by this source inspection. Those checks remain **Not Verified** until the authorized runtime tests are performed.
