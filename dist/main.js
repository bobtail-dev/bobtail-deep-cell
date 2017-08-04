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
  exports.update = exports.jsonCell = exports.SrcJsonCell = exports.DepJsonCell = exports.DepMutationError = exports.ObsJsonCell = exports.UPDATE = exports.patchHas = undefined;
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

  var _slicedToArray = function () {
    function sliceIterator(arr, i) {
      var _arr = [];
      var _n = true;
      var _d = false;
      var _e = undefined;

      try {
        for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
          _arr.push(_s.value);

          if (i && _arr.length === i) break;
        }
      } catch (err) {
        _d = true;
        _e = err;
      } finally {
        try {
          if (!_n && _i["return"]) _i["return"]();
        } finally {
          if (_d) throw _e;
        }
      }

      return _arr;
    }

    return function (arr, i) {
      if (Array.isArray(arr)) {
        return arr;
      } else if (Symbol.iterator in Object(arr)) {
        return sliceIterator(arr, i);
      } else {
        throw new TypeError("Invalid attempt to destructure non-iterable instance");
      }
    };
  }();

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

  function _deleteProperty(getPath, basePath, obj, prop) {
    var _this = this;

    return rx.snap(function () {
      var path = getPath(prop);
      if (recorder.stack.length > 0) {
        // the default mutation warning is nowhere near dire enough. mutating nested objects within a
        // bind is extremely likely to lead to infinite loops.
        console.warn('Warning: deleting nested element at ' + path.join('.') + ' from within a bind context. Affected object:', obj);
        _this.onUnsafeMutation.pub({ op: 'delete', path: path, obj: obj, prop: prop, base: _this._base });
      }
      recorder.mutating(function () {
        var old = obj[prop];
        var diff = prefixDiff(basePath, [_defineProperty({}, prop, old), 0, 0]);
        if (prop in obj) {
          delete obj[prop];
          _this.onChange.pub(diff);
        }
      });
      return true;
    });
  }

  function _setProperty(getPath, basePath, obj, prop, val) {
    var _this2 = this;

    return rx.snap(function () {
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
          jsondiffpatch.patch(obj, diff);
          _this2.onChange.pub(prefixDiff(basePath, diff));
        }
      });
      return true;
    });
  }

  function _getProperty(getPath, basePath, obj, prop) {
    var _this3 = this;

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
      recorder.sub(this.onChange, function () {
        var newVal = (0, _lodash2.default)(_this3._base, path.slice(1)); // necessary because of wrapping in value field
        if (newVal !== oldVal) {
          oldVal = newVal;
          return true;
        }
        return false;
      });
    } else {
      recorder.sub(this.onChange, function (patch) {
        return patchHas(patch, path);
      });
    }
    // return new Proxy(deepGet(this._base, path), this.conf(path, obj));
    if (_underscore2.default.isObject(val)) {
      return new Proxy(val, this.conf(getPath(prop), obj));
    }
    return val;
  }

  var ObsJsonCell = exports.ObsJsonCell = function (_rx$ObsBase) {
    _inherits(ObsJsonCell, _rx$ObsBase);

    function ObsJsonCell(_base) {
      _classCallCheck(this, ObsJsonCell);

      var _this4 = _possibleConstructorReturn(this, (ObsJsonCell.__proto__ || Object.getPrototypeOf(ObsJsonCell)).call(this));

      _this4._base = _base;
      _this4.onChange = _this4._mkEv(function () {
        return jsondiffpatch.diff({}, _this4._base);
      });
      _this4.onUnsafeMutation = _this4._mkEv(function () {});
      _this4._updating(function () {
        return _this4._data = new Proxy({ value: _this4._base }, _this4.conf([], null));
      });
      return _this4;
    }

    _createClass(ObsJsonCell, [{
      key: '_updating',
      value: function _updating(f) {
        this._oldUpdating = this._nowUpdating || false;
        this._nowUpdating = true;
        try {
          rx.snap(f);
        } finally {
          this._nowUpdating = this._oldUpdating;
        }
        return true;
      }
    }, {
      key: '_update',
      value: function _update(newVal) {
        var _this5 = this;

        this._updating(function () {
          var diff = jsondiffpatch.diff(_this5._data, { value: newVal });
          jsondiffpatch.patch(_this5._data, diff);
        });
        return true;
      }
    }, {
      key: 'all',
      value: function all() {
        return this.data;
      }
    }, {
      key: 'readonly',
      value: function readonly() {
        var _this6 = this;

        return new DepJsonCell(function () {
          return _this6.data;
        });
      }
    }, {
      key: 'mkDeleteProperty',
      value: function mkDeleteProperty(getPath, basePath) {
        var _this7 = this;

        return function (obj, prop) {
          return _this7.deleteProperty(getPath, basePath, obj, prop);
        };
      }
    }, {
      key: 'mkSetProperty',
      value: function mkSetProperty(getPath, basePath) {
        var _this8 = this;

        return function (obj, prop, val) {
          return _this8.setProperty(getPath, basePath, obj, prop, val);
        };
      }
    }, {
      key: 'mkGetProperty',
      value: function mkGetProperty(getPath, basePath) {
        var _this9 = this;

        return function (obj, prop) {
          return _this9.getProperty(getPath, basePath, obj, prop);
        };
      }
    }, {
      key: 'deleteProperty',
      value: function deleteProperty(getPath, basePath, obj, prop) {
        return _deleteProperty.call(this, getPath, basePath, obj, prop);
      }
    }, {
      key: 'setProperty',
      value: function setProperty(getPath, basePath, obj, prop, val) {
        return _setProperty.call(this, getPath, basePath, obj, prop, val);
      }
    }, {
      key: 'getProperty',
      value: function getProperty(getPath, basePath, obj, prop) {
        return _getProperty.call(this, getPath, basePath, obj, prop);
      }
    }, {
      key: '_makeReadOnly',
      value: function _makeReadOnly() {
        var oldSet = this.setProperty;
        this.setProperty = function (getPath, basePath, obj, prop, val) {
          if (!this._nowUpdating) {
            throw new DepMutationError("Cannot mutate DepJsonCell!");
          } else return oldSet.call(this, getPath, basePath, obj, prop, val);
        };

        var oldDelete = this.deleteProperty;
        this.deleteProperty = function (getPath, basePath, obj, prop) {
          if (!this._nowUpdating) {
            throw new DepMutationError("Cannot mutate DepJsonCell!");
          } else return oldDelete.call(this, getPath, basePath, obj, prop);
        };
        return this;
      }
    }, {
      key: 'conf',
      value: function conf(basePath) {
        var _this10 = this;

        var getPath = function getPath() {
          for (var _len = arguments.length, props = Array(_len), _key = 0; _key < _len; _key++) {
            props[_key] = arguments[_key];
          }

          return basePath.concat(props);
        };

        return {
          deleteProperty: this.mkDeleteProperty(getPath, basePath),
          set: this.mkSetProperty(getPath, basePath),
          get: this.mkGetProperty(getPath, basePath),
          has: function has(obj, prop) {
            var path = getPath(prop).slice(1); // necessary because we wrap within the value field.
            var had = prop in obj;
            recorder.sub(_this10.onChange, function (patch) {
              var has = (0, _lodash6.default)(_this10._base, path);
              if (had !== has) {
                had = has;
                return true;
              }
              return false;
            });
            return had;
          },
          ownKeys: function ownKeys(obj) {
            recorder.sub(_this10.onChange, function (patch) {
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
        return this._data.value;
      }
    }]);

    return ObsJsonCell;
  }(rx.ObsBase);

  var DepMutationError = exports.DepMutationError = function (_Error) {
    _inherits(DepMutationError, _Error);

    // https://stackoverflow.com/questions/31089801/extending-error-in-javascript-with-es6-syntax
    function DepMutationError() {
      var _ref2;

      _classCallCheck(this, DepMutationError);

      for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      var _this11 = _possibleConstructorReturn(this, (_ref2 = DepMutationError.__proto__ || Object.getPrototypeOf(DepMutationError)).call.apply(_ref2, [this].concat(args)));

      Error.captureStackTrace(_this11, DepMutationError);
      return _this11;
    }

    return DepMutationError;
  }(Error);

  var DepJsonCell = exports.DepJsonCell = function (_ObsJsonCell) {
    _inherits(DepJsonCell, _ObsJsonCell);

    function DepJsonCell(f) {
      var init = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      _classCallCheck(this, DepJsonCell);

      var _this12 = _possibleConstructorReturn(this, (DepJsonCell.__proto__ || Object.getPrototypeOf(DepJsonCell)).call(this, init));

      _this12.f = f;
      var c = rx.bind(_this12.f);
      rx.autoSub(c.onSet, function (_ref3) {
        var _ref4 = _slicedToArray(_ref3, 2),
            o = _ref4[0],
            n = _ref4[1];

        return _this12._update(n);
      });
      _this12._makeReadOnly();
      return _this12;
    }

    return DepJsonCell;
  }(ObsJsonCell);

  var SrcJsonCell = exports.SrcJsonCell = function (_ObsJsonCell2) {
    _inherits(SrcJsonCell, _ObsJsonCell2);

    function SrcJsonCell(init) {
      _classCallCheck(this, SrcJsonCell);

      return _possibleConstructorReturn(this, (SrcJsonCell.__proto__ || Object.getPrototypeOf(SrcJsonCell)).call(this, init));
    }

    _createClass(SrcJsonCell, [{
      key: 'update',
      value: function update(val) {
        return this._update(val);
      }
    }, {
      key: 'data',
      set: function set(val) {
        this._update(val);
      },
      get: function get() {
        return this._data.value;
      }
    }]);

    return SrcJsonCell;
  }(ObsJsonCell);

  var jsonCell = exports.jsonCell = function jsonCell(_base) {
    return new SrcJsonCell(_base).data;
  };

  var update = exports.update = function update(cell, newVal) {
    return rx.snap(function () {
      var diff = jsondiffpatch.diff(cell, newVal);
      jsondiffpatch.patch(cell, diff);
      return true;
    });
  };
});

//# sourceMappingURL=main.js.map