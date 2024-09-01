import {expect, describe, it} from 'vitest';
import {
  Comparator,
  comparing,
  comparingSimpleNumber,
  comparingSimpleString,
  Obj,
} from './index';

describe('Comparator', () => {
  const numbers = [-2, -2, -1, -1, 0, 0, 1, 1, 2, 2];
  const comparisons = [0, -1, 0, -1, 0, -1, 0, -1, 0];

  it('should compare objects by key', () => {
    const things = numbers.map(n => ({n}));
    const comp = comparing('n');
    assertComparisons(things, comp, comparisons);
  });

  it('should compare simple numbers', () => {
    const comp = comparingSimpleNumber();
    assertComparisons(numbers, comp, comparisons);
  });

  it('should compare simple strings', () => {
    const things = numbers.map(n => String.fromCharCode(n + 70));
    const comp = comparingSimpleString();
    assertComparisons(things, comp, comparisons);
  });

  it('should compare tuples by index', () => {
    const things = numbers.map(n => [n] as const);
    const comp = comparing<(typeof things)[number]>(0);
    assertComparisons(things, comp, comparisons);
  });

  describe('default methods', () => {
    type Person = {
      firstName: string;
      lastName?: string;
      age: number;
    };
    const people: Person[] = [
      {firstName: 'John', lastName: 'Doe', age: 34},
      {firstName: 'Mary', lastName: 'Doe', age: 30},
      {firstName: 'Maria', lastName: 'Doe', age: 14},
      {firstName: 'Jonah', lastName: 'Doe', age: 10},
      {firstName: 'John', lastName: 'Cook', age: 54},
      {firstName: 'Mary', lastName: 'Cook', age: 50},
      {firstName: 'Mary', lastName: undefined, age: 25},
      {firstName: 'John', lastName: undefined, age: 27},
    ];
    const cmp = comparing<Person>('firstName');
    const cmp2 = comparing<Person>('lastName');

    it('should reverse order', () => {
      assertComparison(cmp.reverse(), people[1], people[0]);
    });

    it('should compare one after another with comparator', () => {
      assertComparison(cmp.thenComparing(cmp2), people[0], people[1]);
      assertComparison(cmp.thenComparing(cmp2), people[4], people[0]);
    });

    it('should compare one after another with field-name', () => {
      assertComparison(cmp.thenComparing('lastName'), people[0], people[1]);
      assertComparison(cmp.thenComparing('lastName'), people[4], people[0]);
    });

    it('should compare one after another with function', () => {
      assertComparison(
        cmp.thenComparing((person: Person) => person.lastName),
        people[0],
        people[1]
      );
      assertComparison(
        cmp.thenComparing((person: Person) => person.lastName),
        people[4],
        people[0]
      );
    });

    it('should compare to reverse one after another with comparator', () => {
      assertComparison(cmp.thenComparingReverse(cmp2), people[0], people[4]);
    });

    it('should compare to reverse one after another with field-name', () => {
      assertComparison(
        cmp.thenComparingReverse('lastName'),
        people[0],
        people[4]
      );
    });

    it('should compare to reverse one after another with function', () => {
      assertComparison(
        cmp.thenComparingReverse((person: Person) => person.lastName),
        people[0],
        people[4]
      );
    });
  });

  it('should sort an given array immutable', () => {
    const numbers = [10, 1, 2, 3, -3];
    expect(comparingSimpleNumber().sort(numbers)).toEqual([-3, 1, 2, 3, 10]);
    expect(numbers).toEqual([10, 1, 2, 3, -3]);
  });

  it('should not compare non-number and non-string values by default', () => {
    const nulls = [null, null].map(n => ({n}));
    const comp = comparing('n');
    expect(comp(nulls[0], nulls[1])).toBe(0);
  });

  it('should fail when value-extractor is invalid', () => {
    const valueExtractor1 = undefined as unknown as (obj: unknown) => number;
    expect(() => comparing(valueExtractor1)).toThrow();
  });
});

function assertComparisons<T extends Obj>(
  things: T[],
  comp: Comparator<T>,
  comparisons: number[]
) {
  for (let i = 0; i < comparisons.length; i++) {
    expect(things.length).toEqual(comparisons.length + 1);
    expect(comp(things[i], things[i + 1])).toEqual(comparisons[i]);
    expect(comp(things[i + 1], things[i])).toEqual(0 - comparisons[i]);
  }
}

function assertComparison<T extends Obj>(
  comp: Comparator<T>,
  less: T,
  greater: T
) {
  expect(comp(less, greater), 'less').toBeLessThan(0);
  expect(comp(less, less), 'equal').toBe(0);
  expect(comp(greater, greater), 'equal').toBe(0);
  expect(comp(greater, less), 'greater').toBeGreaterThan(0);
}
