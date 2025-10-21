import { dataService } from './data';

jest.mock('./supabase', () => {
  return {
    supabase: {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            order: jest.fn(() => ({ data: [], error: null })),
            single: jest.fn(() => ({ data: {}, error: null })),
            limit: jest.fn(() => ({ data: [], error: null }))
          }))
        }))
      }))
    }
  };
});

describe('dataService', () => {
  it('getCoachClients returns processed clients', async () => {
    const clients = await dataService.getCoachClients('coach1');
    expect(Array.isArray(clients)).toBe(true);
  });

  it('getClientDetail throws if error', async () => {
    // force error
    const { supabase } = require('./supabase');
    supabase.from = jest.fn(() => ({ select: jest.fn(() => ({ eq: jest.fn(() => ({ single: jest.fn(() => ({ data: null, error: { message: "fail" } })) })) })) }));
    await expect(dataService.getClientDetail('client1')).rejects.toBeTruthy();
  });
});
