// =========================================

// draw trunck, draw branches, draw leaves and flowers, draw birds

// view: https://twitter.com/zhoyoyo/status/1065256282079354880
// story: https://qz.com/1465393/

// =========================================

function drawTree(d,i){


	var container = d3.select('.tree-' + i)
		.append('svg')
		.attr('width', treeFrameWidth)
		.attr('height', treeFrameHeight)
		.append('g')
		.attr('transform','translate(' + margin.left + ',' + margin.top + ')');

	var gradient = container.append('defs')
		.append('linearGradient')
		.attr('id','gradient')
		.attr('gradientUnits', 'userSpaceOnUse')
		.attr('x1',0)
		.attr('y1', 10)
		.attr('x2',20)
		.attr('y2', 10)

	gradient.append('stop')
		.attr('offset','0%')
		.style('stop-color', '#327836');

	gradient.append('stop')
		.attr('offset','100%')
		.style('stop-color', '#96B988');


	var gradient2 = container.append('defs')
		.append('radialGradient')
		.attr('id','gradient-pink')

	gradient2.append('stop')
		.attr('offset','20%')
		.style('stop-color', '#e27acf');

	gradient2.append('stop')
		.attr('offset','100%')
		.style('stop-color', '#e54cc8');


	var gradient3 = container.append('defs')
		.append('radialGradient')
		.attr('id','gradient-blue')

	gradient3.append('stop')
		.attr('offset','20%')
		.style('stop-color', '#51b2e5');

	gradient3.append('stop')
		.attr('offset','100%')
		.style('stop-color', '#168dd9');


	drawTrunk(d,container)
	drawBranch(d,container)


}

function drawTrunk(d,container){

	var trunk = container.append('g')
		.attr('class','trunk')
		//anchor point at the bottom center of the tree
		.attr('transform', 'translate(' + (treeFrameWidth - margin.left - margin.right)/2 + ',' + (treeFrameHeight - margin.top - margin.bottom) + ')')

	var line = d3.line().curve(d3.curveBasis);
	var treeTrunkHeight = treeHeightScale(d.revenue_trunk_sqrt),
		treeTrunkWidth = Math.max(treeTrunkHeight/10, trunkTopGapWidth*1.5);


	var allPts = [
		[treeTrunkWidth/-2, 0], //bottom left
		[treeTrunkWidth/-2 /2, treeHeightScale(d.revenue_trunk_sqrt)*0.2*-1], // center point
		[trunkTopGapWidth*-1/2, treeHeightScale(d.revenue_trunk_sqrt) * -1],
		[trunkTopGapWidth*1/2, treeHeightScale(d.revenue_trunk_sqrt) * -1],
		[treeTrunkWidth/2 /2, treeHeightScale(d.revenue_trunk_sqrt)*0.2*-1],
		[treeTrunkWidth/2, 0]

	];


	trunk.append('g')
	.attr('class','contour')
	.append('path')
	.attr('d', line(allPts))

}

function drawBranch(d,container){

	var branchColor = d3.scaleSequential(function(t) {
		var x = t/6+0.3;
		// x = 0.5;
			return d3.rgb(25*x,255*x,255*x);
		});

	var branches = container.append('g')
		.attr('class','branches')
		//anchor point to the top of the trunk
		.attr('transform', 'translate(' + (treeFrameWidth - margin.left - margin.right)/2 + ',' + (treeFrameHeight - margin.top - margin.bottom - treeHeightScale(d.revenue_trunk_sqrt) + 20) + ')')

	var branchHeight = branchHeightScale(d.year_of_exsitence), //(treeFrameHeight - margin.top - margin.bottom)/6,
		branchSpreadAngle = d.tree == 'Amazon' ? 40 * Math.PI/180 : 30 * Math.PI/180,
		branchWidth = branchHeight * Math.tan(branchSpreadAngle);

	var jitter1 = Math.random()*branchWidth/4,
		jitter2 = Math.random()*branchWidth/8;

	var line = d3.line().curve(d3.curveBasis);

	if (d.branch_services !== 0) {


		//branch 1
		var branch1Pts = [
				[0,0],
				[branchWidth/3 - jitter1 - jitter2, branchHeight/-3],
				[branchWidth/3*2 + jitter1, branchHeight/-3*2],
				[branchWidth, branchHeight*-1]
			];

		var b1 = branches.append('g')
			.attr('class','branch branch-1');
		b1.append('path')
			.attr('class','branch-path')
			.attr('d', line(branch1Pts));


		//branch 2
		var jitter1 = Math.random()*branchWidth/4,
			jitter2 = Math.random()*branchWidth/8;

		var branch2Pts = [
			[0,-1*trunkTopGapWidth],
			[branchWidth/-3 + jitter1 + jitter2, branchHeight/-5],
			[branchWidth/-3*2 - jitter2, branchHeight/-5*3],
			[branchWidth/-1, branchHeight/-5*4 * (Math.random()/5 + 0.8)]
		];

		var b2 = branches.append('g')
		.attr('class','branch branch-2')
		
		b2.append('path')
		.attr('class','branch-path')
		.attr('d', line(branch2Pts))

		// add stroke gradient

		branches.selectAll('.branch')
		.each(function(x){
			var thisPath = d3.select(this).select('path').node();
			thisPath.remove();

			var nodeData = quads(samples(thisPath,5));

			var branchNodes = d3.select(this)
				.selectAll(".node")
				.data(nodeData)
				.enter().append('g')
				.attr('class','node')

			branchNodes.append('path')
				.attr('class',function(d,i) {return 'node-' + i;})
				.style('stroke-width',function(d){return trunkTopGapWidth*0.7 * (1-d.t) + 'px';})
		    	.style("stroke", function(d) { return branchColor(d.t); })
		    	.attr("d", function(d) { return lineJoin(d[0], d[1], d[2], d[3], 1); });
		})

		// calculate the number of leaves for each node

		var nodeNum = branches.selectAll('.node').size();
		var leaves = ((+d.title_movie_leaves) + (+d.title_tv_leaves))/10;

		var config = {
			drawnLeavesPerNode: 0,
			drawnLeaves:0,
			leaves : leaves,
			radius: treeFrameHeight/180,
			newNodes: [],
			leavesPerNode: Math.ceil(leaves/nodeNum),
			newBranchNum: 3
		};


		if (config.leavesPerNode < config.newBranchNum) {
			config.newBranchNum = config.leavesPerNode;
		}

		if (config.leavesPerNode > 0) {

			var numOfTV = Math.round(d.title_tv_leaves / (d.title_movie_leaves + d.title_tv_leaves)*config.leavesPerNode),
				numOfTVo = Math.round(d.title_tvo_leaves / d.title_tv_leaves * numOfTV),
				numOfMovie = config.leavesPerNode - numOfTV,
				numOfMovieo = Math.round(d.title_movieo_leaves / d.title_movie_leaves * numOfMovie);


			var actualNumOfTVo = [], 
				actualNumOfMovieo = [], 
				tvoNodes = [], 
				movieoNodes = [];

			var nodeArray = d3.range(config.leavesPerNode),
				tvNodes = _.sampleSize(nodeArray, numOfTV),
				movieNodes = _.without(nodeArray, tvNodes);

			if ((numOfTVo == 0 || numOfTVo == 1) && d.title_tvo_leaves!==0) {
				actualNumOfTVo = _.sampleSize(d3.range(leaves),Math.ceil(d.title_tvo_leaves/10));
			} else {
				tvoNodes = _.sampleSize(tvNodes, numOfTVo);
			}

			if (numOfMovieo == 0 && d.title_movieo_leaves!==0) {
				actualNumOfMovieo = _.sampleSize(d3.range(leaves),Math.ceil(d.title_movieo_leaves/10));
			} else {
				movieoNodes =  _.sampleSize(movieNodes, numOfMovieo);
			}


			var nodeIndex = {
					tv : tvNodes, 
					movieo : movieoNodes, 
					tvo : tvoNodes,
					actualMovieo : actualNumOfMovieo,
					actualtvo: actualNumOfTVo
				};


			branches.selectAll('.node')
				.each(function(x, i) {

					config.startAngle = Math.random() * Math.PI/180 * 10 * i;
					config.drawnLeavesPerNode = 0;

					var thisNode = d3.select(this);
					var _x,_y;

					if (x[0]) {
						_x = x[0][0];
						_y = x[0][1];
					} else {
						_x = x[1][0];
						_y = x[1][1];

					}

					// add leaves on each node,
					// put the start position into config.newNode

					config.newNodes = [[_x,_y]];

					addPoints(thisNode, config, branchWidth, branchHeight, nodeIndex);
				})

		}


	}

	branches.selectAll('.branch-2 .node').raise();
	branches.selectAll('.branch-1 .node').raise();
	branches.selectAll('.original').raise();

}


function addPoints(thisNode, config, branchWidth, branchHeight, nodeIndex){

	config.branchLength = Math.random()*2 + 12 * Math.pow(config.leavesPerNode / (config.drawnLeavesPerNode + 1), 0.4);//30 / Math.pow(, 0.2);//10 + 5 * Math.pow(config.leavesPerNode,0.2);

	//reset newNode
	var nodes = config.newNodes;
	config.newNodes = [];

	// if enough leaves are drawn, exit
	if (config.drawnLeavesPerNode >= config.leavesPerNode) {return;}

	nodes.forEach(function(d) {

		for (var i = 0; i < config.newBranchNum; i++) {

			if (config.drawnLeavesPerNode >= config.leavesPerNode) {return;}

			var ptX = d[0] + Math.cos(config.startAngle + i*Math.PI*2/config.newBranchNum) * config.branchLength,
				ptY = d[1] + Math.sin(config.startAngle + i*Math.PI*2/config.newBranchNum) * config.branchLength - config.branchLength;


			if (nodeIndex.tvo.indexOf(config.drawnLeavesPerNode) == -1  && 
				nodeIndex.movieo.indexOf(config.drawnLeavesPerNode) == -1 &&
				nodeIndex.actualtvo.indexOf(config.drawnLeaves) == -1 &&
				nodeIndex.actualMovieo.indexOf(config.drawnLeaves) == -1 && config.leavesPerNode > 1) {
				// not original

				var dir = ptX > 0 ? -1 : 1;

				thisNode
				.append('path')
				.attr('d', "M14.55,0.6c-1.34,0.06-2.63,0.34-3.89,0.73c-1.94,0.6-3.64,1.54-5.09,2.83C4,5.57,2.93,7.26,2.17,9.12 c-0.62,1.53-1.15,3.13-1.4,4.73c-0.22,1.47-0.38,2.93-0.38,4.41l0.08,1.22c1.14-0.16,4.87-0.93,7.3-1.57 c2.58-0.68,4.94-2.04,6.95-3.65c1.81-1.46,3.09-3.21,3.81-5.29c0.4-1.16,0.6-2.35,0.65-3.56c0.03-0.86-0.04-1.72-0.38-2.54 c-1.08-1.58-1.43-1.64-2.31-2.03C15.86,0.62,15.21,0.57,14.55,0.6z M11.12,3.59c0,0.02,0,0.03,0,0.05c0,0.15-0.13,0.29-0.3,0.31 C9.09,4.18,5.98,7.74,5.61,9.23C5.57,9.4,5.38,9.51,5.19,9.47C5,9.44,4.88,9.27,4.92,9.1c0.39-1.59,3.59-5.48,5.8-5.77 C10.91,3.3,11.09,3.42,11.12,3.59z")
				.style('opacity', function(d) {
					return.8*(1-config.drawnLeavesPerNode/config.leavesPerNode) + 0.2;
				})
				.attr('class', function(){
					if (nodeIndex.tv.indexOf(config.drawnLeavesPerNode) > -1) {return 'leaf tv';}
					else {return 'leaf movie';}
				})
				.style('fill','url(#gradient)')
				.attr('transform','translate(' + ptX + ',' + ptY + ') scale(' + dir*(Math.random()*0.5 + 0.5) + ',' + (Math.random()*0.5 + 0.5) + ')')

			} else {

				thisNode.classed('original', true);
				thisNode
				.append('path')
				.attr('d', "M21.04,4.11L21.04,4.11L21.04,4.11c4.54-2.16,9.29,2.58,7.13,7.13l0,0l0,0c4.74,1.69,4.74,8.39,0,10.08l0,0l0,0 c2.16,4.54-2.58,9.29-7.13,7.13l0,0l0,0c-1.69,4.74-8.39,4.74-10.08,0l0,0l0,0c-4.54,2.16-9.29-2.58-7.13-7.13l0,0l0,0 c-4.74-1.69-4.74-8.39,0-10.08l0,0l0,0C1.67,6.7,6.42,1.95,10.96,4.11l0,0l0,0C12.65-0.63,19.35-0.63,21.04,4.11z")
				.attr('transform','translate(' + ptX + ',' + ptY + ') scale(0.35,0.35)')
				.style('fill-opacty', function(){
					return Math.random()*0.5 + 0.5;
				})
				.style('fill',function(){
					if (nodeIndex.tvo.indexOf(config.drawnLeavesPerNode) > -1 ||
						nodeIndex.actualtvo.indexOf(config.drawnLeaves) > -1) {
						return 'url(#gradient-blue)';}
					else {return 'url(#gradient-pink)';}
				})
				.attr('class', function(){
					if (nodeIndex.tvo.indexOf(config.drawnLeavesPerNode) > -1 ||
						nodeIndex.actualtvo.indexOf(config.drawnLeaves) > -1) {
						return 'tv original';
					} else {
						return 'movie original';
					}

				})


			}

			config.drawnLeavesPerNode += 1;
			config.drawnLeaves += 1;
			config.newNodes.push([ptX, ptY]);

		}


	})
	addPoints(thisNode, config, branchWidth, branchHeight, nodeIndex);


}

function drawBirds(d,container){

	var bottomY = (treeFrameHeight - margin.top - margin.bottom - treeHeightScale(d.revenue_trunk_sqrt));
	var topY = treeFrameHeight - bottomY + (treeFrameHeight - margin.top - margin.bottom)/6;

	var numOfBirds = Math.round(d.birds_coverage/5);
	var birdCanvas = [[16,topY],[treeFrameWidth-16, bottomY]];


	for (var i=0;i < numOfBirds; i++) {

		var xPos = Math.random()*(birdCanvas[1][0] - birdCanvas[0][0]) + birdCanvas[0][0],
			yPos = Math.random()*(birdCanvas[1][1] - birdCanvas[0][1]) + birdCanvas[0][1];

		var dir = Math.random() - 0.5 > 0 ? 1: -1;

		container.append('use')
		.attr('xlink:href', '#bird')
		.style('fill', 'brown')
		.attr('transform','translate(' + xPos + ',' + yPos + ') scale(' + 16/32*dir + ',' + 16/32 + ')')

		container.append('use')
		.attr('xlink:href', '#bird')
		.style('fill', 'gold')
		.attr('transform','translate(' + (xPos-1) + ',' + (yPos-1) + ') scale(' + 16/32*dir + ',' + 16/32 + ')')

	}


}








/* 

borrowed from https://bl.ocks.org/mbostock/4163057

*/


// Sample the SVG path uniformly with the specified precision.
function samples(path, precision) {
  var n = path.getTotalLength(), t = [0], i = 0, dt = precision;
  while ((i += dt) < n) t.push(i);
  t.push(n);
  return t.map(function(t) {
    var p = path.getPointAtLength(t), a = [p.x, p.y];
    a.t = t / n;
    return a;
  });
}

// Compute quads of adjacent points [p0, p1, p2, p3].
function quads(points) {
  return d3.range(points.length - 1).map(function(i) {
    var a = [points[i - 1], points[i], points[i + 1], points[i + 2]];
    a.t = (points[i].t + points[i + 1].t) / 2;
    return a;
  });
}

// Compute stroke outline for segment p12.
function lineJoin(p0, p1, p2, p3, width) {
  var u12 = perp(p1, p2),
      r = width / 2,
      a = [p1[0] + u12[0] * r, p1[1] + u12[1] * r],
      b = [p2[0] + u12[0] * r, p2[1] + u12[1] * r],
      c = [p2[0] - u12[0] * r, p2[1] - u12[1] * r],
      d = [p1[0] - u12[0] * r, p1[1] - u12[1] * r];

  if (p0) { // clip ad and dc using average of u01 and u12
    var u01 = perp(p0, p1), e = [p1[0] + u01[0] + u12[0], p1[1] + u01[1] + u12[1]];
    a = lineIntersect(p1, e, a, b);
    d = lineIntersect(p1, e, d, c);
  }

  if (p3) { // clip ab and dc using average of u12 and u23
    var u23 = perp(p2, p3), e = [p2[0] + u23[0] + u12[0], p2[1] + u23[1] + u12[1]];
    b = lineIntersect(p2, e, a, b);
    c = lineIntersect(p2, e, d, c);
  }

  return "M" + a + "L" + b + " " + c + " " + d + "Z";
}

// Compute intersection of two infinite lines ab and cd.
function lineIntersect(a, b, c, d) {
  var x1 = c[0], x3 = a[0], x21 = d[0] - x1, x43 = b[0] - x3,
      y1 = c[1], y3 = a[1], y21 = d[1] - y1, y43 = b[1] - y3,
      ua = (x43 * (y1 - y3) - y43 * (x1 - x3)) / (y43 * x21 - x43 * y21);
  return [x1 + ua * x21, y1 + ua * y21];
}

// Compute unit vector perpendicular to p01.
function perp(p0, p1) {
  var u01x = p0[1] - p1[1], u01y = p1[0] - p0[0],
      u01d = Math.sqrt(u01x * u01x + u01y * u01y);
  return [u01x / u01d, u01y / u01d];
}





