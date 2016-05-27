"use strict";

module.exports = (Provider, util) => {
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
                if (argsArray !== undefined && argsArray !== null) {
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
         * Create an instance of a class using dependency injection
         * for each of the constructor's arguments.
         *
         * @param {Function} ClassFn
         * @param {Array} [argsArray] What to inject - automatically detected
         * @return this
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
         * @return {Provider}
         */
        register(key, value) {
            var provider;

            provider = new Provider(key, value, this);
            this.registered.set(key, provider);

            return provider;
        }


        /**
         * The other half of the resolver.  Given a key, go figure out and
         * make the value.
         *
         * @param {*} key
         * @return {*}
         */
        resolve(key) {
            var provider;

            provider = this.registered.get(key);

            if (! provider) {
                throw new Error("Invalid key: " + key.toString());
            }

            return provider.provide();
        }
    }

    return Dizzy;
};
