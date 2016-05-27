"use strict";

describe("DizzyProvider", () => {
    var containerMock, DizzyProvider, functionResult, functionTest, provider, requireMock;

    beforeEach(() => {
        containerMock = jasmine.createSpyObj("container", [
            "call",
            "instance",
            "resolve"
        ]);
        functionResult = {
            "function result": true
        };
        functionTest = function (arg) {
            if (this) {
                this.arg = arg;
            }

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
        it("calls the function as a factory", () => {
            provider.asFactory();
            containerMock.call.andReturn("result from calling");
            expect(provider.provide()).toBe("result from calling");
            expect(containerMock.call).toHaveBeenCalledWith(functionTest, null, null);
        });
        it("passes overridden arguments", () => {
            provider.asFactory("test");
            containerMock.call.andReturn("result from calling");
            expect(provider.provide()).toBe("result from calling");
            expect(containerMock.call).toHaveBeenCalledWith(functionTest, [
                "test"
            ], null);
        });
        it("throws an error when the resolved value is not a function", () => {
            provider = new DizzyProvider("testKey", "a string", containerMock);
            provider.asFactory();
            expect(() => {
                provider.provide();
            }).toThrow();
        });
    });
    describe("asInstance()", () => {
        it("creates an instance", () => {
            provider.asInstance();
            containerMock.instance.andReturn("result from instance");
            expect(provider.provide()).toBe("result from instance");
            expect(containerMock.instance).toHaveBeenCalledWith(functionTest, null);
        });
        it("uses overridden arguments", () => {
            provider.asInstance("abcd");
            containerMock.instance.andReturn("result from instance");
            expect(provider.provide()).toBe("result from instance");
            expect(containerMock.instance).toHaveBeenCalledWith(functionTest, [
                "abcd"
            ]);
        });
        it("throws an error when the resolved value is not a function", () => {
            provider = new DizzyProvider("testKey", "a string", containerMock);
            provider.asFactory();
            expect(() => {
                provider.provide();
            }).toThrow();
        });
    });
    describe("asValue()", () => {
        it("is the default", () => {
            expect(provider.provide()).toBe(functionTest);
        });
        it("works when used directly", () => {
            provider.asInstance().asValue();
            expect(provider.provide()).toBe(functionTest);
        });
    });
    describe("cached()", () => {
        function doTest(matches) {
            var first, second;

            containerMock.call.andCallFake((callback) => {
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
    describe("fromContainer()", () => {
        it("looks up the value in the container", () => {
            containerMock.resolve.andReturn("resolved");
            provider.fromContainer();
            expect(provider.provide()).toBe("resolved");
            expect(containerMock.resolve).toHaveBeenCalledWith(functionTest);
        });
    });
    describe("fromModule()", () => {
        function setup(val) {
            // Need to make our own provider here in order to get
            // a Node module name
            requireMock.andCallFake((what) => {
                return "Module: " + what;
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
            expect(provider.provide()).toBe("Module: " + process.cwd() + "/config.js");
        });
        it("uses a specified folder for relative modules", () => {
            setup("./config.js");
            provider.fromModule("/var/lib/modules");
            expect(provider.provide()).toBe("Module: /var/lib/modules/config.js");
        });
    });
    describe("fromValue()", () => {
        it("is the default", () => {
            expect(provider.provide()).toBe(functionTest);
        });
        it("works when used directly", () => {
            provider.fromContainer().fromValue();
            expect(provider.provide()).toBe(functionTest);
        });
    });
    describe("withContext()", () => {
        var localContext;

        beforeEach(() => {
            localContext = {
                "my context": true
            };
            provider.withContext(localContext);
        });
        it("calls the factory without overridden args", () => {
            provider.asFactory();
            containerMock.call.andReturn("result from calling");
            expect(provider.provide()).toBe("result from calling");
            expect(containerMock.call).toHaveBeenCalledWith(functionTest, null, localContext);
        });
        it("calls the factory with overridden args", () => {
            provider.asFactory("test");
            containerMock.call.andReturn("result from calling");
            expect(provider.provide()).toBe("result from calling");
            expect(containerMock.call).toHaveBeenCalledWith(functionTest, [
                "test"
            ], localContext);
        });
    });
});
