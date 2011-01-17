
// internal private state
// yes, it is global
// no, it isn't a problem because there is only one thread
// each proxy object saves the previous state and sets it back
var __next = function() {
    throw Error("Internal failure!");
};

// proxy object to maintain state for a single callback
// tracks counters for multi async events
function Proxy(realthis, callback, next) {
    var queue = 0;
    this.realthis = realthis;

    this.add = function() {
        queue += 1;
    }

    this.proc = function() {
        queue -= 1;
        if (queue != 0) {
            return;
        }

        // store the current dummy to set it back
        // this allows for nesting and other goodness
        var save = __next;
        __next = next;
        callback.apply(realthis, arguments);
        __next = save;
    }
}

// steps is an array of function callbacks
function Chain(realthis, steps) {

    // need to use temp object for prev because this is not accessible from
    // within the foreach loop
    var prev;

    // loop in reverse because we need to give the first items
    // the callback objects of items later in the queue
    steps.reverse().forEach( function(s) {
        prev = new Proxy(realthis, s, prev);
    });

    prev.add();
    prev.proc();
}

// 'static' method to be 'act' as the next callback
next = function() {
    if (!__next) {
        throw Error("No next element in the chain.");
    }

    // bind the variable into local scope
    var bind = __next;

    // if there are multiple invocations of 'next' then increment the proxy object counter
    // this allows us to wait on multiple async events to finish
    bind.add();
    return function() {
        // use apply and pass bind again to avoid splitting the arguments
        bind.proc.apply(bind, arguments);
    };
}

exec = function() {
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

    // run chain immediately
    return new Chain(realthis, steps);
}

exports.exec = exec;
exports.next = next;
