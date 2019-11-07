'use strict';

const test = require('ava');
const dizzyProviderFactory = require('./dizzy-provider');
const path = require('path');

function init() {
    class Spy {
        constructor() {
            this.calls = [];

            for (const methodName of ['call', 'callAsync', 'instance', 'instanceAsync', 'resolve', 'resolveAsync']) {
                this[methodName] = function () {
                    this.calls.push([methodName, Array.from(arguments)]);
                    return this[methodName + 'Result'];
                };
                this[methodName + 'Result'] = undefined;
            }
        }
    }

    const functionTest = function () {
        return functionTest.result;
    };

    functionTest.result = 'Initial value';

    function requireMock(x) {
        return requireMock.fakeCall(x);
    }

    requireMock.fakeCall = () => {};

    const DizzyProvider = dizzyProviderFactory(path, requireMock);
    const containerMock = new Spy();
    const provider = new DizzyProvider('testKey', functionTest, containerMock);

    return {
        containerMock: containerMock,
        DizzyProvider: DizzyProvider,
        functionTest: functionTest,
        provider: provider,
        requireMock: requireMock
    };
}

test('DizzyProvider instantiates', t => {
    const x = init();
    t.is(typeof x.provider, 'object');
});

test('asFactory() sync calls the function as a factory', t => {
    const x = init();
    x.containerMock.callResult = 'result from calling';
    t.is(x.provider.asFactory().provide(), 'result from calling');
    t.deepEqual(x.containerMock.calls, [['call', [x.functionTest, null, null]]]);
});

test('asFactory() sync passes overridden arguments', t => {
    const x = init();
    x.containerMock.callResult = 'result from calling';
    t.is(x.provider.asFactory('test').provide(), 'result from calling');
    t.deepEqual(x.containerMock.calls, [['call', [x.functionTest, ['test'], null]]]);
});

test('asFactory() sync throws an error when resolved value is not a function', t => {
    const x = init();
    const provider = new x.DizzyProvider('testKey', 'a string', x.containerMock);
    t.throws(() => provider.asFactory().provide());
});

test('asFactory() async calls the function as a factory', t => {
    const x = init();
    x.containerMock.callAsyncResult = Promise.resolve('result from calling async');
    return x.provider.asFactory().provideAsync().then(result => {
        t.is(result, 'result from calling async');
        t.deepEqual(x.containerMock.calls, [['callAsync', [x.functionTest, null, null]]]);
    });
});

test('asFactory() async passes overridden arguments', t => {
    const x = init();
    x.containerMock.callAsyncResult = Promise.resolve('result from calling async');
    return x.provider.asFactory('test').provideAsync().then(result => {
        t.is(result, 'result from calling async');
        t.deepEqual(x.containerMock.calls, [['callAsync', [x.functionTest, ['test'], null]]]);
    });
});

test('asFactory() async rejects the promise when resolved value is not a function', t => {
    const x = init();
    const provider = new x.DizzyProvider('testKey', 'a string', x.containerMock);
    return provider.asFactory().provideAsync().then(() => t.fail(), err => {
        t.assert(err instanceof Error);
        t.deepEqual(x.containerMock.calls, []);
    });
});

test('asInstance() sync creates an instance', t => {
    const x = init();
    x.containerMock.instanceResult = 'result from instance';
    t.is(x.provider.asInstance().provide(), 'result from instance');
    t.deepEqual(x.containerMock.calls, [['instance', [x.functionTest, null]]]);
});

test('asInstance() sync uses overridden arguments', t => {
    const x = init();
    x.containerMock.instanceResult = 'result from instance';
    t.is(x.provider.asInstance('abcd').provide(), 'result from instance');
    t.deepEqual(x.containerMock.calls, [['instance', [x.functionTest, ['abcd']]]]);
});

test('asInstance() sync throws an error when the resolved value is not a function', t => {
    const x = init();
    const provider = new x.DizzyProvider('testKey', 'a string', x.containerMock);
    t.throws(() => provider.asInstance.provide());
});

test('asInstance() async creates an instance', t => {
    const x = init();
    x.containerMock.instanceAsyncResult = Promise.resolve('result from instance async');
    return x.provider.asInstance().provideAsync().then(result => {
        t.is(result, 'result from instance async');
        t.deepEqual(x.containerMock.calls, [['instanceAsync', [x.functionTest, null]]]);
    });
});

test('asInstance() async uses overridden arguments', t => {
    const x = init();
    x.containerMock.instanceAsyncResult = Promise.resolve('result from instance async');
    return x.provider.asInstance('abcd').provideAsync().then(result => {
        t.is(result, 'result from instance async');
        t.deepEqual(x.containerMock.calls, [['instanceAsync', [x.functionTest, ['abcd']]]]);
    });
});

test('asInstance() async rejects when the resolved value is not a function', t => {
    const x = init();
    const provider = new x.DizzyProvider('testKey', 'a string', x.containerMock);
    return provider.asInstance().provideAsync().then(() => t.fail(), err => {
        t.assert(err instanceof Error);
        t.deepEqual(x.containerMock.calls, []);
    });
});

test('asValue() sync is the default', t => {
    const x = init();
    t.is(x.provider.provide(), x.functionTest);
});

test('asValue() sync works when used explicitly', t => {
    const x = init();
    x.provider.asInstance().asValue();
    t.is(x.provider.provide(), x.functionTest);
});

test('asValue() async is the default', t => {
    const x = init();
    return x.provider.provideAsync().then(result => {
        t.is(result, x.functionTest);
    });
});

test('asValue() async works when used explicitly', t => {
    const x = init();
    x.provider.asInstance().asValue();
    return x.provider.provideAsync().then(result => {
        t.is(result, x.functionTest);
    });
});

function testIfCachedSync(x) {
    x.containerMock.call = callback => callback();
    x.provider.asFactory();
    x.functionTest.result = 'first result';
    const first = x.provider.provide();
    x.functionTest.result = 'second result';
    const second = x.provider.provide();

    return first === second;
}

test('cached() sync is disabled by default', t => {
    const x = init();
    t.assert(testIfCachedSync(x) === false);
});

test('cached() sync may be enabled with no args', t => {
    const x = init();
    x.provider.cached();
    t.assert(testIfCachedSync(x) === true);
});

test('cached() sync may be enabled with a truthy value', t => {
    const x = init();
    x.provider.cached(true);
    t.assert(testIfCachedSync(x) === true);
});

test('cached() sync is disabled with a falsy value', t => {
    const x = init();
    x.provider.cached(false);
    t.assert(testIfCachedSync(x) === false);
});

function testIfCachedAsync(x) {
    x.containerMock.callAsync = callback => callback();
    x.provider.asFactory();
    x.functionTest.result = 'first result';
    return x.provider.provideAsync().then(first => {
        x.functionTest.result = 'second result';

        return x.provider.provideAsync().then(second => {
            return first === second;
        });
    });
}

test('cached() async is disabled by default', t => {
    const x = init();
    return testIfCachedAsync(x).then(result => t.assert(result === false));
});

test('cached() async may be enabled with no args', t => {
    const x = init();
    x.provider.cached();
    return testIfCachedAsync(x).then(result => t.assert(result === true));
});

test('cached() async may be enabled with a truthy value', t => {
    const x = init();
    x.provider.cached(true);
    return testIfCachedAsync(x).then(result => t.assert(result === true));
});

test('cached() async is disabled with a falsy value', t => {
    const x = init();
    x.provider.cached(false);
    return testIfCachedAsync(x).then(result => t.assert(result === false));
});

test('fromContainer() sync looks up the value in the container', t => {
    const x = init();
    x.containerMock.resolveResult = 'resolved';
    x.provider.fromContainer();
    t.is(x.provider.provide(), 'resolved');
    t.deepEqual(x.containerMock.calls, [['resolve', [x.functionTest]]]);
});

test('fromContainer() async looks up the value in the container', t => {
    const x = init();
    x.containerMock.resolveAsyncResult = Promise.resolve('resolved');
    x.provider.fromContainer();
    return x.provider.provideAsync().then(result => {
        t.is(result, 'resolved');
        t.deepEqual(x.containerMock.calls, [['resolveAsync', [x.functionTest]]]);
    });
});

test('fromModule() sync uses require()', t => {
    const x = init();
    x.requireMock.fakeCall = name => `Module: ${name}`;
    const provider = new x.DizzyProvider('moduleName', 'fs', x.containerMock);
    t.is(provider.fromModule().provide(), 'Module: fs');
});

test('fromModule() sync uses process.cwd() for relative modules', t => {
    const x = init();
    x.requireMock.fakeCall = name => `Module: ${name}`;
    const provider = new x.DizzyProvider('moduleName', './config.js', x.containerMock);
    t.is(provider.fromModule().provide(), `Module: ${process.cwd()}/config.js`);
});

test('fromModule() sync uses a specified folder for relative modules', t => {
    const x = init();
    x.requireMock.fakeCall = name => `Module: ${name}`;
    const provider = new x.DizzyProvider('moduleName', './config.js', x.containerMock);
    t.is(provider.fromModule('/var/lib/modules/').provide(), 'Module: /var/lib/modules/config.js');
});

test('fromModule() sync throws when a module can not be found', t => {
    const x = init();
    x.requireMock.fakeCall = () => {
        throw new Error('Can not find module');
    };
    const provider = new x.DizzyProvider('moduleName', 'fake', x.containerMock);
    t.throws(() => {
        provider.fromModule().provide();
    });
});

test('fromModule() async uses require()', t => {
    const x = init();
    x.requireMock.fakeCall = name => `Module: ${name}`;
    const provider = new x.DizzyProvider('moduleName', 'fs', x.containerMock);
    return provider.fromModule().provideAsync().then(result => t.is(result, 'Module: fs'));
});

test('fromModule() async uses process.cwd() for relative modules', t => {
    const x = init();
    x.requireMock.fakeCall = name => `Module: ${name}`;
    const provider = new x.DizzyProvider('moduleName', './config.js', x.containerMock);
    return provider.fromModule().provideAsync().then(result => t.is(result, `Module: ${process.cwd()}/config.js`));
});

test('fromModule() async uses a specified folder for relative modules', t => {
    const x = init();
    x.requireMock.fakeCall = name => `Module: ${name}`;
    const provider = new x.DizzyProvider('moduleName', './config.js', x.containerMock);
    return provider.fromModule('/var/lib/modules/').provideAsync().then(result => t.is(result, 'Module: /var/lib/modules/config.js'));
});

test('fromModule() async rejects when a module can not be found', t => {
    const x = init();
    x.requireMock.fakeCall = () => {
        throw new Error('Can not find module');
    };
    const provider = new x.DizzyProvider('moduleName', 'fake', x.containerMock);
    return provider.fromModule().provideAsync().then(() => t.fail(), () => t.pass());
});

test('fromValue() sync is the default', t => {
    const x = init();
    t.is(x.provider.provide(), x.functionTest);
});

test('fromValue() sync works when used explicitly', t => {
    const x = init();
    t.is(x.provider.fromContainer().fromValue().provide(), x.functionTest);
});

test('fromValue() async is the default', t => {
    const x = init();
    return x.provider.provideAsync().then(y => t.is(y, x.functionTest));
});

test('fromValue() async works when used explicitly', t => {
    const x = init();
    return x.provider.fromContainer().fromValue().provideAsync().then(y => t.is(y, x.functionTest));
});

test('withContext sync sets null as the default context', t => {
    const x = init();
    x.provider.withContext().asFactory();
    x.containerMock.callResult = 'result from calling';
    t.is(x.provider.provide(), 'result from calling');
    t.deepEqual(x.containerMock.calls, [['call', [x.functionTest, null, null]]]);
});

test('withContext sync calls the factory without overridden args', t => {
    const x = init();
    const context = {localContext: true};
    x.provider.withContext(context).asFactory();
    x.containerMock.callResult = 'result from calling';
    t.is(x.provider.provide(), 'result from calling');
    t.deepEqual(x.containerMock.calls, [['call', [x.functionTest, null, context]]]);
});

test('withContext sync calls the factory with overridden args', t => {
    const x = init();
    const context = {localContext: true};
    x.provider.withContext(context).asFactory('test');
    x.containerMock.callResult = 'result from calling';
    t.is(x.provider.provide(), 'result from calling');
    t.deepEqual(x.containerMock.calls, [['call', [x.functionTest, ['test'], context]]]);
});

test('withContext async sets null as the default context', t => {
    const x = init();
    x.provider.withContext().asFactory();
    x.containerMock.callAsyncResult = 'result from calling';
    return x.provider.provideAsync().then(result => {
        t.is(result, 'result from calling');
        t.deepEqual(x.containerMock.calls, [['callAsync', [x.functionTest, null, null]]]);
    });
});

test('withContext async calls the factory without overridden args', t => {
    const x = init();
    const context = {localContext: true};
    x.provider.withContext(context).asFactory();
    x.containerMock.callAsyncResult = 'result from calling';
    return x.provider.provideAsync().then(result => {
        t.is(result, 'result from calling');
        t.deepEqual(x.containerMock.calls, [['callAsync', [x.functionTest, null, context]]]);
    });
});

test('withContext async calls the factory with overridden args', t => {
    const x = init();
    const context = {localContext: true};
    x.provider.withContext(context).asFactory('test');
    x.containerMock.callAsyncResult = 'result from calling';
    return x.provider.provideAsync().then(result => {
        t.is(result, 'result from calling');
        t.deepEqual(x.containerMock.calls, [['callAsync', [x.functionTest, ['test'], context]]]);
    });
});
