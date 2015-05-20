import d3 from 'd3';
import lodash from 'lodash';

var width = 400,
    height = 600;

var circles = _.times(10, () => {
    return {
        cx: Math.random() * width,
        cy: Math.random() * height,
        r: 20 + Math.random() * 20
    }
});

var chart = d3.select(".chart")
    .attr("width", 400)
    .attr("height", 600)
    .selectAll('circle')
        .data(circles)
        .enter().append("circle")
            .attr('cx', (d) => d.cx)
            .attr('cy', (d) => d.cy)
            .attr('r', (d) => d.r)
            .attr('class', 'bubble');
