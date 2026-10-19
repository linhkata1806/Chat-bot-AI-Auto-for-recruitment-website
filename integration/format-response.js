// n8n Code node: validate/format model output against the current public catalog.
// This does not calculate a match score or implement a matching algorithm.
const catalog = $('Read public catalog').first().json;
const safe = (value, max = 1400) => String(value || '').slice(0, max)
  .replace(/https?:\/\/\S+/gi, '')
  .replace(/[<>\[\]()`*_#]/g, '');
let result = $input.first().json.output;
try { if (typeof result === 'string') result = JSON.parse(result); } catch { result = null; }
if (!result || !Array.isArray(result.jobs) || typeof result.message !== 'string') {
  return [{ json: { output: 'I could not produce a reliable answer. Please try a shorter question.' } }];
}
const byId = new Map((catalog.jobs || []).map(job => [String(job.id), job]));
const seen = new Set();
const matches = result.jobs.filter(match => {
  const id = String(match.id);
  if (!byId.has(id) || seen.has(id)) return false;
  seen.add(id);
  return true;
}).slice(0, 5);
const lines = [safe(result.message, 700)];
for (const [index, match] of matches.entries()) {
  const job = byId.get(String(match.id));
  // Relative links are built by the read-only catalog from validated board paths.
  if (!/^\/jobs\/[1-9][0-9]*$/.test(job.path || '')) continue;
  lines.push(`\n${index + 1}. [${safe(job.title, 180)}](${job.path})`);
  lines.push(`Department: ${safe(job.department, 120)} | Location: ${safe(job.location, 120)}`);
  if (match.reason) lines.push(safe(match.reason));
  if (match.matchingSkills?.length) lines.push('Matching skills: ' + safe(match.matchingSkills.join(', '), 450));
  if (match.gaps?.length) lines.push('Skills or experience to review: ' + safe(match.gaps.join(', '), 450));
}
if (!matches.length && result.jobs.length) {
  return [{ json: { output: 'I could not verify those recommendations against the current job board. Please try again.' } }];
}
if (catalog.coverageWarning) lines.push('\n' + safe(catalog.coverageWarning, 700));
if (catalog.jobs?.some(job => job.textTruncated)) lines.push('\nSome job descriptions were shortened for this session. View the job detail page for the full requirements.');
if ($('Validate request').first().json.hasCv) {
  lines.push('\nThese are AI suggestions based on your CV and public job requirements, not a hiring decision.');
}
return [{ json: { output: lines.filter(Boolean).join('\n') } }];
