# Chain-js

## Overview

Chain-js is a simple library for chaining javascript async callbacks. The motivation is mainly that of syntax appearence when writing async heavy node.js applications. This is nothing more than a way to make one callback "depend" on another

Consider the common async callback example:

    db.open(function(err, db) {
        if (err) ...
        db.makeTable(function(err, table) {
            if (err) ...
            table.query(function(err, result) {
                ... do something with result
            });
        });
    });

This is a pretty common pattern and the nesting quickly gets out of hand, especially if you are already in a callback to begin with. Now, this isn't so much a limitation of doing asyncronous programing as it is a limitation of how you want to express what is happening. In the scenario shown, the callbacks are nested this way because they 'depend' on one another and their execution order matters. With chain this can be re-written to look clearner:

    chain(
        function() {
            db.open(Chain.next());
        },
        function(err, db) {
            if (err) ...
            db.makeTable(Chain.next());
        },
        function(err, table) {
            if (err) ...
            table.query(Chain.next());
        },
        function(err, result) {
            ... do something with result
        }
    );

While the number of code lines has increased (an unfortuate side effect of javascript syntax), the flow of execution is more clear to the reader.

Chain is similar to flow-js (willconant/flow-js) and step (github.com/creationix/step) with the major difference being avoiding the use of 'this' for control flow and added exception handling for the callbacks.

## Examples

### Waiting for multiple callbacks to finish

By using more than one next() call, Chain will wait for all the callbacks to finish before triggering the next callback in the chain.

    chain(
        function() {
            setTimeout(Chain.next(), 500);
            setTimeout(Chain.next(), 10);
        },
        function() {
            // this is called only when both timeouts are done
        }
    );

The syntax for mutliple callbacks is the same as single and chain handles the logic for you. If you ever have to remove a callback, you don't have to change how you invoke chain.

### Reuse a chain

You can define a chain and store it into a variable to be called like a function

    var do_something = chain.define(
        function(input_arg, callback) {
            setTimeout(Chain.next(), 10);

            this.str = 'hello ';

            // store the callback and input to be used in next step
            this.cb = callback;
            this.input = input_arg;
        },
        function(arg) {
            this.str += this.input_arg;
            this.cb();
        }
    );

    // the variable can be treated just like a function
    do_something('world', ...);
    do_something('cat', ...);

