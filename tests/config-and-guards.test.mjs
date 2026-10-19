import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = path => fs.readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const validate = new AsyncFunction('$input', read('integration/validate-request.js'));
const format = new Function('$input', '$', read('integration/format-response.js'));
const sessionId = 'a9df0973-7cd2-4926-90d2-9103513fb412';
const request = (json = {}, binary) => ({ json: { action: 'sendMessage', sessionId, chatInput: 'Show Java jobs', ...json }, ...(binary ? { binary } : {}) });
const pdf = { mimeType: 'application/pdf', fileName: 'synthetic.pdf' };
const run = (item, buffer = Buffer.from('%PDF-1.4\nsynthetic test fixture')) => validate.call({ helpers: { getBinaryDataBuffer: async () => buffer } }, { first: () => item });
test('normal text is accepted without trusting role or userId', async () => {
  const [result] = await run(request({ role: 'ADMIN', userId: 1 }));
  assert.equal(result.json.valid, true); assert.equal(result.json.hasCv, false);
  assert.equal(result.json.role, undefined); assert.equal(result.json.userId, undefined);
});
test('empty message, invalid session and excessive input are rejected', async () => {
  for (const json of [{ chatInput: '' }, { sessionId: '../known' }, { chatInput: 'x'.repeat(6001) }]) {
    assert.equal((await run(request(json)))[0].json.valid, false);
  }
});
test('one genuine-sized PDF is normalized to resume binary', async () => {
  const [result] = await run(request({}, { data0: pdf }));
  assert.equal(result.json.valid, true); assert.equal(result.binary.resume, pdf);
});
test('forged MIME, extension, PDF magic and oversized bytes are rejected', async () => {
  for (const file of [{ ...pdf, mimeType: 'text/plain' }, { ...pdf, fileName: 'payload.exe' }]) {
    assert.equal((await run(request({}, { data0: file })))[0].json.valid, false);
  }
  assert.equal((await run(request({}, { data0: pdf }), Buffer.from('not a real pdf')))[0].json.valid, false);
  assert.equal((await run(request({}, { data0: pdf }), Buffer.alloc(5 * 1024 * 1024 + 1)))[0].json.valid, false);
});
test('multi-upload and trigger-overwritten binary metadata are rejected', async () => {
  assert.equal((await run(request({}, { data0: pdf, data1: pdf })))[0].json.valid, false);
  assert.equal((await run(request({ files: [{}, {}] }, { data0: pdf })))[0].json.valid, false);
  assert.equal((await run(request({ files: [{}] })))[0].json.valid, false);
});
const catalog = { jobs: [{ id: 7, title: 'Synthetic test vacancy', path: '/jobs/7', department: 'Fixture', location: 'Local', acceptingApplications: true }] };
const render = output => format({ first: () => ({ json: { output } }) }, name => ({ first: () => ({ json: name === 'Read public catalog' ? catalog : { hasCv: false } }) }))[0].json.output;
test('response links/titles come exclusively from verified catalog, unknown ids are suppressed', () => {
  const output = render({ message: 'Here are suitable positions.', jobs: [{ id: '7', reason: 'Review the source requirements.' }, { id: '99', reason: 'Invented job' }] });
  assert.match(output, /\[Synthetic test vacancy\]\(\/jobs\/7\)/); assert.doesNotMatch(output, /Invented job|\/jobs\/99/);
});
test('malformed output and entirely stale ids fail safely', () => {
  assert.match(render('broken JSON'), /could not produce a reliable/);
  assert.match(render({ message: 'Test', jobs: [{ id: '99' }] }), /could not verify/);
});
test('workflow graph has only configured public GET retrieval and no business-write tools', () => {
  for (const file of ['integration/rms-public-catalog.json', 'integration/rms-candidate-chat.json']) {
    const workflow = JSON.parse(read(file)); const names = new Set(workflow.nodes.map(node => node.name));
    assert.equal(workflow.active, false); assert.equal(workflow.settings.saveDataErrorExecution, 'none');
    for (const [from, types] of Object.entries(workflow.connections)) {
      assert.ok(names.has(from));
      for (const outputs of Object.values(types)) for (const list of outputs) for (const edge of list || []) assert.ok(names.has(edge.node));
    }
    for (const node of workflow.nodes) {
      assert.equal(node.credentials, undefined);
      assert.doesNotMatch(node.type, /microsoftSql|gmail|googleSheets|mongo|postgres|toolHttp|toolWorkflow|executeCommand/);
      if (node.type.endsWith('.httpRequest')) {
        assert.equal(node.parameters.method, 'GET'); assert.equal(node.parameters.authentication, 'none');
        assert.equal(node.parameters.options.redirect.redirect.followRedirects, false);
        assert.doesNotMatch(node.parameters.url, /fromAI|chatInput|sessionId/);
      }
    }
  }
});
test('embedded nonstreaming output and local-only credential type are configured', () => {
  const workflow = JSON.parse(read('integration/rms-candidate-chat.json'));
  const trigger = workflow.nodes.find(n => n.name === 'Candidate chat');
  assert.equal(trigger.parameters.mode, 'webhook'); assert.equal(trigger.parameters.options.responseMode, 'lastNode');
  assert.equal(workflow.nodes.find(n => n.name === 'Recruitment AI Agent').parameters.options.enableStreaming, false);
  assert.ok(workflow.nodes.some(n => n.type.endsWith('.lmChatOllama')));
  assert.ok(!workflow.nodes.some(n => n.type.endsWith('.chat')));
});
