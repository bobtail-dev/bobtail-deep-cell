(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define('bobtail-deep-cell', ['exports', 'underscore', 'bobtail-rx', 'lodash.get', 'lodash.set', 'jsondiffpatch'], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require('underscore'), require('bobtail-rx'), require('lodash.get'), require('lodash.set'), require('jsondiffpatch'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global._, global.rx, global.lodashGet, global.lodashSet, global.jsondiffpatch);
    global.bobtailDeepCell = mod.exports;
  }
})(this, function (exports, _underscore, _bobtailRx, _lodash, _lodash3, _jsondiffpatch) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.update = exports.deepCell = exports.DeepCell = exports.HAS = exports.GET = exports.DATA = exports.ONCHANGE = undefined;

  var _underscore2 = _interopRequireDefault(_underscore);

  var _bobtailRx2 = _interopRequireDefault(_bobtailRx);

  var _lodash2 = _interopRequireDefault(_lodash);

  var _lodash4 = _interopRequireDefault(_lodash3);

  var _jsondiffpatch2 = _interopRequireDefault(_jsondiffpatch);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

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

  var jsondiffpatch = _jsondiffpatch2.default.create({
    //  objectHash: (obj) -> obj.name or obj.id or obj._id
    cloneDiffValues: true
  });

  var recorder = _bobtailRx2.default._recorder;
  var ONCHANGE = exports.ONCHANGE = Symbol("onChange");
  var DATA = exports.DATA = Symbol("data");
  var GET = exports.GET = Symbol("get");
  var HAS = exports.HAS = Symbol("has");

  var patchHas = function patchHas(obj, path) {
    //  debugger
    var diffArray = false;
    var h = function h(obj, path) {
      if (_underscore2.default.isArray(obj) && !diffArray) {
        diffArray = true;
        obj = obj[0];
      }
      if (_underscore2.default.isObject(obj)) {
        if (!(path[0] in obj)) {
          return false;
        } else if (path.length === 1) {
          return true;
        }
        return h(obj[path[0]], path.slice(1));
      }
      return false;
    };
    return h(obj, path);
  };

  var prefixDiff = function prefixDiff(basePath, diff) {
    if (!basePath.length) {
      return diff;
    }
    var x = {};
    (0, _lodash4.default)(x, basePath, diff);
    return x;
  };

  var conf = function conf(baseObj, basePath, onChange, parent) {
    var getPath = function getPath() {
      for (var _len = arguments.length, props = Array(_len), _key = 0; _key < _len; _key++) {
        props[_key] = arguments[_key];
      }

      return basePath.concat(props);
    };

    return {
      deleteProperty: function deleteProperty(obj, prop) {
        var path = getPath(prop);
        var old = obj[prop];
        onChange.pub(prefixDiff(path, [old, 0, 0]));
        return delete obj[prop];
      },
      set: function set(obj, prop, val) {
        return recorder.mutating(function () {
          var old = obj[prop];
          var diff = jsondiffpatch.diff(_defineProperty({}, prop, old), _defineProperty({}, prop, val));
          if (diff) {
            jsondiffpatch.patch(obj, diff);
            var x = prefixDiff(basePath, diff);
            onChange.pub(x);
          }
          return true;
        });
      },
      get: function get(obj, prop) {
        if (prop === ONCHANGE) {
          return onChange;
        }
        if (['constructor', '__proto__'].includes(prop)) {
          return val;
        }
        var val = obj[prop];
        if (prop === GET || prop === 'getRx' && !(prop in obj)) {
          return function (key) {
            var path = getPath(prop, key);
            recorder.sub(onChange, function (patch) {
              return patchHas(patch, path);
            });
            return new Proxy(val[key], conf(baseObj, path, onChange, obj));
          };
        }
        if (prop === HAS || prop === 'getRx' && !(prop in obj)) {
          return function (key) {
            var path = getPath(prop, key);
            recorder.sub(onChange, function (patch) {
              return patchHas(patch, path);
            });
            return prop in obj;
          };
        }
        if (_underscore2.default.isObject(val)) {
          return new Proxy(val, conf(baseObj, getPath(prop), onChange, obj));
        }
        return val;
      },
      ownKeys: function ownKeys(obj) {
        recorder.sub(onChange, function (patch) {
          var delta = (0, _lodash2.default)(patch, basePath);
          if (!delta) {
            return false;
          }
          // if we added or removed fields on this object
          if (_underscore2.default.isArray(delta && delta.length !== 2)) {
            return true;
          }
          // true if we added or removed elements to this array, else false
          return delta._t === 'a' && _underscore2.default.chain(delta).omit('_t').values().value().some(function (v) {
            return _underscore2.default.isArray(v) && (v.length === 1 || v[1] === 0 && v[2] === 0);
          });
        });

        return Reflect.ownKeys(obj);
      },
      apply: function apply(target, thisArg, argumentsList) {
        return target.apply(thisArg || parent, argumentsList);
      }
    };
  };

  var DeepCell = exports.DeepCell = function (_rx$ObsBase) {
    _inherits(DeepCell, _rx$ObsBase);

    function DeepCell(_base) {
      _classCallCheck(this, DeepCell);

      var _this = _possibleConstructorReturn(this, (DeepCell.__proto__ || Object.getPrototypeOf(DeepCell)).call(this));

      _this._base = _base != null ? _base : {};
      if (!_underscore2.default.isObject(_this._base)) {
        throw "DeepCell must take an object";
      }

      _this[ONCHANGE] = _this._mkEv(function () {
        return jsondiffpatch.diff({}, _this._base);
      });
      _this[DATA] = new Proxy(_this._base, conf(_this._base, [], _this[ONCHANGE]));
      return _this;
    }

    return DeepCell;
  }(_bobtailRx2.default.ObsBase);

  var deepCell = exports.deepCell = function deepCell(_base) {
    return new DeepCell(_base)[DATA];
  };
  var update = exports.update = function update(cell, newVal) {
    var diff = jsondiffpatch.diff(cell, newVal);
    jsondiffpatch.patch(cell, diff);
    return true;
  };
});

