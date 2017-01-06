"use strict";

/**
 * Sample ES6 class, with the constructor not listed first and other
 * tricky functions.
 */
class Es6Class {
    /**
     * @param {*} wrong
     * @return {*}
     */
    deconstructor(wrong) {
        return wrong;
    }


    /**
     * @param {*} right
     * @param {*} correct
     * @return {*}
     */
    constructor(right, correct) {
        return right + correct;
    }


    /**
     * @param {*} incorrect
     * @return {*}
     */
    reconstructor(incorrect) {
        return incorrect;
    }


    /**
     * @param {*} wrong
     * @param {*} bad
     * @return {*}
     */
    subconstructor(wrong, bad) {
        return wrong + bad;
    }
}


/**
 * Take a string and make a function return that string when .toString()
 * is called on the function.
 *
 * @param {string} expectedString
 * @return {Function} A mocked up function
 */
function mockFunctionString(expectedString) {
    var fakeFunction, originalToString;

    fakeFunction = () => {};
    originalToString = Function.prototype.toString;
    spyOn(Function.prototype, "toString").andCallFake(function () {
        var args;

        /* eslint no-invalid-this:off */
        if (this === fakeFunction) {
            return expectedString;
        }

        args = [].prototype.slice.call(arguments);

        return originalToString.apply(this, args);
    });

    return fakeFunction;
}

describe("util", () => {
    var util;

    beforeEach(() => {
        util = require("../lib/util");
    });
    describe("determineArgs()", () => {
        it("is a function", () => {
            expect(typeof util.determineArgs).toBe("function");
        });
        it("works when passed a non-callable thing", () => {
            expect(util.determineArgs(123)).toEqual([]);
        });
        describe("with actual objects", () => {
            it("parses a normal function with no arguments", () => {
                expect(util.determineArgs(function f() {
                    return true;
                })).toEqual([]);
            });
            it("parses a normal function with three arguments", () => {
                expect(util.determineArgs(function f(dk, lmn, moose) {
                    return dk + lmn + moose;
                })).toEqual([
                    "dk",
                    "lmn",
                    "moose"
                ]);
            });
            it("parses an arrow function with one argument", () => {
                expect(util.determineArgs((test) => {
                    return test;
                })).toEqual([
                    "test"
                ]);
            });
            it("works with old classes", () => {
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

                expect(util.determineArgs(oldClass)).toEqual([
                    "left",
                    "right"
                ]);
            });
            it("works with new classes", () => {
                expect(util.determineArgs(Es6Class)).toEqual([
                    "right",
                    "correct"
                ]);
            });
            it("works with new class methods that have a single argument", () => {
                var x;

                x = new Es6Class();
                expect(util.determineArgs(x.reconstructor)).toEqual([
                    "incorrect"
                ]);
            });
            it("works with new class methods that have multiple arguments", () => {
                var x;

                x = new Es6Class();
                expect(util.determineArgs(x.subconstructor)).toEqual([
                    "wrong",
                    "bad"
                ]);
            });
        });
        describe("with mocked results", () => {
            it("parses a condensed function with one argument", () => {
                expect(util.determineArgs(mockFunctionString("function(a){"))).toEqual([
                    "a"
                ]);
            });
            it("parses a terrible function with two arguments", () => {
                expect(util.determineArgs(mockFunctionString("\n  function \n\t somename \n\t ( \n\t mouse \n\t , \n\t cat \n\t ) \n\t {"))).toEqual([
                    "mouse",
                    "cat"
                ]);
            });
            it("parses condensed arrow functions", () => {
                expect(util.determineArgs(mockFunctionString("(x,y)=>{"))).toEqual([
                    "x",
                    "y"
                ]);
            });
            it("parses condensed arrow functions with no parenthesis", () => {
                expect(util.determineArgs(mockFunctionString("x=>{"))).toEqual([
                    "x"
                ]);
            });
            it("parses condensed arrow functions with no parenthesis and no parameters", () => {
                expect(util.determineArgs(mockFunctionString("_=>{"))).toEqual([]);
            });
            it("handles ES6 classes without a constructor", () => {
                expect(util.determineArgs(mockFunctionString("class Test {\n    methodName(wrong) {\n        return wrong;\n    }\n}"))).toEqual([]);
            });
            it("understands objects with mixed functions", () => {
                expect(util.determineArgs(mockFunctionString("(config) => {\n    return { x: function (thing) { return [config,thing];}};\n}"))).toEqual([
                    "config"
                ]);
            });
            it("parses a rewrapped function that is used for coverage", () => {
                expect(util.determineArgs(mockFunctionString("(a)=>{return{f(b){}}}"))).toEqual([
                    "a"
                ]);
            });
        });
    });
});
