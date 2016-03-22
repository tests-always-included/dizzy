Dizzy - Dependency Injection
============================

Dizzy is a dependency injection container (aka framework or system), allowing developers to loosely couple modules together.  Dependency injection is a type of IoC (Inversion of Control), where you let all other code call you instead of the other way around.  It also allows for significantly easier testing, since the dependencies in your modules could be mocks or other classes that have prescribed output.  For more information about dependency injection in node, I suggest reading [Dependency Injection in Node.js](https://blog.risingstack.com/dependency-injection-in-node-js/).


Premise
-------

This system was based around the following goals:

1. Simpler is better.
2. The framework should not need to modify external libraries in order to easily get them added to the dependency tree.
3. Follow industry standard naming conventions and community embraced patterns.
4. Do not hijack `require()`, even though it is tempting.


Examples
--------

In order to use this library, first you must install it.

    npm install --save dizzy

Next, you write some code to create the container.  You can add a few things to the container and then start injecting!

    var dizzy = require('dizzy').container();

    // Let's make "Hello world!" for Express.js
    dizzy.provide('port', 8000);
    dizzy.provide('express', require('express'));
    dizzy.register('app', function (express, addRoutes, port) {
        var app;

        app = express();
        addRoutes(app);
        app.listen(port, function () {
            console.log('app listening on port', port);
        });

        return app;
    });
    dizzy.provide('addRoutes', function (app) {
        // Note, this is not an ideal way to add routes.
        // This example is for illustrative purposes only.
        app.get('/', function (req, res) {
            res.send('Hello world!');
        });
    });

    // Nothing has been made yet.  Start the app.
    dizzy.resolve('app');


Methods
-------


### `dizzy.call([argsArray], callbackFn)`

Call the callback function with arguments from the dependency injection system.  When using the `argsArray`, the function will be called with registered values and their names will be in `argsArray`.  When calling a function only, the function's parameters must match the name of the value to provide.

    dizzy.provide('one', 1);

    // With the argsArray
    dizzy.call([
        'one'
    ], function (someVariable) {
        console.log(someVariable);  // 1
    });

    // Without the argsArray
    dizzy.call(function (one) {
        console.log(one); // 1
    });


### `dizzy.instance(key, [argsArray], classFn)`

Sets up a class so an instance will be to be provided.  Shortcut method for using `dizzy.register()`.  This will create a new instance to everything that depends on it.  See `dizzy.singleton()` when you prefer to have the same instance supplied to every component in the system.

    // Inject the argument without an argsArray
    function Alphabet(letters) {
        this.letters = letters;
    }

    dizzy.provide('letters', 'abcdefghijklmnopqrstuvwxyz');
    dizzy.instance('english alphabet', Alphabet);
    alpha = dizzy.resolve('english alphabet);
    console.log(alpha.letters); // abcdefghijklmnopqrstuvwxyz

    // Inject arguments with an argsArray
    function Coordinates(x, y) {
        this.x = x;
        this.y = y;

        this.distanceFromOrigin = function () {
            return Math.sqrt(this.x * this.x + this.y * this.y);
        };
    }

    dizzy.instance('coords', [
        'locationX',
        'locationY'
    ], Coordinates);
    dizzy.provide('locationX', 4);
    dizzy.provide('locationY', 3);
    c = dizzy.resolve('coords');
    console.log(c.distanceFromOrigin()); // 5

    // Difference between dizzy.singleton() and dizzy.instance().
    function Cow() {
        this.speak = function () {
            console.log("Moo!");
        }
    }

    dizzy.instance('cow-instance', Cow);
    dizzy.singleton('cow-singleton', Cow);

    cow1 = dizzy.resolve('cow-instance');
    cow2 = dizzy.resolve('cow-instance');

    if (cow1 === cow2) {
        throw new Error('These will always be different')
    }

    cow1 = dizzy.resolve('cow-singleton', Cow);
    cow2 = dizzy.resolve('cow-singleton', Cow);

    if (cow1 !== cow2) {
        throw new Error('These will always be the same')
    }

This method is simply a helper shortcut to using `dizzy.register()`, and the code looks a lot like this:

    dizzy.instance = function (key, argsArray, classFn) {
        /* Detect the arguments array and make adjustments as needed.
         * That has been omitted from this example for brevity and clarity.
         */
        this.register(key, argsArray, function () {
            return new classFn();
        });
    };


### `dizzy.isRegistered(key)`

Returns a boolean indicating if the key is registered or not.

    dizzy.provide('day type', 'sunny');

    if (! dizzy.isRegistered('day type')) {
        throw new Error('The type of day was registered')
    }


### `dizzy.list()`

Returns an array of all registered values.

    dizzy.provide('testing', true);
    list = dizzy.list();
    console.log(list);  // [ 'testing' ]


### `dizzy.provide(key, value)`

Sets a given value for a key.  No dependencies will be injected.

    dizzy.provide('port', 8000);
    dizzy.provide('add', function (a, b) {
        return a + b;
    });

This acts as a shortcut for calling `dizzy.register()`.

    dizzy.provide = function (key, value) {
        this.register(key, [], function () {
            return value;
        });
    };


### `dizzy.register(key, [argsArray], factoryFn, [contextObj])`

Sets up a function as a factory.  This will automatically inject dependencies into the factory function.

When `argsArray` is omitted, the function's arguments are used instead.  The variable names will be the keys sought by the dependency injection system.

When `contextObj` is included, the function will be called with the given context.

    // Set up a value to inject
    dizzy.provide('name', 'John Doe');

    // Call register without an argument list.
    dizzy.register('person1', function (name) {
        return name;
    });
    result = dizzy.resolve('person1');
    console.log(result);  // "John Doe"

    // Same as above, but here we are explicitly citing the arguments to
    // inject
    dizzy.register('person2', [
        'name'
    ], function (x, y) {
        // y will be undefined because it was not specified in the
        // array of arguments.
        return x;
    });
    result = dizzy.resolve('person2');
    console.log(result);  // "John Doe"


### `dizzy.resolve(key)`

Instantiates an object, returns a provided value or executes a factory.  This injects all dependencies as well.

    dizzy = require('dizzy').container();
    dizzy.provide('Math', Math);
    object = dizzy.resolve('Math');
    console.log(typeof object.log); // function


### `dizzy.singleton(key, [argsArray], classFn)`

Sets up a class so an instance will be to be provided.  Shortcut method for using `dizzy.register()`.  This will return a single instance for all resolutions; it won't become a new instance.  If you prefer to have a new instance generated, check out `dizzy.instance()`.

    // Illustrate instantiation without an argsArray and
    // behavior of the singleton method.
    function Animal(name) {
        this.name = name;
    }

    dizzy.singleton('animal', Animal);
    dizzy.provide('name', 'Spot');
    animal1 = dizzy.resolve('animal');
    console.log(animal1.name);  // Spot

    // Notice how we change the name, but since "animal" is a singleton,
    // this didn't update the object.
    dizzy.provide('name', 'Rover');
    animal2 = dizzy.resolve('animal');
    console.log(animal1.name);  // Spot

    if (animal1 !== animal2) {
        throw new Error("These will always be identical instances")
    }

    // Redefine the animal singleton, this time using the argsArray.
    dizzy.singleton('animal-with-args-array', [
        'name'
    ], Animal);

Internally, the implementation of `dizzy.singleton()` is similar to this:

    dizzy.singleton = function (key, argsArray, classFn) {
        var instance;

        /* There's some magic here to make sure the arguments are right
         * and to detect the argument array if not specified.  It's not
         * included in this example.
         */
        this.register(key, argsArray, function () {
            if (! instance) {
                instance = new classFn();
            }

            return instance;
        });
    };


Future Work
-----------

Currently there are no events, though they are under consideration.  Proposed events are:

* `debug` - Debugging messages, useful for diagnostics and understanding how the dependencies are resolved.
* `warn` - Indications that you may be doing something wrong.
* `destroy` - Trigger cleanup behavior, such as removing timeouts and closing database connections.

The methods on the container should allow one to register a hash or a map of key/value pairs.

Clearing the cache or clearing all registered values may make testing easier.

Allowing for overrides in `dizzy.resolve()` and `dizzy.call()` would make testing easier.

Loading all files automatically would cut down on the amount of code.  Investigate [dependable.load()](https://github.com/Bruce17/dependable).


License
-------

Dizzy is licensed under a [MIT license](LICENSE.md).
