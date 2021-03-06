Dizzy - Dependency Injection
============================

Dizzy is a dependency injection container (aka framework or system), allowing developers to loosely couple modules together.  Dependency injection is a type of IoC (Inversion of Control), where you let all other code call you instead of the other way around.  It also allows for significantly easier testing, since the dependencies in your modules could be mocks or other classes that have prescribed output.  For more information about dependency injection in node, I suggest reading [Dependency Injection in Node.js](https://blog.risingstack.com/dependency-injection-in-node-js/).

[![npm version][npm-badge]][npm-link]
[![Build Status][travis-badge]][travis-link]
[![Dependencies][dependencies-badge]][dependencies-link]
[![Dev Dependencies][devdependencies-badge]][devdependencies-link]
[![codecov.io][codecov-badge]][codecov-link]


Premise
-------

This system was based around the following goals:

1. Simpler is better.
2. The framework should not need to modify external libraries in order to easily get them added to the dependency tree.
3. Follow industry standard naming conventions and community embraced patterns.
4. Do not hijack `require()`, even though it is tempting.
5. ECMAScript 6.  This impacts both what can be accepted and how the code runs.
6. Allow asynchronous operations.  That's a lofty goal but could be vital for your software.


Examples
--------

In order to use this library, first you must install it.

    npm install --save dizzy

Next, you write some code to create the container.  You can add a few things to the container and then start injecting!

    // dizzy = container, Dizzy = class
    var dizzy, Dizzy;

    // Load the module
    Dizzy = require("dizzy");

    // Create the container
    dizzy = new Dizzy();

    // Let's make "Hello world!" for Express.js
    dizzy.register("port", 8000);  // Static value
    dizzy.register("express", "express").fromModule();  // Node module
    dizzy.register("app", function (express, addRoutes, port) {
        var app;

        app = express();
        addRoutes(app);
        app.listen(port, function () {
            console.log("app listening on port", port);
        });

        return app;
    }).asFactory();  // New instance every time it is injected
    dizzy.register("addRoutes", function (app) {
        // Note, this is not an ideal way to add routes.
        // This example is for illustrative purposes only.
        // A better idea is restify-router-magic.
        app.get("/", function (req, res) {
            res.send("Hello world!");
        });
    });  // Provides this function

    // Nothing has been made yet.  Start the app.  This will inject
    // "port", "express" and "addRoutes" into the call to the "app"
    // factory.
    dizzy.resolve("app");

Once you start using this container to inject dependencies, you'll probably want to inject all sorts of things at once.  For instance, you'll inject several Node.js modules, so there's a technique you can use to make it easier.

    // Inject some common modules.  For instance, the "aws-sdk" library
    // will be registered in Dizzy as awsSdk.  This is done because variables
    // can't have embedded hyphens.
    //
    // All of these will be registered as a module.
    dizzy.registerBulk({
        awsSdk: "aws-sdk",
        bluebird: "bluebird",
        twofa: "2fa"
    }).fromModule();

    // If you have library files in your own codebase and they all use
    // a factory pattern, register them in bulk as well.
    dizzy.registerBulk({
        compression: "./compression",
        textFormatter: "./text-formatter",
        WebServer: "./class/web-server"
    }).fromModule(__dirname).asFactory().cached();

Did you want to register some things as `Promise` objects and have them get resolved before you use them?  Try the `*Async` functions!  If you do not use the asynchronous functions then promise objects may be injected into your factories and may be returned at times.  To make sure everything works as expected, switch over entirely and stop using the synchronous functions.

    // This loads your configuration.  Just an example here.
    // anotherValue will NOT be a promise when resolved asynchronously
    function loadConfigAsync(anotherValue) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    message: "This is your configuration",
                    value: anotherValue
                });
            }, 500);
        });
    }

    anotherPromise = new Promise((resolve) => {
        resolve("this gets resolved before calling the function");
    });

    // Add some modules that return promises
    dizzy.register("config", loadConfigAsync).asFactory().cached();
    dizzy.register("anotherValue", anotherPromise);

    // Load the configuration and get a promise back
    configLoadedPromise = dizzy.resolveAsync("config");
    configLoadedPromise.then((result) => {
        console.log(result);
        // {
        //     message: "This is your configuration"
        //     value: "this gets resolved before calling the function"
        // }
    });

    // Even though it is cached, this may return a different promise.
    secondConfigLoadedPromise = dizzy.resolveAsync("config");
    console.log(configLoadedPromise === secondConfigLoadedPromise);
    // Could be false.  It's the value that is guaranteed to be cached.
    // It's also guaranteed to always be a promise, even though it was
    // already resolved.

Do you prefer Typescript?

    // container.ts
    import { default as Dizzy } from 'dizzy';
    import { configLoaderFactory } from './config-loader';
    import { myServiceFactory } from './my-service';

    const container = new Dizzy();
    container.registerBulk({
        configLoader: configLoaderFactory,
        myService: myServiceFactory
    }).asFactory().cached();

    export type configLoader = ReturnType<typeof configLoaderFactory>
    export type myServiceFactory = ReturnType<typeof myServiceFactory>

    container.resolve('myService').begin();


    // config-loader.ts
    export function configLoaderFactory() {
        // No dependencies and just provides some simple config
        return {
            ready: true
        };
    }


    // my-service.ts
    import { configLoader } from './container';

    export function myServiceFactory(configLoader: configLoader) {
        return {
            begin() {
                console.log('Ready?', configLoader.ready);
            }
        };
    }


API and Methods
---------------

The module exports a class.

    var Dizzy;

    Dizzy = require("dizzy");

    // This instance's methods are detailed below.
    dizzy = new Dizzy();

In addition to exporting the class, `Dizzy.BulkProvider` and `Dizzy.DizzyProvider` supply access to the classes that are used internally, allowing modules to be plugins and add functionality.


### `dizzy.call(callFunction, [argsArray], [contextObj])`

Call `callFunction` with arguments from the dependency injection system.  When using the `argsArray`, the function will be called with registered values and their names will be in `argsArray`.  When calling a function only, the function's parameters must match the name of the value to provide.

When `contextObj` is specified, this uses the designated context when calling the callback.

Returns the value returned from the function.

    dizzy.register("one", 1);

    // Uses argsArray to map the dependency injection "one" to the
    // parameter "someVariable".
    dizzy.call(function (someVariable) {
        console.log(someVariable);  // 1
    }, [
        "one"
    ]);

    // Dizzy will inject "one" to the function automatically when you
    // do not use an argsArray.  This example also sets the context to null.
    dizzy.call(function (one) {
        console.log(one); // 1
    }, null);


### `dizzy.callAsync(callFunction, [argsArray], [contextObj])`

This is identical to `dizzy.call()` except in two ways.  First, all injected values that are promises will be resolved before the function is called.  Second, this always returns the `callFunction`'s result wrapped in a promise.  If the function itself returns a promise, then normal promise resolution occurs.

    dizzy.register("one", new Promise((resolve) => {
        setTimeout(() => {
            resolve(1);
        }, 1000);
    }));

    dizzy.callAsync((one) => {
        return one;
    }).then((result) => {
        console.log(result); // 1
    });

Arguments and the context are both handled exactly like `dizzy.call()`.


### `dizzy.instance(classFunction, [argsArray])`

Creates an instance of `classFunction`.  When `argsArray` is passed, it will inject into the constructor all of the values specified.  If `argsArray` is omitted, Dizzy will look up the parameters that the constructor needs.

Returns the newly created instance.

    class Testing {
        constructor(val) {
            console.log(val);
        }
    }

    dizzy.register("val", "ONE");
    dizzy.register("two", "TWO");
    dizzy.instance(Testing);  // Injects "val" automatically, writes "ONE".
    dizzy.instance(Testing, [
        "two"
    ]);  // Injects "two" using argsArray, writes "TWO" to console.


### `dizzy.instanceAsync(classFunction, [argsArray])`

Asynchronous version of `dizzy.instance()` with two differences.  First, all injected values that are promises shall be resolved before the class is instantiated.  Second, the return value of this function is always wrapped in a promise.

    class Testing {
        constructor(val) {
            console.log(val);
            // "value goes here"
        }
    }

    dizzy.register("val", new Promise((resolve) => {
        setTimeout(() => {
            resolve("value goes here");
        });
    }));
    dizzy.instanceAsync(Testing).then((instance) => {
        console.log("instance was created");
    });


### `dizzy.isRegistered(key)`

Returns a boolean indicating if the key is registered or not.

    dizzy.register("day type", "sunny");

    if (! dizzy.isRegistered("day type")) {
        throw new Error("The type of day was registered")
    }


### `dizzy.list()`

Returns an array of all registered values.

    dizzy.register("testing", true);
    list = dizzy.list();
    console.log(list);  // [ "testing" ]


### `dizzy.register(key, value)`

Sets a given value for a key.  No dependencies will be injected.  Returns `this`.  Keys can be anything - internally a Map is used.  Values can be anything.

Returns an instance of `DizzyProvider`, which allows you define how the value is retrieved, how it is handled, and additional options.

    // Register a normal value
    dizzy.register("port", 8000);

    // Register a function
    dizzy.register("add", function (a, b) {
        return a + b;
    });

    // Register a class that will have dependencies injected
    class TestClass {}
    dizzy.register("testClassInstance", TestClass).asInstance();

    // Register a factory that will have dependencies injected.  We want
    // the same value returned, so this one is also cached.
    dizzy.register("logger", function (console) {
        return console.log.bind(console);
    }).asFactory().cached();

For additional information, look at the `DizzyProvider` section.


### `dizzy.registerBulk(mapping)`

This shorthand is the same as multiple identical calls to `dizzy.register()`.  It's purpose is to configure many values at once in the same way.

    // Old way
    dizzy.register("crypto", "crypto").fromModule();
    dizzy.register("fs", "fs").fromModule();
    dizzy.register("zlib", "zlib").fromModule();

    // New way using registerBulk().
    dizzy.registerBulk({
        crypto: "crypto",
        fs: "fs",
        zlib: "zlib"
    }).fromModule();

The key being registered is still on the left and the value is on the right.


### `dizzy.resolve(key)`

Returns the resolved value from the dependency injection container.

    dizzy.register("logger", function (message) {
       console.log(message);
    });
    var logger = dizzy.resolve("logger")
    logger("something");  // Calls console.log("something");


### `dizzy.resolveAsync(key)`

Asynchronous version of `dizzy.resolve()`.  Always returns the value wrapped in a promise.  If the value was a factory or an instance, this uses the asynchronous versions of those methods.

    dizzy.register("test", "value");
    dizzy.resolveAsync("test").then((result) => {
        console.log(result);
        // value
    });


`DizzyProvider`
---------------

This is responsible for supplying values when they are to be resolved by Dizzy or when they are needed for injection into a factory or instance.

There are three phases:

* Retrieval of the value using a `from*` function.
* Changing the value using an `as*` function.
* Handling additional options.

By default, the provider is configured thus:

* `.fromValue()` - The value registered is not looked up elsewhere.
* `.asValue()` - The value retrieved is unaltered.
* `.cached(false)` - The retrieved value is not cached.
* `.withContext(null)` - The context for factory functions is assigned to `null` as a reasonable default.


### `.asFactory([args...])`

Treat the retrieved value as a factory function.  This example illustrates the difference between a factory and a regular value.

    // Just setup
    dizzy.register("val", "some value");

    // Example:  Not a factory
    dizzy.register("notFactory", function (val) {
        console.log(val);
        return 1;
    });
    notFactory = dizzy.resolve("notFactory");
    console.log(notFactory instanceof Function); // true

    // Example:  Factory function that gets called
    dizzy.register("factory", function (val) {
        console.log(val);
        return 2;
    }).asFactory();
    factory = dizzy.resolve("factory");
    // The above logged "some value" because it was injected and the
    // factory was executed.
    console.log(factory === 2); // true

You can also pass arguments to `asFactory()` and those arguments will be looked up in the container instead of the normal resolution.

    // Example illustrating overriding arguments
    dizzy.register("input", "normal input");
    dizzy.register("alt", "alternate input");
    function reflect(input) {
        return input;
    }
    dizzy.register("normal", reflect).asFactory();
    console.log(dizzy.resolve("normal")); // "normal input"
    dizzy.register("overridden", reflect).asFactory(alt);
    console.log(dizzy.resolve("overridden")); // "alternate input"


### `.asInstance()`

Treat the retrieved value as a class function and return an instance of the class function.  The constructor is called and all dependencies are injected.

    // Here's a value and a class
    dizzy.register("count", 20")
    class TestClass {
        constructor(count) {
            this.count = count;
        }
    }

    // Example:  Register the class - do not make an instance
    dizzy.register("TestClass", TestClass);
    result = dizzy.resolve("TestClass");
    console.log(result === TestClass);  // true

    // Example:  Register the class and make it return an instance
    dizzy.register("testClassInstance", TestClass).asInstance();
    result = dizzy.resolve("testClassInstance");
    console.log(result instanceof TestClass);  // true

You can also pass arguments to `asInstance()` and those arguments will be looked up in the container instead of the normal resolution and passed to the constructor.

    class TestClass {
        constructor(thing) {
            console.log("thing is", thing);
        }
    }

    dizzy.register("thing", "normal thing");
    dizzy.register("alt", "alternate thing");
    dizzy.register("normal", TestClass).asInstance();
    dizzy.resolve("normal");  // thing is normal thing
    dizzy.register("overridden", TestClass).asInstance(alt);
    dizzy.resolve("overridden");  // thing is alternate thing


### `.asValue()`

Returns the retrieved value without any alteration.  This is the default behavior.  The function is provided for completeness.

    // Using it as a default
    dizzy.register("one", 1);

    // I don't know why, but you could do this.
    // The last as* function overrides the others.
    dizzy.register("two", 2).asInstance().asFactory().asValue();


### `.cached()`

Cache the result.  This remembers the value that was provided before and ensures that the exact same value is supplied everywhere.

    // You may prevent factories from running multiple times
    var count = 0;
    function factory() {
        count += 1;
        return count;
    }

    // Uncached factory
    dizzy.register("factoryUncached", factory).asFactory();
    console.log(dizzy.resolve("factoryUncached"));  // 1
    console.log(dizzy.resolve("factoryUncached"));  // 2

    // Cached factory
    dizzy.register("factoryCached", factory).asFactory().cached();
    console.log(dizzy.resolve("factoryCached"));  // 3
    console.log(dizzy.resolve("factoryCached"));  // 3

    // You may supply individual instances or the same instance
    class TestClass {}

    // Uncached instance
    dizzy.register("classUncached", TestClass).asInstance();
    uncached1 = dizzy.resolve("classUncached");
    uncached2 = dizzy.resolve("classUncached");
    console.log(uncached1 === uncached2); // false

    // Cached instance
    dizzy.register("classCached", TestClass).asInstance().cached()
    cached1 = dizzy.resolve("classCached");
    cached2 = dizzy.resolve("classCached");
    console.log(cached1 === cached2); // true


### `.fromContainer()`

Retrieved the value from the container using the registered value as the key.  It's a bit odd to do this, but this mechanism lets you register a class and then register instances of that class.

    // Make a class
    class TestClass {}

    // Register the class
    dizzy.register("TestClass", TestClass);

    // Now register something that makes instances of that class
    dizzy.register("testClassInstance", "TestClass").fromContainer().asInstance();

    instance = dizzy.resolve("testClassInstance");
    classFn = dizzy.resolve("TestClass");
    console.log(instance instanceof classFn); // true


### `.fromModule([baseDir])`

Retrieves the true value from node using `require()`.  You supply a module name.  Make sure it is installed via npm before you start requiring it, otherwise it just won't work.

    // Register a module - this does not use require() yet
    dizzy.register("glob", "glob").fromModule();

    // Resolve the data - this calls require()
    glob = dizzy.resolve("glob");

You also may require relative paths if you indicate the location of the file setting up the container.

    // This writes out the current working directory, which can change.
    // For our example, let us use /home/username
    console.log(process.cwd());  // /home/username
    console.log(__dirname);  // /home/username/project/lib/

    // Registers a module with a relative path.
    // Result:  /home/username/config.json
    dizzy.register("config1", "./config.json").fromModule();

    // Registers a module with a relative path against the file's location
    // Result:  /home/username/project/lib/config.json
    dizzy.register("config2", "./config.json").fromModule(__dirname);


### `.fromValue()`

Retrieves the value directly from the container without doing any lookups.  This is the default behavior.  The function is provided for completeness.

    // Using it as a default
    dizzy.register("one", 1);

    // I don't know why, but you could do this.
    // The last from* function overrides the others.
    dizzy.register("two", 2).fromContainer().fromModule().fromValue()


### `.withContext()`

Allows you to specify a context for a factory function.

    contextObj = {
        something: "test"
    };
    function factoryFn() {
        console.log(this.something);
    }

    // Using the default, null context
    dizzy.register("factoryNullContext", factoryFn).asFactory();
    dizzy.resolve("factoryNullContext");  // logs "undefined"

    // Using the specified context
    dizzy.register("factoryWithContext", factoryFn).asFactory().withContext(contextObj);
    dizzy.resolve("factoryWithContext");  // logs "test"


Future Work
-----------

Currently there are no events, though they are under consideration.  Proposed events are:

* `debug` - Debugging messages, useful for diagnostics and understanding how the dependencies are resolved.
* `warn` - Indications that you may be doing something wrong.
* `destroy` - Trigger cleanup behavior, such as removing timeouts and closing database connections.

Having a cache may make things faster.  Clearing the cache or clearing all registered values may make testing easier.

Allowing for overrides in `dizzy.resolve()` and `dizzy.call()` could make testing easier.

Loading all files automatically would cut down on the amount of code.  Investigate [dependable.load()](https://github.com/Bruce17/dependable).


License
-------

Dizzy is licensed under a [MIT license](LICENSE.md).


[codecov-badge]: https://img.shields.io/codecov/c/github/tests-always-included/dizzy/master.svg
[codecov-link]: https://codecov.io/github/tests-always-included/dizzy?branch=master
[dependencies-badge]: https://img.shields.io/david/tests-always-included/dizzy.svg
[dependencies-link]: https://david-dm.org/tests-always-included/dizzy
[devdependencies-badge]: https://img.shields.io/david/dev/tests-always-included/dizzy.svg
[devdependencies-link]: https://david-dm.org/tests-always-included/dizzy#info=devDependencies
[npm-badge]: https://img.shields.io/npm/v/dizzy.svg
[npm-link]: https://npmjs.org/package/dizzy
[travis-badge]: https://img.shields.io/travis/tests-always-included/dizzy/master.svg
[travis-link]: http://travis-ci.org/tests-always-included/dizzy
