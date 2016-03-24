"use strict";

/**
 * Finds the arguments for something that is callable.
 *
 * @param {Function} callable
 * @return {Array} arguments
 */
function determineArgs(callable) {
    var match, str;

    if (typeof callable !== "function") {
        return [];
    }

    str = callable.toString().trim();

    // Normal function and classes
    match = str.match(/^function.*?\(([\s\S]*?)\)/);

    if (! match && str.match(/^class[\s]/)) {
        // ES6 classes
        match = str.match(/[\s}{]constructor\s*\(([\s\S]*?)\)/);
    } else {
        if (! match) {
            // ES6 class methods
            match = str.match(/\(([\s\S]*?)\)[\s]*{/);
        }

        if (! match) {
            // ES6 arrow functions with parenthesis
            match = str.match(/\(([\s\S]*?)\)[\s]*=>/);
        }

        if (! match) {
            // ES6 arrow functions without parenthesis
            match = str.match(/([^=\s]*)[\s]*=>/);

            if (match && match[1] == "_") {
                match[1] = "";
            }
        }
    }

    if (! match) {
        return [];
    }

    match = match[1].split(",")
        .filter((arg) => {
            return arg;
        })
        .map((arg) => {
            return arg.trim();
        });

    return match;
}


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
     * @param {Array} argsArray Optional
     * @param {Function} callbackFn
     * @param {Object} contextObj Optional
     * @return {*} Value from callback.
     */
    call(argsArray, callbackFn, contextObj) {
        var argsResolved;

        if (typeof argsArray == "function") {
            contextObj = callbackFn;
            callbackFn = argsArray;
            argsArray = determineArgs(callbackFn);
        }

        argsResolved = argsArray.map((requirement) => {
            return this.resolve(requirement);
        });

        return callbackFn.apply(contextObj || null, argsResolved);
    }


    /**
     * Register a factory that creates a new instance of a class
     * with every time it gets resolved.
     *
     * @param {*} key
     * @param {Array} argsArray Optional
     * @param {Function} classFn
     * @return this
     */
    instance(key, argsArray, classFn) {
        if (typeof argsArray === "function") {
            classFn = argsArray;
            argsArray = determineArgs(classFn);
        }

        return this.register(key, argsArray, function () {
            var args;

            args = [].slice.call(arguments);
            return new classFn(...args);
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
     * Provide any value for a given key.
     *
     * @param {*} key
     * @param {*} value
     * @return this
     */
    provide(key, value) {
        return this.register(key, [], () => {
            return value;
        });
    }


    /**
     * One half of the dependency injection system.  This is what everything
     * uses to register keys and the factory functions that generate the
     * resulting values.
     *
     * @param {*} key
     * @param {Array} argsArray Optional
     * @param {Function} factoryFn
     * @param {Object} contextObj Optional
     * @return this
     */
    register(key, argsArray, factoryFn, contextObj) {
        if (typeof argsArray === "function") {
            contextObj = factoryFn;
            factoryFn = argsArray;
            argsArray = determineArgs(factoryFn);
        }

        this.registered.set(key, {
            argsArray: argsArray,
            contextObj: contextObj || null,
            factoryFn: factoryFn
        });

        return this;
    }


    /**
     * The other half of the resolver.  Given a key, go figure out and
     * make the value.
     *
     * @param {*} key
     * @return {*}
     */
    resolve(key) {
        var args, meta;

        meta = this.registered.get(key);

        if (! meta) {
            throw new Error("Invalid key: " + key.toString());
        }

        args = meta.argsArray.map((key) => {
            return this.resolve(key);
        });

        return meta.factoryFn.apply(meta.contextObj, args);
    }


    /**
     * Add a singleton to the dependency injection system.  This will
     * generate one instance of the object *ever*.
     *
     * @param {*} key
     * @param {Array} argsArray Optional
     * @param {Function} classFn
     * @return {Object} instance of classFn
     */
    singleton(key, argsArray, classFn) {
        var cachedInstance;

        if (typeof argsArray === "function") {
            classFn = argsArray;
            argsArray = determineArgs(classFn);
        }

        return this.register(key, argsArray, function () {
            var args;

            args = [].slice.call(arguments);

            if (!cachedInstance) {
                cachedInstance = new classFn(...args);
            }

            return cachedInstance;
        });
    }
}

module.exports = {
    /**
     * Create a new dependency injection container.
     *
     * @return {Dizzy}
     */
    container: function () {
        return new Dizzy();
    },

    /**
     * Exposes the determineArgs() function for easier testing.
     *
     * @param {Function}
     * @return {Array}
     */
    determineArgs: determineArgs
};
