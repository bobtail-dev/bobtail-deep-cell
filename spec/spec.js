import nn from 'nevernull';
import _ from 'underscore';
import * as rx from 'bobtail-rx';
import * as jsonRx from '../src/main.js';
let {snap, bind} = rx;
let {logReturn, patchHas, JsonCell, jsonCell} = jsonRx;
import deepGet from 'lodash.get';

jasmine.CATCH_EXCEPTIONS = false;

describe('get', () => {
  it('should react to deletions, changes and additions', () => {
    let foo = jsonCell({
      a: {b: {c: 1, d: 2}},
      e: 3,
      f: {x: {y: 42, z: ['e', 'b', 'r', 'a']}}
    });
    let zebra = bind(() => {
      let suffix = deepGet(foo, 'f.x.z');
      return suffix ? 'z' + suffix.join('') : undefined;
    });
    expect(zebra.raw()).toBe('zebra');
    foo.f.x.z.push('i');
    expect(zebra.raw()).toBe('zebrai');
    foo.f.x = {z: ['l', 'i', 'o', 'n']};
    expect(zebra.raw()).toBe('zlion');
    delete foo.f.x;
    expect(zebra.raw()).toBeUndefined();
    snap(() => foo.f.x = {z: ['a', 'b', 'c']});
    expect(zebra.raw()).toBe('zabc');
  });
});

describe('has', () => {
  let foo, a, z, q;
  beforeEach(() => {
    foo = jsonCell({
      a: {b: {c: 1, d: 2}},
      e: 3,
      f: {x: {y: 42, z: ['e', 'b', 'r', 'a']}}
    });
    a = bind(() => 'a' in foo);
    z = bind(() => 'z' in (nn(foo).f.x() || {}));
    q = bind(() => 'q' in (nn(foo).f.x() || {}));
  });
  it('should not react to changes', () => {
    expect(a.raw()).toBe(true);
    expect(z.raw()).toBe(true);
    expect(q.raw()).toBe(false);
    foo.a = 42;
    expect(a.raw()).toBe(true);
    expect(z.raw()).toBe(true);
    expect(q.raw()).toBe(false);
    foo.f = {x: {z: 1}};
    expect(a.raw()).toBe(true);
    expect(z.raw()).toBe(true);
    expect(q.raw()).toBe(false);
    foo.f.x.y = 1;
    expect(a.raw()).toBe(true);
    expect(z.raw()).toBe(true);
    expect(q.raw()).toBe(false);
  });
  it('should react to additions and deletions', () => {
    expect(a.raw()).toBe(true);
    expect(z.raw()).toBe(true);
    expect(q.raw()).toBe(false);
    delete foo.a;
    expect(a.raw()).toBe(false);
    expect(z.raw()).toBe(true);
    expect(q.raw()).toBe(false);
    delete foo.f;
    expect(a.raw()).toBe(false);
    expect(z.raw()).toBe(false);
    expect(q.raw()).toBe(false);
  });
});

let testArray = (obj, path) => {
  let mkArr = () => path ? deepGet(obj, path) : obj;
  let cell = bind(() => mkArr());
  let length = bind(() => mkArr() && mkArr().length);
  let arr = mkArr();
  expect(cell.raw()).toEqual([0, 1, 2, 3, 4]);
  expect(length.raw()).toBe(5);
  arr.push(5);
  expect(cell.raw()).toEqual([0, 1, 2, 3, 4, 5]);
  expect(length.raw()).toBe(6);
  arr[0] = 42;
  expect(cell.raw()).toEqual([42, 1, 2, 3, 4, 5]);
  expect(length.raw()).toBe(6);
  arr.shift();
  expect(cell.raw()).toEqual([1, 2, 3, 4, 5]);
  expect(length.raw()).toBe(5);
  arr.splice(1, 3);
  expect(cell.raw()).toEqual([1, 5]);
  expect(length.raw()).toBe(2);
  return {cell, length};
};

describe('array', () => {
  it("should support all array operations on raw arrays", () => {
    let arr = jsonCell([0, 1, 2, 3, 4]);
    testArray(arr);
  });
  it("should support all array operations on nested arrays", () => {
    let arr = jsonCell({x: [0, 1, 2, 3, 4]});
    let {cell, length} = testArray(arr, 'x');
    delete arr.x;
    expect(cell.raw()).toBeUndefined();
    expect(length.raw()).toBeUndefined();
  });
});

describe('onUnsafeMutation', () => {
  it('should fire if a value is set from within a bind context', () => {
    let foobar = new JsonCell({a: 1, b: 2, c: 'lala'});
    let spy = jasmine.createSpy('spy');
    foobar.onUnsafeMutation.pub = spy;
    expect(spy.calls.count()).toBe(0);
    bind(() => {
      foobar.data.b = foobar.data.c + 'la';
      return foobar.data.c;
    });
    expect(spy.calls.count()).toBe(1);
    foobar.data.c = 'lalala';
    expect(spy.calls.count()).toBe(2);
  })
});