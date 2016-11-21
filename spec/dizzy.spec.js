"use strict";

describe("Dizzy", () => {
    var dizzy;

    beforeEach(() => {
        var Dizzy;

        Dizzy = require("..");
        dizzy = new Dizzy();
    });
    it("instantiates", () => {
        expect(typeof dizzy).toBe("object");
    });
    describe("call()", () => {
        beforeEach(() => {
            dizzy.register("one", 1);
            dizzy.register("two", 2);
        });
        it("resolves arguments", () => {
            var args;

            args = null;
            dizzy.call((one, two) => {
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
            dizzy.call((one, two) => {
                args = [
                    one,
                    two
                ];
            }, [
                "two"
            ]);
            expect(args).toEqual([
                2,
                undefined
            ]);
        });
        it("returns the function's result", () => {
            expect(dizzy.call(() => {
                return 15;
            })).toBe(15);
        });
        it("uses the specified context", () => {
            var context;

            context = {};
            dizzy.call(function () {
                this.worked = true;
            }, context);
            expect(context).toEqual({
                worked: true
            });
        });
    });
    describe("instance()", () => {
        beforeEach(() => {
            dizzy.register("one", 1);
            dizzy.register("two", 2);
        });
        it("resolves arguments", () => {
            var args;

            args = null;
            class TestClass {
                constructor(one, two) {
                    args = [
                        one,
                        two
                    ];
                }
            }
            dizzy.instance(TestClass);
            expect(args).toEqual([
                1,
                2
            ]);
        });
        it("works with argsArray", () => {
            var args;

            args = null;
            class TestClass {
                constructor(one, two) {
                    args = [
                        one,
                        two
                    ];
                }
            }
            dizzy.instance(TestClass, [
                "two"
            ]);
            expect(args).toEqual([
                2,
                undefined
            ]);
        });
        it("returns the instantiated object", () => {
            class TestClass {}
            expect(dizzy.instance(TestClass)).toEqual(jasmine.any(TestClass));
        });
    });
    describe("isRegistered()", () => {
        beforeEach(() => {
            dizzy.register("something", "pencil");
        });
        it("finds something", () => {
            expect(dizzy.isRegistered("something")).toBe(true);
        });
        it("notices missing things", () => {
            expect(dizzy.isRegistered("things")).toBe(false);
        });
    });
    describe("list()", () => {
        it("can provide an empty list", () => {
            expect(dizzy.list()).toEqual([]);
        });
        it("can have items in the list", () => {
            var list;

            dizzy.register("x", "x");
            dizzy.register(7, 7);
            list = dizzy.list();
            expect(list).toContain("x");
            expect(list).toContain(7);
            expect(list.length).toBe(2);
        });
    });
    describe("register()", () => {
        [
            "asFactory",
            "asInstance",
            "asValue",
            "cached",
            "fromContainer",
            "fromModule",
            "fromValue",
            "withContext"
        ].forEach((methodName) => {
            it("returns something with method: " + methodName, () => {
                var provider;

                provider = dizzy.register("x", "y");
                expect(provider[methodName]).toEqual(jasmine.any(Function));
            });
        });
    });
    describe("registerBulk()", () => {
        it("returns a BulkProvider for an empty object", () => {
            var provider;

            provider = dizzy.registerBulk({});
            expect(provider.addProvider).toBeDefined();
            expect(provider.providerSet.length).toBe(0);
        });
        it("returns a BulkProvider for an object", () => {
            var provider;

            provider = dizzy.registerBulk({
                "test": true,
                "works": "probably",
                "yay": ":-)"
            });
            expect(provider.addProvider).toBeDefined();
            expect(provider.providerSet.length).toBe(3);
        });
        it("returns a BulkProvider for an empty map", () => {
            var provider;

            provider = dizzy.registerBulk(new Map());
            expect(provider.addProvider).toBeDefined();
            expect(provider.providerSet.length).toBe(0);
        });
        it("returns a BulkProvider for a map", () => {
            var map, provider;

            map = new Map();
            map.set("a", "A");
            map.set("1", "one");
            provider = dizzy.registerBulk(map);
            expect(provider.addProvider).toBeDefined();
            expect(provider.providerSet.length).toBe(2);
        });
    });
    describe("resolve()", () => {
        // Only testing failure paths here because normal usage
        // is tested through other methods already.
        it("throws when a key is not defined", () => {
            expect(() => {
                dizzy.resolve("not defined");
            }).toThrow();
        });
    });
});
