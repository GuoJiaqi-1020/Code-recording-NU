var VSHADER_SOURCE = 
  'uniform mat4 u_ModelMatrix;\n' +
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = u_ModelMatrix * a_Position;\n' +
  '  gl_PointSize = 10.0;\n' +
  '  v_Color = a_Color;\n' +
  '}\n';

// Fragment shader program----------------------------------
var FSHADER_SOURCE = 
//  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
//  '#endif GL_ES\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';


let stack = []
var num_star=1;
var gl;           // webGL Rendering Context. Set in main(), used everywhere.
var g_canvas = document.getElementById('webgl');     
var g_vertsMax = 0;                 // number of vertices held in the VBO 
                                    // (global: replaces local 'n' variable)
var g_modelMatrix = new Matrix4();  // Construct 4x4 matrix; contents get sent
                                    // to the GPU/Shaders as a 'uniform' var.
var g_modelMatLoc;                  // that uniform's location in the GPU

//------------For Animation---------------------------------------------
var g_isRun = true;                 // run/stop for animation; used in tick().
var g_lastMS = Date.now();    			// Timestamp for most-recently-drawn image; 
var g_angle01 = 0;                  // initial rotation angle
var g_angle01Rate = 30.0;           // rotation speed, in degrees/second 

var g_angle02 = 0;                  // initial rotation angle
var g_angle02Rate = 80.0;           // rotation speed, in degrees/second 

var g_angle03 = 0;                  // initial rotation angle
var g_angle03Rate = 50.0;           // rotation speed, in degrees/second 

var g_angle_leg1 = 10;                  // initial rotation angle
var g_angle04Rate = 80.0;           // rotation speed, in degrees/second 

var g_angle_leg2 = -45;                  // initial rotation angle
var g_angle05Rate = 80.0;           // rotation speed, in degrees/second 

//------------For mouse click-and-drag: -------------------------------
var g_isDrag=false;		// mouse-drag: true when user holds down mouse button
var g_xMclik=0.0;			// last mouse button-down position (in CVV coords)
var g_yMclik=0.0;   
var g_xMdragTot=0.0;	// total (accumulated) mouse-drag amounts (in CVV coords).
var g_yMdragTot=0.0; 
var g_digits=5;			// DIAGNOSTICS: # of digits to print in console.log (
									//    console.log('xVal:', xVal.toFixed(g_digits)); // print 5 digits
								 

function main() {
  
  // Get gl, the rendering context for WebGL, from our 'g_canvas' object
  gl = getWebGLContext(g_canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Initialize a Vertex Buffer in the graphics system to hold our vertices
  g_maxVerts = initVertexBuffer(gl);  
  if (g_maxVerts < 0) {
    console.log('Failed to set the vertex information');
    return;
  }
 
	window.addEventListener("keydown", myKeyDown, false);

	window.addEventListener("keyup", myKeyUp, false);
	window.addEventListener("mousedown", myMouseDown); 
	// (After each 'mousedown' event, browser calls the myMouseDown() fcn.)
    window.addEventListener("mousemove", myMouseMove); 
	window.addEventListener("mouseup", myMouseUp);	
	window.addEventListener("click", myMouseClick);				
	window.addEventListener("dblclick", myMouseDblClick); 

    gl.clearColor(0.3, 0.3, 0.3, 1.0);

	gl.depthFunc(gl.LESS);
	gl.enable(gl.DEPTH_TEST); 	  
	
  // Get handle to graphics system's storage location of u_ModelMatrix
  g_modelMatLoc = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!g_modelMatLoc) { 
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  var tick = function() {
    animate();   // Update the rotation angle
    DrawAll()   // Draw all parts
//    console.log('g_angle01=',g_angle01.toFixed(g_digits)); // put text in console.

//	Show some always-changing text in the webpage :  
//		--find the HTML element called 'CurAngleDisplay' in our HTML page,
//			 	(a <div> element placed just after our WebGL 'canvas' element)
// 				and replace it's internal HTML commands (if any) with some
//				on-screen text that reports our current angle value:
//		--HINT: don't confuse 'getElementByID() and 'getElementById()
		document.getElementById('CurAngleDisplay').innerHTML= 
			'g_angle01= '+g_angle01.toFixed(g_digits);
		// Also display our current mouse-dragging state:
		document.getElementById('Mouse').innerHTML=
			'Mouse Drag totals (CVV coords):\t'+
			g_xMdragTot.toFixed(5)+', \t'+g_yMdragTot.toFixed(g_digits);	
		//--------------------------------
    requestAnimationFrame(tick, g_canvas);   
    									// Request that the browser re-draw the webpage
    									// (causes webpage to endlessly re-draw itself)
  };
  tick();							// start (and continue) animation: draw current image	
}


function initVertexBuffer() {
	//==============================================================================
		var c30 = Math.sqrt(0.75);					// == cos(30deg) == sqrt(3) / 2
		var sq2	= Math.sqrt(2.0);		

var colorShapes = new Float32Array([
	// Vertex coordinates(x,y,z,w) and color (R,G,B) for a color tetrahedron:
	  //		Apex on +z axis; equilateral triangle base at z=0
  /*	Nodes:  (a 'node' is a 3D location where we specify 1 or more vertices)
	   0.0,	 0.0, sq2, 1.0,			1.0,  1.0,	1.0,	// Node 0 (apex, +z axis;  white)
	   c30, -0.5, 0.0, 1.0, 		0.0,  0.0,  1.0, 	// Node 1 (base: lower rt; red)
	   0.0,  1.0, 0.0, 1.0,  		1.0,  0.0,  0.0,	// Node 2 (base: +y axis;  grn)
	  -c30, -0.5, 0.0, 1.0, 		0.0,  1.0,  0.0, 	// Node 3 (base:lower lft; blue)
  
	Build tetrahedron from individual triangles (gl.TRIANGLES); each triangle
	requires us to specify 3 vertices in CCW order.  
  */
			  // Face 0: (left side)
	   0.0,	 0.0, sq2, 1.0,			1.0,  0.0,  1.0,	// Node 0
	   c30, -0.5, 0.0, 1.0, 		1.0,  1.0,  1.0, 	// Node 1
	   0.0,  1.0, 0.0, 1.0,  		1.0,  0.0,  1.0,	// Node 2
			  // Face 1: (right side)
		   0.0,	 0.0, sq2, 1.0,		1.0,  0.0,  1.0,	// Node 0
	   0.0,  1.0, 0.0, 1.0,  		1.0,  1.0,  1.0,	// Node 2
	  -c30, -0.5, 0.0, 1.0, 		1.0,  0.0,  1.0, 	// Node 3
		  // Face 2: (lower side)
		   0.0,	 0.0, sq2, 1.0,		1.0,  0.0,  1.0,	// Node 0 
	  -c30, -0.5, 0.0, 1.0, 		1.0,  1.0,  1.0, 	// Node 3
	   c30, -0.5, 0.0, 1.0, 		1.0,  0.0,  1.0, 	// Node 1 
		   // Face 3: (base side)  
	  -c30, -0.5, 0.0, 1.0, 		1.0,  0.0,  1.0, 	// Node 3
	   0.0,  1.0, 0.0, 1.0,  	    1.0,  1.0,  1.0,	// Node 2
	   c30, -0.5, 0.0, 1.0, 		1.0,  0.0,  1.0, 	// Node 1
   
  /*    // Cube Nodes  ('node': a 3D location where we specify 1 or more vertices)
	  -1.0, -1.0, -1.0, 1.0	// Node 0
	  -1.0,  1.0, -1.0, 1.0	// Node 1
	   1.0,  1.0, -1.0, 1.0	// Node 2
	   1.0, -1.0, -1.0, 1.0	// Node 3
	  
	   1.0,  1.0,  1.0, 1.0	// Node 4
	  -1.0,  1.0,  1.0, 1.0	// Node 5
	  -1.0, -1.0,  1.0, 1.0	// Node 6
	   1.0, -1.0,  1.0, 1.0	// Node 7
  */
		  // +x face: RED
	   1.0, -1.0, -1.0, 1.0,	  1.0, 0.0, 0.0,	// Node 3
	   1.0,  1.0, -1.0, 1.0,	  1.0, 1.0, 0.0,	// Node 2
	   1.0,  1.0,  1.0, 1.0,	  1.0, 0.0, 0.0,  // Node 4
	   
	   1.0,  1.0,  1.0, 1.0,	  1.0, 0.1, 0.1,	// Node 4
	   1.0, -1.0,  1.0, 1.0,	  1.0, 0.1, 0.1,	// Node 7
	   1.0, -1.0, -1.0, 1.0,	  1.0, 0.1, 0.1,	// Node 3
  
		  // +y face: GREEN
	  -1.0,  1.0, -1.0, 1.0,	  0.0, 0.5, 0.0,	// Node 1
	  -1.0,  1.0,  1.0, 1.0,	  0.0, 1.0, 0.0,	// Node 5
	   1.0,  1.0,  1.0, 1.0,	  0.0, 1.0, 0.0,	// Node 4
  
	   1.0,  1.0,  1.0, 1.0,	  0.1, 1.0, 0.1,	// Node 4
	   1.0,  1.0, -1.0, 1.0,	  0.1, 1.0, 0.1,	// Node 2 
	  -1.0,  1.0, -1.0, 1.0,	  0.5, 1.0, 0.1,	// Node 1
  
		  // +z face: BLUE
	  -1.0,  1.0,  1.0, 1.0,	  1.0, 0.0, 1.0,	// Node 5
	  -1.0, -1.0,  1.0, 1.0,	  0.6, 0.0, 1.0,	// Node 6
	   1.0, -1.0,  1.0, 1.0,	  0.0, 0.0, 1.0,	// Node 7
  
	   1.0, -1.0,  1.0, 1.0,	  0.1, 0.3, 1.0,	// Node 7
	   1.0,  1.0,  1.0, 1.0,	  0.6, 0.1, 1.0,	// Node 4
	  -1.0,  1.0,  1.0, 1.0,	  0.1, 0.2, 1.0,	// Node 5
  
		  // -x face: CYAN
	  -1.0, -1.0,  1.0, 1.0,	  0.0, 1.0, 1.0,	// Node 6	
	  -1.0,  1.0,  1.0, 1.0,	  0.5, 1.0, 1.0,	// Node 5 
	  -1.0,  1.0, -1.0, 1.0,	  1.0, 1.0, 1.0,	// Node 1
	  
	  -1.0,  1.0, -1.0, 1.0,	  1.0, 1.0, 1.0,	// Node 1
	  -1.0, -1.0, -1.0, 1.0,	  1.0, 1.0, 1.0,	// Node 0  
	  -1.0, -1.0,  1.0, 1.0,	  1.0, 1.0, 1.0,	// Node 6  
	  
		  // -y face: MAGENTA
	   1.0, -1.0, -1.0, 1.0,	  1.0, 1.0, 1.0,	// Node 3
	   1.0, -1.0,  1.0, 1.0,	  0.6, 0.1, 1.0,	// Node 7
	  -1.0, -1.0,  1.0, 1.0,	  0.1, 1.0, 0.3,	// Node 6
  
	  -1.0, -1.0,  1.0, 1.0,	  1.0, 1.0, 1.0,	// Node 6
	  -1.0, -1.0, -1.0, 1.0,	  1.0, 1.0, 0.0,	// Node 0
	   1.0, -1.0, -1.0, 1.0,	  1.0, 1.0, 1.0,	// Node 3
  
	   // -z face: YELLOW
	   1.0,  1.0, -1.0, 1.0,	  0.5, 1.0, 1.0,	// Node 2
	   1.0, -1.0, -1.0, 1.0,	  1.0, 0.7, 1.0,	// Node 3
	  -1.0, -1.0, -1.0, 1.0,	  1.0, 1.0, 1.0,	// Node 0		
  
	  -1.0, -1.0, -1.0, 1.0,	  1.0, 1.0, 1.0,	// Node 0
	  -1.0,  1.0, -1.0, 1.0,	  1.0, 1.0, 0.3,	// Node 1
	   1.0,  1.0, -1.0, 1.0,	  1.0, 0.2, 1.0,	// Node 2
   





// Draw the White cube
	   1.0, -1.0, -1.0, 1.0,	  1.0, 1.0, 1.0,	// Node 3
	   1.0,  1.0, -1.0, 1.0,	  0.8, 0.8, 0.8,	// Node 2
	   1.0,  1.0,  1.0, 1.0,	  0.9, 0.9, 0.9,  // Node 4
	   
	   1.0,  1.0,  1.0, 1.0,	  1.0, 1.0, 1.0,	// Node 4
	   1.0, -1.0,  1.0, 1.0,	  0.8, 0.8, 0.8,	// Node 7
	   1.0, -1.0, -1.0, 1.0,	   0.9, 0.9, 0.9,	// Node 3
  
		  // +y face: GREEN
	  -1.0,  1.0, -1.0, 1.0,	  1.0, 1.0, 1.0,	// Node 1
	  -1.0,  1.0,  1.0, 1.0,	  0.8, 0.8, 0.8,	// Node 5
	   1.0,  1.0,  1.0, 1.0,	   0.9, 0.9, 0.9,	// Node 4
  
	   1.0,  1.0,  1.0, 1.0,	  1.0, 1.0, 1.0,	// Node 4
	   1.0,  1.0, -1.0, 1.0,	  0.8, 0.8, 0.8,	// Node 2 
	  -1.0,  1.0, -1.0, 1.0,	   0.9, 0.9, 0.9,	// Node 1
  
		  // +z face: BLUE
	  -1.0,  1.0,  1.0, 1.0,	  1.0, 1.0, 1.0,	// Node 5
	  -1.0, -1.0,  1.0, 1.0,	  0.8, 0.8, 0.8,	// Node 6
	   1.0, -1.0,  1.0, 1.0,	   0.9, 0.9, 0.9,	// Node 7
  
	   1.0, -1.0,  1.0, 1.0,	  1.0, 1.0, 1.0,	// Node 7
	   1.0,  1.0,  1.0, 1.0,	  0.8, 0.8, 0.8,	// Node 4
	  -1.0,  1.0,  1.0, 1.0,	   0.9, 0.9, 0.9,	// Node 5
  
		  // -x face: CYAN
	  -1.0, -1.0,  1.0, 1.0,	  1.0, 1.0, 1.0,	// Node 6	
	  -1.0,  1.0,  1.0, 1.0,	  0.8, 0.8, 0.8,	// Node 5 
	  -1.0,  1.0, -1.0, 1.0,	   0.9, 0.9, 0.9,	// Node 1
	  
	  -1.0,  1.0, -1.0, 1.0,	  1.0, 1.0, 1.0,	// Node 1
	  -1.0, -1.0, -1.0, 1.0,	  0.8, 0.8, 0.8,	// Node 0  
	  -1.0, -1.0,  1.0, 1.0,	   0.9, 0.9, 0.9,	// Node 6  
	  
		  // -y face: MAGENTA
	   1.0, -1.0, -1.0, 1.0,	  1.0, 1.0, 1.0,	// Node 3
	   1.0, -1.0,  1.0, 1.0,	  0.8, 0.8, 0.8,	// Node 7
	  -1.0, -1.0,  1.0, 1.0,	   0.9, 0.9, 0.9,	// Node 6
  
	  -1.0, -1.0,  1.0, 1.0,	  1.0, 1.0, 1.0,	// Node 6
	  -1.0, -1.0, -1.0, 1.0,	  0.8, 0.8, 0.8,	// Node 0
	   1.0, -1.0, -1.0, 1.0,	   0.9, 0.9, 0.9,	// Node 3
  
	   // -z face: YELLOW
	   1.0,  1.0, -1.0, 1.0,	  1.0, 1.0, 1.0,	// Node 2
	   1.0, -1.0, -1.0, 1.0,	  0.8, 0.8, 0.8,	// Node 3
	  -1.0, -1.0, -1.0, 1.0,	 0.9, 0.9, 0.9,	// Node 0		
  
	  -1.0, -1.0, -1.0, 1.0,	  1.0, 1.0, 1.0,	// Node 0
	  -1.0,  1.0, -1.0, 1.0,	  0.8, 0.8, 0.8,	// Node 1
	   1.0,  1.0, -1.0, 1.0,	   0.9, 0.9, 0.9,	// Node 2





	   1.0, -1.0, -1.0, 1.0,	  0.0, 0.0, 0.0,	// Node 3
	   1.0,  1.0, -1.0, 1.0,	  0.0, 0.0, 0.0,	// Node 2
	   1.0,  1.0,  1.0, 1.0,	  0.0, 0.0, 0.0,  // Node 4
	   
	   1.0,  1.0,  1.0, 1.0,	  0.0, 0.0, 0.0,// Node 4
	   1.0, -1.0,  1.0, 1.0,	  0.0, 0.0, 0.0,	// Node 7
	   1.0, -1.0, -1.0, 1.0,	  0.0, 0.0, 0.0,	// Node 3
  
		  // +y face: GREEN
	  -1.0,  1.0, -1.0, 1.0,	  0.0, 0.0, 0.0, // Node 1
	  -1.0,  1.0,  1.0, 1.0,	  0.0, 0.0, 0.0,	// Node 5
	   1.0,  1.0,  1.0, 1.0,	  0.0, 0.0, 0.0,	// Node 4
  
	   1.0,  1.0,  1.0, 1.0,	  0.0, 0.0, 0.0,	// Node 4
	   1.0,  1.0, -1.0, 1.0,	  0.0, 0.0, 0.0,	// Node 2 
	  -1.0,  1.0, -1.0, 1.0,	  0.0, 0.0, 0.0,	// Node 1
  
		  // +z face: BLUE
	  -1.0,  1.0,  1.0, 1.0,	  0.0, 0.0, 0.0,	// Node 5
	  -1.0, -1.0,  1.0, 1.0,	  0.0, 0.0, 0.0,	// Node 6
	   1.0, -1.0,  1.0, 1.0,	  0.0, 0.0, 0.0,	// Node 7
  
	   1.0, -1.0,  1.0, 1.0,	  0.0, 0.0, 0.0,	// Node 7
	   1.0,  1.0,  1.0, 1.0,	  0.0, 0.0, 0.0,	// Node 4
	  -1.0,  1.0,  1.0, 1.0,	  0.0, 0.0, 0.0,	// Node 5
  
		  // -x face: CYAN
	  -1.0, -1.0,  1.0, 1.0,	  0.0, 0.0, 0.0,	// Node 6	
	  -1.0,  1.0,  1.0, 1.0,	  0.0, 0.0, 0.0,	// Node 5 
	  -1.0,  1.0, -1.0, 1.0,	  0.0, 0.0, 0.0,	// Node 1
	  
	  -1.0,  1.0, -1.0, 1.0,	  0.0, 0.0, 0.0,	// Node 1
	  -1.0, -1.0, -1.0, 1.0,	  0.0, 0.0, 0.0,	// Node 0  
	  -1.0, -1.0,  1.0, 1.0,	  0.0, 0.0, 0.0,	// Node 6  
	  
		  // -y face: MAGENTA
	   1.0, -1.0, -1.0, 1.0,	  0.0, 0.0, 0.0,	// Node 3
	   1.0, -1.0,  1.0, 1.0,	  0.0, 0.0, 0.0,	// Node 7
	  -1.0, -1.0,  1.0, 1.0,	  0.0, 0.0, 0.0,	// Node 6
  
	  -1.0, -1.0,  1.0, 1.0,	  0.0, 0.0, 0.0,	// Node 6
	  -1.0, -1.0, -1.0, 1.0,	  0.0, 0.0, 0.0,	// Node 0
	   1.0, -1.0, -1.0, 1.0,	  0.0, 0.0, 0.0,	// Node 3
  
	   // -z face: YELLOW
	   1.0,  1.0, -1.0, 1.0,	  0.0, 0.0, 0.0,	// Node 2
	   1.0, -1.0, -1.0, 1.0,	  0.0, 0.0, 0.0,	// Node 3
	  -1.0, -1.0, -1.0, 1.0,	 0.0, 0.0, 0.0,	// Node 0		
  
	  -1.0, -1.0, -1.0, 1.0,	  0.0, 0.0, 0.0,	// Node 0
	  -1.0,  1.0, -1.0, 1.0,	  0.0, 0.0, 0.0,	// Node 1
	   1.0,  1.0, -1.0, 1.0,	  0.0, 0.0, 0.0,	// Node 2


	   //star
	    0.0,  0.0,  0.25, 1.0,	  1.0, 1.0, 0.0,	// Node 0
	    0.25, -0.25, 0.0, 1.0,	  1.0, 0.95, 0.0,	// Node 1
		0.6,  0.0, 0.0, 1.0,	  1.0, 0.6, 0.0,

		0.0,  0.0,  0.25, 1.0,	  1.0, 1.0, 0.0,	// Node 0
	    0.25, -0.25, 0.0, 1.0,	  1.0, 0.95, 0.0,	// Node 1
		0.0,  -0.75, 0.0, 1.0,	  1.0, 0.6, 0.0,

		0.0,  0.0,  0.25, 1.0,	  1.0, 1.0, 0.0,
	    -0.25, -0.25, 0.0, 1.0,	  1.0, 0.95, 0.0,
		0.0,  -0.75, 0.0, 1.0,	  1.0, 0.6, 0.0,

		0.0,  0.0,  0.25, 1.0,	  1.0, 1.0, 0.0,
	    -0.25, -0.25, 0.0, 1.0,	  1.0, 0.95, 0.0,
		-0.6,  0.0, 0.0, 1.0,	  1.0, 0.6, 0.0,

		0.0,  0.0,  0.25, 1.0,	  1.0, 1.0, 0.0,
	    -0.25, 0.25, 0.0, 1.0,	  1.0, 0.95, 0.0,
		-0.6,  0.0, 0.0, 1.0,	  1.0, 0.6, 0.0,

		0.0,  0.0,  0.25, 1.0,	  1.0, 1.0, 0.0,
	    -0.25, 0.25, 0.0, 1.0,	  1.0, 0.95, 0.0,
		0.0,  0.75, 0.0, 1.0,	  1.0, 0.6, 0.0,

		0.0,  0.0,  0.25, 1.0,	  1.0, 1.0, 0.0,
	    0.25, 0.25, 0.0, 1.0,	  1.0, 0.95, 0.0,
		0.0,  0.75, 0.0, 1.0,	  1.0, 0.6, 0.0,

		0.0,  0.0,  0.25, 1.0,	  1.0, 1.0, 0.0,
	    0.25, 0.25, 0.0, 1.0,	  1.0, 0.95, 0.0,
		0.6,  0.0, 0.0, 1.0,	  1.0, 0.6, 0.0,


		//backside

		0.0,  0.0,  -0.25, 1.0,	  1.0, 1.0, 0.0,	// Node 0
	    0.25, -0.25, 0.0, 1.0,	  1.0, 0.95, 0.0, // Node 1
		0.6,  0.0, 0.0, 1.0,	  1.0, 0.6, 0.0,

		0.0,  0.0,  -0.25, 1.0,	  1.0, 1.0, 0.0,	// Node 0
	    0.25, -0.25, 0.0, 1.0,	  1.0, 0.95, 0.0,	// Node 1
		0.0,  -0.75, 0.0, 1.0,	  1.0, 0.6, 0.0,

		0.0,  0.0,  -0.25, 1.0,	  1.0, 1.0, 0.0,
	    -0.25, -0.25, 0.0, 1.0,	  1.0, 0.95, 0.0,
		0.0,  -0.75, 0.0, 1.0,	  1.0, 0.6, 0.0,

		0.0,  0.0,  -0.25, 1.0,	  1.0, 1.0, 0.0,
	    -0.25, -0.25, 0.0, 1.0,	  1.0, 0.95, 0.0,
		-0.6,  0.0, 0.0, 1.0,	  1.0, 0.6, 0.0,

		0.0,  0.0,  -0.25, 1.0,	  1.0, 1.0, 0.0,
	    -0.25, 0.25, 0.0, 1.0,	  1.0, 0.95, 0.0,
		-0.6,  0.0, 0.0, 1.0,	  1.0, 0.6, 0.0,

		0.0,  0.0,  -0.25, 1.0,	  1.0, 1.0, 0.0,
	    -0.25, 0.25, 0.0, 1.0,	  1.0, 0.95, 0.0,
		0.0,  0.75, 0.0, 1.0,	  1.0, 0.6, 0.0,

		0.0,  0.0,  -0.25, 1.0,	  1.0, 1.0, 0.0,
	    0.25, 0.25, 0.0, 1.0,	  1.0, 0.95, 0.0,
		0.0,  0.75, 0.0, 1.0,	  1.0, 0.6, 0.0,

		0.0,  0.0,  -0.25, 1.0,	  1.0, 1.0, 0.0,
	    0.25, 0.25, 0.0, 1.0,	  1.0, 0.95, 0.0,
		0.6,  0.0, 0.0, 1.0,	  1.0, 0.6, 0.0,
		
		
		

	   



	]);
	var nn = 168;		
	
  // Create a buffer object
  var shapeBufferHandle = gl.createBuffer();  
  if (!shapeBufferHandle) {
    console.log('Failed to create the shape buffer object');
    return false;
  }

  // Bind the the buffer object to target:
  gl.bindBuffer(gl.ARRAY_BUFFER, shapeBufferHandle);
  gl.bufferData(gl.ARRAY_BUFFER, colorShapes, gl.STATIC_DRAW);

  var FSIZE = colorShapes.BYTES_PER_ELEMENT; // how many bytes per stored value?
    
  //Get graphics system's handle for our Vertex Shader's position-input variable: 
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  // Use handle to specify how to retrieve position data from our VBO:
  gl.vertexAttribPointer(
  		a_Position, 	// choose Vertex Shader attribute to fill with data
  		4, 						// how many values? 1,2,3 or 4.  (we're using x,y,z,w)
  		gl.FLOAT, 		// data type for each value: usually gl.FLOAT
  		false, 				// did we supply fixed-point data AND it needs normalizing?
  		FSIZE * 7, 		// Stride -- how many bytes used to store each vertex?
  									// (x,y,z,w, r,g,b) * bytes/value
  		0);						// Offset -- now many bytes from START of buffer to the
  									// value we will actually use?
  gl.enableVertexAttribArray(a_Position);  
  									// Enable assignment of vertex buffer object's position data

  // Get graphics system's handle for our Vertex Shader's color-input variable;
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if(a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }
  // Use handle to specify how to retrieve color data from our VBO:
  gl.vertexAttribPointer(
  	a_Color, 				// choose Vertex Shader attribute to fill with data
  	3, 							// how many values? 1,2,3 or 4. (we're using R,G,B)
  	gl.FLOAT, 			// data type for each value: usually gl.FLOAT
  	false, 					// did we supply fixed-point data AND it needs normalizing?
  	FSIZE * 7, 			// Stride -- how many bytes used to store each vertex?
  	FSIZE * 4);			// Offset -- how many bytes from START of buffer to the
  									// value we will actually use?  Need to skip over x,y,z,w					
  gl.enableVertexAttribArray(a_Color);  
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

}


function DrawAll(){
	let stack = []

	// Clear <canvas>  colors AND the depth buffer
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	clrColr = new Float32Array(4);
	clrColr = gl.getParameter(gl.COLOR_CLEAR_VALUE);



	g_modelMatrix.setTranslate(0,-0.24, 0.0);  // 'set' means DISCARD old matrix,
	g_modelMatrix.scale(1,1,-1);							// convert to left-handed coord sys																	// to match WebGL display canvas.
	g_modelMatrix.scale(0.12, 0.12, 0.12);
	g_modelMatrix.rotate(g_angle01, 2, 1, 1);  // Make new drawing axes that
	g_modelMatrix.translate(1.4, -0.6, 2);
	g_modelMatrix.rotate(g_angle02, 1, 2, 5);  // Make new drawing axes that
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);

	stack.push(new Matrix4(g_modelMatrix));
	DrawCube()
	g_modelMatrix.translate(-1.2, -0.3, 0);
	g_modelMatrix.scale(1,1,-1);
	Draw_claw_left(1,0,0)

	g_modelMatrix = stack.pop();
	stack.push(new Matrix4(g_modelMatrix));
	g_modelMatrix.translate(1.2, -0.3, 0.0);
	g_modelMatrix.scale(1,1,-1);
	Draw_claw_right(1,0,0)

	g_modelMatrix = stack.pop();
	stack.push(new Matrix4(g_modelMatrix));
	g_modelMatrix.translate(-0.5, -1.2, 0);
	g_modelMatrix.scale(1,1,-1);
	Draw_leg(g_angle_leg1)
	g_modelMatrix = stack.pop();
	stack.push(new Matrix4(g_modelMatrix));
	g_modelMatrix.translate(0.5, -1.2, 0);
	g_modelMatrix.scale(1,1,-1);
	Draw_leg(g_angle_leg2)


	g_modelMatrix = stack.pop();
	stack.push(new Matrix4(g_modelMatrix));
	g_modelMatrix.translate(0, 1.8, 0.0);
	g_modelMatrix.scale(1,1,-1);
	g_modelMatrix.rotate(20,1,0,0)
	g_modelMatrix.rotate(180,1,0,0)
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	DrawTetra()
	g_modelMatrix.rotate(160,1,0,0)
	Draw_eyes()
	Draw_moon()


	Draw_n_star(num_star)
}

function Draw_moon(){
	let stack4 = []
	g_modelMatrix.setTranslate(-0.45, 0.5, 0.0); 
	g_modelMatrix.scale(1,1,-1);							// convert to left-handed coord sys													// to match WebGL display canvas.
	g_modelMatrix.scale(0.2, 0.2, 0.2);				// Make it smaller.
	var dist = Math.sqrt(g_xMdragTot*g_xMdragTot + g_yMdragTot*g_yMdragTot);
	g_modelMatrix.rotate(dist*100, -g_yMdragTot+0.0001, g_xMdragTot+0.0001, 0.0);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 48, 36);
	stack4.push(new Matrix4(g_modelMatrix));
// RIGHT SIDE
	g_modelMatrix.translate(0.36,0,0)
	g_modelMatrix.scale(0.8,0.8,0.8);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 48, 36);
	g_modelMatrix = stack4.pop();
	stack4.push(new Matrix4(g_modelMatrix));
	g_modelMatrix.translate(0.78,0,0)
	g_modelMatrix.scale(0.5, 0.5, 0.5);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 48, 36);
	g_modelMatrix = stack4.pop();
	stack4.push(new Matrix4(g_modelMatrix));
	g_modelMatrix.translate(1.1,0,0)
	g_modelMatrix.scale(0.3, 0.3, 0.3);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 48, 36);
// LEFT SIDE
	g_modelMatrix = stack4.pop();
	stack4.push(new Matrix4(g_modelMatrix));
	g_modelMatrix.translate(-0.36,0,0)
	g_modelMatrix.scale(0.8,0.8,0.8);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 48, 36);
	g_modelMatrix = stack4.pop();
	stack4.push(new Matrix4(g_modelMatrix));
	g_modelMatrix.translate(-0.78,0,0)
	g_modelMatrix.scale(0.5, 0.5, 0.5);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 48, 36);
	g_modelMatrix = stack4.pop();
	stack4.push(new Matrix4(g_modelMatrix));
	g_modelMatrix.translate(-1.1,0,0)
	g_modelMatrix.scale(0.3, 0.3, 0.3);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 48, 36);
// UPPER SIDE
	g_modelMatrix = stack4.pop();
	stack4.push(new Matrix4(g_modelMatrix));
	g_modelMatrix.translate(0,0.36,0)
	g_modelMatrix.scale(0.8,0.8,0.8);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 48, 36);
	g_modelMatrix = stack4.pop();
	stack4.push(new Matrix4(g_modelMatrix));
	g_modelMatrix.translate(0,0.78,0)
	g_modelMatrix.scale(0.5, 0.5, 0.5);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 48, 36);
	g_modelMatrix = stack4.pop();
	stack4.push(new Matrix4(g_modelMatrix));
	g_modelMatrix.translate(0,1.1,0)
	g_modelMatrix.scale(0.3, 0.3, 0.3);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 48, 36);
	// LOWER SIDE
	g_modelMatrix = stack4.pop();
	stack4.push(new Matrix4(g_modelMatrix));
	g_modelMatrix.translate(0,-0.36,0)
	g_modelMatrix.scale(0.8,0.8,0.8);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 48, 36);
	g_modelMatrix = stack4.pop();
	stack4.push(new Matrix4(g_modelMatrix));
	g_modelMatrix.translate(0,-0.78,0)
	g_modelMatrix.scale(0.5, 0.5, 0.5);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 48, 36);
	g_modelMatrix = stack4.pop();
	stack4.push(new Matrix4(g_modelMatrix));
	g_modelMatrix.translate(0,-1.1,0)
	g_modelMatrix.scale(0.3, 0.3, 0.3);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 48, 36);

	// BACK SIDE
	g_modelMatrix = stack4.pop();
	stack4.push(new Matrix4(g_modelMatrix));
	g_modelMatrix.translate(0,0.0,-0.36)
	g_modelMatrix.scale(0.8,0.8,0.8);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 48, 36);
	g_modelMatrix = stack4.pop();
	stack4.push(new Matrix4(g_modelMatrix));
	g_modelMatrix.translate(0,0,-0.78)
	g_modelMatrix.scale(0.5, 0.5, 0.5);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 48, 36);
	g_modelMatrix = stack4.pop();
	stack4.push(new Matrix4(g_modelMatrix));
	g_modelMatrix.translate(0,0,-1.1)
	g_modelMatrix.scale(0.3, 0.3, 0.3);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 48, 36);


	// BACK SIDE
	g_modelMatrix = stack4.pop();
	stack4.push(new Matrix4(g_modelMatrix));
	g_modelMatrix.translate(0,0.0,0.36)
	g_modelMatrix.scale(0.8,0.8,0.8);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 48, 36);
	g_modelMatrix = stack4.pop();
	stack4.push(new Matrix4(g_modelMatrix));
	g_modelMatrix.translate(0,0,0.78)
	g_modelMatrix.scale(0.5, 0.5, 0.5);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 48, 36);
	g_modelMatrix = stack4.pop();
	stack4.push(new Matrix4(g_modelMatrix));
	g_modelMatrix.translate(0,0,1.1)
	g_modelMatrix.scale(0.3, 0.3, 0.3);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 48, 36);

}


function Draw_n_star(n){
	var i;

	for (i = 0; i < n; i++){
		x = Math.random()*2-1
		y = Math.random()*2-1
		size = Math.random()*0.1+0.05
		rotate_par = Math.random()*160
		Draw_star(rotate_par, x, y, size)
	}
}

function Draw_star(rotate_par,x,y,size){
	g_modelMatrix.setTranslate(x, y, 0.0); 
	g_modelMatrix.scale(1,1,-1);							// convert to left-handed coord sys													// to match WebGL display canvas.
	g_modelMatrix.scale(size, size, size);				// Make it smaller.
	var dist = Math.sqrt(g_xMdragTot*g_xMdragTot + g_yMdragTot*g_yMdragTot);
	g_modelMatrix.rotate(dist*rotate_par, -g_yMdragTot+0.0001, g_xMdragTot+0.0001, 0.0);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	// Draw only the last 2 triangles: start at vertex 6, draw 6 vertices
	gl.drawArrays(gl.TRIANGLES, 120, 48);

}

function Draw_eyes(){
	let stack3 = []
	stack3.push(new Matrix4(g_modelMatrix));
	g_modelMatrix.scale(0.2,0.2,0.2)
	g_modelMatrix.translate(2.5,2,-4)
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 48, 36);
	g_modelMatrix.scale(0.5,0.5,0.5)
	g_modelMatrix.translate(-0.5,-0.5,-2.1)
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 84, 36);
	g_modelMatrix = stack3.pop();
	g_modelMatrix.scale(0.2,0.2,0.2)
	g_modelMatrix.translate(-2.5,2,-4)
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 48, 36);
	g_modelMatrix.scale(0.5,0.5,0.5)
	g_modelMatrix.translate(-0.5,-0.5,-2.1)
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	gl.drawArrays(gl.TRIANGLES, 84, 36);
}

function Draw_leg(g){
	let stack2 = []
	g_modelMatrix.scale(0.2, 0.2, 0.2);

	g_modelMatrix.rotate(g, 1,0,0);  // Make new drawing axes that
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	DrawCube();
	g_modelMatrix.translate(0, -1.5, -1.5);
	g_modelMatrix.rotate(g, 1, 0, 0);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	DrawCube();
	g_modelMatrix.translate(0, -1.5, -1.5);
	g_modelMatrix.scale(2, 1, 2);
	g_modelMatrix.rotate(g, 1, 0, 0);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	DrawCube();

}

function Draw_claw_right(x,y,z){
	let stack2 = []
	g_modelMatrix.scale(0.2, 0.2, 0.2);
	// g_modelMatrix.rotate(g_angle02, 1, 0, 0);
	g_modelMatrix.rotate(90, 0, -1, 0);
	g_modelMatrix.rotate(g_angle02, x, y, z);  // Make new drawing axes that
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	DrawCube();
	g_modelMatrix.translate(0, -1.5, -1.5);
	g_modelMatrix.rotate(g_angle02, x, y, z);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	DrawCube();
	g_modelMatrix.translate(0, -1.5, -1.5);
	g_modelMatrix.rotate(g_angle02, x, y, z);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	DrawCube();
	g_modelMatrix.translate(0, -1.5, -1.5);
	g_modelMatrix.rotate(g_angle02, x, y, z);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	DrawCube();
	g_modelMatrix.translate(0, -1.5, -1.5);
	g_modelMatrix.rotate(g_angle02, x, y, z);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	DrawCube();

	// // lower claw
	// g_modelMatrix.translate(0, -2.5, 0);
	// g_modelMatrix.scale(0.5, 0.5, 0.5);
	// g_modelMatrix.rotate(90, 1, 0, 0)

	// stack2.push(new Matrix4(g_modelMatrix));
	// gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	// // DrawCube();

	// g_modelMatrix = stack2.pop();
	// g_modelMatrix.translate(0, 0, -2);
	// gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	// DrawCube();



}

function Draw_claw_left(x,y,z){
	g_modelMatrix.scale(0.2, 0.2, 0.2);
	g_modelMatrix.rotate(90, 0, 1, 0);
	g_modelMatrix.rotate(g_angle02, x, y, z);  
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	DrawCube();
	g_modelMatrix.translate(0, -1.5, -1.5);
	g_modelMatrix.rotate(g_angle02, x, y, z);
	// g_modelMatrix.rotate(g_angle02, 0, 1, 0);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	DrawCube();
	g_modelMatrix.translate(0, -1.5, -1.5);
	g_modelMatrix.rotate(g_angle02, x, y, z);
	// g_modelMatrix.rotate(g_angle02, 0, -1, 0);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	DrawCube();
	g_modelMatrix.translate(0, -1.5, -1.5);
	g_modelMatrix.rotate(g_angle02, x, y, z);
	// g_modelMatrix.rotate(g_angle02, 0, -1, 0);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	DrawCube();
	g_modelMatrix.translate(0, -1.5, -1.5);
	g_modelMatrix.rotate(g_angle02, x, y, z);
	// g_modelMatrix.rotate(g_angle02, 0, -1, 0);
	gl.uniformMatrix4fv(g_modelMatLoc, false, g_modelMatrix.elements);
	DrawCube();
	

}

function DrawTetra() {
	// Draw triangles: start at vertex 0 and draw 12 vertices
  gl.drawArrays(gl.TRIANGLES, 0, 12);
}

function DrawWedge() {
  		// Draw only the last 2 triangles: start at vertex 6, draw 6 vertices
  gl.drawArrays(gl.TRIANGLES, 6,6);

}

function DrawCube(){
   gl.drawArrays(gl.TRIANGLES, 12,36);

}

function DrawPart2(){
	gl.drawArrays(gl.TRIANGLES, 6,3);
}



// Last time that this function was called:  (used for animation timing)
var g_last = Date.now();

function animate() {
//==============================================================================
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;
  
  // Update the current rotation angle (adjusted by the elapsed time)
  //  limit the angle to move smoothly between +120 and -85 degrees:
  //  if(angle >  120.0 && g_angle01Rate > 0) g_angle01Rate = -g_angle01Rate;
  //  if(angle <  -85.0 && g_angle01Rate < 0) g_angle01Rate = -g_angle01Rate;
  
  g_angle01 = g_angle01 + (g_angle01Rate * elapsed) / 1000.0;
  if(g_angle01 > 180.0) g_angle01 = g_angle01 - 360.0;
  if(g_angle01 <-180.0) g_angle01 = g_angle01 + 360.0;

  g_angle02 = g_angle02 + (g_angle02Rate * elapsed) / 1000.0;
//   if(g_angle02 > 180.0) g_angle02 = g_angle02 - 360.0;
//   if(g_angle02 <-180.0) g_angle02 = g_angle02 + 360.0;
  
  if(g_angle02 > 45.0 && g_angle02Rate > 0) g_angle02Rate *= -1.0;
  if(g_angle02 < 0.0  && g_angle02Rate < 0) g_angle02Rate *= -1.0;

  g_angle_leg1 = g_angle_leg1 - (g_angle04Rate * elapsed) / 1000.0;
    if(g_angle_leg1 < -50.0 && g_angle04Rate > 0) g_angle04Rate *= -1.0;
	if(g_angle_leg1 > 10.0 && g_angle04Rate < 0) g_angle04Rate *= -1.0;



  g_angle_leg2 = g_angle_leg2 + (g_angle05Rate * elapsed) / 1000.0;
	if(g_angle_leg2 > 10 && g_angle05Rate > 0) g_angle05Rate *= -1.0;
	if(g_angle_leg2 < -50.0  && g_angle05Rate < 0) g_angle05Rate *= -1.0;

}

//==================HTML Button Callbacks======================

function num_stars() {
	// Called when user presses 'Submit' button on our webpage
	//		HOW? Look in HTML file (e.g. ControlMulti.html) to find
	//	the HTML 'input' element with id='usrAngle'.  Within that
	//	element you'll find a 'button' element that calls this fcn.
	
	// Read HTML edit-box contents:
		var UsrTxt = document.getElementById('Numstars').value;	
	// Display what we read from the edit-box: use it to fill up
	// the HTML 'div' element with id='editBoxOut':
	  document.getElementById('EditBoxOut').innerHTML ='You Typed: '+UsrTxt;
	  console.log('NumSubmit: UsrTxt:', UsrTxt); // print in console, and
	  num_star = parseFloat(UsrTxt);     // convert string to float number 
	};


function angleSubmit() {
// Called when user presses 'Submit' button on our webpage
//		HOW? Look in HTML file (e.g. ControlMulti.html) to find
//	the HTML 'input' element with id='usrAngle'.  Within that
//	element you'll find a 'button' element that calls this fcn.

// Read HTML edit-box contents:
	var UsrTxt = document.getElementById('usrAngle').value;	
// Display what we read from the edit-box: use it to fill up
// the HTML 'div' element with id='editBoxOut':
  document.getElementById('EditBoxOut').innerHTML ='You Typed: '+UsrTxt;
  console.log('angleSubmit: UsrTxt:', UsrTxt); // print in console, and
  g_angle01 = parseFloat(UsrTxt);     // convert string to float number 
};

function clearDrag() {
// Called when user presses 'Clear' button in our webpage
	g_xMdragTot = 0.0;
	g_yMdragTot = 0.0;
}

function spinUp() {
// Called when user presses the 'Spin >>' button on our webpage.
// ?HOW? Look in the HTML file (e.g. ControlMulti.html) to find
// the HTML 'button' element with onclick='spinUp()'.
  g_angle01Rate += 25; 
}

function spinDown() {
// Called when user presses the 'Spin <<' button
 g_angle01Rate -= 25; 
}

function runStop() {
// Called when user presses the 'Run/Stop' button
  if(g_angle01Rate*g_angle01Rate > 1) {  // if nonzero rate,
    myTmp = g_angle01Rate;  // store the current rate,
    g_angle01Rate = 0;      // and set to zero.
  }
  else {    // but if rate is zero,
  	g_angle01Rate = myTmp;  // use the stored rate.
  }
}

function myMouseDown(ev) {
//==============================================================================
// Called when user PRESSES down any mouse button;
// 									(Which button?    console.log('ev.button='+ev.button);   )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
  var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseDown(pixel coords): xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
  						 (g_canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - g_canvas.height/2) /		//										 -1 <= y < +1.
							 (g_canvas.height/2);
//	console.log('myMouseDown(CVV coords  ):  x, y=\t',x,',\t',y);
	
	g_isDrag = true;											// set our mouse-dragging flag
	g_xMclik = x;													// record where mouse-dragging began
	g_yMclik = y;
	// report on webpage
	document.getElementById('MouseAtResult').innerHTML = 
	  'Mouse At: '+x.toFixed(g_digits)+', '+y.toFixed(g_digits);
};


function myMouseMove(ev) {
//==============================================================================
// Called when user MOVES the mouse with a button already pressed down.
// 									(Which button?   console.log('ev.button='+ev.button);    )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

	if(g_isDrag==false) return;				// IGNORE all mouse-moves except 'dragging'

	// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
	var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseMove(pixel coords): xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
  						 (g_canvas.width/2);		// normalize canvas to -1 <= x < +1,
	var y = (yp - g_canvas.height/2) /		//									-1 <= y < +1.
							 (g_canvas.height/2);
//	console.log('myMouseMove(CVV coords  ):  x, y=\t',x,',\t',y);

	// find how far we dragged the mouse:
	g_xMdragTot += (x - g_xMclik);			// Accumulate change-in-mouse-position,&
	g_yMdragTot += (y - g_yMclik);
	// Report new mouse position & how far we moved on webpage:
	document.getElementById('MouseAtResult').innerHTML = 
	  'Mouse At: '+x.toFixed(g_digits)+', '+y.toFixed(g_digits);
	document.getElementById('MouseDragResult').innerHTML = 
	  'Mouse Drag: '+(x - g_xMclik).toFixed(g_digits)+', ' 
	  					  +(y - g_yMclik).toFixed(g_digits);

	g_xMclik = x;											// Make next drag-measurement from here.
	g_yMclik = y;
};

function myMouseUp(ev) {
//==============================================================================
// Called when user RELEASES mouse button pressed previously.
// 									(Which button?   console.log('ev.button='+ev.button);    )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
	var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseUp  (pixel coords):\n\t xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
  						 (g_canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - g_canvas.height/2) /		//										 -1 <= y < +1.
							 (g_canvas.height/2);
	console.log('myMouseUp  (CVV coords  ):\n\t x, y=\t',x,',\t',y);
	
	g_isDrag = false;											// CLEAR our mouse-dragging flag, and
	// accumulate any final bit of mouse-dragging we did:
	g_xMdragTot += (x - g_xMclik);
	g_yMdragTot += (y - g_yMclik);
	// Report new mouse position:
	document.getElementById('MouseAtResult').innerHTML = 
	  'Mouse At: '+x.toFixed(g_digits)+', '+y.toFixed(g_digits);
	console.log('myMouseUp: g_xMdragTot,g_yMdragTot =',
		g_xMdragTot.toFixed(g_digits),',\t',g_yMdragTot.toFixed(g_digits));
};

function myMouseClick(ev) {
	console.log("myMouseClick() on button: ", ev.button); 
}	

function myMouseDblClick(ev) {
//=============================================================================
// Called when user completes a mouse-button double-click event 
	console.log("myMouse-DOUBLE-Click() on button: ", ev.button); 
}	

function myKeyDown(kev) {
//===============================================================================
// Called when user presses down ANY key on the keyboard;
//
// For a light, easy explanation of keyboard events in JavaScript,
// see:    http://www.kirupa.com/html5/keyboard_events_in_javascript.htm
// For a thorough explanation of a mess of JavaScript keyboard event handling,
// see:    http://javascript.info/tutorial/keyboard-events
//
// NOTE: Mozilla deprecated the 'keypress' event entirely, and in the
//        'keydown' event deprecated several read-only properties I used
//        previously, including kev.charCode, kev.keyCode. 
//        Revised 2/2019:  use kev.key and kev.code instead.
//
// Report EVERYTHING in console:
  console.log(  "--kev.code:",    kev.code,   "\t\t--kev.key:",     kev.key, 
              "\n--kev.ctrlKey:", kev.ctrlKey,  "\t--kev.shiftKey:",kev.shiftKey,
              "\n--kev.altKey:",  kev.altKey,   "\t--kev.metaKey:", kev.metaKey);

// and report EVERYTHING on webpage:
	document.getElementById('KeyDownResult').innerHTML = ''; // clear old results
  document.getElementById('KeyModResult' ).innerHTML = ''; 
  // key details:
  document.getElementById('KeyModResult' ).innerHTML = 
        "   --kev.code:"+kev.code   +"      --kev.key:"+kev.key+
    "<br>--kev.ctrlKey:"+kev.ctrlKey+" --kev.shiftKey:"+kev.shiftKey+
    "<br>--kev.altKey:"+kev.altKey +"  --kev.metaKey:"+kev.metaKey;
 
	switch(kev.code) {
		case "KeyP":
			console.log("Pause/unPause!\n");                // print on console,
			document.getElementById('KeyDownResult').innerHTML =  
			'myKeyDown() found p/P key. Pause/unPause!';   // print on webpage
			if(g_isRun==true) {
			  g_isRun = false;    // STOP animation
			  }
			else {
			  g_isRun = true;     // RESTART animation
			  tick();
			  }
			break;
		//------------------WASD navigation-----------------
		case "KeyA":
			console.log("a/A key: Strafe LEFT!\n");
			document.getElementById('KeyDownResult').innerHTML =  
			'myKeyDown() found a/A key. Strafe LEFT!';
			break;
    case "KeyD":
			console.log("d/D key: Strafe RIGHT!\n");
			document.getElementById('KeyDownResult').innerHTML = 
			'myKeyDown() found d/D key. Strafe RIGHT!';
			break;
		case "KeyS":
			console.log("s/S key: Move BACK!\n");
			document.getElementById('KeyDownResult').innerHTML = 
			'myKeyDown() found s/Sa key. Move BACK.';
			break;
		case "KeyW":
			console.log("w/W key: Move FWD!\n");
			document.getElementById('KeyDownResult').innerHTML =  
			'myKeyDown() found w/W key. Move FWD!';
			break;
		//----------------Arrow keys------------------------
		case "ArrowLeft": 	
			console.log(' left-arrow.');
			// and print on webpage in the <div> element with id='Result':
  		document.getElementById('KeyDownResult').innerHTML =
  			'myKeyDown(): Left Arrow='+kev.keyCode;
			break;
		case "ArrowRight":
			console.log('right-arrow.');
  		document.getElementById('KeyDownResult').innerHTML =
  			'myKeyDown():Right Arrow:keyCode='+kev.keyCode;
  		break;
		case "ArrowUp":		
			console.log('   up-arrow.');
  		document.getElementById('KeyDownResult').innerHTML =
  			'myKeyDown():   Up Arrow:keyCode='+kev.keyCode;
			break;
		case "ArrowDown":
			console.log(' down-arrow.');
  		document.getElementById('KeyDownResult').innerHTML =
  			'myKeyDown(): Down Arrow:keyCode='+kev.keyCode;
  		break;	
    default:
      console.log("UNUSED!");
  		document.getElementById('KeyDownResult').innerHTML =
  			'myKeyDown(): UNUSED!';
      break;
	}
}

function myKeyUp(kev) {
//===============================================================================
// Called when user releases ANY key on the keyboard; captures scancodes well

	console.log('myKeyUp()--keyCode='+kev.keyCode+' released.');
}
