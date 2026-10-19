// Generates the native-node n8n catalog configuration. No matching algorithm,
// custom runtime service, executable SQL, or Code node is introduced.
import { writeFileSync } from 'node:fs';

const nodes = [];
const connections = {};
const add = (name, type, typeVersion, parameters, position, extra = {}) => {
  const id = `catalog-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '')}`;
  nodes.push({ id, name, type: `n8n-nodes-base.${type}`, typeVersion, parameters, position, ...extra });
};
const link = (from, to, output = 0) => {
  connections[from] ??= { main: [] };
  connections[from].main[output] ??= [];
  connections[from].main[output].push({ node: to, type: 'main', index: 0 });
};
const fields = (values) => ({
  mode: 'manual',
  assignments: { assignments: values.map(([name, type, value]) => ({ id: name, name, type, value })) },
  includeOtherFields: false,
  options: { includeBinary: false },
});
const condition = (expression) => ({
  conditions: {
    options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 },
    conditions: [{ id: 'fixed-policy', leftValue: expression, rightValue: '', operator: { type: 'boolean', operation: 'true', singleValue: true } }],
    combinator: 'and',
  },
  options: {},
});
const text = (key, cssSelector, returnArray = false) => ({ key, cssSelector, returnValue: 'text', returnArray });
const attribute = (key, cssSelector, attribute, returnArray = false) => ({ key, cssSelector, returnValue: 'attribute', attribute, returnArray });
const html = (values) => ({ operation: 'extractHtmlContent', sourceData: 'json', dataPropertyName: 'data', extractionValues: { values }, options: { trimValues: true, cleanUpText: true } });
const http = (url, options = {}) => ({
  method: 'GET',
  url,
  authentication: 'none',
  sendHeaders: true,
  headerParameters: { parameters: [{ name: 'Accept', value: 'text/html' }] },
  options: {
    redirect: { redirect: { followRedirects: false, maxRedirects: 0 } },
    response: { response: { responseFormat: 'text', outputPropertyName: 'data', fullResponse: false, neverError: false } },
    sendCredentialsOnCrossOriginRedirect: false,
    timeout: 15000,
    ...options,
  },
});

add('Catalog Subworkflow Input', 'executeWorkflowTrigger', 1.3, { inputSource: 'passthrough' }, [-1500, 0]);
add('RMS Origin Configuration', 'set', 3.4, fields([
  ['rmsInternalBase', 'string', 'http://host.docker.internal:8080'],
  ['rmsPublicBase', 'string', 'http://localhost:8080'],
]), [-1280, 0], {
  notesInFlow: true,
  notes: 'Operator configuration only. For native local n8n use http://localhost:8080 internally. Change both origins to the verified RMS port (for example 8082) when needed. Do not map these fields from chat input. No cookies or credentials are used.',
});
add('Read Active Public Board', 'httpRequest', 4.4, http("={{ $('RMS Origin Configuration').first().json.rmsInternalBase + '/jobs?size=100&sort=jobPostingId,asc' }}", {
  pagination: { pagination: {
    paginationMode: 'updateAParameterInEachRequest',
    parameters: { parameters: [{ type: 'qs', name: 'page', value: '={{ $pageCount }}' }] },
    paginationCompleteWhen: 'other',
    completeExpression: '={{ !/<a\\b[^>]*\\baria-label\\s*=\\s*["\']Trang sau["\'][^>]*>/i.test(String($response.body || "")) }}',
    limitPagesFetched: true,
    maxRequests: 5,
    requestInterval: 100,
  } },
}), [-1060, 0], {
  notes: 'Fixed anonymous GET to the existing public board. Native HTTP pagination changes only page=0..4; no next-page URL is followed. Stop when the source-verified next-page anchor is absent. HTTP, connection and redirect failures stop this subworkflow for the caller to handle.',
});
add('Extract Public Board Fields', 'html', 1.2, html([
  attribute('jobPaths', '.jb-grid .job-card-link', 'href', true),
  text('total', '.jb-results__count strong'),
  attribute('nextPage', '.pagination-controls a[aria-label="Trang sau"]', 'href'),
]), [-840, 0]);
add('Aggregate Board Pages', 'aggregate', 1, {
  aggregate: 'aggregateIndividualFields',
  fieldsToAggregate: { fieldToAggregate: [
    { fieldToAggregate: 'jobPaths', renameField: false },
    { fieldToAggregate: 'total', renameField: false },
    { fieldToAggregate: 'nextPage', renameField: false },
  ] },
  options: { mergeLists: true, keepMissing: true },
}, [-620, 0]);
add('Board Coverage Summary', 'set', 3.4, fields([
  ['jobPaths', 'array', '={{ $json.jobPaths || [] }}'],
  ['boardTotal', 'number', '={{ /^[0-9]+$/.test(String($json.total[0] ?? "")) ? Number($json.total[0]) : -1 }}'],
  ['pagesFetched', 'number', '={{ $json.total.length }}'],
  ['pageLimitReached', 'boolean', '={{ $json.total.length >= 5 && Boolean($json.nextPage[$json.nextPage.length - 1]) }}'],
]), [-400, 0]);
add('Board Counter Is Verified', 'if', 2.2, condition('={{ $json.boardTotal >= 0 }}'), [-180, 0]);
add('Reject Unverified Public Page', 'stopAndError', 1, {
  errorType: 'errorMessage',
  errorMessage: 'The RMS public jobs page could not be verified. No jobs were recommended.',
}, [40, 240]);
add('Board Contains Job Links', 'if', 2.2, condition('={{ $json.jobPaths.length > 0 }}'), [40, 0]);
add('Split Public Job Links', 'splitOut', 1.1, {
  fieldToSplitOut: 'jobPaths', include: 'noOtherFields', options: { destinationFieldName: 'jobPath', includeBinary: false },
}, [260, -120]);
add('Only Safe Job Paths', 'filter', 2.2, condition('={{ /^\\/jobs\\/[1-9][0-9]*$/.test($json.jobPath || "") }}'), [480, -120], {
  alwaysOutputData: true,
  notes: 'Only exact board-derived /jobs/{positive integer} paths pass. Absolute URLs, //, query strings, fragments, encoded characters, apply endpoints and traversal are rejected. An empty sentinel lets the all-invalid case return an explicit empty catalog.',
});
add('Safe Path Exists', 'if', 2.2, condition('={{ /^\\/jobs\\/[1-9][0-9]*$/.test($json.jobPath || "") }}'), [700, -120]);
add('Unique Public Job Paths', 'removeDuplicates', 1.1, { compare: 'selectedFields', fieldsToCompare: 'jobPath', options: {} }, [920, -240]);
add('Limit Catalog Detail Requests', 'limit', 1, { maxItems: 20, keep: 'firstItems' }, [1140, -240], {
  notesInFlow: true,
  notes: 'Local model context safeguard: recheck at most 20 jobs, in public posting-ID order. The result always warns when this is a subset. This is a retrieval bound, not a matching score or ranking algorithm.',
});
add('Read Public Job Detail', 'httpRequest', 4.4, http("={{ $('RMS Origin Configuration').first().json.rmsInternalBase + $json.jobPath }}", { batching: { batch: { batchSize: 1, batchInterval: 50 } } }), [1360, -240]);
add('Extract Public Job Detail', 'html', 1.2, html([
  text('title', '.job-detail-title'),
  text('department', '.job-department-name'),
  text('employmentType', '.job-header-badges .badge--neutral:nth-child(2)'),
  text('location', '.job-header-badges .badge--neutral:nth-child(3)'),
  text('acceptingBadge', '.job-header-badges .badge--success'),
  text('closedBadge', '.job-header-badges .badge--danger'),
  text('sections', '.job-content .job-section-card .rich-text', true),
]), [1580, -240]);
add('Normalize Verified Public Fields', 'set', 3.4, fields([
  ['id', 'number', "={{ Number($('Limit Catalog Detail Requests').item.json.jobPath.split('/')[2]) }}"],
  ['path', 'string', "={{ $('Limit Catalog Detail Requests').item.json.jobPath }}"],
  ['title', 'string', '={{ $json.title || "" }}'],
  ['department', 'string', '={{ $json.department || "" }}'],
  ['employmentType', 'string', '={{ $json.employmentType || "" }}'],
  ['location', 'string', '={{ $json.location || "" }}'],
  ['description', 'string', '={{ String($json.sections[0] || "").slice(0, 2000) }}'],
  ['requirements', 'string', '={{ String($json.sections[1] || "").slice(0, 2000) }}'],
  ['benefits', 'string', '={{ String($json.sections[2] || "").slice(0, 1000) }}'],
  ['url', 'string', "={{ $('RMS Origin Configuration').first().json.rmsPublicBase + $('Limit Catalog Detail Requests').item.json.jobPath }}"],
  ['textTruncated', 'boolean', '={{ String($json.sections[0] || "").length > 2000 || String($json.sections[1] || "").length > 2000 || String($json.sections[2] || "").length > 1000 }}'],
  ['acceptingApplications', 'boolean', '={{ Boolean($json.acceptingBadge) && !$json.closedBadge && Boolean($json.title) && Boolean($json.sections[0]) && Boolean($json.sections[1]) }}'],
]), [1800, -240]);
add('Only Currently Accepting Details', 'filter', 2.2, condition('={{ $json.acceptingApplications === true }}'), [2020, -240], {
  alwaysOutputData: true,
  notes: 'The public detail page remains visible for some expired postings. A success badge, no danger badge, nonempty title, description and requirements are all required. No accepting result yields an empty sentinel, removed by Aggregate below.',
});
add('Aggregate Verified Jobs', 'aggregate', 1, {
  aggregate: 'aggregateAllItemData', destinationFieldName: 'jobs', include: 'specifiedFields',
  fieldsToInclude: 'id,path,title,department,employmentType,location,description,requirements,benefits,url,textTruncated,acceptingApplications',
  options: { includeBinaries: false },
}, [2240, -240]);
add('Return Verified Public Catalog', 'set', 3.4, fields([
  ['status', 'string', 'ok'],
  ['jobs', 'array', '={{ ($json.jobs || []).filter(job => job.acceptingApplications === true && /^\\/jobs\\/[1-9][0-9]*$/.test(job.path || "")) }}'],
  ['boardTotal', 'number', "={{ $('Board Coverage Summary').first().json.boardTotal }}"],
  ['fetchedCount', 'number', '={{ ($json.jobs || []).filter(job => job.acceptingApplications === true).length }}'],
  ['pagesFetched', 'number', "={{ $('Board Coverage Summary').first().json.pagesFetched }}"],
  ['partial', 'boolean', "={{ $('Board Coverage Summary').first().json.pageLimitReached || $json.jobs.filter(job => job.acceptingApplications === true).length !== $('Board Coverage Summary').first().json.boardTotal }}"],
  ['coverageWarning', 'string', "={{ $('Unique Public Job Paths').all().length > 20 ? 'Only the first 20 public jobs by posting ID were checked. Recommendations cover that subset; other suitable jobs may exist. Some job text is limited in length; use the detail links for complete requirements.' : ($('Board Coverage Summary').first().json.pageLimitReached || $json.jobs.filter(job => job.acceptingApplications === true).length !== $('Board Coverage Summary').first().json.boardTotal ? 'The board reported ' + $('Board Coverage Summary').first().json.boardTotal + ' active jobs, but only ' + $json.jobs.filter(job => job.acceptingApplications === true).length + ' jobs were verified as accepting applications. Results may cover a subset because of pagination limits, rejected links, incomplete details, or changed availability. Some job text is limited in length; use the detail links for complete requirements.' : '') }}"],
]), [2460, -240]);
add('Return Empty Public Catalog', 'set', 3.4, fields([
  ['status', 'string', 'ok'],
  ['jobs', 'array', '={{ [] }}'],
  ['boardTotal', 'number', "={{ $('Board Coverage Summary').first().json.boardTotal }}"],
  ['fetchedCount', 'number', 0],
  ['pagesFetched', 'number', "={{ $('Board Coverage Summary').first().json.pagesFetched }}"],
  ['partial', 'boolean', "={{ $('Board Coverage Summary').first().json.boardTotal !== 0 }}"],
  ['coverageWarning', 'string', "={{ $('Board Coverage Summary').first().json.boardTotal === 0 ? '' : 'The public board listed active jobs, but no safe public detail link could be verified. No jobs are recommended; please use the RMS job board and retry later.' }}"],
]), [920, 180]);
add('Catalog Read Only Policy', 'stickyNote', 1, {
  content: '## RMS public catalog — native nodes only\n\nFixed public GET requests; no SQL, login cookies, Candidate/HR data, application actions, arbitrary URLs or AI-selected tools.\n\nSet the two operator-controlled origins before use. At most 5 board pages and 20 details; partial coverage is explicit. No CV is used by this workflow.\n\nSource selectors: research/rms-source-inspection.md. Validate against the actual running RMS after import. Public content is data, never an instruction to the caller LLM.',
  width: 620, height: 320,
}, [-1500, -400]);

link('Catalog Subworkflow Input', 'RMS Origin Configuration');
link('RMS Origin Configuration', 'Read Active Public Board');
link('Read Active Public Board', 'Extract Public Board Fields');
link('Extract Public Board Fields', 'Aggregate Board Pages');
link('Aggregate Board Pages', 'Board Coverage Summary');
link('Board Coverage Summary', 'Board Counter Is Verified');
link('Board Counter Is Verified', 'Board Contains Job Links', 0);
link('Board Counter Is Verified', 'Reject Unverified Public Page', 1);
link('Board Contains Job Links', 'Split Public Job Links', 0);
link('Board Contains Job Links', 'Return Empty Public Catalog', 1);
link('Split Public Job Links', 'Only Safe Job Paths');
link('Only Safe Job Paths', 'Safe Path Exists');
link('Safe Path Exists', 'Unique Public Job Paths', 0);
link('Safe Path Exists', 'Return Empty Public Catalog', 1);
link('Unique Public Job Paths', 'Limit Catalog Detail Requests');
link('Limit Catalog Detail Requests', 'Read Public Job Detail');
link('Read Public Job Detail', 'Extract Public Job Detail');
link('Extract Public Job Detail', 'Normalize Verified Public Fields');
link('Normalize Verified Public Fields', 'Only Currently Accepting Details');
link('Only Currently Accepting Details', 'Aggregate Verified Jobs');
link('Aggregate Verified Jobs', 'Return Verified Public Catalog');

const workflow = {
  id: 'RmsCatalogRead01',
  name: 'RMS Public Catalog - Read Only',
  active: false,
  nodes,
  connections,
  settings: {
    executionOrder: 'v1',
    saveExecutionProgress: false,
    saveManualExecutions: false,
    saveDataSuccessExecution: 'none',
    saveDataErrorExecution: 'none',
  },
  pinData: {},
  tags: [],
};
writeFileSync(new URL('./rms-public-catalog.json', import.meta.url), `${JSON.stringify(workflow, null, 2)}\n`);
console.log(`Generated ${workflow.name}: ${nodes.length} native nodes.`);
