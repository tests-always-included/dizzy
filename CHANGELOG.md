CHANGELOG
=========

2.0.4 - 2016-05-31
------------------

* Found and fixed a problem where an arrow function returned an object that utilized the syntax of a class function.  Mostly changed the order of the parsers, but also added a test to ensure it is fixed in the future as well.


2.0.3 - 2016-05-27
------------------

* The provider class now does type checking before instantiating a class and running functions, catching the errors closer to the problem, allowing for more accurate error messages.


2.0.2 - 2016-05-27
------------------

* Throws an error with the key name when there is a problem resolving something.


2.0.1 - 2016-05-06
------------------

* Allow `.fromModule()` to be passes a path and handle relative paths in a defined way.


2.0.0 - 2016-05-06
------------------

* New fluent interface, allowing for greater freedom in expressing the source of the value, how to treat the value, and extra options one can apply.


1.0.3 - 2016-04-25
------------------

* Addressed a problem where the argument matcher would continue well beyond the argument list.  Added a test and updated others.


1.0.2 - 2016-03-28
------------------

* Merged pull request #2 - remove use of spread operator to support older versions of Node.


1.0.1 - 2016-03-24
------------------

* Fixed #1 - Did not detect when an ES6 class did not have a constructor.


1.0.0 - 2016-03-23
------------------

* Initial release
