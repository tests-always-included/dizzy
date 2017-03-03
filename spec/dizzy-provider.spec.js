"use strict";

describe("DizzyProvider", () => {
    var containerMock, DizzyProvider, functionResult, functionTest, provider, requireMock;

    beforeEach(() => {
        containerMock = jasmine.createSpyObj("container", [
            "call",
            "callAsync",
            "instance",
            "instanceAsync",
            "resolve",
            "resolveAsync"
        ]);
        functionResult = {
            "function result": true
        };
        functionTest = function () {
            return functionResult;
        };
        requireMock = jasmine.createSpy("requireMock");
        DizzyProvider = require("../lib/dizzy-provider")(require("path"), requireMock);
        provider = new DizzyProvider("testKey", functionTest, containerMock);
    });
    it("instantiates", () => {
        expect(typeof provider).toBe("object");
    });
    describe("asFactory()", () => {
        describe("sync", () => {
            beforeEach(() => {
                containerMock.call.and.returnValue("result from calling");
            });
            it("calls the function as a factory", () => {
                expect(provider.asFactory().provide()).toBe("result from calling");
                expect(containerMock.call).toHaveBeenCalledWith(functionTest, null, null);
            });
            it("passes overridden arguments", () => {
                expect(provider.asFactory("test").provide()).toBe("result from calling");
                expect(containerMock.call).toHaveBeenCalledWith(functionTest, [
                    "test"
                ], null);
            });
            it("throws an error when resolved value is not a function", () => {
                provider = new DizzyProvider("testKey", "a string", containerMock);
                expect(() => {
                    provider.asFactory().provide();
                }).toThrow();
            });
        });
        describe("async", () => {
            beforeEach(() => {
                containerMock.callAsync.and.returnValue(Promise.resolve("result from calling async"));
            });
            it("calls the function as a factory", () => {
                return provider.asFactory().provideAsync().then((result) => {
                    expect(result).toBe("result from calling async");
                    expect(containerMock.callAsync).toHaveBeenCalledWith(functionTest, null, null);
                });
            });
            it("passes overridden arguments", () => {
                return provider.asFactory("test").provideAsync().then((result) => {
                    expect(result).toBe("result from calling async");
                    expect(containerMock.callAsync).toHaveBeenCalledWith(functionTest, [
                        "test"
                    ], null);
                });
            });
            it("rejects the promise when resolved value is not a function", () => {
                provider = new DizzyProvider("testKey", "a string", containerMock);

                return provider.asFactory().provideAsync().then(jasmine.fail, (err) => {
                    expect(err).toEqual(jasmine.any(Error));
                    expect(containerMock.callAsync).not.toHaveBeenCalled();
                });
            });
        });
    });
    describe("asInstance()", () => {
        describe("sync", () => {
            beforeEach(() => {
                containerMock.instance.and.returnValue("result from instance");
            });
            it("creates an instance", () => {
                expect(provider.asInstance().provide()).toBe("result from instance");
                expect(containerMock.instance).toHaveBeenCalledWith(functionTest, null);
            });
            it("uses overridden arguments", () => {
                expect(provider.asInstance("abcd").provide()).toBe("result from instance");
                expect(containerMock.instance).toHaveBeenCalledWith(functionTest, [
                    "abcd"
                ]);
            });
            it("throws an error when the resolved value is not a function", () => {
                provider = new DizzyProvider("testKey", "a string", containerMock);
                expect(() => {
                    provider.asInstance().provide();
                }).toThrow();
            });
        });
        describe("async", () => {
            beforeEach(() => {
                containerMock.instanceAsync.and.returnValue(Promise.resolve("result from instance async"));
            });
            it("creates an instance", () => {
                return provider.asInstance().provideAsync().then((result) => {
                    expect(result).toBe("result from instance async");
                    expect(containerMock.instanceAsync).toHaveBeenCalledWith(functionTest, null);
                });
            });
            it("uses overridden arguments", () => {
                return provider.asInstance("abcd").provideAsync().then((result) => {
                    expect(result).toBe("result from instance async");
                    expect(containerMock.instanceAsync).toHaveBeenCalledWith(functionTest, [
                        "abcd"
                    ]);
                });
            });
            it("rejects when the resolved value is not a function", () => {
                provider = new DizzyProvider("testKey", "a string", containerMock);

                return provider.asInstance().provideAsync().then(jasmine.fail, (err) => {
                    expect(err).toEqual(jasmine.any(Error));
                    expect(containerMock.instanceAsync).not.toHaveBeenCalled();
                });
            });
        });
    });
    describe("asValue()", () => {
        describe("sync", () => {
            it("is the default", () => {
                expect(provider.provide()).toBe(functionTest);
            });
            it("works when used directly", () => {
                provider.asInstance().asValue();
                expect(provider.provide()).toBe(functionTest);
            });
        });
        describe("async", () => {
            it("is the default", () => {
                return provider.provideAsync().then((result) => {
                    expect(result).toBe(functionTest);
                });
            });
            it("works when used directly", () => {
                provider.asInstance().asValue();

                return provider.provideAsync().then((result) => {
                    expect(result).toBe(functionTest);
                });
            });
        });
    });
    describe("cached()", () => {
        describe("sync", () => {
            /**
             * Injects a value, changes it, then injects it again.
             *
             * Determines if the results do/don't match.
             *
             * @param {Boolean} matches If true, results should match.
             */
            function doTest(matches) {
                var first, second;

                containerMock.call.and.callFake((callback) => {
                    return callback();
                });
                provider.asFactory();
                functionResult = "first result";
                first = provider.provide();
                functionResult = "second result";
                second = provider.provide();

                if (matches) {
                    expect(first).toEqual(second);
                } else {
                    expect(first).not.toEqual(second);
                }
            }

            it("is disabled by default", () => {
                doTest(false);
            });
            it("may be enabled with no args", () => {
                provider.cached();
                doTest(true);
            });
            it("may be enabled with truthy value", () => {
                provider.cached(true);
                doTest(true);
            });
            it("may be disabled with falsy value", () => {
                provider.cached().cached(false);
                doTest(false);
            });
        });
        describe("async", () => {
            /**
             * Injects a value, changes it, then injects it again.
             *
             * Determines if the results do/don't match.
             *
             * @param {Boolean} matches If true, results should match.
             * @return {Promise.<*>}
             */
            function doTest(matches) {
                containerMock.callAsync.and.callFake((callback) => {
                    return callback();
                });
                provider.asFactory();
                functionResult = "first result";

                return provider.provideAsync().then((first) => {
                    functionResult = "second result";

                    return provider.provideAsync().then((second) => {
                        if (matches) {
                            expect(first).toEqual(second);
                        } else {
                            expect(first).not.toEqual(second);
                        }
                    });
                });
            }

            it("is disabled by default", () => {
                return doTest(false);
            });
            it("may be enabled with no args", () => {
                provider.cached();

                return doTest(true);
            });
            it("may be enabled with truthy value", () => {
                provider.cached(true);

                return doTest(true);
            });
            it("may be disabled with falsy value", () => {
                provider.cached().cached(false);

                return doTest(false);
            });
            it("throws if trying to resolve async and sync at the same time", () => {
                var promise;

                provider.cached();
                containerMock.callAsync.and.callFake((callback) => {
                    setTimeout(callback, 100);
                });
                promise = provider.provideAsync();
                expect(() => {
                    provider.provide();
                }).toThrow();

                return promise.then((asyncResult) => {
                    expect(provider.provide()).toBe(asyncResult);
                });
            });
        });
    });
    describe("fromContainer()", () => {
        describe("sync", () => {
            it("looks up the value in the container", () => {
                containerMock.resolve.and.returnValue("resolved");
                provider.fromContainer();
                expect(provider.provide()).toBe("resolved");
                expect(containerMock.resolve).toHaveBeenCalledWith(functionTest);
            });
        });
        describe("async", () => {
            it("looks up the value in the container", () => {
                containerMock.resolveAsync.and.returnValue(Promise.resolve("resolved"));
                provider.fromContainer();

                return provider.provideAsync().then((result) => {
                    expect(result).toBe("resolved");
                    expect(containerMock.resolveAsync).toHaveBeenCalledWith(functionTest);
                });
            });
        });
    });
    describe("fromModule()", () => {
        describe("sync", () => {
            /**
             * Fake a required module and rewire the provider to use
             * that fake module.
             *
             * @param {string} val Name of module that is rewired
             */
            function setup(val) {
                // Need to make our own provider here in order to get
                // a Node module name
                requireMock.and.callFake((what) => {
                    return `Module: ${what}`;
                });
                provider = new DizzyProvider("moduleName", val, containerMock);
            }

            it("uses require()", () => {
                setup("fs");
                provider.fromModule();
                expect(provider.provide()).toBe("Module: fs");
            });
            it("uses process.cwd() for relative modules", () => {
                setup("./config.js");
                provider.fromModule();
                expect(provider.provide()).toBe(`Module: ${process.cwd()}/config.js`);
            });
            it("uses a specified folder for relative modules", () => {
                setup("./config.js");
                provider.fromModule("/var/lib/modules");
                expect(provider.provide()).toBe("Module: /var/lib/modules/config.js");
            });
            it("throws when a module can't be found", () => {
                setup("fake-module-that-does-not-exist");
                requireMock.and.throwError(new Error("Can not find module"));
                provider.fromModule();
                expect(() => {
                    provider.provide();
                }).toThrow();
            });
        });
        describe("async", () => {
            /**
             * Rewire a module to be faked and recreate the provider so the
             * desired module can be fake loaded.
             *
             * @param {string} val Name of module to fake
             */
            function setup(val) {
                // Need to make our own provider here in order to get
                // a Node module name
                requireMock.and.callFake((what) => {
                    return `Module: ${what}`;
                });
                provider = new DizzyProvider("moduleName", val, containerMock);
            }

            it("uses require()", () => {
                setup("fs");
                provider.fromModule();

                return provider.provideAsync().then((result) => {
                    expect(result).toBe("Module: fs");
                });
            });
            it("uses process.cwd() for relative modules", () => {
                setup("./config.js");
                provider.fromModule();

                return provider.provideAsync().then((result) => {
                    expect(result).toBe(`Module: ${process.cwd()}/config.js`);
                });
            });
            it("uses a specified folder for relative modules", () => {
                setup("./config.js");
                provider.fromModule("/var/lib/modules");

                return provider.provideAsync().then((result) => {
                    expect(result).toBe("Module: /var/lib/modules/config.js");
                });
            });
            it("rejects when a module can't be found", () => {
                setup("fake-module-that-does-not-exist");
                requireMock.and.throwError(new Error("Can not find module"));
                provider.fromModule();

                return provider.provideAsync().then(jasmine.fail, (err) => {
                    expect(err).toEqual(jasmine.any(Error));
                });
            });
        });
    });
    describe("fromValue()", () => {
        describe("sync", () => {
            it("is the default", () => {
                expect(provider.provide()).toBe(functionTest);
            });
            it("works when used directly", () => {
                provider.fromContainer().fromValue();
                expect(provider.provide()).toBe(functionTest);
            });
        });
        describe("async", () => {
            it("is the default", () => {
                return provider.provideAsync().then((result) => {
                    expect(result).toBe(functionTest);
                });
            });
            it("works when used directly", () => {
                provider.fromContainer().fromValue();

                return provider.provideAsync().then((result) => {
                    expect(result).toBe(functionTest);
                });
            });
        });
    });
    describe("withContext()", () => {
        var localContext;

        beforeEach(() => {
            localContext = {
                "my context": true
            };
            provider.withContext(localContext);
            containerMock.call.and.returnValue("result from calling");
            containerMock.callAsync.and.returnValue("result from calling async");
        });
        describe("sync", () => {
            it("sets null as the default context", () => {
                provider.withContext().asFactory();
                expect(provider.provide()).toBe("result from calling");
                expect(containerMock.call).toHaveBeenCalledWith(functionTest, null, null);
            });
            it("calls the factory without overridden args", () => {
                provider.asFactory();
                expect(provider.provide()).toBe("result from calling");
                expect(containerMock.call).toHaveBeenCalledWith(functionTest, null, localContext);
            });
            it("calls the factory with overridden args", () => {
                provider.asFactory("test");
                expect(provider.provide()).toBe("result from calling");
                expect(containerMock.call).toHaveBeenCalledWith(functionTest, [
                    "test"
                ], localContext);
            });
        });
        describe("async", () => {
            it("sets null as the default context", () => {
                provider.withContext().asFactory();

                return provider.provideAsync().then((result) => {
                    expect(result).toBe("result from calling async");
                    expect(containerMock.callAsync).toHaveBeenCalledWith(functionTest, null, null);
                });
            });
            it("calls the factory without overridden args", () => {
                provider.asFactory();

                return provider.provideAsync().then((result) => {
                    expect(result).toBe("result from calling async");
                    expect(containerMock.callAsync).toHaveBeenCalledWith(functionTest, null, localContext);
                });
            });
            it("calls the factory with overridden args", () => {
                provider.asFactory("test");

                return provider.provideAsync().then((result) => {
                    expect(result).toBe("result from calling async");
                    expect(containerMock.callAsync).toHaveBeenCalledWith(functionTest, [
                        "test"
                    ], localContext);
                });
            });
        });
    });
});
