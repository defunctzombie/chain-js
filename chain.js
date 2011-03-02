
// internal private state
// yes, it is global
// no, it isn't a problem because there is only one thread
// each proxy object saves the previous state and sets it back
var __next = function() {
    throw Error('Internal failure!');
};

// proxy object to maintain state for a single callback
// tracks counters for multi async events
function Proxy(realthis, callback, next) {
    var queue = 0;
    this.realthis = realthis;

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
                callback.apply(realthis, arguments);
            } catch (err) {
                this.disable();
                this.catcher(err);
            }
        } else {
            callback.apply(realthis, arguments);
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
                callback.apply(realthis, arguments);
            } catch (err) {
                this.disable();
                this.catcher(err);
            }
        } else {
            callback.apply(realthis, arguments);
        }
        __next = save;
    }
}

// steps is an array of function callbacks
function Chain(realthis, steps) {

    var prev;

    // loop in reverse because we need to give the first items
    // the callback objects of items later in the queue
    steps.reverse().forEach(function(s) {
        prev = new Proxy(realthis, s, prev);
    });

    prev.add();

    // start chain execution
    this.exec = function() {
        prev.proc();
    }

    this.catch = function(callback) {
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

/*
// Multi allows the user to control termination
function Multi(bind, callback) {
    this.finish = function() {
        bind.disable();
        callback();
    }
}

multi = function(finished_callback) {
    if (!__next) {
        throw Error('No next element in the chain.');
    }

    var bind = __next;

    if (finished_callback) {
        var multi = new Multi(bind, finished_callback);
        return function() {
            var args = Array.prototype.slice.call(arguments);
            bind.exec.apply(bind, [multi, args]);
        };
    }

    return function() {
        bind.exec.apply(bind, arguments);
    };
};
*/

create = function() {
    var argarr = Array.prototype.slice.call(arguments);

    if (argarr.length == 0) {
        return;
    }

    // if the first argument is an object, then use that for the 'this'
    // to all the callbacks, otherwise, no 'this' needed
    var realthis = null;
    if (typeof argarr[0] == 'object') {
        realthis = argarr.shift();
    }

    // the callbacks
    var steps = argarr;

    // return the created chain
    return new Chain(realthis, steps);
};

// backwards compatibility/convenience
// immedately execute the given chain
exports.exec = function() {
    return create.apply(null, arguments).exec();
}

exports.create = create;
exports.next = next;
//exports.multi = multi;
