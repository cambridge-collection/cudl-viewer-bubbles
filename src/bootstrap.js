// Seems like the polyfill has to be imported before the rest of the code...
require("babel/polyfill");
// Ensure we can use console.xxx() on IE without breaking
require('console-polyfill');

require('../style/similarity.less');
require('./index');
