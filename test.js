// Unit tests
// run with expresso framework

var sys = require('sys');
var assert = require('assert');

var Chain = require('./chain');

// simple chain test
exports['simple-old'] = function(beforeExit) {

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

exports['simple'] = function(beforeExit) {

    var n = 0;
    // call without an object for basic chaining
    Chain.create(
        function() {
            setTimeout(Chain.next(), 10);
        },
        function() {
            n++;        
        }
    ).exec();
    
    beforeExit(function() {
        assert.equal(1, n, 'Ensure n was incremented');
    });
}

// wait on multiple callbacks
exports['multiple-next'] = function(beforeExit) {
    var n = 0;
    Chain.create(
        function() {
            setTimeout(Chain.next(), 500);
            setTimeout(Chain.next(), 10);
        },
        function() {
            n++;
        }
    ).exec();

    beforeExit(function() {
        assert.equal(1, n, 'Ensure n was incremented only once');
    });
}

exports['exception'] = function(beforeExit) {

    var n = 0;

    Chain.create(
        function() {
            setTimeout(Chain.next(), 100);
        },
        function() {
            throw Error('something bad happened');
        }
    ).catch( function(err) {
        n = 5;
    }).exec();

    beforeExit(function() {
        assert.equal(5, n, 'error callback was not called');
    });
}

exports['default-exception'] = function(beforeExit) {

    var n = 0;
    try {
        Chain.create(
            function() {
                setTimeout(Chain.next(), 100);
            }
        ).exec();
    } catch (err) {
        n = 5;
    }

    beforeExit(function() {
        assert.equal(5, n);
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
    Chain.create(
        function() {
            setTimeout(Chain.next(), 10, "2");
            magic += "1";
        },
        function(arg) {
            magic += arg;
            Chain.create(
                function() {
                    setTimeout(Chain.next(), 300, "4");
                    magic += "3";
                },
                function(arg) {
                    magic += arg;
                }
            ).exec();
        }
    ).exec();
    
    beforeExit(function() {
        assert.equal('1234', magic);
    });
}

exports['nested-throw'] = function(beforeExit) {

    var magic = "";
    Chain.create(
        function() {
            setTimeout(Chain.next(), 10, '2');
            magic += '1';
        },
        function(arg) {
            magic += arg;
            Chain.create(
                function() {
                    magic += '3';
                    throw Error(magic);
                    // is after the throw otherwise the next callback will be called
                    setTimeout(Chain.next(), 300, '4');
                },
                function(arg) {
                    magic += arg;
                    // should not be called
                    assert.equal(1, 0);
                }
            ).exec();
        }
    ).catch(function(err) {
        assert.equal('123', err.message);
    }).exec();
    
    beforeExit(function() {
        assert.equal('123', magic);
    });
}

// test complex interaction between two chains where callback order is interwined
exports['complex'] = function(beforeExit) {
    var magic = "";
    
    Chain.create(
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
    ).exec();
    
    Chain.create(
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
    ).exec();
    
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

/*
exports['multi'] = function(beforeExit) {

    var counter = 0;
    
    function finished() {
        assert.equal(10, counter);
    }

    Chain.create(
        function() {
            for ( i=0 ; i<12 ; ++i ) {
                setTimeout(Chain.multi(finished), i*2, i);
            }
        },
        function(multi, arg) {
            counter++;

            if (arg > 9) {
                throw Error("multi was not disabled properly");
            }

            // we exit on the 10th invoation
            // to test the finish paramter
            if (arg == 9) {
                multi.finish();
                Chain.next()(arg);
            }
        },
        function(arg) {
            // also called once
            assert.equal(9, arg);
        }
    ).exec();

    beforeExit(function() {
    });
}

exports['multi-exception'] = function(beforeExit) {

    var counter = 0;

    function finished() {
    }

    Chain.create(
        function() {
            for ( i=0 ; i<12 ; ++i ) {
                setTimeout(Chain.multi(), i*2, i);
            }
        },
        function(multi, arg) {
            if (arg > 5) {
                //throw Error("multi was not disabled properly");
                // this should probly stop the entire multi?
            }

            if (argv >= 11) {
                multi.finish();
            }
        }
    ).catch(function(err) {
        console.log("sd");
        // should be called only once
        counter++;
    }).exec();

    beforeExit(function() {
        assert.equal(1, counter);
    });
}
*/
