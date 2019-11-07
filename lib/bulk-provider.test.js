'use strict';

const test = require('ava');
const bulkProviderFactory = require('./bulk-provider');

const BulkProvider = bulkProviderFactory();

test('BulkProvider operates with no registered providers', t => {
    const bulkProvider = new BulkProvider();
    t.notThrows(() => bulkProvider.fromModule());
});

test('BulkProvider chains the method call to all registered providers', t => {
    class Spy {
        constructor() {
            this.calls = 0;
        }

        cached() {
            this.calls += 1;
        }
    }

    const spy1 = new Spy();
    const spy2 = new Spy();
    const spy3 = new Spy();

    const bulkProvider = new BulkProvider();
    bulkProvider.addProvider(spy1);
    bulkProvider.addProvider(spy2);
    bulkProvider.addProvider(spy3);
    t.is(spy1.calls, 0);
    t.is(spy2.calls, 0);
    t.is(spy3.calls, 0);
    bulkProvider.cached();
    t.is(spy1.calls, 1);
    t.is(spy1.calls, 1);
    t.is(spy1.calls, 1);
});

test('BulkProvider passes along arguments', t => {
    class Spy {
        constructor() {
            this.args = null;
        }

        asFactory() {
            this.args = arguments;
        }
    }

    const spy = new Spy();

    const bulkProvider = new BulkProvider();
    bulkProvider.addProvider(spy);
    bulkProvider.asFactory('one', 2, true);
    t.deepEqual(spy.args, ['one', 2, true]);
});

test('BulkProvider allows chaining', t => {
    const bulkProvider = new BulkProvider();
    const result = bulkProvider.cached();

    t.is(result, bulkProvider);
});
