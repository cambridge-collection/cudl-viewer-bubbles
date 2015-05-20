import d3 from 'd3';

var chart = d3.select(".chart")
    .attr("width", 400)
    .attr("height", 600)
  .append("circle")
    .attr('cx', 60)
    .attr('cy', 60)
    .attr('r', 25)
    .attr('class', 'bubble');
