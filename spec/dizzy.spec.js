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
            dizzy.register("promise", Promise.resolve("the promise result"));
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
        it("does not wait for promises", () => {
            var args;

            args = null;
            dizzy.call((promise) => {
                args = promise;
            });
            expect(args).toEqual(jasmine.any(Promise));
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

            /* eslint no-undefined:off */
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
                /* eslint no-invalid-this:off */
                this.worked = true;
            }, context);
            expect(context).toEqual({
                worked: true
            });
        });
    });
    describe("callAsync()", () => {
        beforeEach(() => {
            dizzy.register("one", 1);
            dizzy.register("two", Promise.resolve(2));
        });
        it("resolves arguments, getting values from promises", () => {
            var args;

            args = null;

            return dizzy.callAsync((one, two) => {
                args = [
                    one,
                    two
                ];
            }).then(() => {
                expect(args).toEqual([
                    1,
                    2
                ]);
            });
        });
        it("resolves promises recursively", () => {
            dizzy.register("three", (two) => {
                return {
                    two
                };
            }).asFactory().cached();

            return dizzy.callAsync((three) => {
                return three;
            }).then((three) => {
                expect(three.two).toBe(2);
            });
        });
        it("does wait for promises", () => {
            var args, promise;

            promise = new Promise((resolve) => {
                setTimeout(() => {
                    resolve("actual value");
                }, 100);
            });
            dizzy.register("delayed", promise);
            args = null;

            return dizzy.callAsync((delayed) => {
                args = delayed;
            }).then(() => {
                expect(args).toEqual("actual value");
            });
        });
        it("works with argsArray", () => {
            var args;

            args = null;

            return dizzy.callAsync((one, two) => {
                args = [
                    one,
                    two
                ];
            }, [
                "two"
            ]).then(() => {
                expect(args).toEqual([
                    2,
                    undefined
                ]);
            });
        });
        it("returns the function's result", () => {
            return dizzy.callAsync(() => {
                return 15;
            }).then((result) => {
                expect(result).toBe(15);
            });
        });
        it("uses the specified context", () => {
            var context;

            context = {};

            return dizzy.callAsync(function () {
                this.worked = true;
            }, context).then(() => {
                expect(context).toEqual({
                    worked: true
                });
            });
        });
    });
    describe("instance()", () => {
        var args;

        /**
         * Fake class for testing instance creation
         */
        class TestClass {
            /**
             * Sets arguments to the `args` variable.
             *
             * @param {*} one
             * @param {*} two
             */
            constructor(one, two) {
                args = [
                    one,
                    two
                ];
            }
        }

        beforeEach(() => {
            args = null;
            dizzy.register("one", 1);
            dizzy.register("two", 2);
            dizzy.register("promise", Promise.resolve("the promise result"));
        });
        it("resolves arguments", () => {
            var result;

            result = dizzy.instance(TestClass);
            expect(args).toEqual([
                1,
                2
            ]);
            expect(result).toEqual(jasmine.any(TestClass));
        });
        it("does not resolve promises and works with argsArray", () => {
            var result;

            result = dizzy.instance(TestClass, [
                "one",
                "promise"
            ]);
            expect(args).toEqual([
                1,
                jasmine.any(Promise)
            ]);
            expect(result).toEqual(jasmine.any(TestClass));
        });
    });
    describe("instanceAsync()", () => {
        var args;

        /**
         * Fake class for testing instance creation
         */
        class TestClass {
            /**
             * Sets arguments to the `args` variable.
             *
             * @param {*} one
             * @param {*} two
             */
            constructor(one, two) {
                args = [
                    one,
                    two
                ];
            }
        }

        beforeEach(() => {
            args = null;
            dizzy.register("one", 1);
            dizzy.register("two", Promise.resolve(2));
        });
        it("resolves arguments", () => {
            return dizzy.instanceAsync(TestClass).then((result) => {
                expect(args).toEqual([
                    1,
                    2
                ]);
                expect(result).toEqual(jasmine.any(TestClass));
            });
        });
        it("waits for promises to resolve and uses argsArray", () => {
            var promise;

            promise = new Promise((resolve) => {
                setTimeout(() => {
                    resolve("actual value");
                }, 100);
            });
            dizzy.register("delayed", promise);

            return dizzy.instanceAsync(TestClass, [
                "one",
                "delayed"
            ]).then((result) => {
                expect(args).toEqual([
                    1,
                    "actual value"
                ]);
                expect(result).toEqual(jasmine.any(TestClass));
            });
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
            it(`returns something with method: ${methodName}`, () => {
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
                test: true,
                works: "probably",
                yay: ":-)"
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
    describe("resolveAsync()", () => {
        // Only testing failure paths here because normal usage
        // is tested through other methods already.
        it("rejects when a key is not defined", () => {
            return dizzy.resolveAsync("not defined").then(jasmine.fail, (err) => {
                expect(err).toEqual(jasmine.any(Error));
            });
        });
    });
});
