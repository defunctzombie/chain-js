
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

    this.add = function() {
        queue += 1;
    }

    this.disable = function() {
        callback = null;
    }

    // call the callback without incrementing queue
    this.exec = function() {
        if (!callback) {
            return;
        }
        var save = __next;
        __next = next;
        if (this.catcher) {
            if (__next)
                __next.catcher = this.catcher;
            try {
                callback.apply(chain_obj, arguments);
            } catch (err) {
                this.disable();
                this.catcher(err);
            }
        } else {
            callback.apply(chain_obj, arguments);
        }
        __next = save;
    }

    this.proc = function() {
        if (!callback) {
            return;
        }

        queue -= 1;
        if (queue != 0) {
            return;
        }

        // store the current dummy to set it back
        // this allows for nesting and other goodness
        var save = __next;
        __next = next;
        if (this.catcher) {
            if (__next)
                __next.catcher = this.catcher;
            try {
                callback.apply(chain_obj, arguments);
            } catch (err) {
                this.disable();
                this.catcher(err);
            }
        } else {
            callback.apply(chain_obj, arguments);
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
        prev.catcher = callback;
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
        return chain.error(cb);
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
