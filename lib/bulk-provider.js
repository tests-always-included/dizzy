'use strict';

module.exports = () => {
    /**
     * Manages a set of DizzyProvider objects.  Methods called on this
     * object will be called on all child objects.
     */
    class BulkProvider {
        /**
         * Hooks up all of the methods to call through to each of the
         * providers in the set.
         */
        constructor() {
            this.providerSet = [];

            [
                'asFactory',
                'asInstance',
                'asValue',
                'cached',
                'fromContainer',
                'fromModule',
                'fromValue',
                'resolve',
                'withContext'
            ].forEach(methodName => {
                this[methodName] = this.chainMethod(methodName);
            });
        }

        /**
         * Adds a provider to the list
         *
         * @param {DizzyProvider} provider
         */
        addProvider(provider) {
            this.providerSet.push(provider);
        }

        /**
         * Creates a function that will call a method on all providers
         * in the set.
         *
         * @param {string} methodName
         * @return {Function}
         */
        chainMethod(methodName) {
            /**
             * Calls the same method on all children, passing along all
             * of the arguments passed in.
             *
             * Do not use an arrow function.
             *
             * @param {*} args...
             * @return {this}
             */
            return function() {
                var args;

                if (arguments.length) {
                    args = [].slice.call(arguments);
                } else {
                    args = null;
                }

                // This function generates methods, so this is not invalid.
                /* eslint no-invalid-this:off */
                this.forEach(provider => {
                    provider[methodName].apply(provider, args);
                });

                return this;
            };
        }

        /**
         * Call a function, providing each provider in the set.
         *
         * Callback is called with (provider).
         *
         * @param {Function} callback
         */
        forEach(callback) {
            this.providerSet.forEach(callback);
        }
    }

    return BulkProvider;
};
