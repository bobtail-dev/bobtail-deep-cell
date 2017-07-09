import nn from 'nevernull';
import _ from 'underscore';
import * as rx from 'bobtail-rx';
import deepGet from 'lodash.get';
import deepSet from 'lodash.set';
import deepHas from 'lodash.hasin';

import patchFactory from 'jsondiffpatch';

let jsondiffpatch = patchFactory.create({
//  objectHash: (obj) -> obj.name or obj.id or obj._id
  cloneDiffValues: true
});

let recorder = rx._recorder;

export let patchHas = function(patch, path, diffArray=false) {
  if(_.isString(path)) {
    return patchHas(patch, path.split('.'));  // potentially ambiguous with empty or dot-containing property names
  }
  if(!path.length) {return true;}
  if (_.isArray(patch) && !diffArray) {
    diffArray = true;
    patch = patch[0];
  }

  let [first, ...rest] = path;

  if (_.isObject(patch)) {
    if (!diffArray && patch._t === 'a') {
      let under = `${first}`;
      if(under in patch) {
        return patchHas(patch[under], rest, diffArray);
      }
      else if(first in patch) {
        return patchHas(patch[first], rest, diffArray);
      }
      return false;
    }
    if (!(first in patch)) {
      return false;
    } else if (path.length === 1) {
      return true;
    }
    return patchHas(patch[first], rest, diffArray);
  }
  return false;
};

let prefixDiff = function(basePath, diff) {
  if (!basePath.length) { return diff; }
  let x = {};
  deepSet(x, basePath, diff);
  return x;
};

export function logReturn(x) {
  console.info(x);
  return x;
}

let lengthChange = patchVal =>
  _.isArray(patchVal) && ((patchVal.length === 1) || (patchVal[1] === 0 && patchVal[2] === 0));

export let UPDATE = Symbol('update');

export class JsonCell extends rx.ObsBase {
  constructor(_base) {
    super();
    this._base = _base != null ? _base: {};
    this.onChange = this._mkEv(() => jsondiffpatch.diff({}, this._base));
    this.onUnsafeMutation = this._mkEv(() => {});
    this._data = new Proxy(this._base, this.conf([], null));
  }

  get data() {return this._data;}
  set data(val) {this.update(val);}

  static stDel(obj, prop) {return delete obj[prop];}
  del(obj, prop) {return this.__proto__.constructor.stDel(obj, prop);}
  static stSet(obj, prop, val) {return obj[prop] = val;}
  set(obj, prop) {return this.__proto__.constructor.stSet(obj, prop);}

  update (newVal) {
    let diff = jsondiffpatch.diff(this.data, newVal);
    jsondiffpatch.patch(this.data, diff);
    return true;
  }

  conf(basePath) {
    let getPath = (...props) => basePath.concat(props);

    return {
      deleteProperty: (obj, prop) => {
        let path = getPath(prop);
        if (recorder.stack.length > 0) {
          // the default mutation warning is nowhere near dire enough. mutating nested objects within a
          // bind is extremely likely to lead to infinite loops.
          console.warn(
            `Warning: deleting nested element at ${path.join('.')} from within a bind context. Affected object:`, obj
          );
          this.onUnsafeMutation.pub({op: 'delete', path, obj, prop, base: this._base})
        }
        recorder.mutating(() => {
          let old = obj[prop];
          let diff = prefixDiff(basePath, [{[prop]: old}, 0, 0]);
          if(prop in obj) {
            this.del(obj, prop);
            this.onChange.pub(diff);
          }
        });
        return true;
      },
      set: (obj, prop, val) => {
        let path = getPath(prop);
        if (recorder.stack.length > 0) {
          // the default mutation warning is nowhere near dire enough. mutating nested objects within a
          // bind is extremely likely to lead to infinite loops.
          console.warn(
            `Warning: updating nested element at ${path.join('.')} from within a bind context. Affected object:`, obj
          );
          this.onUnsafeMutation.pub({op: 'set', path, obj, prop, val, base: this._base});
        }
        recorder.mutating(() => {
          let old = rx.snap(() => obj[prop]);
          let diff = jsondiffpatch.diff({[prop]: old}, {[prop]: val});
          if (diff) {
            rx.snap(() => jsondiffpatch.patch(obj, diff));
            this.onChange.pub(prefixDiff(basePath, diff));
          }
        });
        return true;
      },
      get: (obj, prop) => {
        let val = obj[prop];
        if (prop === '__proto__' || _.isFunction(val)) {
          return val;
        }
        if (prop === UPDATE || (prop === 'updateRxb' && !('updateRxb' in obj))) {
          return other => jsondiffpatch.patch(obj, jsondiffpatch.diff(obj, other));
        }
        let path = getPath(prop);
        if (prop === 'length' && _.isArray(obj)) {
          let oldVal = obj.length;
          recorder.sub(this.onChange, () => {
            let newVal = deepGet(this._base, path);
            if(newVal !== oldVal){
              oldVal = newVal;
              return true;
            }
            return false;
          });
        }
        else {
          recorder.sub(this.onChange, patch => patchHas(patch, path));
        }
        // return new Proxy(deepGet(this._base, path), this.conf(path, obj));
        if (_.isObject(val)) {
          return new Proxy(val, this.conf(getPath(prop), obj));
        }
        return val;
      },
      has: (obj, prop) => {
        let path = getPath(prop);
        let had = prop in obj;
        recorder.sub(this.onChange, patch => {
          let has = deepHas(this._base, path);
          if(had !== has) {
            had = has;
            return true;
          }
          return false;
        });
        return had;
      },
      ownKeys: obj => {
        recorder.sub(this.onChange, patch => {
          let delta = deepGet(patch, basePath);
          if (!delta) {
            return false;
          }
          // if we added or removed fields on this object
          if (_.isArray(delta && (delta.length !== 2))) {
            return true;
          }
          // true if we added or removed elements to this array, else false
          return (delta._t === 'a') && _.chain(delta).omit('_t').values().value().some(

          );
        });

        return Reflect.ownKeys(obj);
      }
    }
  }
}

export let jsonCell = _base => new JsonCell(_base).data;

export let update = (cell, newVal) => {
  let diff = jsondiffpatch.diff(cell, newVal);
  jsondiffpatch.patch(cell, diff);
  return true;
};