/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
type KeyExtractorFn<T> = (obj: T) => (typeof obj)[any];
type KeyOf<T extends Obj> = keyof T & (string | number | Symbol);
type Simple = string | number;
export type Obj = object | Simple;
type KeyExtractor<T extends Obj> = KeyOf<T> | KeyExtractorFn<T>;

type Compare<T> = {
  (o1: T, o2: T): number;
};

/**
 * Comparators can be passed to the sort method of arrays to sort them.
 * Alternatively, it can create a sorted copy of the array, via its own sort method.
 */
export type Comparator<T extends Obj> = {
  (o1: T, o2: T): number;

  /**
   * Returns a {@link Comparator} with either a key, or a function that extracts a sort key,
   * to be compared with the specified {@link Comparator}, or a default comparator.
   */
  thenComparing: (
    valueExtractor: KeyExtractor<T> | Comparator<T>,
    keyComparator?: Compare<KeyExtractorFn<T>>
  ) => Comparator<T>;

  /**
   * Returns a {@link Comparator} with either a key, or a function that extracts a sort key,
   * to be compared in reverse with the specified {@link Comparator}, or a default comparator.
   */
  thenComparingReverse: (
    valueExtractor: KeyExtractor<T> | Comparator<T>,
    keyComparator?: Compare<KeyExtractorFn<T>>
  ) => Comparator<T>;

  /**
   * Returns a {@link Comparator} that imposes the reverse ordering of this comparator.
   */
  reverse: () => Comparator<T>;

  /**
   * Create a sorted copy of the given array, where the order is determined by the comparator.
   */
  sort: (list: Array<T>) => Array<T>;
};

const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && isFinite(value);

const isString = (value: unknown): value is string => value === '' + value;

const isSymbol = (value: unknown): value is Symbol => typeof value === 'symbol';

const isComparator = <T extends Obj>(
  value: KeyExtractor<T> | Comparator<T>
): value is Comparator<T> => value.toString().split(')')[0].includes(',');

function createComparator<T extends Obj>(
  compare: (o1: T, o2: T) => number
): Comparator<T> {
  const comparator = (o1: T, o2: T) => compare(o1, o2);
  comparator.thenComparing = (
    valueExtractor: KeyExtractor<T> | Comparator<T>,
    keyComparator?: Compare<KeyExtractorFn<T>>
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
    valueExtractor: KeyExtractor<T> | Comparator<T>,
    keyComparator?: Compare<KeyExtractorFn<T>>
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
  valueExtractor: KeyExtractor<T> | Comparator<T>,
  keyComparator?: Compare<KeyExtractorFn<T>>
): Comparator<T> {
  if (!valueExtractor && valueExtractor !== 0)
    throw new Error(
      `invalid comparator or value-extractor: ${valueExtractor?.toString()}`
    );
  if (isComparator(valueExtractor)) return valueExtractor;
  const extractValue: KeyExtractorFn<T> =
    isString(valueExtractor) ||
    isNumber(valueExtractor) ||
    isSymbol(valueExtractor)
      ? obj => obj[valueExtractor]
      : valueExtractor;
  const actualComparator =
    keyComparator ??
    ((a: KeyExtractorFn<T>, b: KeyExtractorFn<T>) => {
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

/**
 * Accepts a function that extracts a sort key from a type T,
 * and returns a {@link Comparator|Comparator<T>}  that compares by that sort key.
 *
 * @apiNote
 * For example, to obtain a Comparator that compares Person objects by their last name:
 *
 * <pre>
 * const byLastName = comparing<Person>(person => person.lastName);
 * </pre>
 */
export function comparing<T extends Obj>(
  keyExtractor: KeyExtractorFn<T>
): Comparator<T>;

/**
 * Accepts a key from a type T,
 * and returns a {@link Comparator|Comparator<T>}  that compares by that sort key.
 *
 * @apiNote
 * For example, to obtain a Comparator that compares Person objects by their last name:
 *
 * <pre>
 * const byLastName = comparing<Person>("lastName");
 * </pre>
 */
export function comparing<T extends Obj>(keyOf: KeyOf<T>): Comparator<T>;

/**
 * Accepts a function that extracts a sort key from a type T,
 * and returns a {@link Comparator|Comparator<T>} that compares by that sort key using
 * the specified {@link Comparator}.
 *
 * @apiNote
 * For example, to obtain a Comparator that compares Person objects by their last name:
 *
 * <pre>
 * const byLastName = comparing<Person>(
 *     person => person.lastName,
 *     (name1, name2) => name1.localeCompare(name2, "de")
 * );
 * </pre>
 */
export function comparing<T extends Obj>(
  keyExtractor: KeyExtractorFn<T>,
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  keyComparator: Compare<any>
): Comparator<T>;

/**
 * Accepts a key from a type T,
 * and returns a {@link Comparator|Comparator<T>} that compares by that sort key using
 * the specified {@link Comparator}.
 *
 * @apiNote
 * For example, to obtain a Comparator that compares Person objects by their last name:
 *
 * <pre>
 * const byLastName = comparing<Person>(
 *     "lastName",
 *     (name1, name2) => name1.localeCompare(name2, "de")
 * );
 * </pre>
 */
export function comparing<T extends Obj>(
  keyOf: KeyOf<T>,
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  keyComparator: Compare<any>
): Comparator<T>;

/**
 * Accepts either a key, or a function that extracts a sort key, from a type T,
 * and returns a {@link Comparator|Comparator<T>} that compares by that sort key using
 * the specified {@link Comparator}, or a default comparator.
 *
 * @apiNote
 * For example, to obtain a Comparator that compares Person objects by their last name:
 *
 * <pre>
 * const byLastName = comparing<Person>(
 *     "lastName",
 *     (name1, name2) => name1.localeCompare(name2, "de")
 * );
 * </pre>
 */
export function comparing<T extends Obj>(
  valueExtractor: KeyExtractorFn<T> | KeyOf<T>,
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  keyComparator?: Compare<any>
): Comparator<T> {
  return doComparing(valueExtractor, keyComparator);
}

/**
 * Returns a {@link Comparator|Comparator<string>} that compares strings using
 * the specified {@link Comparator}, or a default comparator.
 */
export function comparingSimpleString(
  keyComparator?: Compare<string>
): Comparator<string> {
  return comparing<string>(val => val, keyComparator!);
}

/**
 * Returns a {@link Comparator|Comparator<number>} that compares numbers using
 * the specified {@link Comparator}, or a default comparator.
 */
export function comparingSimpleNumber(
  keyComparator?: Compare<number>
): Comparator<number> {
  return comparing(val => val, keyComparator!);
}
