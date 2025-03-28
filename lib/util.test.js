'use strict';

const test = require('ava');
const util = require('./util');

/**
 * Sample ES6 class, with the constructor not listed first and other
 * tricky functions.
 */
class Es6Class {
    deconstructor(wrong) {
        return wrong;
    }

    constructor(right, correct) {
        return right + correct;
    }

    reconstructor(incorrect) {
        return incorrect;
    }

    subconstructor(wrong, bad) {
        return wrong + bad;
    }
}

/**
 * Sample ES6 class with a static member, minified
 */
class Es6ClassStatic {
    static name='Es6ClassStatic';constructor(right,correct){return right+correct;}
}

test('determineArgs() is a function', t => {
    t.assert(util.determineArgs instanceof Function);
});

test('determineArgs() works when passed a non-callable thing', t => {
    t.deepEqual(util.determineArgs(123), []);
});

test('determineArgs() parses a normal function with no arguments', t => {
    t.deepEqual(util.determineArgs(function f() {
        return true;
    }), []);
});

test('determineArgs() works with old classes', t => {
    /**
     * Old class
     *
     * @param {*} left
     * @param {*} right
     * @return {*}
     */
    function oldClass(left, right) {
        return 3 * right === left;
    }

    t.deepEqual(util.determineArgs(oldClass), [
        'left',
        'right'
    ]);
});

test('determineArgs() works with new classes', t => {
    t.deepEqual(util.determineArgs(Es6Class), ['right', 'correct']);
});

test('determineArgs() works with new classes with a static property', t => {
    t.deepEqual(util.determineArgs(Es6ClassStatic), ['right', 'correct']);
});

test('determineArgs() works with new class methods that have a single argument', t => {
    const x = new Es6Class();
    t.deepEqual(util.determineArgs(x.reconstructor), ['incorrect']);
});

test('determineArgs() works with new class methods that have multiple arguments', t => {
    const x = new Es6Class();
    t.deepEqual(util.determineArgs(x.subconstructor), ['wrong', 'bad']);
});

function mockToString(expectedString) {
    var toString = Function.prototype.toString;
    // eslint-disable-next-line
    Function.prototype.toString = () => {
        return expectedString;
    };
    const r = util.determineArgs(() => {});
    // eslint-disable-next-line
    Function.prototype.toString = toString;
    return r;
}

test('determineArgs() parses an arrow function with one argument', t => {
    t.deepEqual(mockToString('(test) => test'), ['test']);
});

test('determineArgs() parses a normal function with three arguments', t => {
    t.deepEqual(mockToString('function f(dk, lmn, moose) {\nreturn true;\n}'), ['dk', 'lmn', 'moose']);
});

test('determineArgs() parses a condensed function with one argument', t => {
    t.deepEqual(mockToString('function(a){'), ['a']);
});

test('determineArgs() parses a terrible function with two arguments', t => {
    t.deepEqual(mockToString('\n  function \n\t somename \n\t ( \n\t mouse \n\t , \n\t cat \n\t ) \n\t {'), ['mouse', 'cat']);
});

test('determineArgs() parses condensed arrow functions', t => {
    t.deepEqual(mockToString('(x,y)=>{'), ['x', 'y']);
});

test('determineArgs() parses condensed arrow functions with no parenthesis', t => {
    t.deepEqual(mockToString('x=>{'), ['x']);
});

test('determineArgs() parses condensed arrow functions with underscore', t => {
    t.deepEqual(mockToString('_=>{'), []);
});

test('determineArgs() parses condensed arrow functions with no arguments', t => {
    t.deepEqual(mockToString('()=>{'), []);
});

test('determineArgs() handles ES6 classes without a constructor', t => {
    t.deepEqual(mockToString('class Test {\n    methodName(wrong) {\n        return wrong;\n    }\n}'), []);
});

test('determineArgs() understands objects with mixed functions', t => {
    t.deepEqual(mockToString('(config) => {\n    return { x: function (thing) { return [config,thing];}};\n}'), ['config']);
});

test('determineArgs() parses a rewrapped function that is used for coverage', t => {
    t.deepEqual(mockToString('(a)=>{return{f(b){}}}'), ['a']);
});
