"use strict";

class es6Class {
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

function mockFunctionString(expectedString) {
    var result;

    result = new Function();
    result.toString = () => {
        return expectedString;
    };

    return result;
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
                function oldClass(left, right) {
                    return 3 * right == left;
                }

                expect(util.determineArgs(oldClass)).toEqual([
                    "left",
                    "right"
                ]);
            });
            it("works with new classes", () => {
                expect(util.determineArgs(es6Class)).toEqual([
                    "right",
                    "correct"
                ]);
            });
            it("works with new class methods that have a single argument", () => {
                var x;

                x = new es6Class();
                expect(util.determineArgs(x.reconstructor)).toEqual([
                    "incorrect"
                ]);
            });
            it("works with new class methods that have multiple arguments", () => {
                var x;

                x = new es6Class();
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
