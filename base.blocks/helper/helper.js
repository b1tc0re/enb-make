/**
 * @module helper
 */
modules.define('helper', function(provide) {

    /**
     * @exports
     * @class helper
     * @bem
     */
    provide({

        /**
         * Determines whether an object has a property with the specified name.
         * @param v A property name.
         * @return boolean
         */
        hasOwnProperty: Object.prototype.hasOwnProperty,

        /**
         * Returns a string representation of an object.
         */
        toString: Object.prototype.toString,

        /**
         * Adds a property to an object, or modifies attributes of an existing property.
         * @param o Object on which to add or modify the property. This can be a native JavaScript object (that is, a user-defined object or a built in object) or a DOM object.
         * @param p The property name.
         * @param attributes Descriptor for the property. It can be for a data property or an accessor property.
         */
        defineProperty:  Object.defineProperty,

        /**
         * Gets the own property descriptor of the specified object.
         * An own property descriptor is one that is defined directly on the object and is not inherited from the object's prototype.
         * @param o Object that contains the property.
         * @param p Name of the property.
         */
        getOwnPropertyDescriptor: Object.getOwnPropertyDescriptor,

        /**
         * Check if the passed variable is an array
         * @param arr
         * @return {boolean}
         */
        isArray: function (arr) {
            if (typeof Array.isArray === 'function') {
                return Array.isArray(arr);
            }

            return this.toString.call(arr) === '[object Array]';
        },

        /**
         * Check if the passed variable is a plain object
         * @param obj
         * @return {boolean}
         */
        isPlainObject: function (obj) {
            if (!obj || this.toString.call(obj) !== '[object Object]') {
                return false;
            }

            let hasOwnConstructor = this.hasOwnProperty.call(obj, 'constructor');
            let hasIsPrototypeOf = obj.constructor && obj.constructor.prototype && this.hasOwnProperty.call(obj.constructor.prototype, 'isPrototypeOf');

            // Not own constructor property must be Object
            if (obj.constructor && !hasOwnConstructor && !hasIsPrototypeOf) {
                return false;
            }

            // Own properties are enumerated firstly, so to speed up,
            // if last one is own, then all properties are own.
            let key;
            for (key in obj) { /**/ }

            return typeof key === 'undefined' || this.hasOwnProperty.call(obj, key);
        },

        /**
         * If name is '__proto__', and Object.defineProperty is available, define __proto__ as an own property on target
         * @param target
         * @param options
         * @private
         */
        _setProperty: function (target, options) {

            if (this.defineProperty && options.name === '__proto__') {
                this.defineProperty(target, options.name, {
                    enumerable: true,
                    configurable: true,
                    value: options.newValue,
                    writable: true
                });
            }
            else {
                target[options.name] = options.newValue;
            }
        },

        /**
         * Return undefined instead of __proto__ if '__proto__' is not an own property
         * @param obj
         * @param name
         * @return {any}
         * @private
         */
        _getProperty: function (obj, name) {

            if (name === '__proto__') {
                if (!this.hasOwnProperty.call(obj, name)) {
                    return void 0;
                } else if (this.getOwnPropertyDescriptor) {
                    // In early versions of node, obj['__proto__'] is buggy when obj has
                    // __proto__ as an own property. Object.getOwnPropertyDescriptor() works.
                    return this.getOwnPropertyDescriptor(obj, name).value;
                }
            }

            return obj[name];
        },

        /**
         * Port of the classic extend() method from jQuery. It behaves as you expect. It is simple, tried and true.
         * @return {any}
         */
        jqueryExtend: function() {
            let options, name, src, copy, copyIsArray, clone,
                target = arguments[0],
                i = 1,
                length = arguments.length,
                deep = false;

            // Handle a deep copy situation
            if (typeof target === 'boolean') {
                deep = target;
                target = arguments[1] || {};
                // skip the boolean and the target
                i = 2;
            }
            if (target == null || (typeof target !== 'object' && typeof target !== 'function')) {
                target = {};
            }

            for (; i < length; ++i) {
                options = arguments[i];
                // Only deal with non-null/undefined values
                if (options != null) {
                    // Extend the base object
                    for (name in options) {
                        src = this._getProperty(target, name);
                        copy = this._getProperty(options, name);

                        // Prevent never-ending loop
                        if (target !== copy) {
                            // Recurse if we're merging plain objects or arrays
                            if (deep && copy && (this.isPlainObject(copy) || (copyIsArray = this.isArray(copy)))) {
                                if (copyIsArray) {
                                    copyIsArray = false;
                                    clone = src && this.isArray(src) ? src : [];
                                } else {
                                    clone = src && this.isPlainObject(src) ? src : {};
                                }

                                // Never move original objects, clone them
                                this._setProperty(target, { name: name, newValue: extend(deep, clone, copy) });

                                // Don't bring in undefined values
                            } else if (typeof copy !== 'undefined') {
                                this._setProperty(target, { name: name, newValue: copy });
                            }
                        }
                    }
                }
            }

            // Return the modified object
            return target;
        },

        /**
         * Добавить к сушествуюшему обекту или массиву дополнения
         * @param {object|undefined|Array} target
         * @param {object} extend
         * @return {object|Array}
         */
        append: function (target, extend) {
            this.isPlainObject(target) || (target = {});

            if( this.isArray(target) ) {
                target.forEach((_target, index) => {
                    target[index] = this.jqueryExtend(_target, extend);
                });
            }
            else {
                target = this.jqueryExtend(target, extend);
            }

            return target;
        },

        /**
         * Добавить элемент в массив если передается Обект обернуть его в массив
         * @param {object|Array} target
         * @param {object} extend
         * @return {Array}
         */
        push: function (target, extend) {
            typeof target === 'undefined' && (target = []);

            this.isPlainObject(target) && (target = [target]);
            !this.isArray(target) && (target = []);
            target.push(extend);

            return target;
        }
    });
});
