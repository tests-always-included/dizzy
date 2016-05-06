"use strict";

describe("DizzyProvider", () => {
    var containerMock, DizzyProvider, functionResult, functionTest, provider;

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
        DizzyProvider = require("../lib/dizzy-provider")();
        provider = new DizzyProvider(functionTest, containerMock);
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
        it("uses require()", () => {
            // Need to make our own provider here in order to get
            // a Node module name
            provider = new DizzyProvider("fs", containerMock);
            provider.fromModule();
            expect(provider.provide()).toBe(require("fs"));
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
