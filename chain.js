
// internal private state
// yes, it is global (to the module)
// no, it isn't a problem because there is only one thread
// each proxy object saves the previous state and sets it back
var __next = function() {
    throw Error('Internal failure!');
};

// proxy object to maintain state for a single callback
// tracks counters for multi async events
function Proxy(chain_obj, callback, next) {
    var queue = 0;
    var self = this;

    self._error_handler;

    self.add = function() {
        queue += 1;
    }

    self.disable = function() {
        self.error_handler = null;
    }

    Object.defineProperty(this, 'error_handler', {
        get: function() {
            return self._error_handler;
        },
        set: function(cb) {
            self._error_handler = cb;
            if (next) {
                next.error_handler = cb;
            }
        },
    });

    self.proc = function() {
        if (!callback) {
            return;
        }

        queue -= 1;
        if (queue != 0) {
            return;
        }

        var save = __next;
        __next = next;

        var args = Array.prototype.slice.call(arguments);

        if (self.error_handler) {
            // mungle first argument
            var error = args.shift();

            // if it was an error, call error handler
            if (error && error instanceof Error) {
                return self.error_handler.call(chain_obj, error);
            }
        }

        try {
            callback.apply(chain_obj, args);
        } catch (err) {

            // put back the next callback
            __next = save;

            self.disable();
            if (self.error_handler) {
                return self.error_handler.call(chain_obj, err);
            }

            // no error handler, rethrow
            throw err;
        }

        __next = save;
    }
}

// steps is an array of function callbacks
function Chain(steps) {

    var self = this;
    var prev;

    // loop in reverse because we need to give the first items
    // the callback objects of items later in the queue
    steps.reverse().forEach(function(s) {
        prev = new Proxy(self, s, prev);
    });

    // start chain execution
    self.exec = function() {
        prev.add();
        prev.proc.apply(prev, arguments);
    }

    self.error = function(callback) {
        prev.error_handler = callback;
        return this;
    }
}

// 'static' method to be 'act' as the next callback
next = function() {
    if (!__next) {
        throw Error('No next element in the chain.');
    }

    // bind the variable into local scope
    var bind = __next;

    // if there are multiple invocations of 'next' then
    // increment the proxy object counter
    // this allows us to wait on multiple async events to finish
    bind.add();
    return function() {
        // use apply and pass bind again to avoid splitting the arguments
        bind.proc.apply(bind, arguments);
    };
};

var define = function() {
    var steps = Array.prototype.slice.call(arguments);

    if (steps.length == 0) {
        throw new Error('cannot define a chain with no steps');
    }

    // return the created chain
    var chain = new Chain(steps);

    var func_proc = function() {
        chain.exec.apply(chain, arguments);
    };

    func_proc.error = function(cb) {
        // define error on the chain object
        chain.error(cb);
        return func_proc;
    };

    // achieve () execution by returning a function
    return func_proc;
};

// immediate execution
module.exports = function() {
    return define.apply(null, arguments)();
};

module.exports.define = define;
module.exports.next = next;
