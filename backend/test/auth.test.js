const test = require('node:test');
const assert = require('node:assert');

process.env.JWT_SECRET = 'test-secret';
const { signToken, requireRole, faceMatches } = require('../middleware/auth');

// Runs the middleware with a fake request/response and reports what happened
function run(middleware, authorization) {
  const result = { status: null, nextCalled: false };
  const req = { headers: authorization ? { authorization } : {} };
  const res = { status(code) { result.status = code; return this; }, json() { return this; } };
  middleware(req, res, () => { result.nextCalled = true; });
  return { ...result, user: req.user };
}

const tokenFor = (role) => `Bearer ${signToken({ _id: 'abc123', role, name: 'tester' })}`;

test('requireRole rejects missing and invalid tokens with 401', () => {
  assert.strictEqual(run(requireRole('admin')).status, 401);
  assert.strictEqual(run(requireRole('admin'), 'Bearer not-a-token').status, 401);
});

test('requireRole rejects the wrong role with 403', () => {
  const r = run(requireRole('admin'), tokenFor('attendee'));
  assert.strictEqual(r.status, 403);
  assert.strictEqual(r.nextCalled, false);
});

test('requireRole lets the right role through and sets req.user', () => {
  const r = run(requireRole('admin', 'volunteer'), tokenFor('volunteer'));
  assert.strictEqual(r.nextCalled, true);
  assert.deepStrictEqual([r.user.id, r.user.role], ['abc123', 'volunteer']);
});

test('faceMatches accepts the same face and rejects a distant one', () => {
  const face = Array.from({ length: 128 }, (_, i) => Math.sin(i) * 0.1);
  const other = face.map((x, i) => (i === 0 ? x + 1.0 : x));
  assert.strictEqual(faceMatches(face, face), true);
  assert.strictEqual(faceMatches(other, face), false);
  assert.strictEqual(faceMatches(face.slice(1), face), false);
  assert.strictEqual(faceMatches(null, face), false);
});
