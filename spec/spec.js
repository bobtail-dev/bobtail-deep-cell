import nn from 'nevernull';
import _ from 'underscore';
import * as rx from 'bobtail-rx';
import * as jsonRx from '../src/main.js';
let {snap, bind} = rx;
let {IS_PROXY_SYM, DepMutationError, DepJsonCell, SrcJsonCell, jsonCell} = jsonRx;
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
    let foobar = new SrcJsonCell({a: 1, b: 2, c: 'lala'});
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

describe('DepJsonCell', () => {
  it('should react to changes', () => {
    let testCell = rx.cell({a: {b: 42, c: 60}, c: 0});
    let x = new DepJsonCell(() => testCell.get().a);
    let y = bind(() => x.data);
    expect(x.data).toEqual({b: 42, c: 60});
    testCell.set({a: {x: 42}, b: 40});
    expect(x.data).toEqual({x: 42});
    testCell.set({a: 80});
    expect(x.data).toEqual(80);
    expect(y.get()).toEqual(80);
    testCell.set({a: {b: 'c'}});
    expect(x.data).toEqual({b: 'c'});
    expect(y.get()).toEqual({b: 'c'});
  });
  it('should not permit writing or deleting properties', () => {
    let testCell = rx.cell({a: {b: 42, c: 60}, c: 0});
    let x = new DepJsonCell(() => testCell.get());
    expect(() => delete x.data.b).toThrowError("Cannot mutate DepJsonCell!");
    expect(() => x.data.a = 90).toThrowError("Cannot mutate DepJsonCell!");
  });
});

describe('SrcJsonCell', () => {
  it('should support primitive values', () => {
    let x = new SrcJsonCell(42);
    expect(x.data).toBe(42);
    x.data = null;
    expect(x.data).toBeNull();
    x.data = {a: 'b'};
    expect(x.data).toEqual({a: 'b'});
    x.data = false;
    expect(x.data).toBe(false);
  });
});

describe('arrays', () => {
  it('should emit change events when splice is called', () => {
    let src = new SrcJsonCell([1,2,3,4]);
    let dep = bind(() => src.data);
    expect(dep.raw()).toEqual([1,2,3,4]);
    src.data.splice(0,1);
    expect(dep.raw()).toEqual([2,3,4]);
    src.data.splice(0,0,1);
    expect(dep.raw()).toEqual([1,2,3,4]);
  });
});

describe('cloneRaw', () => {
  it('should not return a Proxy', () => {
    expect(new SrcJsonCell({}).raw()[IS_PROXY_SYM]).toBeUndefined()
  });
  it('should not return a reactive object', () => {
    let cell = new SrcJsonCell({a: 1, b: {c: 2}});
    let x = cell.cloneRaw();
    let y = rx.bind(() => x);
    cell.data.a = 2;
    cell.data.b.c = 3;
    expect(y.raw()).toEqual({a: 1, b: {c: 2}});
  });
  it('should not return an object whose mutations will affect its source', () => {
    let cell = new SrcJsonCell({a: 1, b: {c: 2}});
    let x = cell.cloneRaw();
    x.a = 2;
    expect(rx.snap(() => cell.data.a)).toBe(1);
  });
  it('should return a clone of its parent object', () => {
    let cell = new SrcJsonCell({a: 1, b: {c: 2}});
    let x = cell.cloneRaw();
    expect(rx.snap(() => _.isEqual(x, cell.data))).toBe(true);
    expect(rx.snap(() => x === cell.data)).toBe(false);
  });
});

describe('multiple proxies', () => {
  // cell.data returns a new Proxy every time, so make sure that this doesn't break reactivity.
  it('Cells dependent on different proxies from the same object should update whenever the object changes', () => {
    let cell = new SrcJsonCell({a: 1});
    let x = cell.data;
    let y = cell.data;
    let xCell = bind(() => x.a);
    let yCell = bind(() => y.a);
    x.a = 2;
    expect(xCell.raw()).toBe(2);
    expect(yCell.raw()).toBe(2);
  });
});

describe('nullified cells', () => {
  it("should work even after being reset to null", () => {
    // This previously caused breakages due to reliance on the old _base attribute.
    // let's make sure it doesn't sneak in again.
    let x = new SrcJsonCell(null);
    x.data = [1, 2, 3, 4];
    expect(bind(() => x.data.map(_.identity)).raw()).toEqual([1, 2, 3, 4]);
  });
});

describe('snapGet', () => {
  it("Should not subscribe dependencies", () => {
    let cell = new SrcJsonCell({a: {b: 1, c: 2}, d: 3});
    let x = bind(() => cell.snapGet('a.b'));
    expect(x.raw()).toBe(1);
    cell.data.a.b = 2;
    expect(x.raw()).toBe(1); // should not update
  });
  it("sub properties should subscribe dependencies", () => {
    let cell = new SrcJsonCell({a: {b: {c: 2, d: 3}}, e: 1});
    let x = bind(() => cell.snapGet('a.b').c);
    let spy = jasmine.createSpy('listener');
    rx.autoSub(x.onSet, rx.skipFirst(spy));
    expect(x.raw()).toBe(2);
    cell.data.a.b.d = 4;
    expect(spy).not.toHaveBeenCalled();
    cell.data.a.b.c = 3;
    expect(x.raw()).toBe(3);
    expect(spy).toHaveBeenCalledTimes(1);
  });
  it("", () => {

  });
});