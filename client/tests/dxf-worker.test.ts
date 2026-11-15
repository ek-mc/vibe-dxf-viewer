import { beforeAll, describe, expect, it, vi } from 'vitest';

const worker = { onmessage: null as any, postMessage: vi.fn() };
beforeAll(async () => {
  vi.stubGlobal('self', worker);
  await import('../src/workers/dxfParser.worker');
});
function parse(entities: string) {
  worker.postMessage.mockClear();
  worker.onmessage({ data: {
    fileName: 'survey.dxf',
    text: `0\nSECTION\n2\nENTITIES\n${entities}0\nENDSEC\n0\nEOF\n`,
  }});
  expect(worker.postMessage).toHaveBeenCalledTimes(1);
  return worker.postMessage.mock.calls[0][0];
}
describe('real DXF worker integration', () => {
  it('returns line coordinates, layer counts and survey extents', () => {
    const result = parse('0\nLINE\n8\nSurvey\n10\n-12\n20\n4\n11\n30\n21\n18\n');
    expect(result.type).toBe('result');
    expect(result.payload.fileName).toBe('survey.dxf');
    expect(result.payload.entityCount).toBe(1);
    expect(result.payload.bounds).toEqual({ minX: -12, minY: 4, maxX: 30, maxY: 18 });
    expect(result.payload.layers).toEqual([expect.objectContaining({name: 'Survey', entityCount: 1, visible: true})]);
  });
  it('includes circle radius in bounds', () => {
    const result = parse('0\nCIRCLE\n8\n0\n10\n10\n20\n20\n40\n5\n');
    expect(result.type).toBe('result');
    expect(result.payload.entities[0]).toMatchObject({ center: { x: 10, y: 20 }, radius: 5 });
    expect(result.payload.bounds).toEqual({ minX: 5, minY: 15, maxX: 15, maxY: 25 });
  });
  it('handles an empty drawing with finite default extents', () => {
    const result = parse('');
    expect(result.type).toBe('result');
    expect(result.payload.entityCount).toBe(0);
    expect(result.payload.layers).toEqual([]);
    expect(result.payload.bounds).toEqual({ minX: 0, minY: 0, maxX: 100, maxY: 100 });
  });
});
