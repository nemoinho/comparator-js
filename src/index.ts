/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
type Val<T> = (obj: T) => (typeof obj)[any];
type Simple = string | number;
export type Obj = object | Simple;
type ValueExtractor<T extends Obj> =
  | (keyof T & (string | number | Symbol))
  | Val<T>;

type Compare<T> = {
  (o1: T, o2: T): number;
};

export type Comparator<T extends Obj> = {
  (o1: T, o2: T): number;
  thenComparing: (
    valueExtractor: ValueExtractor<T> | Comparator<T>,
    keyComparator?: Compare<Val<T>>
  ) => Comparator<T>;
  thenComparingReverse: (
    valueExtractor: ValueExtractor<T> | Comparator<T>,
    keyComparator?: Compare<Val<T>>
  ) => Comparator<T>;
  reverse: () => Comparator<T>;
  sort: (list: Array<T>) => Array<T>;
};

const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && isFinite(value);

const isString = (value: unknown): value is string => value === '' + value;

const isSymbol = (value: unknown): value is Symbol => typeof value === 'symbol';

const isComparator = <T extends Obj>(
  value: ValueExtractor<T> | Comparator<T>
): value is Comparator<T> => value.toString().split(')')[0].includes(',');

function createComparator<T extends Obj>(
  compare: (o1: T, o2: T) => number
): Comparator<T> {
  const comparator = (o1: T, o2: T) => compare(o1, o2);
  comparator.thenComparing = (
    valueExtractor: ValueExtractor<T> | Comparator<T>,
    keyComparator?: Compare<Val<T>>
  ) => {
    const otherComparator = isComparator(valueExtractor)
      ? valueExtractor
      : doComparing(valueExtractor, keyComparator);
    return createComparator<T>((o1: T, o2: T) => {
      const res = compare(o1, o2);
      return res !== 0 ? res : otherComparator(o1, o2);
    });
  };
  comparator.thenComparingReverse = (
    valueExtractor: ValueExtractor<T> | Comparator<T>,
    keyComparator?: Compare<Val<T>>
  ): Comparator<T> =>
    comparator.thenComparing(
      doComparing(valueExtractor, keyComparator).reverse()
    );
  comparator.reverse = () =>
    createComparator<T>((o1: T, o2: T) => 0 - compare(o1, o2));
  comparator.sort = (list: Array<T>) => [...list].sort(comparator);
  return comparator;
}

function doComparing<T extends Obj>(
  valueExtractor: ValueExtractor<T> | Comparator<T>,
  keyComparator?: Compare<Val<T>>
): Comparator<T> {
  if (!valueExtractor)
    throw new Error(
      `invalid comparator or value-extractor: ${valueExtractor?.toString()}`
    );
  if (isComparator(valueExtractor)) return valueExtractor;
  const extractValue: Val<T> =
    isString(valueExtractor) ||
    isNumber(valueExtractor) ||
    isSymbol(valueExtractor)
      ? obj => obj[valueExtractor]
      : valueExtractor;
  const actualComparator =
    keyComparator ??
    ((a: Val<T>, b: Val<T>) => {
      if (isNumber(a)) {
        return isNumber(b) ? a - b : 0;
      } else if (isString(a)) {
        return isString(b) ? a.localeCompare(b) : 0;
      } else {
        return 0;
      }
    });
  return createComparator((o1: T, o2: T) => {
    const a = extractValue(o1);
    const b = extractValue(o2);
    return actualComparator(a, b);
  });
}

export function comparing<T extends Obj>(
  valueExtractor: ValueExtractor<T>,
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  keyComparator?: Compare<any>
): Comparator<T> {
  return doComparing(valueExtractor, keyComparator);
}

export function comparingSimpleString(
  keyComparator?: Compare<string>
): Comparator<string> {
  return comparing(val => val, keyComparator);
}

export function comparingSimpleNumber(
  keyComparator?: Compare<number>
): Comparator<number> {
  return comparing(val => val, keyComparator);
}
