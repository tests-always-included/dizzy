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

    str = Function.prototype.toString.call(callable).trim();

    // Normal function and classes
    match = str.match(/^function[^(]*\(([\s\w,]*?)\)/);

    if (!match && str.match(/^class[\s]/)) {
        // ES6 classes
        match = str.match(/[\s}{]constructor\s*\(([\s\w,]*?)\)/);
    } else {
        if (!match) {
            // ES6 arrow functions with parenthesis
            match = str.match(/^\(([\s\w,]*?)\)[\s]*=>/);
        }

        if (!match) {
            // ES6 arrow functions without parenthesis
            match = str.match(/^([^=\s]*)[\s]*=>/);

            if (match && match[1] === "_") {
                match[1] = "";
            }
        }

        if (!match) {
            // ES6 class methods
            match = str.match(/^[\S]*\(([\s\w,]*?)\)[\s]*{/);
        }
    }

    if (!match) {
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


/**
 * Creates a new instance of an object.  This is an ES5 variant of the ES6
 * spread operator when used in something like this
 *
 *   new ClassName(...args)
 *
 * @param {Function} ClassFn
 * @param {Array} args
 * @return {Object}
 */
function newInstance(ClassFn, args) {
    return new (Function.prototype.bind.apply(ClassFn, [
        null
    ].concat(args)))();
}


module.exports = {
    determineArgs,
    newInstance
};
