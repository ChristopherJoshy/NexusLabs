import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeBaseUrl } from '../src/lib/api/client.ts';
import { hostLabel, resolveHttpUrl, siteRoot } from '../src/lib/url.ts';
import { ApiError } from '../src/lib/api/types.ts';

const base = 'https://college.example/androidapp/';

test('resolveHttpUrl resolves relative links against the college base', () => {
  assert.equal(
    resolveHttpUrl(base, 'uploads/receipt.pdf'),
    'https://college.example/androidapp/uploads/receipt.pdf',
  );
});

test('resolveHttpUrl keeps secure absolute links', () => {
  assert.equal(
    resolveHttpUrl(base, 'https://files.college.example/receipt.pdf'),
    'https://files.college.example/receipt.pdf',
  );
});

test('resolveHttpUrl rejects insecure remote links', () => {
  assert.equal(resolveHttpUrl(base, 'http://files.college.example/receipt.pdf'), null);
  assert.equal(resolveHttpUrl(base, 'http://localhost.evil.example/receipt.pdf'), null);
});

test('resolveHttpUrl allows localhost development over HTTP', () => {
  assert.equal(
    resolveHttpUrl('http://localhost:8080/androidapp/', '/uploads/a.pdf'),
    'http://localhost:8080/uploads/a.pdf',
  );
  assert.equal(
    resolveHttpUrl('http://127.0.0.1:8080/androidapp/', '/uploads/a.pdf'),
    'http://127.0.0.1:8080/uploads/a.pdf',
  );
  assert.equal(
    resolveHttpUrl('http://[::1]:8080/androidapp/', '/uploads/a.pdf'),
    'http://[::1]:8080/uploads/a.pdf',
  );
});

test('resolveHttpUrl rejects non-web schemes and empty values', () => {
  assert.equal(resolveHttpUrl(base, 'javascript:alert(1)'), null);
  assert.equal(resolveHttpUrl(base, 'data:text/html,hello'), null);
  assert.equal(resolveHttpUrl(base, ''), null);
  assert.equal(resolveHttpUrl(base, undefined), null);
  assert.equal(resolveHttpUrl(base, 123), null);
});

test('hostLabel and siteRoot tolerate malformed values', () => {
  assert.equal(hostLabel('https://college.example:8443/androidapp/'), 'college.example:8443');
  assert.equal(hostLabel('not a url'), 'not a url');
  assert.equal(siteRoot(base), 'https://college.example');
  assert.equal(siteRoot('not a url'), 'not a url');
});

test('normalizeBaseUrl allows only the SJCET portal over HTTPS', () => {
  assert.equal(normalizeBaseUrl('sjcetpalai.etlab.in'), 'https://sjcetpalai.etlab.in/androidapp/');
  assert.equal(normalizeBaseUrl('https://sjcetpalai.etlab.in/androidapp/'), 'https://sjcetpalai.etlab.in/androidapp/');

  for (const value of [
    'http://sjcetpalai.etlab.in',
    'https://other-college.etlab.in',
    'https://sjcetpalai.etlab.in.evil.example',
    'https://user:password@sjcetpalai.etlab.in',
    'https://sjcetpalai.etlab.in/other',
  ]) {
    assert.throws(() => normalizeBaseUrl(value), ApiError);
  }
});
