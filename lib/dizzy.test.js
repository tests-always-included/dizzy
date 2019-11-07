'use strict';

const test = require('ava');
const Dizzy = require('..');

test('instantiation', t => {
    t.is(typeof new Dizzy(), 'object');
});

function callSetup() {
    const dizzy = new Dizzy();

    dizzy.register('one', 1);
    dizzy.register('two', 2);
    dizzy.register('promise', Promise.resolve('ok'));
    dizzy.register('deeperPromise', (promise) => promise.length).asFactory().cached();

    return dizzy;
}

test('call() resolves arguments', t => {
    let args = null;
    callSetup().call((one, two) => {
        args = [one, two];
    });
    t.deepEqual(args, [1, 2]);
});

test('call() does not wait for promises', t => {
    let args = null;

    callSetup().call(promise => {
        args = promise;
    });
    t.assert(args instanceof Promise);
});

test('call() works with argsArray', t => {
    let args = null;

    callSetup().call((one, two) => {
        args = [one, two];
    }, ['two']);
    t.deepEqual(args, [2, undefined]);
});

test('call() returns the function result', t => {
    const result = callSetup().call(() => 15);
    t.is(result, 15);
});

test('call() uses the specified context', t => {
    const context = {};

    callSetup().call(function () {
        // eslint-disable-next-line
        this.worked = true;
    }, context);
    t.deepEqual(context, {
        worked: true
    });
});

test('callAsync() resolves arguments, getting values from promises', t => {
    return callSetup().callAsync((one, promise) => {
        t.is(one, 1);
        t.is(promise, 'ok');
    });
});

test('callAsync() resolves promises recursively', t => {
    return callSetup().callAsync(deeperPromise => {
        t.is(deeperPromise, 2);
    });
});

test('callAsync() waits for promises to resolve', t => {
    const dizzy = callSetup();
    dizzy.register('delayed', new Promise(resolve => setTimeout(() => resolve('good'))));
    return dizzy.callAsync(delayed => {
        t.is(delayed, 'good');
    });
});

test('callAsync() works with argsArray', t => {
    return callSetup().callAsync((one, two) => {
        t.is(one, 2);
        t.is(two, undefined);
    }, ['two']);
});

test('callAsync() returns the function result', t => {
    return callSetup().callAsync(() => 15).then(result => {
        t.is(result, 15);
    });
});

test('callAsync() uses the specified context', t => {
    const context = {};

    return callSetup().callAsync(function () {
        // eslint-disable-next-line
        this.worked = true;
    }, context).then(() => {
        t.deepEqual(context, {
            worked: true
        });
    });
});

class TestClass {
    constructor(one, two) {
        this.args = [ one, two ];
    }
}

test('instance() resolves arguments', t => {
    const result = callSetup().instance(TestClass);
    t.assert(result instanceof TestClass);
    t.deepEqual(result.args, [ 1, 2 ]);
});

test('instance() does not resolve promises and works with argsArray', t => {
    const result = callSetup().instance(TestClass, [ 'one', 'promise' ]);
    t.assert(result instanceof TestClass);
    t.assert(Array.isArray(result.args));
    t.is(result.args.length, 2);
    t.is(result.args[0], 1);
    t.assert(result.args[1] instanceof Promise);
});

test('instanceAsync() resolves arguments', t => {
    return callSetup().instanceAsync(TestClass).then(result => {
        t.assert(result instanceof TestClass);
        t.deepEqual(result.args, [ 1, 2 ]);
    });
});

test('instanceAsync() waits for promises and works with argsArray', t => {
    return callSetup().instanceAsync(TestClass, [ 'one', 'promise' ]).then(result => {
        t.assert(result instanceof TestClass);
        t.deepEqual(result.args, [1, 'ok']);
    });
});

test('isRegistered() finds something', t => {
    t.is(callSetup().isRegistered('one'), true);
});

test('isRegistered() notices missing things', t => {
    t.is(callSetup().isRegistered('missing'), false);
});

test('list() can provide an empty list', t => {
    const dizzy = new Dizzy();
    t.deepEqual(dizzy.list(), []);
});

test('list() can have items in the list', t => {
    t.deepEqual(callSetup().list().sort(), [ 'deeperPromise', 'one', 'promise', 'two' ]);
});

[ 'asFactory', 'asInstance', 'asValue', 'cached', 'fromContainer', 'fromModule', 'fromValue', 'withContext' ].forEach(method => {
    test(`register() returns something from ${method}()`, t => {
        const dizzy = new Dizzy();
        const provider = dizzy.register('x', 'y');
        t.assert(provider[method]() instanceof Dizzy.DizzyProvider);
    });
});

test('registerBulk() returns a BulkProvider for an empty object', t => {
    const dizzy = new Dizzy();
    const provider = dizzy.registerBulk({});
    t.assert(provider.addProvider instanceof Function);
    t.is(provider.providerSet.length, 0);
});

test('registerBulk() returns a BulkProvider for an object', t => {
    const dizzy = new Dizzy();
    const provider = dizzy.registerBulk({
        test: true,
        works: 'probably',
        yay: ':-)'
    });
    t.assert(provider.addProvider instanceof Function);
    t.is(provider.providerSet.length, 3);
});

test('registerBulk() returns a BulkProvider for an empty map', t => {
    const dizzy = new Dizzy();
    const provider = dizzy.registerBulk(new Map());
    t.assert(provider.addProvider instanceof Function);
    t.is(provider.providerSet.length, 0);
});

test('registerBulk() returns a BulkProvider for an Map', t => {
    const dizzy = new Dizzy();
    const map = new Map();
    map.set('a', 'A');
    map.set('1', 'one');
    const provider = dizzy.registerBulk(map);
    t.assert(provider.addProvider instanceof Function);
    t.is(provider.providerSet.length, 2);
});

// Only testing failure paths here because normal usage is tested through
// other methods already.
test('resolve() throws when a key is not defined', t => {
    const dizzy = new Dizzy();
    t.throws(() => {
        dizzy.resolve('not defined');
    });
});

// Only testing failure paths here because normal usage is tested through
// other methods already.
test('resolveAsync() rejects when a key is not defined', t => {
    const dizzy = new Dizzy();
    return dizzy.resolveAsync('not defined').then(t.fail, t.pass);
});
