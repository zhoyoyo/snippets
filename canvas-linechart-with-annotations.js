// =========================================

// draw a canvas line chart with svg for text annotations & events

// story: https://qz.com/1553700/

// =========================================


renderGraphic({
	container: 'graphic-0',
	width: width,
	annotatedWords: words,
	events: true
});



function renderGraphic(config) {

	// Configuration

	// Calculate actual chart dimensions
	var width = config['width'];
	var aspectRatio = width < 600? 1 : 1.2;
	if (width <= 400) {aspectRatio = 0.8;}
	var height = Math.min(width/aspectRatio,650);

	var radius = width < 500? 1.5 : 2.5;
	var lineColor = '#969696';
	var canvasAlpha = config.width > 300 ? 0.25 : 0.15;

	var margins = {
		top: 15,
		right: 20,
		bottom: 30,
		left: width < 300 ? 10 : 5
	};

	var chartWidth = width - (margins['left'] + margins['right']);
	var chartHeight = height - (margins['top'] + margins['bottom']);

	// Clear existing graphic (for redraw)
	var containerElement = d3.select('#' + config['container']);
	if (containerElement.size() == 0) {
		containerElement = d3.select("#graphic")
		.append('div').attr('id', config['container']).attr('class','small');
	}
	containerElement.html('');

	// Create the root SVG element
	var chartWrapper = containerElement.append('div')
		.attr('class', 'graphic-wrapper');

	var chartElement = chartWrapper.append('svg')
		.attr('width', chartWidth + margins['left'] + margins['right'])
		.attr('height', chartHeight + margins['top'] + margins['bottom'])
		.append('g')
		.attr('transform', 'translate(' + margins['left'] + ',' + margins['top'] + ')');

	chartElement.append('rect').attr('class','overlay')
		.attr('width', chartWidth + margins['left'] + margins['right'])
		.attr('height', chartHeight + margins['top'] + margins['bottom']);

	chartWrapper.append('canvas')
		.attr('width', chartWidth + margins['left'] + margins['right'])
		.attr('height', chartHeight + margins['top'] + margins['bottom'])
		.style('width', chartWidth + margins['left'] + margins['right'])
		.style('height', chartHeight + margins['top'] + margins['bottom']);


	// PROJECT SPECIFIC
	var annotatedData = _.filter(dataNested, function(d) {
		return config.annotatedWords.indexOf(d.key.split(' ')[0]) !== -1;
	});

	yScale = d3.extent(data, function(d) {return d.freq;});


	var y = d3.scaleLinear()
			.domain(yScale)
			.range([chartHeight, margins.top]),
		x = d3.scaleLinear().domain([1989,2018])
			.range([0 ,chartWidth]);

	// 1. add in canvas layer of all lines (all words)

	var canvas = containerElement.select('canvas').node(),
		context = canvas.getContext('2d');
	
	context.clearRect(0, 0, 
		chartWidth+margins.left+margins.right, 
		chartHeight+margins.top+margins.bottom);

	var line = d3.line()
		.x(function(d) {return x(d.year);})
		.y(function(d) {return y(d.freq);})
		.curve(d3.curveBasis)
		.context(context);

	context.translate(margins.left, margins.top);
	var allPts = [];

	dataNested.forEach(function(d) {

		context.globalAlpha = canvasAlpha;

		context.strokeStyle = lineColor;

		context.beginPath();
		context.lineWidth = 1.5;
		line(d.values);
		context.stroke();

		context.beginPath();
		context.fillStyle = lineColor;
		context.arc(2018, y(d.values[d.values.length-1].freq), radius, 0, 2 * Math.PI, false);
		context.fill();
		d.values.forEach(function(x) {
			allPts.push([x.year, x.freq, d]);
		})

	})
	line.context(null); //for mouseover purpose


	// 2. axes
	var yticks = chartElement.append('g')
    	.attr("class", "axis axis-y")
    	.selectAll('g.tick')
    	.data([0,5,10,15])
    	.enter().append("g")
    	.attr('class','tick')
    	.attr('transform',function(d) {
    		return 'translate(0,' + y(d) + ')';
    	});

    yticks.append('text')
    	.attr('dy',-3)
    	.text(function(d) {
    		return formatPct(d);
    	})
    yticks.append('line')
    	.classed('baseline', function(d) {return d == 0 ? true : false;})
    	.attr('x2', chartWidth)

    var tks = config.width > 280? 5:4;
	chartElement.append("g")
    	.attr("class", "axis axis-x")
		.attr("transform", "translate(" + x(firstYearAxis+0.1) + "," + chartHeight + ")")
		.call(d3.axisBottom(x)
			.ticks(tks)
			.tickFormat(function(d) {
				return d;
		}))


	chartElement.select('.axis.axis-x')
		.append('text')
		.attr('class', 'label')
		.attr("transform", "translate(" + x(firstYearAxis+0.1)*-1 + "," + (-1*chartHeight+margins.top-5) + ")")
		.text(function(){
			return (config.container.split('-')[1] > 0) ? '' :'Mentions per 1,000 words';
		})


	// 3. add in svg layer of highlighted words (several words)
	var annotations;

	if (annotatedData.length > 0) {

		annotations = chartElement.append("g").attr('class','annotations visible')
			.selectAll('g.ann')
			.data(annotatedData).enter()
			.append('g')
			.attr('class',function(d,i){return 'ann ann-'+i});
		annotations.append('path')
			.attr('class',function(d,i) {return 'bg bg-'+i})
			.attr('d',function(d){
				return line(d.values);
			});
		annotations.append('path')
			.attr('class',function(d,i) {return 'fg-'+i})
			.attr('d',function(d){
				return line(d.values);
			});
		annotations.append('circle')
			.attr('class',function(d,i) {return 'fg-'+i})
			.attr('transform', function(d) {
				var xpos = x(2018),
					ypos = y(d.values[d.values.length-1].freq);
				return 'translate(' + xpos + "," + ypos + ')';
			})
			.attr('r', radius*1.2);

		annotations.append('text')
			.attr('class',function(d,i) {return 'bg bg-'+i})
			.attr('x', x(2018))
			.attr('y', function(d) {
				var chg = d.values[d.values.length-1].freq;
				var ypos = y(chg);
				return (chg < 0) ? (ypos + 20) : (ypos - 10);
			})
			.text(function(d) {
				return d.values[0].entity;
			});


		annotations.append('text')
			.attr('class',function(d,i) {return 'fg-'+i})
			.attr('x', x(2018))
			.attr('y', function(d) {
				var chg = d.values[d.values.length-1].freq;
				var ypos = y(chg);
				return (chg < 0) ? (ypos + 20) : (ypos - 10);
			})
			.text(function(d) {
				return d.values[0].entity;
			});


	}

	if (config.events) {

		// 4. add in svg layer of mouseovered word (one word)
		var highlightEl = chartElement.append('g')
			.attr('class','highlight');

		highlightEl.append('path').attr('class','bg');
		highlightEl.append('path');
		highlightEl.append('circle')
			.attr('r', radius*1.5)
			.attr('transform','translate(-10000,-10000)');
		highlightEl.append('text').attr('class','bg');
		highlightEl.append('text');

		if (annotatedData.length <= 1) { // disable events when two or more selected

			chartElement
				.on('mouseover', mouseoverChart)
				.on('mousemove', mouseMoveChart)
				.on('mouseout', mouseoutChart)

			if (isMobile) {
				chartElement.call(d3.drag()
					.on('start',dragged)
					.on("drag", dragged))
			}

		}


	}

	// 5. initialize searchbox

	function mouseMoveChart(chartEl){
		if (!isMobile) {
			var closest = getClosestByMouse();

			highlightLine(closest[2]);
		}
	}
	function mouseoutChart(chartEl){
		highlightEl.classed('visible',false)
		d3.selectAll('.annotations').classed('visible',true);
	}
	function mouseoverChart(chartEl){
		d3.selectAll('.annotations').classed('visible',false);
		highlightEl.classed('visible',true);
	}

	function dragged() {
		var closest = getClosestByMouse();
		highlightLine(closest[2]);
	}

	function getClosestByMouse() {
		var m = d3.mouse(chartElement.node()),
			year = x.invert(m[0]),
			roundedYear = Math.round(+year),
			freq = y.invert(m[1]);

		if (roundedYear == 2019) {roundedYear = 2018;}

		var ptsByYear = _.sortBy(_.filter(allPts, function(d) {
			return d[0] == roundedYear;
		}), function(x) {
			return Math.abs(x[1]-freq);
		});
		return ptsByYear[0];
	}

	function highlightLine(d) {
		if (d) {
			var xpos = x(2018),
				chg = d.values[d.values.length-1].freq,
				ypos = y(chg),
				entity = d.values[0].entity;


			highlightEl.selectAll('path')
				.attr("d", line(d.values));
			highlightEl.selectAll('circle')
				.attr('transform', "translate(" + xpos + ',' + ypos + ')');
			highlightEl.selectAll('text')
				.attr('x', xpos).attr('y',(chg <0) ? (ypos + 20) : (ypos - 10))
				.text(entity);
		}

	}



} // end of renderGraphic()

function formatPct(input) {
	return Math.round(input*10)/10;
}
