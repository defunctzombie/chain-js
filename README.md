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

    Chain.exec(
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

Chain is similar to flow-js (willconant/flow-js) and step (github.com/creationix/step) but it has one difference over the others; it does not stomp on your 'this' variable. This allows for Chain to be used inside member functions or passed objects to operate on. Look at the examples section or the test files in the source tree for more complete uses.

## Examples

### Waiting for multiple callbacks to finish

By using more than one next() call, Chain will wait for all the callbacks to finish before triggering the next callback in the chain.
    
    var n = 0;
    Chain.exec(
        function() {
            setTimeout(Chain.next(), 500);
            setTimeout(Chain.next(), 10);
        },
        function() {
            n++;
        }
    );

    // n will only be incremented once

The syntax for mutliple callbacks is the same as single and chain handles the logic for you. If you ever have to remove a callback, you don't have to change how you invoke chain.

### Passing an object to operate on

Chain can also take an object as the first argument. If this is the case, that object will become the 'this' inside of the callbacks. This allows for chain to be used inside of member variables as well being invoked on an arbitraty object.
    
    var testObj = { 'chain': '' };
    
    Chain.exec(testObj,
        function() {
            setTimeout(Chain.next(), 10);
            // inside the chain, the 'this' keyword refers to the passed in object
            this.chain += "1";
        },
        function() {
            this.chain += "2";
        }
    );

    // testObj.chain will be '12' after the second callback finishes
    // notice that testObj was passed in as the first parameter
    // to use Chain in a member function just pass 'this' as the first parameter

### Reuse a chain

By wrapping the exec in a function you can create reusable chains very easily.

    var obj1 = { };
    var obj2 = { };
   

    var helloWorld = function(obj) {
        Chain.exec(obj
            function() {
                setTimeout(Chain.next(), 10);
                this.str = "hello ";
            },
            function(arg) {
                this.str += "world!";
            }
        );
    );

    helloWorld(obj1);
    helloWorld(obj2);

    // obj1.str and obj2.str now are 'hello world!'
