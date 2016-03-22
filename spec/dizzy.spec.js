"use strict";

var dizzy = require("..");

class es6Class {
    deconstructor(wrong) {
        return wrong;
    }
    constructor(right) {
        return right;
    }
    reconstructor(incorrect) {
        return incorrect;
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

describe("Dizzy's exports", () => {
    it("is an object", () => {
        expect(typeof dizzy).toBe("object");
    });
    it("has .container()", () => {
        expect(typeof dizzy.container).toBe("function");
    });
    describe("determineArgs", () => {
        it("is a function", () => {
            expect(typeof dizzy.determineArgs).toBe("function");
        });
        describe("with actual objects", () => {
            it("parses a normal function with no arguments", () => {
                expect(dizzy.determineArgs(function f() {
                    return true;
                })).toEqual([]);
            });
            it("parses a normal function with three arguments", () => {
                expect(dizzy.determineArgs(function f(dk, lmn, moose) {
                    return dk + lmn + moose;
                })).toEqual([
                    "dk",
                    "lmn",
                    "moose"
                ]);
            });
            it("parses an arrow function with one argument", () => {
                expect(dizzy.determineArgs((test) => {
                    return test;
                })).toEqual([
                    "test"
                ]);
            });
            it("works with old classes", () => {
                function oldClass(left, right) {
                    return 3 * right == left;
                }

                expect(dizzy.determineArgs(oldClass)).toEqual([
                    "left",
                    "right"
                ]);
            });
            it("works with new classes", () => {
                expect(dizzy.determineArgs(es6Class)).toEqual([
                    "right"
                ]);
            });
            it("works with new class methods", () => {
                var x;

                x = new es6Class();
                expect(dizzy.determineArgs(x.reconstructor)).toEqual([
                    "incorrect"
                ]);
            });
        });
        describe("with mocked results", () => {
            it("parses a condensed function with one argument", () => {
                expect(dizzy.determineArgs(mockFunctionString("function(a){"))).toEqual([
                    "a"
                ]);
            });
            it("parses a terrible function with two arguments", () => {
                expect(dizzy.determineArgs(mockFunctionString("\n  function \n\t somename \n\t ( \n\t mouse \n\t , \n\t cat \n\t ) \n\t {"))).toEqual([
                    "mouse",
                    "cat"
                ]);
            });
            it("parses condensed arrow functions", () => {
                expect(dizzy.determineArgs(mockFunctionString("(x,y)=>{"))).toEqual([
                    "x",
                    "y"
                ]);
            });
            it("parses condensed arrow functions with no parenthesis", () => {
                expect(dizzy.determineArgs(mockFunctionString("x=>{"))).toEqual([
                    "x"
                ]);
            });
            it("parses condensed arrow functions with no parenthesis and no parameters", () => {
                expect(dizzy.determineArgs(mockFunctionString("_=>{"))).toEqual([]);
            });
        });
    });
});
describe("Dizzy", () => {
    var instance;

    beforeEach(() => {
        instance = dizzy.container();
    });
    it("instantiates", () => {
        expect(typeof instance).toBe("object");
    });
    describe("call()", () => {
        beforeEach(() => {
            instance.provide("one", 1);
            instance.provide("two", 2);
        });
        it("resolves arguments", () => {
            var args;

            args = null;
            instance.call((one, two) => {
                args = [
                    one,
                    two
                ];
            });
            expect(args).toEqual([
                1,
                2
            ]);
        });
        it("works with argsArray", () => {
            var args;

            args = null;
            instance.call([
                "one"
            ], (one, two) => {
                args = [
                    one,
                    two
                ];
            });
            expect(args).toEqual([
                1,
                undefined
            ]);
        });
        it("returns the function's result", () => {
            expect(instance.call(() => {
                return 15;
            })).toBe(15);
        });
        it("uses the specified context", () => {
            var context;

            context = {};
            instance.call(function () {
                this.worked = true;
            }, context);
            expect(context).toEqual({
                worked: true
            });
        });
    });
    describe("instance()", () => {
        beforeEach(() => {
            instance.provide("color", "red");
        });
        it("makes different instances", () => {
            var a, b;

            instance.instance("fakeClass", function () {
                this.fakeClass = true;
            });
            a = instance.resolve("fakeClass");
            b = instance.resolve("fakeClass");
            expect(a).not.toBe(b);
        });
        it("provides arguments automatically", () => {
            var colorSaved, result;

            colorSaved = null;
            instance.instance("fakeClass", function (color) {
                colorSaved = color;
                this.color = color;
            });
            result = instance.resolve("fakeClass");
            expect(colorSaved).toBe("red");
            expect(result.color).toBe("red");
        });
        it("provides arguments from a list", () => {
            var colorSaved;

            colorSaved = null;
            instance.instance("fakeClass", [
                "color"
            ], function (something) {
                colorSaved = something;
            });
            instance.resolve("fakeClass");
            expect(colorSaved).toBe("red");
        });
    });
    describe("isRegistered()", () => {
        beforeEach(() => {
            instance.provide("something", "pencil");
        });
        it("finds something", () => {
            expect(instance.isRegistered("something")).toBe(true);
        });
        it("notices missing things", () => {
            expect(instance.isRegistered("things")).toBe(false);
        });
    });
    describe("list()", () => {
        it("can provide an empty list", () => {
            expect(instance.list()).toEqual([]);
        });
        it("can have items in the list", () => {
            var list;

            instance.provide("x", "x");
            instance.provide(7, 7);
            list = instance.list();
            expect(list).toContain("x");
            expect(list).toContain(7);
            expect(list.length).toBe(2);
        });
    });
    describe("provide()", () => {
        it("provides numbers", () => {
            instance.provide("test", 123);
            expect(instance.resolve("test")).toBe(123);
        });
        it("provides objects", () => {
            instance.provide("test", {
                duck: true
            });
            expect(instance.resolve("test")).toEqual({
                duck: true
            });
        });
    });
    // register() is tested through the helper methods.
    // Tests should be added here if there are any code paths that
    // do not get tested through other means.
    describe("resolve()", () => {
        // Only testing failure paths here because normal usage
        // is tested through other methods already.
        it("throws when a key is not defined", () => {
            expect(() => {
                instance.resolve("not defined");
            }).toThrow();
        });
    });
    describe("singleton()", () => {
        beforeEach(() => {
            instance.provide("color", "blue");
        });
        it("makes only one instance", () => {
            var a, b;

            instance.singleton("fakeClass", function () {
                this.fakeClass = true;
            });
            a = instance.resolve("fakeClass");
            b = instance.resolve("fakeClass");
            expect(a).toBe(b);
        });
        it("provides arguments automatically", () => {
            var colorSaved, result;

            colorSaved = null;
            instance.singleton("fakeClass", function (color) {
                colorSaved = color;
                this.color = color;
            });
            result = instance.resolve("fakeClass");
            expect(colorSaved).toBe("blue");
            expect(result.color).toBe("blue");
        });
        it("provides arguments from a list", () => {
            var colorSaved;

            colorSaved = null;
            instance.singleton("fakeClass", [
                "color"
            ], function (something) {
                colorSaved = something;
            });
            instance.resolve("fakeClass");
            expect(colorSaved).toBe("blue");
        });
    });
});
