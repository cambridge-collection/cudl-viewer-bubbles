# CUDL Viewer Bubbles

This repository contains the bubble similarity view shown in the CUDL Viewer's
similar items tab.

It uses [D3](http://d3js.org/) with a
[custom](src/views/bubbles/bubblelayout.js)
[layout](https://github.com/mbostock/d3/wiki/Layouts) to represent similar
items as bubbles sized in proportion to their level of similarity.

The project is compiled as a library by [Webpack](http://webpack.github.io/).
It exports itself as a function on the global `cudl` object provided by the
CUDL Viewer, and assumes the presence of existing CUDL Viewer dependencies such
as jQuery.

It's integrated with the CUDL Viewer UI by including this module in the 
package.json.  

## Developing

Run `$ npm install` to install the modules required. 


## Building

NOTE: Running `$ webpack` by itself will result in a configuration error as this
module should be configured from the cudl-viewer-ui module and cannot be separately
run. 


## Releasing a version

1. Build as per previous instructions
2. Commit and tag the commit with the version in `package.json`
3. Update the version used in 'cudl-viewer-ui'

