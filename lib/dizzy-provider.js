"use strict";

module.exports = function () {
    class DizzyProvider {
        constructor(value, container) {
            this.value = value;
            this.container = container;
            this.fromValue().asValue().cached(false).withContext(null);
        }


        /**
         * Treat the resolved value as a factory.  Inject dependencies
         * and return the result of the function.
         *
         * @param {*} ...args Overrides auto-detection of injectables
         */
        asFactory() {
            var args;

            if (arguments.length) {
                args = [].slice.call(arguments);
            } else {
                args = null;
            }

            this.asFn = (val) => {
                return this.container.call(val, args, this.context);
            };

            return this;
        }


        /**
         * Treat the resolved value as a class function.  Inject parameters
         * into the constructor and return the new instance.
         *
         * @param {*} ...args Overrides auto-detection of injectables
         */
        asInstance() {
            var args;

            if (arguments.length) {
                args = [].slice.call(arguments);
            } else {
                args = null;
            }

            this.asFn = (val) => {
                return this.container.instance(val, args);
            };

            return this;
        }


        /**
         * Returns the raw value as provided from the "from*" function.
         * This is the default.
         */
        asValue() {
            this.asFn = (val) => {
                return val;
            };

            return this;
        }


        /**
         * Enable or disable caching of the value before providing it to
         * Dizzy.
         *
         * @param {boolean} [newSetting=true]
         */
        cached(newSetting) {
            var cachedValue;

            if (newSetting === undefined) {
                newSetting = true;
            }

            if (newSetting) {
                this.provide = () => {
                    if (cachedValue === undefined) {
                        cachedValue = this.resolve();
                    }

                    return cachedValue;
                };
            } else {
                this.provide = this.resolve;
            }

            return this;
        }


        /**
         * The stored value is a key that should be retrieved from the
         * container.
         */
        fromContainer() {
            this.fromFn = () => {
                return this.container.resolve(this.value);
            };

            return this;
        }


        /**
         * The stored value is a name of a module that should be loaded
         * through `require()`
         */
        fromModule() {
            this.fromFn = () => {
                return require(this.value);
            };

            return this;
        }


        /**
         * The value stored should be returned as-is.
         * This is the default.
         */
        fromValue() {
            this.fromFn = () => {
                return this.value;
            };

            return this;
        }


        /**
         * Returns the value using the from* function and as* function.
         *
         * @internal
         * @return {*}
         */
        resolve() {
            return this.asFn(this.fromFn());
        }


        /**
         * If the value is a factory, you can set the context for the
         * factory here.
         *
         * dizzy.register("x", factory).asFactory().withContext({...})
         */
        withContext(context) {
            if (context === undefined) {
                context = null;
            }

            this.context = context;
        }
    }

    return DizzyProvider;
};
