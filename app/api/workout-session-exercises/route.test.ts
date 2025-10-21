
jest.mock('@/lib/supabaseAdmin', () => ({
  __esModule: true,
  default: {
    from: () => ({
      insert: () => ({ select: () => ({ single: async () => ({ data: {}, error: null }) }) })
    })
  }
}));

import { POST } from './route';

describe('workout-session-exercises API', () => {
  it('should return 400 if required fields are missing', async () => {
    // @ts-ignore
    const req = { json: async () => ({}) };
    // @ts-ignore
    const res = await POST(req);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toMatch(/required/);
  });
});
