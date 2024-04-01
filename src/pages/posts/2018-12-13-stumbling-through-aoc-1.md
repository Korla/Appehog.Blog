---
layout: ../../layouts/BlogLayout.astro
title: "Lazy iteration in Javascript"
date: 2018-12-29
tags: javascript generators adventofcode
slug: "2018-12-13-stumbling-through-aoc-1"
description: "Follow along as I stumble my way through the first task in Advent of Code, landing in generator heaven."
---

I decided to check out [Advent of Code (AoC](https://adventofcode.com/) this year, and when solving the first task I made a little library for lazy evaluation of sequences using [generators](/2018-12-13/aoc-generators/). Generators are something I rarely use at work, but would like to have in my toolbelt.

The first task in AoC this year is about finding the duplicates in a sequence of numbers (frequencies). The numbers are a running total of deltas (frequency changes). A given example is the sequence `[+3, +3, +4, -2, -4]`, which evaluates to the following running total:

```js
0  +3 -> 3
3  +3 -> 6
6  +4 -> 10
10 -2 -> 8
8  -4 -> 4
```

No duplicate frequencies were found in this case, so then the sequence of changes is repeated:

```js
// Continuing fom the running total 4 from above
4  +3 -> 7
7  +3 -> 10 // 10 is the first duplicate
10 +4 -> 14
14 -2 -> 12
12 -4 -> 8  // 8 is the second duplicate
```

In this case we had to loop the numbers once to find a duplicate frequency, but we do not know how many times we need to loop the numbers to reach the total. In the actual data we use in AoC, the number of times we need to loop the frequency changes is hundreds of times.

## Procedural solution

The first piece to solve this with code is to have some way to give us the next frequency change. This can be solved using a modulo operation, given the complete array of frequency changes, `frequencyChanges`:

```js
const nextFrequencyChange = frequencyChanges[i % frequencyChanges.length];
```

If we put this in an infinite loop, we can calculate the running total, `frequency`:

```js
let frequency = 0; // The current frequency
let i = 0; // A counter used to get the next frequency change
while (true) {
  // An infinite loop
  frequency += frequencyChanges[i % frequencyChanges.length]; // Calculate the next frequency
  i++; // Tick up the counter
}
```

The next part is finding if the current frequency has already been visited. This can for instance be done by having a dictionary record the visited frequencies. I did this with a counter for how many times the frequency had been visited:

```js
const history = {}; // The visited frequencies
let frequency = 0;
let i = 0;
while (true) {
  history[frequency] = (history[frequency] || 0) + 1; // Append the last frquency to the history
  frequency += frequencyChanges[i % frequencyChanges.length];
  i++;
}
```

Finally, we check if the frequency has been visited once, if it has, it is added to the duplicates array. We also update the while-condition so that it exits when the desired number of frequencies has been found. We can also wrap it in a function to make it work with different arrays, and look for a certain number of duplicates:

```js
const findDuplicates = (frequencyChanges, numberOfDuplicates) => {
  const duplicates = []; // The duplicates we will find
  const history = {};
  let frequency = 0;
  let i = 0;
  while (duplicates.length !== numberOfDuplicates) {
    // Loop until we find the desired number of duplicates
    history[frequency] = (history[frequency] || 0) + 1;
    frequency += frequencyChanges[i % frequencyChanges.length];
    if (history[frequency] === 1) {
      // Check if the current frequency has been visited once previously
      duplicates.push(frequency); // Add it to duplicates if it has been visited
    }
    i++;
  }
  return duplicates;
};
```

This looks quite neat, and we have a decently portable solution, but I dislike the outer state, and the amount of mutability it leads to. The code feels a little brittle when it comes to changing requirements in a real-world scenario.

It would also be nice if we could write the code so that if we needed another duplicate for some reason, we could just ask for it, and we wouldn't have to recalculate the history to that point, since we already did that.

All these requirements can be satisfied if we implement the solution using generators instead.

![Image of a birch tree taken form the kitchen](/images/aoc.jpg "Lazy birch")
_So, how lazy was I? I took this photo from the warmth of the kitchen_

## Mutationless (almost) solution

The first part is again to create an infinite loop of the frequency changes. This can be done by yielding the elements of the sequence, and then recursively yielding the elements of the sequence:

```js
function* loop(seq) {
  yield* seq; // Yield the iterable sequence one element at a time
  yield* loop(seq); // Recurse
}
```

To calculate the running total, we would like to be able to reduce over the iterable sequence. Something like this:

```js
const runningTotal = loop(frequencyChanges).reduce(
  (runningTotal, delta) => runningTotal + delta,
  0,
);
```

Unfortunately, Array.reduce, or similar, isn't implemented for a Generator object. So instead we can aim for something similar to this API:

```js
const runningTotal = new Lazy(frequencyChanges)
  .loop()
  .reduce((runningTotal, delta) => runningTotal + delta, 0)
  .take(2)
  .toArray();
```

Or, if we dislike the class syntax, a function chain could work:

```js
const runningTotal = lazy.chain(
  lazy.loop(),
  lazy.reduce((runningTotal, delta) => runningTotal + delta, 0),
  lazy.take(2),
  lazy.toArray(),
);
```

A simple implementation of the first API could look like this:

```js
class Lazy {
  constructor(seq) {
    this.seq = seq;
  }
  _toFluent(generator) {
    // A helper to instantiate the next "link" in the Lazy "chain"
    // The next Lazy "link" takes the previous iterable sequence as its argument
    // The iterable sequence can be any iterable, such as a Generator or an Array
    return new Lazy(generator(this.seq));
  }
  reduce(fn, start) {
    return this._toFluent(function* reduce(seq) {
      let next = start;
      for (let value of seq) {
        next = fn(next, value); // Here we call the reduce-callback
        yield next; // We yield the value, and wait for someone to ask us for the next one
      }
    });
  }
  loop() {
    return this._toFluent(function* loop(seq) {
      yield* seq;
      yield* loop(seq);
    });
  }
  take(number) {
    return this.toFluent(function* take(seq) {
      for (let value of seq) {
        yield value;
        if (--number === 0) {
          return;
        }
      }
    });
  }
  toArray() {
    // If we call toArray on an infinite sequence, the execution will not complete
    // But if we call it after doing take, only as many elements as we take will be included
    // in the resulting Array
    return Array.from(this.seq);
  }
}
```

An interesting property of these utilities is that the callbacks to `Lazy.reduce` (and as you can see below, `Lazy.map`, and `Lazy.filter`) is a normal, synchronous function, but the behaviour of the resulting Lazy is lazy due to the Lazy being implemented using Generators.

The final solution looks quite similar to the procedural solution, but it lacks outer state, the reduce encapsulates the state. We can now use our common Array operations to implement the solution.

```js
const duplicates = new Lazy(frequencyChanges) // Create a generator which can yield our frequency changes
  .loop() // Loop the frequency changes infinitely
  .reduce(
    ({ history, frequency }, delta) => {
      // Append the last frequency to the history, and calculate the next frequency
      history[frequency] = (history[frequency] || 0) + 1;
      return {
        history,
        frequency: frequency + delta,
      };
    },
    { history: {}, frequency: 0 },
  )
  .filter(({ history, frequency }) => history[frequency] === 1) // Check if the current frequency has been visited once previously
  .map(({ frequency }) => frequency) // Select the frequency part of our reduced object
  .take(2) // Pick only the first two results
  .toArray(); // Convert enumerable to array
```

_Unfortunately, the reduce mutates the previous state, which is a concession to performance. A performant solution would implement history using an immutable data structure, perhaps using a proxy (a topic for a future blog post perhaps?)_

The full `Lazy` implementation can be seen in this [gist](https://gist.github.com/Korla/ec117e0d41b7d383c78173afb5ceab8c). To run it against your data, I suggest copying the gist to a snippet and running it directly on the input page for AoC #1.
