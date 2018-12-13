---
layout: post
title: "Generators in short"
date: 2018-12-13
tags: javascript generators
description: "This is a short explanation of key concepts to explain my solution to Advent of Code #1."
---

Why should I care about generators?
---
Generators can be used to model asynchronous push-pull processes. They can also model infinite sequences, which I did when [I solved Advent of Code #1](/2018-12-13/stumbling-through-aoc-1/). In such cases they are useful since it's a very concise way of writing code which only needs to process however many elements in the infinite sequence that it needs to fulfil its conditions.

This all sounds a little scary, but it isn't really. I hope that this simple post gives you a short overview what they can do. And that my post on a case where I ended up using them shows you how they can actually be useful in cleaning up your code, and making its intent much clearer.

![Image of a workbench](/assets/images/generator.jpg "Image of a workbench")
> This isn't actually a generator, but it's the closest that the headquarters can supply at the moment

How do they work?
---
In short, generators are functions which can be asked to yield their next value. This means that they have an internal state, and when asked for their next value, continue from their current state, and yield the next value. Here's an example:

```js
function* createGenerator() {
  yield 1;
  yield 2;
  yield 3;
}

for(let value of createGenerator()) {
  console.log(value); // This will first log 1, then 2, then 3
}
```

Under the hood, they implement `Iterable`, and `Iterator`. What this means is that the return value of a Generator is an object which has a next-function. Whenever the next-function is called, it returns an object which has a value (the yielded value), and a boolean, done, which is false until the last value is yielded.

```js
const generator = createGenerator();
console.log(generator.next()); // {value: 1, done: false}
console.log(generator.next()); // {value: 2, done: false}
console.log(generator.next()); // {value: 3, done: false}
console.log(generator.next()); // {value: 3, done: false}
```

This also means that we can implement our own iterators. To do this we need to create an object with a next-method which returns the next value, and a Symbol.iterator-property. The Symbol.iterator is what the runtime uses under the hood when doing for example a `for...of`-loop.

```js
const createCustomGenerator = () => {
    let value = 0;
    return {
        next: () => value < 3 ?
            { value: value++, done: false } :
            { value: undefined, done: true },
        [Symbol.iterator]: function() { return this }
    }
}

const customGenerator = createCustomGenerator();
console.log(customGenerator.next()); // {value: 1, done: false}
console.log(customGenerator.next()); // {value: 2, done: false}
console.log(customGenerator.next()); // {value: 3, done: false}
console.log(customGenerator.next()); // {value: 3, done: false}

for(let value of createCustomGenerator()) {
  console.log(value); // This will first log 1, then 2, then 3
}
```

Generators also support two-way-communication using the next-method, where the generator receives the value passed to it through the yield-statement:

```js
function* createIterable(a) {
    while(true) {
        a = yield a * a;
    }
}

const iterable = createIterable(2);
console.log(iterable.next(1)); // {value: 4, done: false}
console.log(iterable.next(6)); // {value: 36, done: false}
console.log(iterable.next(-2)); // {value: 4, done: false}
console.log(iterable.next(10)); // {value: 100, done: false}
```

> Note: The first value sent to the generator (1 in this case) is discarded. The first time through the value passed into the generator isn't assigned before the generator yields. On subsequent passes through, it is.

As demonstrated in this example:

```js
function* createIterable(fn) {
    a = fn();
    while(true) {
        fn = yield a * a;
        a = fn();
    }
}

const iterable = createIterable(() => 2);
console.log(iterable.next(() => { throw 'This is ignored' })); // Does not throw
console.log(iterable.next(() => { throw 'This is called' })); // Throws
```

Where can I read more?
---
There is a lot of great material on Generators out there. The [exploringjs article on generators](http://exploringjs.com/es6/ch_generators.html#sec_overview-generators), goes into great detail to explain what generators do. The mdn articles on [Generator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator), and [function\*](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*) are also useful for quick information on syntax and behaviour. 

Implementation wise there are  a host of articles on how async/await can be implemented using generators. I find that [Eric Elliott's take](https://medium.com/javascript-scene/the-hidden-power-of-es6-generators-observable-async-flow-control-cfa4c7f31435) makes for good reading.