"use strict";

describe("BulkProvider", () => {
    var bulkProvider;

    beforeEach(() => {
        var BulkProvider;

        BulkProvider = require("../lib/bulk-provider")();
        bulkProvider = new BulkProvider();
    });
    it("operates with no registered providers", () => {
        expect(() => {
            bulkProvider.fromModule();
        }).not.toThrow();
    });
    it("chains the method call to all registered providers", () => {
        var spy1, spy2, spy3;

        spy1 = jasmine.createSpyObj("spy1", [
            "cached"
        ]);
        spy2 = jasmine.createSpyObj("spy2", [
            "cached"
        ]);
        spy3 = jasmine.createSpyObj("spy3", [
            "cached"
        ]);
        bulkProvider.addProvider(spy1);
        bulkProvider.addProvider(spy2);
        bulkProvider.addProvider(spy3);
        expect(spy1.cached).not.toHaveBeenCalled();
        expect(spy2.cached).not.toHaveBeenCalled();
        expect(spy3.cached).not.toHaveBeenCalled();
        bulkProvider.cached();
        expect(spy1.cached).toHaveBeenCalled();
        expect(spy2.cached).toHaveBeenCalled();
        expect(spy3.cached).toHaveBeenCalled();
    });
    it("passes along arguments", () => {
        var spy;

        spy = jasmine.createSpyObj("spy", [
            "asFactory"
        ]);
        bulkProvider.addProvider(spy);
        bulkProvider.asFactory("one", 2, true);
        expect(spy.asFactory).toHaveBeenCalledWith("one", 2, true);
    });
    it("allows chaining", () => {
        var result;

        result = bulkProvider.cached();
        expect(result).toBe(bulkProvider);
    });
});
