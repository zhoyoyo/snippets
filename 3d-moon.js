// NPM modules
var _ = {};
_.assign = require('lodash.assign');

var d3 = _.assign({},
    require("d3-selection"),
    require("d3-request"),
    require("d3-scale"),
    require('d3-geo'),
    require("d3-transition")
);

var versor = require("versor");
var THREE = require('three');
var TrackballControls = require('three-trackballcontrols');
var irregularQuantize = require("./irregular-quantize");

d3.getEvent = function(){ return require("d3-selection").event}.bind(this);


// Local modules
var features = require('./detectFeatures')();
var fm = require('./fm');
var utils = require('./utils');


// Globals
var DEFAULT_WIDTH = 940;
var MOBILE_BREAKPOINT = 600;

// Defaults and globals for scrollable
var total_scroll = 1000;
var annotations_height;
var viewport_height;
var scrollDepth = 0;
var frame = null;
var quantize_range = [0];
var intra_frame = 0;
var non_scrolling_elements;
var scrolling_elements;
var clientDimensions = {width: 900, height: 600};
var globe = {
    renderer:null, 
    scene:null, 
    camera:null, 
    controls: null, 
    sphere: {}, 
    pole:{},
    ptLight: null,
    hemiLight: null,
    apollos:[],
    lunar:[],
    cabeus: null
    };

var initY = 90, initX = 0,
    radius = window.innerWidth < 500 ? 0.4 : 0.5, 
    scale = 1.5,
    timer = null, timer2, timer3, timer4, timer5;

var globeContainer = d3.select("#graphic #globe");

// scales
var progress, frame_progress, intra_frame_progress;

// containers 
var annotations, interactive_content, graphic, screens;



/**
 * Initialize the graphic.
 *
 * Fetch data, format data, cache HTML references, etc.
 */

function init() {

    drawGlobe();
}

function drawGlobe(){


    var width = d3.select('#interactive-content').node().getBoundingClientRect().width,
        height = window.innerHeight;

    var segments = 64, rotation = Math.PI/-2;

    // set the scene

    globe.scene = new THREE.Scene();
    globe.scene.background = new THREE.Color(1,1,1);

    // set the camera

    globe.camera = new THREE.PerspectiveCamera(45, width/height, 0.01, 1000);
    
    globe.camera.position.z = scale;

    // set the renderer

    globe.renderer = new THREE.WebGLRenderer();
    globe.renderer.setSize(width, height);

    // add two lights to the scene

    globe.ptLight = new THREE.PointLight( 0x999999, 0.1);
    var mesh = new THREE.MeshStandardMaterial( {
                    color: 0x000000,
                    transparent:true,
                    opacity: 0.5
                } );

    globe.hemiLight = new THREE.HemisphereLight( 0xffffff, 0x000000, 2 );
    globe.ptLight.add( new THREE.Mesh( new THREE.SphereBufferGeometry( 0.0001, 16, 8 ), mesh) );
    globe.ptLight.position.set(3,0,0)
    globe.hemiLight.position.set(3,0,0)

    globe.scene.add( globe.hemiLight );
    globe.scene.add( globe.ptLight );

    // add moon 

    globe.sphere.body = createSphere(segments);
    globe.sphere.body.rotation.y = rotation;
    globe.scene.add(globe.sphere.body);

    globe.sphere.top = createSphereTop(segments);
    globe.sphere.top.rotation.y = rotation;
    globe.scene.add(globe.sphere.top);

    globe.sphere.bottom = createSphereBottom(segments);
    globe.sphere.bottom.rotation.y = rotation;
    globe.scene.add(globe.sphere.bottom);

    // add pole overlays

    globe.pole.top = createSphereTopLt(segments);
    globe.pole.top.rotation.y = rotation;
    globe.scene.add(globe.pole.top);

    globe.pole.bottom = createSphereBottomLt(segments);
    globe.pole.bottom.rotation.y = rotation;
    globe.scene.add(globe.pole.bottom);

    // add stars

    var stars = createStars(90,64);
    globe.scene.add(stars);

    // add events

    globe.controls = new TrackballControls(globe.camera);
    globe.controls.enabled = false;

    document.getElementById('globe')
        .appendChild(globe.renderer.domElement);

    renderScene();


}

function showImage(imgIndex){
    // add an image
    d3.selectAll('#graphic .image-' + imgIndex)
        .transition().duration(200)
        .style('opacity',1)
        .on('end',function(){
            d3.select(this).select('img').classed('multiply',true);
        })
}

function hideImage(imgIndex) {
    d3.selectAll('#graphic .image-' + imgIndex)
        .style('opacity',0);

    d3.selectAll('#graphic .image-' + imgIndex + ' img')
        .classed('multiply',false);
}

function createSphere(segments) {
    return new THREE.Mesh(
        new THREE.SphereGeometry(radius, segments, segments),
        new THREE.MeshPhongMaterial({
            map: new THREE.TextureLoader().load('assets/moon-sphere.jpg')//,
        })
        );
}
function createSphereTop(segments) {
    return new THREE.Mesh(
        new THREE.SphereGeometry(radius, segments, segments, 0, 2*Math.PI, 0, Math.PI/180*30),
        new THREE.MeshPhongMaterial({
            map: new THREE.TextureLoader().load('assets/moon_top_rect.jpg')
        })
        );
}
function createSphereTopLt(segments) {
    var mesh = new THREE.Mesh(
        new THREE.SphereGeometry(radius*1.005, segments, segments, 0, 2*Math.PI, 0, Math.PI/180*10),
        new THREE.MeshPhongMaterial({
            map: new THREE.TextureLoader().load('assets/moon_top_rect_lt.png'),
            transparent: true,
            opacity: 0
        })
    );
    return mesh;
}
function createSphereBottom(segments) {
    return new THREE.Mesh(
        new THREE.SphereGeometry(radius, segments, segments, Math.PI, 2*Math.PI, Math.PI/180*150, Math.PI/180*30),
        new THREE.MeshPhongMaterial({
            map: new THREE.TextureLoader().load('assets/moon_bottom_rect.jpg')
        })
        );
}
function createSphereBottomLt(segments) {
    var mesh = new THREE.Mesh(
        new THREE.SphereGeometry(radius*1.005, segments, segments, Math.PI, 2*Math.PI, Math.PI/180*170, Math.PI/180*10),
        new THREE.MeshPhongMaterial({
            map: new THREE.TextureLoader().load('assets/moon_bottom_rect_lt.png'),
            transparent: true,
            opacity: 0
        })
    );

    return mesh;
}

function createStars(radius, segments) {
    return new THREE.Mesh(
        new THREE.SphereGeometry(radius, segments, segments),
        new THREE.MeshBasicMaterial({
            map: new THREE.TextureLoader().load('assets/galaxy_starfield.png'),
            side: THREE.BackSide
        })
    );
}

function renderScene(fromResize){

    globe.controls.update();

    requestAnimationFrame(function(){
        return renderScene(fromResize);
    });
    globe.renderer.render(globe.scene, globe.camera);
}

/**
 * Figure out the current frame size and render the graphic.
 */
 function render(fromResize) {


    var width = d3.select('#interactive-content').node().getBoundingClientRect().width,
        height = window.innerHeight;

    var segments = 64, rotation = Math.PI/-2;


    //reset camera
    globe.camera.aspect = width/height;
    globe.camera.updateProjectionMatrix();
    globe.renderer.setSize(width, height);

    //reset image
    var image = d3.selectAll('.image-container img');

    if (width > height) {
        image.attr('height', height);
        image.attr('width', "auto")
    } else {

        var factor;
        if (width > 500) {factor = 1} 
        else {factor = height / width / 2;}

        image.attr('width', width * factor);
        image.attr('height', "auto")
        image.style('top', (height - width*factor)/2 + 'px')
    }

    renderScene(fromResize);

 }


/**
 * Use to modify the graphic at certain points of scrolling
 */
 var cur_screen;

 function removeLandingSites(vari){
    //remove apollos 
    if (globe[vari].length >0) {
        globe[vari].forEach(function(d){
            globe.scene.remove(d.point);
        })

    }
 }

 function renderScene1(){

    initY +=1;

    if (initY <= 450){
        var q = versor.cartesian([0,initY])
        globe.ptLight.position.set(q[0],q[1],q[2]);
        globe.hemiLight.position.set(q[0],q[1],q[2]);

        timer = requestAnimationFrame(function(){
            return renderScene1();
        });

    }

}

function addApolloSites(){

    // add apollo sites
    var rotation = Math.PI/-2;

    var apollosData = [
        {index:11,coordinates:[0.67345,-23.47307]},
        {index:12,coordinates:[-3.0128,23.4219]},
        {index:14,coordinates:[-3.64589,17.47194]},
        {index:15,coordinates:[26.13239,-3.63330]},
        {index:16,coordinates:[-8.9734,-15.5011]},
        {index:17,coordinates:[20.1911,-30.7723]}
        ];

    apollosData.forEach(function(d,i){

        var q = versor.cartesian(d.coordinates);

        globe.apollos.push({point:addPoint(q, '#D4AF37'),name: d.index});
        globe.scene.add(globe.apollos[i].point);
        globe.apollos[i].point.rotation.y = rotation;

    })

    setTimeout(function(){
        globe.renderer.render(globe.scene, globe.camera);
    },500)

}


function renderScene2(){

    // rotate to lunar landing site
    initY += 2;

    if (initY <= 90){
        var q = versor.cartesian([0,initY])
        globe.camera.position.set(q[0]*scale,q[1]*scale,q[2]*scale);

        globe.controls.update();
        timer2 = requestAnimationFrame(function(){
            return renderScene2();
        });

    }

}

function resetLighting(){

    window.cancelAnimationFrame(timer);
    var q = versor.cartesian([0,450])
    globe.ptLight.position.set(q[0],q[1],q[2]);
    globe.hemiLight.position.set(q[0],q[1],q[2]);
    globe.controls.update();
}

function renderScene3(down){

    if (down) {

        if (initY > 30){
            // rotate to lunar landing site
            initY -= 2;
            var q = versor.cartesian([0,initY])

            globe.camera.position.set(q[0]*scale,q[1]*scale,q[2]*scale);

            globe.controls.update();
            timer2 = requestAnimationFrame(function(){
                return renderScene3(true);
            });
        }

    } else {

        if (initY < 30){
            // rotate to lunar landing site
            initY += 2;
            var q = versor.cartesian([0,initY])

            globe.camera.position.set(q[0]*scale,q[1]*scale,q[2]*scale);

            globe.controls.update();
            timer2 = requestAnimationFrame(function(){
                return renderScene3(false);
            });

        }

    }
     
}

function renderScene4(initLight){

    initY -= 0.15;
    initLight -= 0.3;

    var q = versor.cartesian([0,initY]);
    var ql = versor.cartesian([0,initLight]);
    globe.camera.position.set(q[0]*scale,q[1]*scale,q[2]*scale);
    globe.ptLight.position.set(ql[0],ql[1],ql[2]);
    globe.hemiLight.position.set(ql[0],ql[1],ql[2]);

    globe.controls.update();
    timer3 = requestAnimationFrame(function(){
        return renderScene4(initLight);
    });
}

function addCabeus(){

    var cabeus = [-84.9, 3.5];
    var q = versor.cartesian(cabeus);
    globe.cabeus = addPoint(q, '#51b2e5');
    globe.scene.add(globe.cabeus);
    globe.cabeus.rotation.y = Math.PI/-2;
}

function renderScene6(xyRatio, speed){

    initY -= speed;
    initX -= (speed * xyRatio);

    var cabeus = [-89.5, 3.5];

    if (initX > cabeus[0]){

        globe.camera.fov-=0.25;
        globe.camera.updateProjectionMatrix();

        globe.hemiLight.intensity -= 0.001;


        var q = versor.cartesian([initX,initY]);
        globe.camera.position.set(q[0]*scale,q[1]*scale,q[2]*scale);
        globe.controls.update();
    
        timer4 = requestAnimationFrame(function(){
            return renderScene6(xyRatio, speed);
        });
    }

}

function renderScene7(){

    if (globe.camera.fov > 15){

        globe.camera.fov-=0.7;
        globe.camera.updateProjectionMatrix();

        requestAnimationFrame(function(){
            return renderScene7();
        });
    }

}

function addLtMeshes(){

    globe.pole.bottom.material.opacity = 1;
    globe.pole.top.material.opacity = 1;

};

function renderScene8(zoomOut){

    initX += 2;

    if (initX <= 90){
        var q = versor.cartesian([initX,0])
        globe.camera.position.set(q[0]*scale,q[1]*scale,q[2]*scale);

        if (zoomOut) {

            globe.camera.fov+=0.7;
            globe.camera.updateProjectionMatrix();

            globe.controls.update();

            if (globe.camera.fov <45) {
                timer5 = requestAnimationFrame(function(){
                    return renderScene8(true);
                });
            } else {
                timer5 = requestAnimationFrame(function(){
                    return renderScene8(false);
                });

            }
        } else {

            //zoom in
            if (globe.camera.fov > 15) {
                globe.camera.fov-=0.7;
                globe.camera.updateProjectionMatrix();
            }

            timer5 = requestAnimationFrame(function(){
                return renderScene8(false);
            });

        }

        

    }
}


function addLunarSite(){

    var rotation = Math.PI/-2;
    var lunarData = [{index:24, coordinates:[12.25,-62.2]}];

    lunarData.forEach(function(d,i){

        var q = versor.cartesian(d.coordinates);

        globe.lunar.push({point:addPoint(q, '#d365ba'),name: d.index});
        globe.scene.add(globe.lunar[i].point);
        globe.lunar[i].point.rotation.y = rotation;

    })

    globe.renderer.render(globe.scene, globe.camera);

}

function addPoint(q, color) {
    var scale = 0.025;

    var dot1Obj = new THREE.SphereGeometry(radius*scale, 64, 10);
    dot1Obj.translate(q[0]*radius*0.98,q[1]*radius*0.98,q[2]*radius*0.98)

    var mesh = new THREE.Mesh(
        dot1Obj, 
        new THREE.MeshStandardMaterial( {
                    emissive: 0xcccccc,
                    emissiveIntensity: 0.1,
                    color:color
                })
        );

    return mesh;
}




 function updateScrollables(fromResize) {

     if(has_fully_loaded_once && !fromResize) {
         if(Math.round(scrollDepth) % 50 == 0) {
             // limit how often this is called to once every 50 px
             var cur_anno_height = annotations.node().getBoundingClientRect().height;

             if(cur_anno_height != annotations_height) {
                 onResize(true);
             }
         }
     }

    
    var cur_frame = frame_progress(scrollDepth)

    try {
         intra_frame = intra_frames_progress[frame](scrollDepth)
    }
    catch(e) {
        intra_frame = 0
    }

    if(frame !== cur_frame) {
         // a new annotation has appeared on screen
         frame = cur_frame;
         interactive_content.attr("data-frame", frame)

         cur_screen = d3.selectAll(".screen[data-frame='"+frame+"']")

        // console.log(frame)
        // console.log("initY: "+initY)
        // console.log("initX: "+initX)

        if (frame !== 5) {
            hideImage(5);
        }
        if (globe.cabeus) {
            globe.scene.remove(globe.cabeus);
        }

        // turn off images on last two scenes
        if (frame < 7 && globe.pole.bottom) {
            globe.pole.bottom.material.opacity = 0;
            globe.pole.top.material.opacity = 0;
        }

        // egends
        if (frame <= 1 || frame > 6 || frame == 5) {
            d3.select('.text-container .c1').style('opacity',0);
            d3.select('.text-container .c2').style('opacity',0);
            d3.select('.text-container .c3').style('opacity',0);

        } else if (frame == 2) {
            d3.select('.text-container .c1').style('opacity',1);
            d3.select('.text-container .c2').style('opacity',0);
            d3.select('.text-container .c3').style('opacity',0);

        } else if (frame == 3 || frame == 4) {
            d3.select('.text-container .c1').style('opacity',1);
            d3.select('.text-container .c2').style('opacity',1);
            d3.select('.text-container .c3').style('opacity',0);

        } else {
            d3.select('.text-container .c1').style('opacity',1);
            d3.select('.text-container .c2').style('opacity',1);
            d3.select('.text-container .c3').style('opacity',1);
        }


        if (frame == 1 && has_fully_loaded_once) {
        
            removeLandingSites('apollos')
            removeLandingSites('lunar')

            initY = 0;
            renderScene1();

        } else if (frame == 2) {

            removeLandingSites('lunar')
            resetLighting();
            addApolloSites();

            if (initY <= 31 && initY >= 29) {
                renderScene2();
            }

        } else if (frame == 3) {
            resetLighting();

            if (timer3) {

                window.cancelAnimationFrame(timer3);
            }
            addLunarSite();
            
            if (initY > 30) {
                initY = 90;
                renderScene3(true);
            } else {
                renderScene3(false);
            }
            


        } else if (frame == 4) {
            var lightInit = 450;
            renderScene4(lightInit);

        } else if (frame == 5) {
            resetLighting();

            if (timer3) {
                window.cancelAnimationFrame(timer3);
            }

            if (timer4) {
                window.cancelAnimationFrame(timer4);
            }

            setTimeout(function(){
                var dest = [0,90];
                initX = 0, initY = 90;
                var q = versor.cartesian(dest);
                globe.camera.position.set(q[0]*scale,q[1]*scale,q[2]*scale);
                // globe.controls.update();

                globe.camera.fov = 45;
                globe.camera.updateProjectionMatrix();

            },400)

            showImage(5);

        } else if (frame == 6) {

            addCabeus();

            var cabeus = [-87, 3.5];
            var xyRatio = (cabeus[0] - initX)/(cabeus[1] - initY);
            var speed = Math.abs((cabeus[0] - initX)/100);

            renderScene6(xyRatio, speed);

        } else if (frame == 7) {

            if (timer4) {
                window.cancelAnimationFrame(timer4);
            }

            // add new meshes
            addLtMeshes();

            // zoom in -- and correct position
            var pole = [-90,0];

            if (initX > pole[0]) {
                var q = versor.cartesian(pole);
                globe.camera.position.set(q[0]*scale,q[1]*scale,q[2]*scale);
            }
            initX = -90; initY = 0;

        } else if (frame == 8) {

            // add new meshes
            renderScene8(true);
        }


     }


     // adjust the position of the annotations to simulate scrolling
     annotations.style("top", progress(scrollDepth) + "px")
 }


/**
 * Invoke on resize. Update all scrollable dimensions and rerender.
 */
 function onResize() {
     fm.readWindowProps()

     fm.updateHeight(total_scroll)

     // make sure the containers are the proper heights
     graphic.style("height", viewport_height + "px")
     interactive_content.style("height",  total_scroll + "px")
     
     updateScales();
     render(true);
 }

/**
 * Setup the graphic.
 *
 * assign globals, register FM, bind event listeners
 */
function setup() {

    // assign the various containers
    interactive_content = d3.select("#interactive-content");
    annotations = interactive_content.select("#annotations")
    screens = annotations.selectAll(".screen")
    graphic = interactive_content.select("#graphic");

    // instantiate the scales for scrolling progress
    progress = d3.scaleLinear();
    frame_progress = irregularQuantize();
    intra_frames_progress = []

    // create an array equal to the number of annotations
    annotations.selectAll(".copy")
        .each(function(d,i){
            quantize_range.push(i+1)
        })
    quantize_range.pop()

    // tell Frame Messager that this is a fixed scroll item
    fm.setup({
        requestHeight : {
            desktop: total_scroll,
            tablet: total_scroll,
            mobile: total_scroll,
            fix: true
        },
        fix: true
    })

    // Setup FM to, then read, the parent window height
    fm.setupReadWindow(function(o){
        clientDimensions = o.data.windowProps.clientDimensions;

        // the 0.9 multiple is to account for the various interface elements that show up on mobile
        viewport_height = clientDimensions.height * 0.90;
        annotations_height = annotations.node().getBoundingClientRect().height;
        total_scroll = viewport_height + annotations_height;
    })

    // Setup scroll and resize events
    fm.setupItemScroll(onScroll);
    setInterval(function(){
        fm.readWindowProps()
        fm.updateHeight(total_scroll)

    }, 1000);
    window.addEventListener("resize", utils.throttle(onResize, 250), true);

    
}

 /**
  * Invoke on scroll.
  */
function onScroll(a) {
     if(scrollDepth != a.data.scrollDepth) {
         scrollDepth = a.data.scrollDepth;
         window.requestAnimationFrame(updateScrollables)
     }  
}


/**
 * Invoked on resize, updates the progress scales to use the new dimensions
 */
function updateScales() {
    progress.domain([interactive_content.node().offsetTop, annotations_height])
        .range([0,-annotations_height])
        .clamp(true)

    var screen_offsets = screens.nodes().map(function(d, i){return d.offsetTop - viewport_height})

    frame_progress.domain(screen_offsets) 

    intra_frames_progress = screen_offsets.map(function(d,i){
        var offsets = screen_offsets.slice(i-1, i+1);
        if(i === 0) {
            offsets = [0, screen_offsets[1]]
        }

        return d3.scaleLinear()
            .domain(offsets)
            .range([0,1])
        })
}



// Bind on-load handler
document.addEventListener("DOMContentLoaded", function() {
    setup();
    init();
    d3.select("body").classed("loaded", true)
});

document.addEventListener("loadEvent", function() {
    onResize();
})
