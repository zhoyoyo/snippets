// =========================================

// draw svg stroke with changing thickness, color and opacity

// example: https://twitter.com/zhoyoyo/status/1063105971084541954
// story: https://qz.com/1455671/

// =========================================


function drawGraphic(){
	
	var width = GRAPHIC_CONTAINER.node().getBoundingClientRect().width;
	var height = width*0.75;

	var colorScale = d3.scaleLinear().domain([0,1]).range(['#EEEEEE','#d365ba']),
		colorlessScale = d3.scaleLinear().domain([0,1]).range(['#EEEEEE','#DDDDDD']),
		strokeScale = d3.scaleLinear().domain([0,1]).range([1,10]);
	
	var svg = GRAPHIC_CONTAINER.append('svg')
		.attr('width', width)
		.attr('height', height)
		.append('g').attr('class','svg')
		.attr('transform','translate(' + margin.left + ',' + margin.top+ ')')


	var xScale = d3.scaleLinear().domain([0,22.5]).range([margin.left,width - margin.right]),
		yScale = d3.scaleLinear().domain([0,60]).range([height - margin.bottom, margin.top]);

	var lines = svg.selectAll('.line')
		.data(data).enter().append('g')
		.attr('class',function(d){
			return d.country + ' line';
		});

	lines
		.append('line')
		.attr('x1', function(d){return xScale(d.circ12);})
		.attr('x2', function(d){return xScale(d.circ15);})
		.attr('y1', function(d){return yScale(d.use12);})
		.attr('y2', function(d){return yScale(d.use15);})
		.style('opacity',0)

	lines.each(function(d,i) {

		var thisNode = d3.select(this);
		var pLen = thisNode.select('line').node().getTotalLength(),
			numOfLines = Math.ceil(pLen/3);

		for (var i = 0; i < numOfLines; i++) {
			thisNode.append('line')
				.attr('x1', xScale(d.circ12))
				.attr('x2', xScale(d.circ15))
				.attr('y1', yScale(d.use12))
				.attr('y2', yScale(d.use15))
				.style('stroke-width', strokeScale((i+1)/numOfLines))
				.style('stroke-dasharray', pLen*(numOfLines - i - 1)/numOfLines + ', ' + pLen)
				.style('stroke-dashoffset', pLen*(numOfLines - i - 1)/numOfLines+0.01-pLen)
				.style('stroke',function(){
					if (d.circ12 > d.circ15 && d.use12 < d.use15) {
						return colorScale((i+1)/numOfLines);
					} else {
						return colorlessScale((i+1)/numOfLines);
					}
				})
		}
	})


}

