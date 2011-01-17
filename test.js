// Unit tests
// run with expresso framework

var sys = require('sys');
var assert = require('assert');

var Chain = require('./chain');

// simple chain test
exports['simple'] = function(beforeExit) {

    var n = 0;
    // call without an object for basic chaining
    Chain.exec(
        function() {
            setTimeout(Chain.next(), 10);
        },
        function() {
            n++;        
        }
    );
    
    beforeExit(function() {
        assert.equal(1, n, 'Ensure n was incremented');
    });
}

// wait on multiple callbacks
exports['multi'] = function(beforeExit) {
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
    beforeExit(function() {
        assert.equal(1, n, 'Ensure n was incremented only once');
    });
}

// simple callback test to make sure 'this' is used correctly
exports['simple-object'] = function(beforeExit) {

    var testObj = { 'chain': 'chain!' };
    
    Chain.exec(testObj,
        function() {
            setTimeout(Chain.next(), 10);
            this.chain += "1";
        },
        function() {
            this.chain += "2";
        }
    );

    beforeExit(function() {
        assert.equal('chain!12', testObj.chain);
    });
}

exports['nesting'] = function(beforeExit) {

    var magic = "";
    Chain.exec(
        function() {
            setTimeout(Chain.next(), 10, "2");
            magic += "1";
        },
        function(arg) {
            magic += arg;
            Chain.exec(
                function() {
                    setTimeout(Chain.next(), 300, "4");
                    magic += "3";
                },
                function(arg) {
                    magic += arg;
                }
            );
        }
    );
    
    beforeExit(function() {
        assert.equal('1234', magic);
    });
}

// test complex interaction between two chains where callback order is interwined
exports['complex'] = function(beforeExit) {
    var magic = "";
    
    // can also pass 'this' (or any object)
    // the object passed will become the 'this'
    // within the callbacks 
    Chain.exec(
        function() {
            setTimeout(Chain.next(), 100);
            magic += "1";
        },
        function(arg) {
            setTimeout(Chain.next(), 200);
            magic += "5";
        },
        function() {
            magic += "6";
        }
    );
    
    Chain.exec(
        function() {
            setTimeout(Chain.next(), 10);
            magic += "2";
        },
        function() {
            setTimeout(Chain.next(), 10);
            magic += "3";
        },
        function() {
            magic += "4";
        }
    );
    
    beforeExit(function() {
        assert.equal('123456', magic);
    });
}

exports['reuse'] = function(beforeExit) {
    
    var obj1 = { "obj": "1" };
    var obj2 = { "obj": "2" };
   
    var makeString = function(obj) {
        Chain.exec(obj,
            function() {
                setTimeout(Chain.next(), 10);
                this.str = "hello ";
            },
            function() {
                this.str += "world!";
            }
        );
    };

    makeString(obj1);
    makeString(obj2);
    
    beforeExit(function() {
        assert.equal('hello world!', obj1.str);
        assert.equal('1', obj1.obj);
        assert.equal('hello world!', obj2.str);
        assert.equal('2', obj2.obj);
    });
}


