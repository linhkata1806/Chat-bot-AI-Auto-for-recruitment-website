// n8n Code node: upload validation only; no matching logic or network access.
const item = $input.first();
const json = item.json || {};
const reject = (output) => [{ json: { valid: false, output } }];
if (json.action !== 'sendMessage') return reject('Please start a new conversation.');
if (typeof json.sessionId !== 'string' || !/^[A-Za-z0-9_-]{16,80}$/.test(json.sessionId)) {
  return reject('Your chat session is invalid. Refresh this page and try again.');
}
const chatInput = typeof json.chatInput === 'string' ? json.chatInput.trim() : '';
if (chatInput.length > 6000) return reject('Please keep your message under 6,000 characters.');
const keys = Object.keys(item.binary || {});
if (keys.length > 1 || (Array.isArray(json.files) && json.files.length > 1)) {
  return reject('Please upload one PDF CV at a time (maximum 5 MiB).');
}
if (!keys.length && Array.isArray(json.files) && json.files.length) {
  return reject('The upload did not arrive. Please attach the PDF again.');
}
if (!keys.length) {
  if (!chatInput) return reject('Please enter a question or upload a PDF CV.');
  return [{ json: { valid: true, hasCv: false, chatInput, sessionId: json.sessionId } }];
}
const key = keys[0];
const file = item.binary[key];
if (file.mimeType !== 'application/pdf' || !/\.pdf$/i.test(file.fileName || '')) {
  return reject('Only PDF CVs are supported. Please export your CV as a text-based PDF.');
}
try {
  const bytes = await this.helpers.getBinaryDataBuffer(0, key);
  if (bytes.length > 5 * 1024 * 1024) return reject('Your PDF exceeds 5 MiB. Please upload a smaller file.');
  if (bytes.length < 8 || bytes.subarray(0, 5).toString('ascii') !== '%PDF-') {
    return reject('This file is not a valid PDF. Please export your CV as PDF and try again.');
  }
} catch {
  return reject('The PDF could not be read. Please upload it again.');
}
return [{
  json: {
    valid: true, hasCv: true, sessionId: json.sessionId,
    chatInput: chatInput || 'Which current positions best fit this CV?'
  },
  binary: { resume: file }
}];
