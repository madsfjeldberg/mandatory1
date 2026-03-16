import { expect, test } from 'vitest';

const minus = (a: number, b: number) => a - b;

test('subtracts 5 - 2 to equal 3', () => {
  expect(minus(5, 2)).toBe(3);
});