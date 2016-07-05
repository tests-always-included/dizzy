"use strict";

module.exports = function (path, requireFn) {
    /**
     * Responsible for providing a value to Dizzy.  When used for dependency
     * injection, this will fetch one dependency, possibly alter it and then
     * return it to Dizzy.
     */
    class DizzyProvider {
        constructor(key, value, container) {
            this.key = key;
            this.value = value;
            this.container = container;
            this.fromValue().asValue().cached(false).withContext(null);
        }


        /**
         * Treat the resolved value as a factory.  Inject dependencies
         * and return the result of the function.
         *
         * @param {*} ...args Overrides auto-detection of injectables
         * @return {this}
         */
        asFactory() {
            var args;

            if (arguments.length) {
                args = [].slice.call(arguments);
            } else {
                args = null;
            }

            this.asFn = (val) => {
                if (typeof val !== "function") {
                    throw new Error("Registered as factory but did not resolve to a function: " + this.key.toString());
                }

                return this.container.call(val, args, this.context);
            };

            return this;
        }


        /**
         * Treat the resolved value as a class function.  Inject parameters
         * into the constructor and return the new instance.
         *
         * @param {*} ...args Overrides auto-detection of injectables
         * @return {this}
         */
        asInstance() {
            var args;

            if (arguments.length) {
                args = [].slice.call(arguments);
            } else {
                args = null;
            }

            this.asFn = (val) => {
                if (typeof val !== "function") {
                    throw new Error("Registered as instance but did not resolve to a class: " + this.key.toString());
                }

                return this.container.instance(val, args);
            };

            return this;
        }


        /**
         * Returns the raw value as provided from the "from*" function.
         * This is the default.
         *
         * @return {this}
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
         * @return {this}
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
         *
         * @return {this}
         */
        fromContainer() {
            this.fromFn = () => {
                return this.container.resolve(this.value);
            };

            return this;
        }


        /**
         * The stored value is a name of a module that should be loaded
         * through `require()`.  Starts resolving the file from the given
         * base directory.  If none is passes, uses process.cwd().
         *
         * @param {string} [baseDir]
         * @return {this}
         */
        fromModule(baseDir) {
            var realRequire;

            if (baseDir === undefined) {
                baseDir = process.cwd();
            }

            if (this.value.charAt(0) != ".") {
                realRequire = this.value;
            } else {
                realRequire = path.resolve(baseDir, this.value);
            }

            this.fromFn = () => {
                try {
                    return requireFn(realRequire);
                } catch (e) {
                    throw new Error("Error requring " + realRequire + ": " + e.toString());
                }
            };

            return this;
        }


        /**
         * The value stored should be returned as-is.
         * This is the default.
         *
         * @return {this}
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
         *
         * @return {this}
         */
        withContext(context) {
            if (context === undefined) {
                context = null;
            }

            this.context = context;

            return this;
        }
    }

    return DizzyProvider;
};
