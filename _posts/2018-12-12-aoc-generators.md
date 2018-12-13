---
layout: post
title: "Generators!"
date: 2018-12-13
tags: javascript generators adventofcode
---

I decided to check out Advent of Code (AoC) this year, and when solving the first task I decided to learn a little more about generators, which is something I rarely use at work, but would like to have in my toolbelt. Those of you who already know the basics of Generators, the function*-declaration, Iterables, Iterators , and yield can skip ahead to the section on explaining AoC task #1, or skip to my solutions, for some code.

Generators in general
---
The exploringjs article on generators, goes into great detail to explain what generators do, so read that for a thorough explanation. But, in short, generators are functions which can be asked to yield their next value. This means that they can have an internal state, and when asked for their next value, continue from the state which they had, and yield the next value. Here's an example:

```js
function* sequence() {
  yield 1;
  yield 2;
  yield 3;
}

for(let value of sequence()) {
  console.log(value); // This will first log 1, then 2, then 3
}
```

Under the hood, they implement Iterable , and Iterator, and that is what allows the for-of loop and other constructs work with them. 

//Replace with gist

The short of what this means is that the return value of a Generator is an object which has a next-function which is parameterless. Whenever the next-function is called, it returns an object which has a value (the yielded value), and a boolean done which is false until the last value is yielded.