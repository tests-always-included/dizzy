'use strict';

module.exports = (path, requireFn) => {
    /**
     * Responsible for providing a value to Dizzy.  When used for dependency
     * injection, this will fetch one dependency, possibly alter it and then
     * return it to Dizzy.
     */
    class DizzyProvider {
        /**
         * Creates the instance.
         *
         * @param {*} key
         * @param {*} value
         * @param {Dizzy} container
         */
        constructor(key, value, container) {
            this.key = key;
            this.value = value;
            this.container = container;
            this.cacheEnabled = false;

            // This sets up the default functions and sets the default context.
            // fromFn(), fromFnAsync(), asFn(), asFnAsync(), provide(),
            // provideAsync()
            this.fromValue()
                .asValue()
                .cached(false)
                .withContext(null);
        }

        /**
         * Treat the resolved value as a factory.  Inject dependencies
         * and return the result of the function.
         *
         * @param {*} args... Overrides auto-detection of injectables
         * @return {this}
         */
        asFactory() {
            var args, functionGuard;

            /**
             * Ensure the value is a function before we use it as a factory.
             *
             * Uses an arrow function to preserve `this`.
             *
             * @param {*} fn
             * @throws {Error} if fn is not a function
             */
            functionGuard = fn => {
                if (typeof fn !== 'function') {
                    throw new Error(
                        `Registered as factory but did not resolve to a function: ${this.key.toString()}`
                    );
                }
            };

            if (arguments.length) {
                args = [].slice.call(arguments);
            } else {
                args = null;
            }

            /**
             * Returns the result of calling a function.
             *
             * @param {Function} val
             * @return {*}
             */
            this.asFn = val => {
                functionGuard(val);

                return this.container.call(val, args, this.context);
            };

            /**
             * Returns a promise that resolves in the result of calling
             * a function.  The function may return a promise.  The function
             * is called after all of its injected arguments, which could
             * be promises, are all resolved.
             *
             * @param {Promise.<Function>} valPromise
             * @return {Promise.<*>}
             */
            this.asFnAsync = valPromise => {
                return valPromise.then(val => {
                    functionGuard(val);

                    return this.container.callAsync(val, args, this.context);
                });
            };

            this.resetCache();

            return this;
        }

        /**
         * Treat the resolved value as a class function.  Inject parameters
         * into the constructor and return the new instance.
         *
         * @param {*} args... Overrides auto-detection of injectables
         * @return {this}
         */
        asInstance() {
            var args, classGuard;

            /**
             * Ensure the value is a class (function) before we use it to
             * create an instance.
             *
             * Uses an arrow function to preserve `this`.
             *
             * @param {Function} classObject
             * @throws {Error} if fn is not a class
             */
            classGuard = classObject => {
                if (typeof classObject !== 'function') {
                    throw new Error(
                        `Registered as instance but did not resolve to a class: ${this.key.toString()}`
                    );
                }
            };

            if (arguments.length) {
                args = [].slice.call(arguments);
            } else {
                args = null;
            }

            /**
             * Returns an instance of a class that's provided.
             *
             * @param {Function} val The class (which is a Function)
             * @return {Object} instance of val
             */
            this.asFn = val => {
                classGuard(val);

                return this.container.instance(val, args);
            };

            /**
             * Async version of class creation.  Waits for the promise to
             * be resolved in a class, then instantiates the class.  The
             * class's injected parameters may also be promises, and the
             * class instantiation is deferred until those are resolved
             * as well.
             *
             * @param {Promise.<Function>} valPromise The class
             * @return {Promise.<Object>} Instance of the class
             */
            this.asFnAsync = valPromise => {
                return valPromise.then(val => {
                    classGuard(val);

                    return this.container.instanceAsync(val, args);
                });
            };

            this.resetCache();

            return this;
        }

        /**
         * Returns the raw value as provided from the "from*" function.
         * This is the default.
         *
         * @return {this}
         */
        asValue() {
            /**
             * Simply return the value.
             *
             * @param {*} val
             * @return {*} val
             */
            this.asFn = val => {
                return val;
            };

            /**
             * Return the promise that's passed in.
             *
             * @param {Promise.<*>} valPromise
             * @return {Promise.<*>} valPromise
             */
            this.asFnAsync = valPromise => {
                return valPromise;
            };

            this.resetCache();

            return this;
        }

        /**
         * Enable or disable caching of the value before providing it to
         * Dizzy.  Resets the cache whenever this is called.
         *
         * There are separate caches for the sync and async versions.
         *
         * @param {boolean} [newSetting=true]
         * @return {this}
         */
        cached(newSetting) {
            var cachedValue, isCached, isResolvingAsync;

            if (typeof newSetting === 'undefined') {
                newSetting = true;
            }

            this.cacheEnabled = !!newSetting;

            if (newSetting) {
                /**
                 * Look up a value and return it.
                 *
                 * This is the cached version.
                 *
                 * @return {*}
                 * @throws {Error} if called sync during another async request
                 */
                this.provide = () => {
                    if (isCached) {
                        return cachedValue;
                    }

                    if (isResolvingAsync) {
                        throw new Error(
                            `Can not provide synchronously while being provided asynchronously: ${
                                this.key
                            }`
                        );
                    }

                    cachedValue = this.resolve();
                    isCached = true;

                    return cachedValue;
                };

                /**
                 * Look up a value and return it.
                 *
                 * This is the cached version.
                 *
                 * The returned promise is not cached and a new Promise will
                 * always be made.  The value itself will be cached.
                 *
                 * @return {Promise.<*>}
                 */
                this.provideAsync = () => {
                    if (isCached) {
                        return Promise.resolve(cachedValue);
                    }

                    // Indicate the sync version shouldn't be
                    // used right now.
                    isResolvingAsync = true;

                    return Promise.resolve(this.resolveAsync()).then(val => {
                        isCached = true;
                        cachedValue = val;
                        isResolvingAsync = false;

                        return val;
                    });
                };
            } else {
                /**
                 * Look up a value and return it.
                 *
                 * Non-cached version simply calls this.resolve().
                 * Do not use an arrow function.
                 *
                 * @return {*}
                 */
                this.provide = function() {
                    // Do not simply copy this.resolve because plugins may
                    // want to extend how this.resolve() works.
                    return this.resolve();
                };

                /**
                 * Look up a value and return it.
                 *
                 * Non-cached version simply calls this.resolveAsync().
                 * Do not use an arrow function.
                 *
                 * @return {*}
                 */
                this.provideAsync = function() {
                    // Do not simply copy this.resolve because plugins may
                    // want to extend how this.resolveAsync() works.
                    return this.resolveAsync();
                };
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
            /**
             * The provided value is looked up again in the container.
             *
             * @return {*}
             */
            this.fromFn = () => {
                return this.container.resolve(this.value);
            };

            /**
             * Async version of looking up things in the container.
             *
             * @return {Promise.<*>}
             */
            this.fromFnAsync = () => {
                return this.container.resolveAsync(this.value);
            };

            this.resetCache();

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

            /**
             * Use `require` to get the value.
             *
             * @return {*}
             * @throws {Error} if error loading module
             */
            function fromFn() {
                try {
                    return requireFn(realRequire);
                } catch (e) {
                    throw new Error(
                        `Error requiring ${realRequire}: ${e.toString()}`
                    );
                }
            }

            if (!baseDir) {
                baseDir = process.cwd();
            }

            if (this.value.charAt(0) === '.') {
                realRequire = path.resolve(baseDir, this.value);
            } else {
                realRequire = this.value;
            }

            this.fromFn = fromFn;

            /**
             * Async version waits for the promise to resolve and then
             * calls require synchronously using the identical technique
             * as fromFn.
             *
             * @return {Promise.<*>}
             */
            this.fromFnAsync = () => {
                // Need to wrap in a new promise because `this.fromFn()`
                // may throw.
                return new Promise(resolve => {
                    // Errors thrown automatically reject this promise.
                    resolve(this.fromFn());
                });
            };

            this.resetCache();

            return this;
        }

        /**
         * The value stored should be returned as-is.
         * This is the default.
         *
         * @return {this}
         */
        fromValue() {
            /**
             * Simply returns the value that's stored.
             *
             * @return {*}
             */
            this.fromFn = () => {
                return this.value;
            };

            /**
             * Async version that returns the value that's stored.
             * For consistency, this returns a promise that's immediately
             * resolved with the stored value.  The stored value may be a
             * promise and the normal promise resolution will happen.
             *
             * @return {Promise.<*>}
             */
            this.fromFnAsync = () => {
                return Promise.resolve(this.value);
            };

            this.resetCache();

            return this;
        }

        /**
         * If caching is enabled, this function will reset the caching.
         * Call this function when any of the parameters change and any
         * memoized instances are now potentially out of date.
         *
         * @internal
         */
        resetCache() {
            if (this.cacheEnabled) {
                this.cached();
            }
        }

        /**
         * Returns the value using the from* function and as* function.
         * This is either wrapped and assigned (when cached) or simply
         * copied (when not cached) to the .provide property on this.
         *
         * @internal
         * @return {*}
         */
        resolve() {
            return this.asFn(this.fromFn());
        }

        /**
         * Async version of resolve().  Always returns a promise.
         * This is either wrapped and assigned (when cached) or simply
         * copied (when not cached) to the .provide property on this.
         *
         * For this to work, the fromFnAsync() must always return a
         * promise.  asFnAsync() always expects and returns a promise.
         *
         * @internal
         * @return {Promise.<*>}
         */
        resolveAsync() {
            return this.asFnAsync(this.fromFnAsync());
        }

        /**
         * If the value is a factory, you can set the context for the
         * factory here.
         *
         * dizzy.register("x", factory).asFactory().withContext({...})
         *
         * @param {(Object|null)} [context=null]
         * @return {this}
         */
        withContext(context) {
            if (!context) {
                context = null;
            }

            this.context = context;
            this.resetCache();

            return this;
        }
    }

    return DizzyProvider;
};
