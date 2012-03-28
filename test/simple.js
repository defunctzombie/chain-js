var assert = require('assert');

var chain = require('..');

test('basic', function(done) {

    // call without an object for basic chaining
    chain(
        function() {
            process.nextTick(chain.next());
        },
        function() {
            process.nextTick(chain.next());
        },
        function() {
            done();
        }
    );
});

test('arguments', function(done) {

    // pass arguments to chain
    chain.define(
        function(magic_num, magic_string) {
            assert.equal(magic_num, 5);
            assert.equal(magic_string, 'cat');
            process.nextTick(chain.next());
        },
        function() {
            done();
        }
    )(5, 'cat');
});

// wait on multiple async ops before executing next in line
test('multiple wait', function(done) {
    chain(
        function() {
            setTimeout(chain.next(), 10);
            setTimeout(chain.next(), 5);
        },
        function() {
            done();
        }
    );
});

// multiple chains inside one another
test('nesting', function(done) {
    var magic = "";
    chain(
        function() {
            process.nextTick(chain.next());
            magic += '1';
        },
        function(arg) {
            magic += '2';
            var next = chain.next();
            chain(
                function() {
                    process.nextTick(chain.next());
                    magic += '3';
                },
                function(arg) {
                    magic += '4';
                    next();
                }
            );
        },
        function() {
            assert.equal('1234', magic);
            done();
        }
    );
});

// test complex interaction between two chains where callback order is interwined
test('interlaced', function(done) {
    var magic = '';

    chain(
        function() {
            setTimeout(chain.next(), 25);
            magic += '1';
        },
        function(arg) {
            setTimeout(chain.next(), 20);
            magic += '5';
        },
        function() {
            magic += '6';
            assert.equal('123456', magic);
            done();
        }
    );

    chain(
        function() {
            setTimeout(chain.next(), 10);
            magic += '2';
        },
        function() {
            setTimeout(chain.next(), 10);
            magic += '3';
        },
        function() {
            magic += '4';
        }
    );
});

test('reuse', function(done) {
    var string_maker = chain.define(
        function(count, cb) {
            this.my_string = '';
            this.cb = cb;

            for (var i=0 ; i<count ; ++i) {
                this.my_string += count;
            }

            // do something
            process.nextTick(chain.next());
        },
        function() {
            this.cb(this.my_string);
        }
    );

    string_maker(4, function(string) {
        assert.equal(string, '4444');
        string_maker(2, function(string) {
            assert.equal(string, '22');
            done();
        });
    });
});

// no error handler
test('error', function(done) {
    chain(
        function() {
            setTimeout(chain.next(), 10, new Error('test error'));
        },
        function(err) {
            assert.equal(err.message, 'test error');
            done();
        }
    )
});

// test having an error handler
test('error-handler', function(done) {
    chain.define(
        function() {
            setTimeout(chain.next(), 5, null, 'result');
        },
        function(result) {
            // when we have an error handler, it consumes the first arg
            assert.equal('result', result);

            setTimeout(chain.next(), 5, new Error('test error'));
        },
        function() {
            // should never get here
            assert.equal(false, true);
        }
    ).error(function(err) {
        assert.equal(err.message, 'test error');
        done();
    })();
});
