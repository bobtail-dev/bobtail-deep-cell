(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define('bobtail-json-cell', ['exports', 'underscore', 'bobtail-rx', 'lodash.get', 'lodash.set', 'lodash.hasin', 'jsondiffpatch'], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require('underscore'), require('bobtail-rx'), require('lodash.get'), require('lodash.set'), require('lodash.hasin'), require('jsondiffpatch'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global._, global.rx, global.lodashGet, global.lodashSet, global.lodashHasin, global.jsondiffpatch);
    global.bobtailJsonCell = mod.exports;
  }
})(this, function (exports, _underscore, _bobtailRx, _lodash, _lodash3, _lodash5, _jsondiffpatch) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.update = exports.jsonCell = exports.JsonCell = exports.UPDATE = exports.patchHas = undefined;
  exports.logReturn = logReturn;

  var _underscore2 = _interopRequireDefault(_underscore);

  var rx = _interopRequireWildcard(_bobtailRx);

  var _lodash2 = _interopRequireDefault(_lodash);

  var _lodash4 = _interopRequireDefault(_lodash3);

  var _lodash6 = _interopRequireDefault(_lodash5);

  var _jsondiffpatch2 = _interopRequireDefault(_jsondiffpatch);

  function _interopRequireWildcard(obj) {
    if (obj && obj.__esModule) {
      return obj;
    } else {
      var newObj = {};

      if (obj != null) {
        for (var key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
        }
      }

      newObj.default = obj;
      return newObj;
    }
  }

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();

  function _possibleConstructorReturn(self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  }

  function _toArray(arr) {
    return Array.isArray(arr) ? arr : Array.from(arr);
  }

  var jsondiffpatch = _jsondiffpatch2.default.create({
    //  objectHash: (obj) -> obj.name or obj.id or obj._id
    cloneDiffValues: true
  });

  var recorder = rx._recorder;

  var patchHas = exports.patchHas = function patchHas(patch, path) {
    var diffArray = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

    if (_underscore2.default.isString(path)) {
      return patchHas(patch, path.split('.')); // potentially ambiguous with empty or dot-containing property names
    }
    if (!path.length) {
      return true;
    }
    if (_underscore2.default.isArray(patch) && !diffArray) {
      diffArray = true;
      patch = patch[0];
    }

    var _path = _toArray(path),
        first = _path[0],
        rest = _path.slice(1);

    if (_underscore2.default.isObject(patch)) {
      if (!diffArray && patch._t === 'a') {
        var under = '' + first;
        if (under in patch) {
          return patchHas(patch[under], rest, diffArray);
        } else if (first in patch) {
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

  var prefixDiff = function prefixDiff(basePath, diff) {
    if (!basePath.length) {
      return diff;
    }
    var x = {};
    (0, _lodash4.default)(x, basePath, diff);
    return x;
  };

  function logReturn(x) {
    console.info(x);
    return x;
  }

  var lengthChange = function lengthChange(patchVal) {
    return _underscore2.default.isArray(patchVal) && (patchVal.length === 1 || patchVal[1] === 0 && patchVal[2] === 0);
  };

  var UPDATE = exports.UPDATE = Symbol('update');

  var JsonCell = exports.JsonCell = function (_rx$ObsBase) {
    _inherits(JsonCell, _rx$ObsBase);

    function JsonCell(_base) {
      _classCallCheck(this, JsonCell);

      var _this = _possibleConstructorReturn(this, (JsonCell.__proto__ || Object.getPrototypeOf(JsonCell)).call(this));

      _this._base = _base != null ? _base : {};
      _this.onChange = _this._mkEv(function () {
        return jsondiffpatch.diff({}, _this._base);
      });
      _this.onUnsafeMutation = _this._mkEv(function () {});
      _this._data = new Proxy(_this._base, _this.conf([], null));
      return _this;
    }

    _createClass(JsonCell, [{
      key: 'del',
      value: function del(obj, prop) {
        return this.__proto__.constructor.stDel(obj, prop);
      }
    }, {
      key: 'set',
      value: function set(obj, prop) {
        return this.__proto__.constructor.stSet(obj, prop);
      }
    }, {
      key: 'update',
      value: function update(newVal) {
        var diff = jsondiffpatch.diff(this.data, newVal);
        jsondiffpatch.patch(this.data, diff);
        return true;
      }
    }, {
      key: 'conf',
      value: function conf(basePath) {
        var _this2 = this;

        var getPath = function getPath() {
          for (var _len = arguments.length, props = Array(_len), _key = 0; _key < _len; _key++) {
            props[_key] = arguments[_key];
          }

          return basePath.concat(props);
        };

        return {
          deleteProperty: function deleteProperty(obj, prop) {
            var path = getPath(prop);
            if (recorder.stack.length > 0) {
              // the default mutation warning is nowhere near dire enough. mutating nested objects within a
              // bind is extremely likely to lead to infinite loops.
              console.warn('Warning: deleting nested element at ' + path.join('.') + ' from within a bind context. Affected object:', obj);
              _this2.onUnsafeMutation.pub({ op: 'delete', path: path, obj: obj, prop: prop, base: _this2._base });
            }
            recorder.mutating(function () {
              var old = obj[prop];
              var diff = prefixDiff(basePath, [_defineProperty({}, prop, old), 0, 0]);
              if (prop in obj) {
                _this2.del(obj, prop);
                _this2.onChange.pub(diff);
              }
            });
            return true;
          },
          set: function set(obj, prop, val) {
            var path = getPath(prop);
            if (recorder.stack.length > 0) {
              // the default mutation warning is nowhere near dire enough. mutating nested objects within a
              // bind is extremely likely to lead to infinite loops.
              console.warn('Warning: updating nested element at ' + path.join('.') + ' from within a bind context. Affected object:', obj);
              _this2.onUnsafeMutation.pub({ op: 'set', path: path, obj: obj, prop: prop, val: val, base: _this2._base });
            }
            recorder.mutating(function () {
              var old = rx.snap(function () {
                return obj[prop];
              });
              var diff = jsondiffpatch.diff(_defineProperty({}, prop, old), _defineProperty({}, prop, val));
              if (diff) {
                rx.snap(function () {
                  return jsondiffpatch.patch(obj, diff);
                });
                _this2.onChange.pub(prefixDiff(basePath, diff));
              }
            });
            return true;
          },
          get: function get(obj, prop) {
            var val = obj[prop];
            if (prop === '__proto__' || _underscore2.default.isFunction(val)) {
              return val;
            }
            if (prop === UPDATE || prop === 'updateRxb' && !('updateRxb' in obj)) {
              return function (other) {
                return jsondiffpatch.patch(obj, jsondiffpatch.diff(obj, other));
              };
            }
            var path = getPath(prop);
            if (prop === 'length' && _underscore2.default.isArray(obj)) {
              var oldVal = obj.length;
              recorder.sub(_this2.onChange, function () {
                var newVal = (0, _lodash2.default)(_this2._base, path);
                if (newVal !== oldVal) {
                  oldVal = newVal;
                  return true;
                }
                return false;
              });
            } else {
              recorder.sub(_this2.onChange, function (patch) {
                return patchHas(patch, path);
              });
            }
            // return new Proxy(deepGet(this._base, path), this.conf(path, obj));
            if (_underscore2.default.isObject(val)) {
              return new Proxy(val, _this2.conf(getPath(prop), obj));
            }
            return val;
          },
          has: function has(obj, prop) {
            var path = getPath(prop);
            var had = prop in obj;
            recorder.sub(_this2.onChange, function (patch) {
              var has = (0, _lodash6.default)(_this2._base, path);
              if (had !== has) {
                had = has;
                return true;
              }
              return false;
            });
            return had;
          },
          ownKeys: function ownKeys(obj) {
            recorder.sub(_this2.onChange, function (patch) {
              var delta = (0, _lodash2.default)(patch, basePath);
              if (!delta) {
                return false;
              }
              // if we added or removed fields on this object
              if (_underscore2.default.isArray(delta && delta.length !== 2)) {
                return true;
              }
              // true if we added or removed elements to this array, else false
              return delta._t === 'a' && _underscore2.default.chain(delta).omit('_t').values().value().some();
            });

            return Reflect.ownKeys(obj);
          }
        };
      }
    }, {
      key: 'data',
      get: function get() {
        return this._data;
      },
      set: function set(val) {
        this.update(val);
      }
    }], [{
      key: 'stDel',
      value: function stDel(obj, prop) {
        return delete obj[prop];
      }
    }, {
      key: 'stSet',
      value: function stSet(obj, prop, val) {
        return obj[prop] = val;
      }
    }]);

    return JsonCell;
  }(rx.ObsBase);

  var jsonCell = exports.jsonCell = function jsonCell(_base) {
    return new JsonCell(_base).data;
  };

  var update = exports.update = function update(cell, newVal) {
    var diff = jsondiffpatch.diff(cell, newVal);
    jsondiffpatch.patch(cell, diff);
    return true;
  };
});

//# sourceMappingURL=main.js.map