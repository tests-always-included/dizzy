"use strict";

module.exports = (BulkProvider, DizzyProvider, util) => {
    /**
     * Dependency injection container.
     *
     * Simple usage:
     *
     *     dizzy.register("a", "b");  // Registers the key "a" with value "b"
     *     dizzy.register("c", (...) => { return ...}).asFactory();
     *
     * See the README.md for far better documentation.
     */
    class Dizzy {
        /**
         * Initializes a new Map for the key/value pairs.
         */
        constructor() {
            this.registered = new Map();
        }


        /**
         * Call a function after resolving the arguments.
         *
         * @param {Function} callbackFn
         * @param {(Array|null)} [argsArray] What to inject - automatically detected
         * @param {Object} [contextObj=null]
         * @return {*} Value from callback.
         */
        call(callbackFn, argsArray, contextObj) {
            var argsResolved;

            if (!Array.isArray(argsArray)) {
                if (typeof argsArray === "object" && argsArray) {
                    contextObj = argsArray;
                }

                argsArray = util.determineArgs(callbackFn);
            }

            argsResolved = argsArray.map((requirement) => {
                return this.resolve(requirement);
            });

            return callbackFn.apply(contextObj || null, argsResolved);
        }


        /**
         * Call a function asynchronously, waiting for any Promises to resolve.
         * Promises may be passed in through the `argsArray` or they may
         * be the values registered in the container.
         *
         * @param {Function} callbackFn
         * @param {(Array|null)} [argsArray] What to inject - automatically detected
         * @param {Object} [contextObj=null]
         * @return {Promise.<*>} Value from callback.
         */
        callAsync(callbackFn, argsArray, contextObj) {
            var args;

            if (!Array.isArray(argsArray)) {
                if (typeof argsArray === "object" && argsArray) {
                    contextObj = argsArray;
                }

                argsArray = util.determineArgs(callbackFn);
            }

            args = argsArray.map((requirement) => {
                return this.resolveAsync(requirement);
            });

            return Promise.all(args).then((argsResolved) => {
                return callbackFn.apply(contextObj || null, argsResolved);
            });
        }


        /**
         * Create an instance of a class using dependency injection
         * for each of the constructor's arguments.
         *
         * @param {Function} ClassFn
         * @param {Array} [argsArray] What to inject - automatically detected
         * @return {Object}
         */
        instance(ClassFn, argsArray) {
            var argsResolved;

            if (!Array.isArray(argsArray)) {
                argsArray = util.determineArgs(ClassFn);
            }

            argsResolved = argsArray.map((requirement) => {
                return this.resolve(requirement);
            });

            return util.newInstance(ClassFn, argsResolved);
        }


        /**
         * Async version of instance creation.  Returns a Promise that will
         * be fulfilled with the instance of the new object.
         *
         * @param {Function} ClassFn
         * @param {Array} [argsArray] What to inject - automatically detected
         * @return {Promise.<Object>}
         */
        instanceAsync(ClassFn, argsArray) {
            var args;

            if (!Array.isArray(argsArray)) {
                argsArray = util.determineArgs(ClassFn);
            }

            args = argsArray.map((requirement) => {
                return this.resolveAsync(requirement);
            });

            return Promise.all(args).then((argsResolved) => {
                return util.newInstance(ClassFn, argsResolved);
            });
        }


        /**
         * Returns a boolean indicating if a given key has been registered or not.
         *
         * @param {*} key
         * @return {boolean}
         */
        isRegistered(key) {
            return this.registered.has(key);
        }


        /**
         * Provide an array listing every registered key.
         *
         * @return {Array}
         */
        list() {
            return Array.from(this.registered.keys());
        }


        /**
         * One half of the dependency injection system.  This is what everything
         * uses to register things to be injected.
         *
         * @param {*} key
         * @param {*} value
         * @return {DizzyProvider}
         */
        register(key, value) {
            var provider;

            provider = new DizzyProvider(key, value, this);
            this.registered.set(key, provider);

            return provider;
        }


        /**
         * Shorthand for registering several similar items.
         *
         * @param {(Object|Map)} mapping
         * @return {BulkProvider}
         */
        registerBulk(mapping) {
            var bulkProvider;

            bulkProvider = new BulkProvider();

            if (mapping.forEach) {
                mapping.forEach((value, key) => {
                    var provider;

                    provider = this.register(key, value);
                    bulkProvider.addProvider(provider);
                });
            } else {
                Object.keys(mapping).forEach((key) => {
                    var provider;

                    provider = this.register(key, mapping[key]);
                    bulkProvider.addProvider(provider);
                });
            }

            return bulkProvider;
        }


        /**
         * The other half of the resolver.  Given a key, go figure out and
         * make the value.  If the resulting value is a Promise, this
         * simply returns that Promise.
         *
         * @param {*} key
         * @return {*}
         * @throws {Error} when supplied an invalid key
         */
        resolve(key) {
            var provider;

            provider = this.registered.get(key);

            if (!provider) {
                throw new Error(`Invalid key: ${key.toString()}`);
            }

            return provider.provide();
        }


        /**
         * An async version of resolve().  This always returns a Promise
         * that resolves with the final value.
         *
         * @param {*} key
         * @return {Promise.<*>}
         */
        resolveAsync(key) {
            var provider;

            provider = this.registered.get(key);

            if (!provider) {
                return Promise.reject(new Error(`Invalid key: ${key.toString()}`));
            }

            // By wrapping in a Promise, this always traps errors that
            // could be generated by providing the value.
            return new Promise((resolve) => {
                resolve(provider.provide());
            });
        }
    }

    return Dizzy;
};
