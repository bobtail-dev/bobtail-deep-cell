# README

This package is intended to provide an easy, way to use functional reactive programming to deeply nested JSON objects. Built on the [bobtail](github.com/bobtail-dev/bobtail) reactive programming framework

See the [bobtail-form](https://github.com/bobtail-dev/bobtail-form) package, which uses `JsonCell`s to for its reactive form serializaiton, for a sample use case.

Example code in this README is written in CoffeeScript.

# The Problem
...

# Usage

## Instantiation

```
// equivalent
obj = jsonCell {x: y: z: 1}
obj = new JsonCell({x: y: z: 1}).data
```

## Dependencies and mutation events

Getting a field (`obj.x.y`), or checking to see if a key is present (`'z' in obj.x.y`). Note that in the latter example, a 'get' dependency has been introduced on `obj.x` and `obj.x.y`, as well as the 'has' dependency on `obj.x.y.z`. 
Setting a field (`obj.field = 'foo'`, `obj[fieldVar] = 'bar'`) will trigger a mutation event, as will using the `delete` keyword.

# API

## class JsonCell

The most important thing here at the moment is the `data` field. This is the Proxy object which overlays the underlying data
and handles all of the reactive bits. The `data` cell is itself behind a setter, which patches the data object and fires all necessary events. Thus, you can do things like this:

```
c = new JsonCell {} 
x = bind -> c.data.x
# x.get(): undefined
c.data = {x: 1}
# x.get(): 1
```

More to come...

## function `jsonCell(obj)`

Constructs a `JsonCell` from `obj`, and returns its `data` field.

More to come...

# Example

```
{jsonCell} = require 'bobtail-json-cell'
rx = require 'bobtail-rx'
myRxJson = jsonCell a: b: c: {'d', 'e', 'f'}
abc = rx.bind -> myRxJson?.a?.b?.c
# abc: {d: 'd', e: 'e', f: 'f'}
rx.snap -> myRxJson.a.b.c = 1  # snap necessary because otherwise we would introduce dependencies on a and a.b
# abc: 1
rx.snap -> delete myRxJson.a
# abc: undefined
myRxJson.a = b: c: d: 42
# abc: {d: 42}

myArr = new JsonCell([0, 1, 2]).data
depArr = rx.bind -> myArr
depLen = rx.bind -> myArr.length
myArr.push 3
# depArr: [0, 1, 2, 3], depLen: 4
myArr.shift()
# depArr: [1, 2, 3], depLen: 3
```

# Implementational Details

## Diffing and Patching

Because this package is specifically intended for working with complex JSON, mutation is handled by patching existing portions of the object tree, to attempt to minimize mutations. Diffing and patching are handled by Benjamín Eidelman's [jsondiffpatch package](https://github.com/benjamine/jsondiffpatch).

In particular, this means that the `=` operator behaves differently with `JsonCell`s than regular objects. Consider `myRxJson = jsonCell a: b: c: {'d', 'e', 'f'}`, from above. If we were to execute `myRxJson.a.b = {c: 'd', 'e', 'f'}`, _nothing would happen_. That's because  we are attempting to replace `myRxJson.a.b` with an identical object. `jsondiffpatch` will see this, and do nothing. Now consider `myRxJson.a.b.c = {'d', f: 'z'}`. Rather than replacing `myRxJson.a.b.c` with a new object, under the hood, jsondiffpatch will be doing something like `a.b.c.f = 'z'; delete a.b.c.e;`.

This helps cut down on unnecessary refreshes, since `bobtail` uses reference equality to determine if a refresh is necessary, and ensures that dependencies do not wind up pointing at "orphaned" objects, which would be a risk if we simply compared diffs before doing a regular assignment.

## Null Checking

When working with nested JSON objects, some kind of null-checking is highly useful. CoffeeScript's `?` operator is incredibly helpful. For those not using CoffeeScript, I recommend using Jason McAffee's [nevernull package](https://github.com/jasonmcaffee/nn). Alternatively, you can use Lodash's suite of object utilities, which offers a number of utilities for deep access on objects.

## Proxies

This project is dependent on [Proxies](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy). Proxies are supported on the latest versions of Edge, Chrome, Firefox, and Safari. However, many older browsers, including Internet Explorer, do not support them, and they **cannot be polyfilled**.

As such, if you need your code to work on older browsers, _you should not_ use this package.

# Installation

Run `npm install bobtail-json-cell`.
