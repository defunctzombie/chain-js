var Mocha = require('mocha');

var mocha = new Mocha;
mocha.reporter('list').ui('qunit');

mocha.addFile('test/simple.js');

mocha.run();

