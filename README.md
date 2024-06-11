# @nemoinho/comparator

[![CI](https://ci.nehrke.info/api/v1/teams/main/pipelines/comparator-js/jobs/build/badge)](https://ci.nehrke.info/teams/main/pipelines/comparator-js?group=build)

Compare complex objects with ease.
This library provides a simple API to create complex comparators and keep them understandable for humans.

> The comparator is heavily inspired by the Comparator from Java.

## Usage
The library provides some simple functions and can be easily extended to complex comparators:

```typescript
import { comparing } from "@nemoinho/comparator-js";

type Person = {
  name: string;
  originCountry: string;
}

const people = [/* people here */]

const comparator =
  comparing<Person>("originCountry")
    .thenComparing("name");

// create a new sorted list
comparator.sort(people);

// or sort existing list in place
people.sort(comparator);
```

## API
The library provides the following functions:

`comparing<T>(valueExtractor, keyComparator?): Comparator<T>`

Create a comparator which compares objects of Type T.

`valueExtractor`: The valueExtractor can either be a field-name of T or a function which extracts a value from a given object T.

`keyComparator`: An optional comparator to compare the extracted value.
The default comparator is capable of comparing string and numbers, all other types will be considered equal!

---

`comparingSimpleString(keyComparator?): Comparator<string>`
`comparingSimpleNumber(keyComparator?): Comparator<number>`

Create a comparator to compare string/numbers instead of objects.

`keyComparator`: An optional comparator to compare the extracted value.
The default comparator is capable of comparing string and numbers, all other types will be considered equal!

---

`Comparator<T>.thenComparing(valueExtractor, keyComparator?): Comparator<T>`

Chains another comparison onto the comparator, note that this is only executed if the previous comparisons resulted in equal objects.

`valueExtractor`: The valueExtractor can either be a field-name of T or a function which extracts a value from a given object T.

`keyComparator`: An optional comparator to compare the extracted value.
The default comparator is capable of comparing string and numbers, all other types will be considered equal!

---

`Comparator<T>.reverse(): Comparator<T>`

Reverses the result of the current comparator.

---

`Comparator<T>.thenComparingReverse(valueExtractor, keyComparator?): Comparator<T>`

A convenience method which combines `thenComparing()` and `reverse()`.

---

`Comparator<T>.sort(list): Array<T>`

This method returns a sorted version of the given list, which is sorted by this comparator.
