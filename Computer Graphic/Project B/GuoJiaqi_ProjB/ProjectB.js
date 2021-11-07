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

var DEBUG = false;

// Global Variables
//? Keys
const UP_ARROW    = 38;
const LEFT_ARROW  = 37;
const RIGHT_ARROW = 39;
const DOWN_ARROW  = 40;

const W = 87;
const A = 65;
const S = 83;
const D = 68;

// ! For Quaternion Mouse Drag =================================================

var isDrag=false;		// mouse-drag: true when user holds down mouse button
var xMclik=0.0;			// last mouse button-down position (in CVV coords)
var yMclik=0.0;   
var xMdragTot=0.0;	// total (accumulated) mouse-drag amounts (in CVV coords).
var yMdragTot=0.0;  

var qNew = new Quaternion(0,0,0,1); // most-recent mouse drag's rotation
var qTot = new Quaternion(0,0,0,1);	// 'current' orientation (made from qNew)
var quatMatrix = new Matrix4();				// rotation matrix, made from latest qTot

// ! ============================================================================

var ANGLE_STEP = 45.0;		// Rotation angle rate (degrees/second)
var floatsPerVertex = 7;	// # of Float32Array elements used for each vertex
													// (x,y,z,w)position + (r,g,b)color
													// Later, see if you can add:
													// (x,y,z) surface normal + (tx,ty) texture addr.

var g_camXInit = 5.0, g_camYInit = 5.0, g_camZInit = 5.0;
var g_lookXInit = 4.0, g_lookYInit = 4.0, g_lookZInit = 4.5;

var g_aimThetaInit = 215.0

var g_camX = g_camXInit, g_camY = g_camYInit, g_camZ = g_camZInit; //! Location of our camera
var g_lookX = g_lookXInit, g_lookY = g_lookYInit, g_lookZ = g_lookZInit; //! Where our camera is looking

var g_aimTheta = g_aimThetaInit;

var g_aimZDiff = g_lookZ - g_camZ;

var g_moveRate = 3.0;

// For Animation 
var g_angle01 = 0.0;                  // initial rotation angle
var g_angle01Rate = 45.0;           // rotation speed, in degrees/second 

var g_angle02 = 0.0;
var g_angle02Rate = 20.0;

var g_angleLink1 = 0.0;
var g_angleLink1Rate = 10.0;

var g_angleLink2 = 0.0;
var g_angleLink2Rate = 15.0;

var g_angleLink3 = 0.0;
var g_angleLink3Rate = 20.0;

var g_angleHead = 0.0;
var g_angleHeadRate = 20.0;
var modelMatrix = new Matrix4();
var viewMatrix = new Matrix4();
var projMatrix = new Matrix4();
var ModelMatrix = new Matrix4();

function main() {
	var canvas = document.getElementById('webgl');
	window.addEventListener('keydown', keyDown, false);
	canvas.onmouseup = (ev) => myMouseUp(ev, gl, canvas);
	canvas.onmousedown = (ev) => mouseDown(ev, gl, canvas);
	canvas.onmousemove = (ev) => mouseMove(ev, gl, canvas);
	
	var gl = getWebGLContext(canvas);
	if (!gl) {
	console.log('Failed to get the rendering context for WebGL');
	return;
	}

	// Initialize shaders
	if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
		console.log('Failed to intialize shaders.');
		return;
	}

	var g_maxVerts = initVertexBuffer(gl);
	if (g_maxVerts < 0) {
		console.log('Failed to set the vertex information');
		return;
	}

	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.enable(gl.DEPTH_TEST); 	 

  // Get handle to graphics system's storage location of u_ModelMatrix
	var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');

	if (!u_ModelMatrix) { 
		console.log('Failed to get the storage location of u_ModelMatrix');
		return;
		}

	var tick = function() {
		currentAngle = animate(currentAngle);
		drawResize(gl, canvas, currentAngle, modelMatrix, viewMatrix, projMatrix, ModelMatrix, u_ModelMatrix);   // Draw shapes
    requestAnimationFrame(tick, canvas);   
	};
	tick();
}

function initVertexBuffer(gl) {
//==============================================================================
// Create one giant vertex buffer object (VBO) that holds all vertices for all
// shapes.
 
	// Make each 3D shape in its own array of vertices:
	makeConcaveHex();				// create, fill the concaveHexVerts array
	makeHexagram(); 				// create, fill the hexagramVerts array
	makePyramid();					// create, fill the pyrVerts array
	makeCylinder();					// create, fill the cylVerts array
	makeSphere();						// create, fill the sphVerts array
	makeTorus();						// create, fill the torVerts array
	makeGroundGrid();				// create, fill the gndVerts array
  // how many floats total needed to store all shapes?
	var mySiz = (concaveHexVerts.length + hexagramVerts.length + pyrVerts.length + cylVerts.length + sphVerts.length + 
							 torVerts.length + gndVerts.length);						

	// How many vertices total?
	var nn = mySiz / floatsPerVertex;
	console.log('nn is', nn, 'mySiz is', mySiz, 'floatsPerVertex is', floatsPerVertex);
	// Copy all shapes into one big Float32 array:
  var colorShapes = new Float32Array(mySiz);
	// Copy them:  remember where to start for each shape:
	cylStart = 0;							// we stored the cylinder first.
  for(i=0,j=0; j< cylVerts.length; i++,j++) {
  	colorShapes[i] = cylVerts[j];
		}
		sphStart = i;						// next, we'll store the sphere;
	for(j=0; j< sphVerts.length; i++, j++) {// don't initialize i -- reuse it!
		colorShapes[i] = sphVerts[j];
		}
		torStart = i;						// next, we'll store the torus;
	for(j=0; j< torVerts.length; i++, j++) {
		colorShapes[i] = torVerts[j];
		}
		gndStart = i;						// next we'll store the ground-plane;
	for(j=0; j< gndVerts.length; i++, j++) {
		colorShapes[i] = gndVerts[j];
		}
		pyrStart = i;						// store the pyramid
	for(j=0; j< pyrVerts.length; i++, j++) {
		colorShapes[i] = pyrVerts[j];
		}
		concaveHexStart = i;    // store concave hexagon
	for(j=0; j< concaveHexVerts.length; i++, j++) {
		colorShapes[i] = concaveHexVerts[j];
		}
		hexagramStart = i; 			// store hexagram
	for(j=0; j< hexagramVerts.length; i++, j++) {
		colorShapes[i] = hexagramVerts[j];
		}

  // Create a buffer object on the graphics hardware:
  var shapeBufferHandle = gl.createBuffer();  
  if (!shapeBufferHandle) {
    console.log('Failed to create the shape buffer object');
    return false;
  }

  // Bind the the buffer object to target:
  gl.bindBuffer(gl.ARRAY_BUFFER, shapeBufferHandle);
  // Transfer data from Javascript array colorShapes to Graphics system VBO
  // (Use sparingly--may be slow if you transfer large shapes stored in files)
  gl.bufferData(gl.ARRAY_BUFFER, colorShapes, gl.STATIC_DRAW);
    
  //Get graphics system's handle for our Vertex Shader's position-input variable: 
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }

  var FSIZE = colorShapes.BYTES_PER_ELEMENT; // how many bytes per stored value?

  // Use handle to specify how to retrieve **POSITION** data from our VBO:
  gl.vertexAttribPointer(
  		a_Position, 	// choose Vertex Shader attribute to fill with data
  		4, 						// how many values? 1,2,3 or 4.  (we're using x,y,z,w)
  		gl.FLOAT, 		// data type for each value: usually gl.FLOAT
  		false, 				// did we supply fixed-point data AND it needs normalizing?
  		FSIZE * floatsPerVertex, // Stride -- how many bytes used to store each vertex?
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
  // Use handle to specify how to retrieve **COLOR** data from our VBO:
  gl.vertexAttribPointer(
  	a_Color, 				// choose Vertex Shader attribute to fill with data
  	3, 							// how many values? 1,2,3 or 4. (we're using R,G,B)
  	gl.FLOAT, 			// data type for each value: usually gl.FLOAT
  	false, 					// did we supply fixed-point data AND it needs normalizing?
  	FSIZE * 7, 			// Stride -- how many bytes used to store each vertex?
  									// (x,y,z,w, r,g,b) * bytes/value
  	FSIZE * 4);			// Offset -- how many bytes from START of buffer to the
  									// value we will actually use?  Need to skip over x,y,z,w
  									
  gl.enableVertexAttribArray(a_Color);  
  									// Enable assignment of vertex buffer object's position data

	//--------------------------------DONE!
  // Unbind the buffer object 
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return nn;
}

// simple & quick-- 
// I didn't use any arguments such as color choices, # of verts,slices,bars, etc.
// YOU can improve these functions to accept useful arguments...
//
function makeHexagram() {
	const s60 = Math.sqrt(3.0)/2.0;      // == sin(60deg) == sqrt(3) / 2
	const c60 = 0.5;										 // == cos(60deg) == 1 / 2

	hexagramVerts = new Float32Array([
		
		//! ------------------------ 3D Hexagram -----------------------

		/*
		Nodes:
			* Triangle 1
			1.0,  0.0,  0.0 , 1.0,   0.4,  0.0,  0.8,  // Node  0 PURPLE
		 -c60,  s60,  0.0 , 1.0,   0.0,  1.0,  0.0,  // Node  1 GREEN
		 -c60, -s60,  0.0 , 1.0,   0.0,  1.0,  1.0,  // Node  2 CYAN
			* Triangle 2
		 -1.0,  0.0,  0.01, 1.0,   0.4,  0.0,  0.8,  // Node  3 PURPLE
			c60, -s60,  0.01, 1.0,   0.0,  1.0,  0.0,  // Node  4 GREEN
			c60,  s60,  0.01, 1.0,   0.0,  1.0,  1.0,  // Node  5 CYAN

		 * Triangle 1 (back)
			1.0,  0.0, -1.0 , 1.0,   0.4,  0.0,  0.8,  // Node  6 PURPLE
		 -c60,  s60, -1.0 , 1.0,   0.0,  1.0,  0.0,  // Node  7 GREEN
		 -c60, -s60, -1.0 , 1.0,   0.0,  1.0,  1.0,  // Node  8 CYAN
		 * Triangle 2 (back)
		 -1.0,  0.0, -1.01, 1.0,   0.4,  0.0,  0.8,  // Node  9 PURPLE
			c60, -s60, -1.01, 1.0,   0.0,  1.0,  0.0,  // Node 10 GREEN
			c60,  s60, -1.01, 1.0,   0.0,  1.0,  1.0,  // Node 11 CYAN
		*/
		//* Front Face
			1.0,  0.0,  0.0 , 1.0,   0.4,  0.0,  0.8,  // Node  0 PURPLE
		 -c60,  s60,  0.0 , 1.0,   0.0,  1.0,  0.0,  // Node  1 GREEN
		 -c60, -s60,  0.0 , 1.0,   0.0,  1.0,  1.0,  // Node  2 CYAN

		 -1.0,  0.0,  0.01, 1.0,   0.4,  0.0,  0.8,  // Node  3 PURPLE
			c60, -s60,  0.01, 1.0,   0.0,  1.0,  0.0,  // Node  4 GREEN
			c60,  s60,  0.01, 1.0,   0.0,  1.0,  1.0,  // Node  5 CYAN
		//* Back Face
			1.0,  0.0, -1.01, 1.0,   0.4,  0.0,  0.8,  // Node  6 PURPLE
		 -c60,  s60, -1.01, 1.0,   0.0,  1.0,  0.0,  // Node  7 GREEN
		 -c60, -s60, -1.01, 1.0,   0.0,  1.0,  1.0,  // Node  8 CYAN

		 -1.0,  0.0, -1.0 , 1.0,   0.4,  0.0,  0.8,  // Node  9 PURPLE
			c60, -s60, -1.0 , 1.0,   0.0,  1.0,  0.0,  // Node 10 GREEN
			c60,  s60, -1.0 , 1.0,   0.0,  1.0,  1.0,  // Node 11 CYAN
		//* Sides
		//*----------------------------------------
			1.0,  0.0,  0.0 , 1.0,   0.4,  0.0,  0.8,  // Node  0 PURPLE
			1.0,  0.0, -1.01, 1.0,   0.4,  0.0,  0.8,  // Node  6 PURPLE
		 -c60,  s60, -1.01, 1.0,   0.0,  1.0,  0.0,  // Node  7 GREEN

		 -c60,  s60,  0.0 , 1.0,   0.0,  1.0,  0.0,  // Node  1 GREEN
		 -c60,  s60, -1.01, 1.0,   0.0,  1.0,  0.0,  // Node  7 GREEN
			1.0,  0.0,  0.0 , 1.0,   0.4,  0.0,  0.8,  // Node  0 PURPLE
		//*----------------------------------------
		 -c60,  s60,  0.0 , 1.0,   0.0,  1.0,  0.0,  // Node  1 GREEN
		 -c60,  s60, -1.01, 1.0,   0.0,  1.0,  0.0,  // Node  7 GREEN
		 -c60, -s60, -1.01, 1.0,   0.0,  1.0,  1.0,  // Node  8 CYAN
		
		 -c60, -s60,  0.0 , 1.0,   0.0,  1.0,  1.0,  // Node  2 CYAN
		 -c60, -s60, -1.01, 1.0,   0.0,  1.0,  1.0,  // Node  8 CYAN
		 -c60,  s60,  0.0 , 1.0,   0.0,  1.0,  0.0,  // Node  1 GREEN
		//*----------------------------------------
		 -c60, -s60,  0.0 , 1.0,   0.0,  1.0,  1.0,  // Node  2 CYAN
		 -c60, -s60, -1.01, 1.0,   0.0,  1.0,  1.0,  // Node  8 CYAN
			1.0,  0.0, -1.01, 1.0,   0.4,  0.0,  0.8,  // Node  6 PURPLE

			1.0,  0.0,  0.0 , 1.0,   0.4,  0.0,  0.8,  // Node  0 PURPLE
			1.0,  0.0, -1.01, 1.0,   0.4,  0.0,  0.8,  // Node  6 PURPLE
		 -c60, -s60,  0.0 , 1.0,   0.0,  1.0,  1.0,  // Node  2 CYAN
		//*----------------------------------------
		 -1.0,  0.0,  0.01, 1.0,   0.4,  0.0,  0.8,  // Node  3 PURPLE
		 -1.0,  0.0, -1.0 , 1.0,   0.4,  0.0,  0.8,  // Node  9 PURPLE
			c60, -s60, -1.0 , 1.0,   0.0,  1.0,  0.0,  // Node 10 GREEN

			c60, -s60,  0.01, 1.0,   0.0,  1.0,  0.0,  // Node  4 GREEN
			c60, -s60, -1.0 , 1.0,   0.0,  1.0,  0.0,  // Node 10 GREEN
		 -1.0,  0.0,  0.01, 1.0,   0.4,  0.0,  0.8,  // Node  3 PURPLE
		//*----------------------------------------
		 c60, -s60,  0.01, 1.0,   0.0,  1.0,  0.0,  // Node  4 GREEN
		 c60, -s60, -1.0 , 1.0,   0.0,  1.0,  0.0,  // Node 10 GREEN
		 c60,  s60, -1.0 , 1.0,   0.0,  1.0,  1.0,  // Node 11 CYAN

		 c60,  s60,  0.01, 1.0,   0.0,  1.0,  1.0,  // Node  5 CYAN
		 c60,  s60, -1.0 , 1.0,   0.0,  1.0,  1.0,  // Node 11 CYAN
		 c60, -s60,  0.01, 1.0,   0.0,  1.0,  0.0,  // Node  4 GREEN
		//*----------------------------------------
		 c60,  s60,  0.01, 1.0,   0.0,  1.0,  1.0,  // Node  5 CYAN
		 c60,  s60, -1.0 , 1.0,   0.0,  1.0,  1.0,  // Node 11 CYAN
		-1.0,  0.0, -1.0 , 1.0,   0.4,  0.0,  0.8,  // Node  9 PURPLE

		-1.0,  0.0,  0.01, 1.0,   0.4,  0.0,  0.8,  // Node  3 PURPLE
		-1.0,  0.0, -1.0 , 1.0,   0.4,  0.0,  0.8,  // Node  9 PURPLE
		 c60,  s60,  0.01, 1.0,   0.0,  1.0,  1.0,  // Node  5 CYAN	
		//*----------------------------------------
	]);
}

function makeConcaveHex() {
//==============================================================================
	const s30 = 0.5;										 // == sin(30deg) == 1 / 2
	const c30 = Math.sqrt(3.0)/2.0;			 // == cos(30deg) == sqrt(3) / 2

	concaveHexVerts = new Float32Array([
		//! --------------------- 3D Concave Hexagon ----------------------
		/*
			Nodes:
			* Front Facing Triangle
			-0.1,  0.1,  0.5,  1.0,    1.0,  0.0,  0.0,  // Node 0 RED
			 0.0, -0.1,  0.5,  1.0,    1.0,  1.0,  1.0,  // Node 1 WHITE
			 0.1,  0.1,  0.5,  1.0,    0.0,  0.0,  1.0,  // Node 2 BLUE
			* Back Facing Triangle
			-0.1,  0.1,  0.0,  1.0,    1.0,  0.0,  0.0,  // Node 3 RED
			 0.0, -0.1,  0.0,  1.0,    1.0,  1.0,  1.0,  // Node 4 WHITE
			 0.1,  0.1,  0.0,  1.0,    0.0,  0.0,  1.0,  // Node 5 BLUE
			* Points of Star
			 0.0,  1.0,  0.25, 1.0,    1.0,  0.0,  0.0,  // Node 6 RED
			-c30, -s30,  0.25, 1.0,    1.0,  1.0,  1.0,  // Node 7 WHITE
			 c30, -s30,  0.25, 1.0,    0.0,  0.0,  1.0,  // Node 8 BLUE 
		*/
		// * Front
			-0.1,  0.1,  0.5,  1.0,    1.0,  0.0,  0.0,  // Node 0 RED
			 0.0, -0.1,  0.5,  1.0,    1.0,  1.0,  1.0,  // Node 1 WHITE
			 0.1,  0.1,  0.5,  1.0,    0.0,  0.0,  1.0,  // Node 2 BLUE
		// * Back
			-0.1,  0.1,  0.0,  1.0,    1.0,  0.0,  0.0,  // Node 3 RED
			 0.0, -0.1,  0.0,  1.0,    1.0,  1.0,  1.0,  // Node 4 WHITE
			 0.1,  0.1,  0.0,  1.0,    0.0,  0.0,  1.0,  // Node 5 BLUE
		// ! ------------------- Top Point -------------------------
		// * Front Top Point Face
			-0.1,  0.1,  0.5,  1.0,    1.0,  0.0,  0.0,  // Node 0 RED
			 0.1,  0.1,  0.5,  1.0,    0.0,  0.0,  1.0,  // Node 2 BLUE
			 0.0,  1.0,  0.25, 1.0,    1.0,  0.0,  0.0,  // Node 6 RED
		// * Left Top Point Face
			-0.1,  0.1,  0.5,  1.0,    1.0,  0.0,  0.0,  // Node 0 RED
			-0.1,  0.1,  0.0,  1.0,    1.0,  0.0,  0.0,  // Node 3 RED
			 0.0,  1.0,  0.25, 1.0,    1.0,  0.0,  0.0,  // Node 6 RED
		// * Back Top Point Face
			-0.1,  0.1,  0.0,  1.0,    1.0,  0.0,  0.0,  // Node 3 RED
			 0.1,  0.1,  0.0,  1.0,    0.0,  0.0,  1.0,  // Node 5 BLUE
			 0.0,  1.0,  0.25, 1.0,    1.0,  0.0,  0.0,  // Node 6 RED
		// * Right Top Point Face
			 0.1,  0.1,  0.5,  1.0,    0.0,  0.0,  1.0,  // Node 2 BLUE
			 0.1,  0.1,  0.0,  1.0,    0.0,  0.0,  1.0,  // Node 5 BLUE
			 0.0,  1.0,  0.25, 1.0,    1.0,  0.0,  0.0,  // Node 6 RED
		// ! ------------------- Left Point -------------------------
		// * Front Left Point Face
			-0.1,  0.1,  0.5,  1.0,    1.0,  0.0,  0.0,  // Node 0 RED
			 0.0, -0.1,  0.5,  1.0,    1.0,  1.0,  1.0,  // Node 1 WHITE
			-c30, -s30,  0.25, 1.0,    1.0,  1.0,  1.0,  // Node 7 WHITE
		// * Left Left Point Face
			-0.1,  0.1,  0.5,  1.0,    1.0,  0.0,  0.0,  // Node 0 RED
			-0.1,  0.1,  0.0,  1.0,    1.0,  0.0,  0.0,  // Node 3 RED
			-c30, -s30,  0.25, 1.0,    1.0,  1.0,  1.0,  // Node 7 WHITE
		// * Back Left Point Face
			-0.1,  0.1,  0.0,  1.0,    1.0,  0.0,  0.0,  // Node 3 RED
			 0.0, -0.1,  0.0,  1.0,    1.0,  1.0,  1.0,  // Node 4 WHITE
			-c30, -s30,  0.25, 1.0,    1.0,  1.0,  1.0,  // Node 7 WHITE
		// * Right Left Point Face
			 0.0, -0.1,  0.5,  1.0,    1.0,  1.0,  1.0,  // Node 1 WHITE
			 0.0, -0.1,  0.0,  1.0,    1.0,  1.0,  1.0,  // Node 4 WHITE
			-c30, -s30,  0.25, 1.0,    1.0,  1.0,  1.0,  // Node 7 WHITE
		// ! -------------------- Right Point ------------------------
		// * Front Right Point Face 
			0.0, -0.1,  0.5,  1.0,    1.0,  1.0,  1.0,  // Node 1 WHITE
			0.1,  0.1,  0.5,  1.0,    0.0,  0.0,  1.0,  // Node 2 BLUE
			c30, -s30,  0.25, 1.0,    0.0,  0.0,  1.0,  // Node 8 BLUE
		// * Left Right Point Face
			0.0, -0.1,  0.5,  1.0,    1.0,  1.0,  1.0,  // Node 1 WHITE
			0.0, -0.1,  0.0,  1.0,    1.0,  1.0,  1.0,  // Node 4 WHITE
			c30, -s30,  0.25, 1.0,    0.0,  0.0,  1.0,  // Node 8 BLUE
		// * Back Right Point Face
			0.0, -0.1,  0.0,  1.0,    1.0,  1.0,  1.0,  // Node 4 WHITE
			0.1,  0.1,  0.0,  1.0,    0.0,  0.0,  1.0,  // Node 5 BLUE
			c30, -s30,  0.25, 1.0,    0.0,  0.0,  1.0,  // Node 8 BLUE
		// * Right Right Point Face
			0.1,  0.1,  0.5,  1.0,    0.0,  0.0,  1.0,  // Node 2 BLUE
			0.1,  0.1,  0.0,  1.0,    0.0,  0.0,  1.0,  // Node 5 BLUE
			c30, -s30,  0.25, 1.0,    0.0,  0.0,  1.0,  // Node 8 BLUE 
			]);
}

function makePyramid() {
//==============================================================================
// Make a 4-cornered pyramid from one OpenGL TRIANGLE_STRIP primitive.
// All vertex coords are +/1 or zero; pyramid base is in xy plane.

  	pyrVerts = new Float32Array([
			//! ------------------------ Pyramid ------------------------

			//* Bottom Face
			0.0,  0.0,  0.0, 1.0,    0.0,  1.0,  0.0, // Node 0 GREEN
			0.0,  0.0, -1.0, 1.0,    1.0,  0.0,  0.0, // Node 1 RED
			1.0,  0.0, -1.0, 1.0,    0.0,  0.0,  1.0, // Node 2 BLUE
			0.0,  0.0,  0.0, 1.0,    0.0,  1.0,  0.0, // Node 0 GREEN
			1.0,  0.0, -1.0, 1.0,    0.0,  0.0,  1.0, // Node 2 BLUE
			1.0,  0.0,  0.0, 1.0,    1.0,  0.0,  1.0, // Node 3 MAGENTA
			//* Front Face
			0.0,  0.0,  0.0, 1.0,    0.0,  1.0,  0.0, // Node 0 GREEN
			1.0,  0.0,  0.0, 1.0,    1.0,  0.0,  1.0, // Node 3 MAGENTA
			0.5,  1.0, -0.5, 1.0,    0.0,  1.0,  1.0, // Node 4 CYAN
			//* Right Face
			1.0,  0.0,  0.0, 1.0,    1.0,  0.0,  1.0, // Node 3 MAGENTA
			1.0,  0.0, -1.0, 1.0,    0.0,  0.0,  1.0, // Node 2 BLUE
			0.5,  1.0, -0.5, 1.0,    0.0,  1.0,  1.0, // Node 4 CYAN
			//* Back Face
			1.0,  0.0, -1.0, 1.0,    0.0,  0.0,  1.0, // Node 2 BLUE
			0.0,  0.0, -1.0, 1.0,    1.0,  0.0,  0.0, // Node 1 RED
			0.5,  1.0, -0.5, 1.0,    0.0,  1.0,  1.0, // Node 4 CYAN
			//* Left Face
			0.0,  0.0, -1.0, 1.0,    1.0,  0.0,  0.0, // Node 1 RED
			0.0,  0.0,  0.0, 1.0,    0.0,  1.0,  0.0, // Node 0 GREEN
			0.5,  1.0, -0.5, 1.0,    0.0,  1.0,  1.0, // Node 4 CYAN
			//* Coordinate Axes
			0.0,  0.0,  0.0, 1.0,		 0.3,  0.3,  0.3,	// X axis line (origin: gray)
		  1.3,  0.0,  0.0, 1.0,		 1.0,  0.3,  0.3,	// 						 (endpoint: red)
		 
		  0.0,  0.0,  0.0, 1.0,    0.3,  0.3,  0.3,	// Y axis line (origin: white)
		  0.0,  1.3,  0.0, 1.0,		 0.3,  1.0,  0.3,	//						 (endpoint: green)

		  0.0,  0.0,  0.0, 1.0,		 0.3,  0.3,  0.3,	// Z axis line (origin:white)
		  0.0,  0.0,  1.3, 1.0,		 0.3,  0.3,  1.0,	//	
		]);
}


function makeCylinder() {
//==============================================================================
// Make a cylinder shape from one TRIANGLE_STRIP drawing primitive, using the
// 'stepped spiral' design described in notes.
// Cylinder center at origin, encircles z axis, radius 1, top/bottom at z= +/-1.
//
 var ctrColr = new Float32Array([0.2, 0.2, 0.2]);	// dark gray
 var topColr = new Float32Array([0.4, 0.7, 0.4]);	// light green
 var botColr = new Float32Array([0.5, 0.5, 1.0]);	// light blue
 var capVerts = 16;	// # of vertices around the topmost 'cap' of the shape
 var botRadius = 1.6;		// radius of bottom of cylinder (top always 1.0)
 
 // Create a (global) array to hold this cylinder's vertices;
 cylVerts = new Float32Array(  ((capVerts*6) -2) * floatsPerVertex);
										// # of vertices * # of elements needed to store them. 

	// Create circle-shaped top cap of cylinder at z=+1.0, radius 1.0
	// v counts vertices: j counts array elements (vertices * elements per vertex)
	for(v=1,j=0; v<2*capVerts; v++,j+=floatsPerVertex) {	
		// skip the first vertex--not needed.
		if(v%2==0)
		{				// put even# vertices at center of cylinder's top cap:
			cylVerts[j  ] = 0.0; 			// x,y,z,w == 0,0,1,1
			cylVerts[j+1] = 0.0;	
			cylVerts[j+2] = 1.0; 
			cylVerts[j+3] = 1.0;			// r,g,b = topColr[]
			cylVerts[j+4]=ctrColr[0]; 
			cylVerts[j+5]=ctrColr[1]; 
			cylVerts[j+6]=ctrColr[2];
		}
		else { 	// put odd# vertices around the top cap's outer edge;
						// x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
						// 					theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
			cylVerts[j  ] = Math.cos(Math.PI*(v-1)/capVerts);			// x
			cylVerts[j+1] = Math.sin(Math.PI*(v-1)/capVerts);			// y
			//	(Why not 2*PI? because 0 < =v < 2*capVerts, so we
			//	 can simplify cos(2*PI * (v-1)/(2*capVerts))
			cylVerts[j+2] = 1.0;	// z
			cylVerts[j+3] = 1.0;	// w.
			// r,g,b = topColr[]
			cylVerts[j+4]=topColr[0]; 
			cylVerts[j+5]=topColr[1]; 
			cylVerts[j+6]=topColr[2];			
		}
	}
	// Create the cylinder side walls, made of 2*capVerts vertices.
	// v counts vertices within the wall; j continues to count array elements
	for(v=0; v< 2*capVerts; v++, j+=floatsPerVertex) {
		if(v%2==0)	// position all even# vertices along top cap:
		{		
				cylVerts[j  ] = Math.cos(Math.PI*(v)/capVerts);		// x
				cylVerts[j+1] = Math.sin(Math.PI*(v)/capVerts);		// y
				cylVerts[j+2] = 1.0;	// z
				cylVerts[j+3] = 1.0;	// w.
				// r,g,b = topColr[]
				cylVerts[j+4]=topColr[0]; 
				cylVerts[j+5]=topColr[1]; 
				cylVerts[j+6]=topColr[2];			
		}
		else		// position all odd# vertices along the bottom cap:
		{
				cylVerts[j  ] = botRadius * Math.cos(Math.PI*(v-1)/capVerts);		// x
				cylVerts[j+1] = botRadius * Math.sin(Math.PI*(v-1)/capVerts);		// y
				cylVerts[j+2] =-1.0;	// z
				cylVerts[j+3] = 1.0;	// w.
				// r,g,b = topColr[]
				cylVerts[j+4]=botColr[0]; 
				cylVerts[j+5]=botColr[1]; 
				cylVerts[j+6]=botColr[2];			
		}
	}
	// Create the cylinder bottom cap, made of 2*capVerts -1 vertices.
	// v counts the vertices in the cap; j continues to count array elements
	for(v=0; v < (2*capVerts -1); v++, j+= floatsPerVertex) {
		if(v%2==0) {	// position even #'d vertices around bot cap's outer edge
			cylVerts[j  ] = botRadius * Math.cos(Math.PI*(v)/capVerts);		// x
			cylVerts[j+1] = botRadius * Math.sin(Math.PI*(v)/capVerts);		// y
			cylVerts[j+2] =-1.0;	// z
			cylVerts[j+3] = 1.0;	// w.
			// r,g,b = topColr[]
			cylVerts[j+4]=botColr[0]; 
			cylVerts[j+5]=botColr[1]; 
			cylVerts[j+6]=botColr[2];		
		}
		else {				// position odd#'d vertices at center of the bottom cap:
			cylVerts[j  ] = 0.0; 			// x,y,z,w == 0,0,-1,1
			cylVerts[j+1] = 0.0;	
			cylVerts[j+2] =-1.0; 
			cylVerts[j+3] = 1.0;			// r,g,b = botColr[]
			cylVerts[j+4]=botColr[0]; 
			cylVerts[j+5]=botColr[1]; 
			cylVerts[j+6]=botColr[2];
		}
	}
}

function makeSphere() {
//==============================================================================
// Make a sphere from one OpenGL TRIANGLE_STRIP primitive.   Make ring-like 
// equal-lattitude 'slices' of the sphere (bounded by planes of constant z), 
// and connect them as a 'stepped spiral' design (see makeCylinder) to build the
// sphere from one triangle strip.
  var slices = 13;		// # of slices of the sphere along the z axis. >=3 req'd
											// (choose odd # or prime# to avoid accidental symmetry)
  var sliceVerts	= 27;	// # of vertices around the top edge of the slice
											// (same number of vertices on bottom of slice, too)
  var topColr = new Float32Array([0.7, 0.7, 0.7]);	// North Pole: light gray
  var equColr = new Float32Array([0.3, 0.7, 0.3]);	// Equator:    bright green
  var botColr = new Float32Array([0.9, 0.9, 0.9]);	// South Pole: brightest gray.
  var sliceAngle = Math.PI/slices;	// latitude angle spanned by one slice.

	// Create a (global) array to hold this sphere's vertices:
  sphVerts = new Float32Array(  ((slices * 2* sliceVerts) -2) * floatsPerVertex);
										// # of vertices * # of elements needed to store them. 
										// each slice requires 2*sliceVerts vertices except 1st and
										// last ones, which require only 2*sliceVerts-1.
										
	// Create dome-shaped top slice of sphere at z=+1
	// s counts slices; v counts vertices; 
	// j counts array elements (vertices * elements per vertex)
	var cos0 = 0.0;					// sines,cosines of slice's top, bottom edge.
	var sin0 = 0.0;
	var cos1 = 0.0;
	var sin1 = 0.0;	
	var j = 0;							// initialize our array index
	var isLast = 0;
	var isFirst = 1;
	for(s=0; s<slices; s++) {	// for each slice of the sphere,
		// find sines & cosines for top and bottom of this slice
		if(s==0) {
			isFirst = 1;	// skip 1st vertex of 1st slice.
			cos0 = 1.0; 	// initialize: start at north pole.
			sin0 = 0.0;
		}
		else {					// otherwise, new top edge == old bottom edge
			isFirst = 0;	
			cos0 = cos1;
			sin0 = sin1;
		}								// & compute sine,cosine for new bottom edge.
		cos1 = Math.cos((s+1)*sliceAngle);
		sin1 = Math.sin((s+1)*sliceAngle);
		// go around the entire slice, generating TRIANGLE_STRIP verts
		// (Note we don't initialize j; grows with each new attrib,vertex, and slice)
		if(s==slices-1) isLast=1;	// skip last vertex of last slice.
		for(v=isFirst; v< 2*sliceVerts-isLast; v++, j+=floatsPerVertex) {	
			if(v%2==0)
			{				// put even# vertices at the the slice's top edge
							// (why PI and not 2*PI? because 0 <= v < 2*sliceVerts
							// and thus we can simplify cos(2*PI(v/2*sliceVerts))  
				sphVerts[j  ] = sin0 * Math.cos(Math.PI*(v)/sliceVerts); 	
				sphVerts[j+1] = sin0 * Math.sin(Math.PI*(v)/sliceVerts);	
				sphVerts[j+2] = cos0;		
				sphVerts[j+3] = 1.0;			
			}
			else { 	// put odd# vertices around the slice's lower edge;
							// x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
							// 					theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
				sphVerts[j  ] = sin1 * Math.cos(Math.PI*(v-1)/sliceVerts);		// x
				sphVerts[j+1] = sin1 * Math.sin(Math.PI*(v-1)/sliceVerts);		// y
				sphVerts[j+2] = cos1;																				// z
				sphVerts[j+3] = 1.0;																				// w.		
			}
			if(s==0) {	// finally, set some interesting colors for vertices:
				sphVerts[j+4]=topColr[0]; 
				sphVerts[j+5]=topColr[1]; 
				sphVerts[j+6]=topColr[2];	
				}
			else if(s==slices-1) {
				sphVerts[j+4]=botColr[0]; 
				sphVerts[j+5]=botColr[1]; 
				sphVerts[j+6]=botColr[2];	
			}
			else {
					sphVerts[j+4]=Math.random();// equColr[0]; 
					sphVerts[j+5]=Math.random();// equColr[1]; 
					sphVerts[j+6]=Math.random();// equColr[2];					
			}
		}
	}
}

function makeTorus() {
//==============================================================================
// 		Create a torus centered at the origin that circles the z axis.  
// Terminology: imagine a torus as a flexible, cylinder-shaped bar or rod bent 
// into a circle around the z-axis. The bent bar's centerline forms a circle
// entirely in the z=0 plane, centered at the origin, with radius 'rbend'.  The 
// bent-bar circle begins at (rbend,0,0), increases in +y direction to circle  
// around the z-axis in counter-clockwise (CCW) direction, consistent with our
// right-handed coordinate system.
// 		This bent bar forms a torus because the bar itself has a circular cross-
// section with radius 'rbar' and angle 'phi'. We measure phi in CCW direction 
// around the bar's centerline, circling right-handed along the direction 
// forward from the bar's start at theta=0 towards its end at theta=2PI.
// 		THUS theta=0, phi=0 selects the torus surface point (rbend+rbar,0,0);
// a slight increase in phi moves that point in -z direction and a slight
// increase in theta moves that point in the +y direction.  
// To construct the torus, begin with the circle at the start of the bar:
//					xc = rbend + rbar*cos(phi); 
//					yc = 0; 
//					zc = -rbar*sin(phi);			(note negative sin(); right-handed phi)
// and then rotate this circle around the z-axis by angle theta:
//					x = xc*cos(theta) - yc*sin(theta) 	
//					y = xc*sin(theta) + yc*cos(theta)
//					z = zc
// Simplify: yc==0, so
//					x = (rbend + rbar*cos(phi))*cos(theta)
//					y = (rbend + rbar*cos(phi))*sin(theta) 
//					z = -rbar*sin(phi)
// To construct a torus from a single triangle-strip, make a 'stepped spiral' 
// along the length of the bent bar; successive rings of constant-theta, using 
// the same design used for cylinder walls in 'makeCyl()' and for 'slices' in 
// makeSphere().  Unlike the cylinder and sphere, we have no 'special case' 
// for the first and last of these bar-encircling rings.
//
var rbend = 1.0;										// Radius of circle formed by torus' bent bar
var rbar = 0.5;											// radius of the bar we bent to form torus
var barSlices = 23;									// # of bar-segments in the torus: >=3 req'd;
																		// more segments for more-circular torus
var barSides = 13;										// # of sides of the bar (and thus the 
																		// number of vertices in its cross-section)
																		// >=3 req'd;
																		// more sides for more-circular cross-section
// for nice-looking torus with approx square facets, 
//			--choose odd or prime#  for barSides, and
//			--choose pdd or prime# for barSlices of approx. barSides *(rbend/rbar)
// EXAMPLE: rbend = 1, rbar = 0.5, barSlices =23, barSides = 11.

	// Create a (global) array to hold this torus's vertices:
 torVerts = new Float32Array(floatsPerVertex*(2*barSides*barSlices +2));
//	Each slice requires 2*barSides vertices, but 1st slice will skip its first 
// triangle and last slice will skip its last triangle. To 'close' the torus,
// repeat the first 2 vertices at the end of the triangle-strip.  Assume 7

var phi=0, theta=0;										// begin torus at angles 0,0
var thetaStep = 2*Math.PI/barSlices;	// theta angle between each bar segment
var phiHalfStep = Math.PI/barSides;		// half-phi angle between each side of bar
																			// (WHY HALF? 2 vertices per step in phi)
	// s counts slices of the bar; v counts vertices within one slice; j counts
	// array elements (Float32) (vertices*#attribs/vertex) put in torVerts array.
	for(s=0,j=0; s<barSlices; s++) {		// for each 'slice' or 'ring' of the torus:
		for(v=0; v< 2*barSides; v++, j+=7) {		// for each vertex in this slice:
			if(v%2==0)	{	// even #'d vertices at bottom of slice,
				torVerts[j  ] = (rbend + rbar*Math.cos((v)*phiHalfStep)) * 
																						 Math.cos((s)*thetaStep);
							  //	x = (rbend + rbar*cos(phi)) * cos(theta)
				torVerts[j+1] = (rbend + rbar*Math.cos((v)*phiHalfStep)) *
																						 Math.sin((s)*thetaStep);
								//  y = (rbend + rbar*cos(phi)) * sin(theta) 
				torVerts[j+2] = -rbar*Math.sin((v)*phiHalfStep);
								//  z = -rbar  *   sin(phi)
				torVerts[j+3] = 1.0;		// w
			}
			else {				// odd #'d vertices at top of slice (s+1);
										// at same phi used at bottom of slice (v-1)
				torVerts[j  ] = (rbend + rbar*Math.cos((v-1)*phiHalfStep)) * 
																						 Math.cos((s+1)*thetaStep);
							  //	x = (rbend + rbar*cos(phi)) * cos(theta)
				torVerts[j+1] = (rbend + rbar*Math.cos((v-1)*phiHalfStep)) *
																						 Math.sin((s+1)*thetaStep);
								//  y = (rbend + rbar*cos(phi)) * sin(theta) 
				torVerts[j+2] = -rbar*Math.sin((v-1)*phiHalfStep);
								//  z = -rbar  *   sin(phi)
				torVerts[j+3] = 1.0;		// w
			}
			torVerts[j+4] = Math.random();		// random color 0.0 <= R < 1.0
			torVerts[j+5] = Math.random();		// random color 0.0 <= G < 1.0
			torVerts[j+6] = Math.random();		// random color 0.0 <= B < 1.0
		}
	}
	// Repeat the 1st 2 vertices of the triangle strip to complete the torus:
			torVerts[j  ] = rbend + rbar;	// copy vertex zero;
						  //	x = (rbend + rbar*cos(phi==0)) * cos(theta==0)
			torVerts[j+1] = 0.0;
							//  y = (rbend + rbar*cos(phi==0)) * sin(theta==0) 
			torVerts[j+2] = 0.0;
							//  z = -rbar  *   sin(phi==0)
			torVerts[j+3] = 1.0;		// w
			torVerts[j+4] = Math.random();		// random color 0.0 <= R < 1.0
			torVerts[j+5] = Math.random();		// random color 0.0 <= G < 1.0
			torVerts[j+6] = Math.random();		// random color 0.0 <= B < 1.0
			j+=7; // go to next vertex:
			torVerts[j  ] = (rbend + rbar) * Math.cos(thetaStep);
						  //	x = (rbend + rbar*cos(phi==0)) * cos(theta==thetaStep)
			torVerts[j+1] = (rbend + rbar) * Math.sin(thetaStep);
							//  y = (rbend + rbar*cos(phi==0)) * sin(theta==thetaStep) 
			torVerts[j+2] = 0.0;
							//  z = -rbar  *   sin(phi==0)
			torVerts[j+3] = 1.0;		// w
			torVerts[j+4] = Math.random();		// random color 0.0 <= R < 1.0
			torVerts[j+5] = Math.random();		// random color 0.0 <= G < 1.0
			torVerts[j+6] = Math.random();		// random color 0.0 <= B < 1.0
}

function makeGroundGrid() {
//==============================================================================
// Create a list of vertices that create a large grid of lines in the x,y plane
// centered at x=y=z=0.  Draw this shape using the GL_LINES primitive.

	var xcount = 100;			// # of lines to draw in x,y to make the grid.
	var ycount = 100;		
	var xymax	= 50.0;			// grid size; extends to cover +/-xymax in x and y.
 	var xColr = new Float32Array([1.0, 1.0, 0.3]);	// bright yellow
 	var yColr = new Float32Array([0.5, 1.0, 0.5]);	// bright green.
 	
	// Create an (global) array to hold this ground-plane's vertices:
	gndVerts = new Float32Array(floatsPerVertex*2*(xcount+ycount));
						// draw a grid made of xcount+ycount lines; 2 vertices per line.
						
	var xgap = xymax/(xcount-1);		// HALF-spacing between lines in x,y;
	var ygap = xymax/(ycount-1);		// (why half? because v==(0line number/2))
	
	// First, step thru x values as we make vertical lines of constant-x:
	for(v=0, j=0; v<2*xcount; v++, j+= floatsPerVertex) {
		if(v%2==0) {	// put even-numbered vertices at (xnow, -xymax, 0)
			gndVerts[j  ] = -xymax + (v  )*xgap;	// x
			gndVerts[j+1] = -xymax;								// y
			gndVerts[j+2] = 0.0;									// z
			gndVerts[j+3] = 1.0;									// w.
		}
		else {				// put odd-numbered vertices at (xnow, +xymax, 0).
			gndVerts[j  ] = -xymax + (v-1)*xgap;	// x
			gndVerts[j+1] = xymax;								// y
			gndVerts[j+2] = 0.0;									// z
			gndVerts[j+3] = 1.0;									// w.
		}
		gndVerts[j+4] = xColr[0];			// red
		gndVerts[j+5] = xColr[1];			// grn
		gndVerts[j+6] = xColr[2];			// blu
	}
	// Second, step thru y values as wqe make horizontal lines of constant-y:
	// (don't re-initialize j--we're adding more vertices to the array)
	for(v=0; v<2*ycount; v++, j+= floatsPerVertex) {
		if(v%2==0) {		// put even-numbered vertices at (-xymax, ynow, 0)
			gndVerts[j  ] = -xymax;								// x
			gndVerts[j+1] = -xymax + (v  )*ygap;	// y
			gndVerts[j+2] = 0.0;									// z
			gndVerts[j+3] = 1.0;									// w.
		}
		else {					// put odd-numbered vertices at (+xymax, ynow, 0).
			gndVerts[j  ] = xymax;								// x
			gndVerts[j+1] = -xymax + (v-1)*ygap;	// y
			gndVerts[j+2] = 0.0;									// z
			gndVerts[j+3] = 1.0;									// w.
		}
		gndVerts[j+4] = yColr[0];			// red
		gndVerts[j+5] = yColr[1];			// grn
		gndVerts[j+6] = yColr[2];			// blu
	}
}


function drawAll(gl, canvas, currentAngle, modelMatrix, viewMatrix, projMatrix, ModelMatrix, u_ModelMatrix) {
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	modelMatrix.setIdentity();
	ModelMatrix.setIdentity();
	projMatrix.setIdentity();
	viewMatrix.setIdentity();
	// added   Need to modify
	g_lookX = g_camX + Math.cos(toRadians(g_aimTheta));
	g_lookY = g_camY + Math.sin(toRadians(g_aimTheta));
	g_lookZ = g_camZ + g_aimZDiff;
	// set the ViewPoint accoding the requirement
	gl.viewport(0, 0, innerWidth / 2, innerWidth / 2);

    //set the first camera
	viewMatrix.setLookAt(g_camX,  g_camY,  g_camZ, // center of projection
		g_lookX, g_lookY, g_lookZ, // look-at point
		0.0,     0.0,     1.0); // View UP vector

	projMatrix.setPerspective(42.0, // FOVY
		canvas.width/canvas.height/2, // Aspect ratio
		1.0, // z-near
		100.0 /* z-far */);

	drawMyScene(gl, currentAngle, modelMatrix, viewMatrix, projMatrix, ModelMatrix, u_ModelMatrix);

    //set the second orth camera
	modelMatrix.setIdentity();
	ModelMatrix.setIdentity();
	projMatrix.setIdentity();
	viewMatrix.setIdentity();
	

	viewMatrix.setLookAt(g_camX,  g_camY,  g_camZ, // center of projection
		g_lookX, g_lookY, g_lookZ, // look-at point
		0.0,     0.0,     1.0); // View UP vector
		
	projMatrix.setOrtho(-3, 3, -3, 3, 0, 99.0 / 3);
	gl.viewport(innerWidth / 2, 0, innerWidth / 2, innerWidth / 2);
	drawMyScene(gl, currentAngle, modelMatrix, viewMatrix, projMatrix, ModelMatrix, u_ModelMatrix);
}

// added need to modify
function drawMyScene(gl, currentAngle, modelMatrix, viewMatrix, projMatrix, ModelMatrix, u_ModelMatrix) {
	// ! Draw Flower =========================================
	//modelMatrix.setIdentity(); // reset modelMatrix

	modelMatrix.translate(0.8, 0.8, 0.0);
	modelMatrix.scale(0.2, 0.2, 0.2);
	modelMatrix.rotate(140.0, 0.0, 0.0, 1.0);
	modelMatrix.rotate(90, -1, 0, 0);
	modelMatrix.rotate(g_angleLink1, 0.0, 0.0, 1.0);
	modelMatrix.translate(0.0, -1.0, 0.0);
	modelMatrix.rotate(g_angle01, 0.0, 0.5, 0.0);
	setMVPMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);

		// * First link
		gl.drawArrays(gl.TRIANGLES, concaveHexStart/floatsPerVertex, concaveHexVerts.length/floatsPerVertex); // Draw a Concave Hexagon

		modelMatrix.rotate(g_angleLink2, 0.0, 0.0, 1.0);
		modelMatrix.translate(0.0, -1.0, 0.0);
			pushMatrix(modelMatrix);
				setMVPMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
				// * Second link
				gl.drawArrays(gl.TRIANGLES, concaveHexStart/floatsPerVertex, concaveHexVerts.length/floatsPerVertex);

		modelMatrix = popMatrix();
		pushMatrix(modelMatrix);

			modelMatrix.rotate(g_angleLink3, 0.0, 0.0, 1.0);
			modelMatrix.translate(0.0, -1.0, 0.0);
			setMVPMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
			// * Third Link
			gl.drawArrays(gl.TRIANGLES, concaveHexStart/floatsPerVertex, concaveHexVerts.length/floatsPerVertex);
		
		modelMatrix.translate(0.0, -0.5, 0.25);
		modelMatrix.scale(0.5, 0.5, 0.5);
		modelMatrix.rotate(currentAngle, 0.0, 1.0, 0.0);
		modelMatrix.translate(0.0, -0.5, 0.5);
		setMVPMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);

		// * Head
		gl.drawArrays(gl.TRIANGLES, hexagramStart/floatsPerVertex, hexagramVerts.length/floatsPerVertex); // Draw 3D Hexagram

	// ! Draw Pyramid =================================================
	modelMatrix.setIdentity();
	pushMatrix(modelMatrix);
		modelMatrix.translate(-0.4, -0.4, 0.5);
		modelMatrix.scale(0.3, 0.3, 0.3);
		modelMatrix.rotate(90.0, 1, 0, 0);
		modelMatrix.rotate(currentAngle, 0, 1, 0);
		modelMatrix.translate(-0.5, 0.0, 0.5);
		setMVPMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
		// Draw pyramid
		gl.drawArrays(gl.TRIANGLES, 
									pyrStart/floatsPerVertex, 
									pyrVerts.length/floatsPerVertex - 6);
		modelMatrix.translate(0.5, 0.0, -0.5)
		setMVPMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
		// Draw axes
		gl.drawArrays(gl.LINES,
									pyrStart/floatsPerVertex + pyrVerts.length/floatsPerVertex - 6,
									6);
	modelMatrix = popMatrix();
	// ! Draw Cylinder
	modelMatrix.setIdentity();
 	 pushMatrix(modelMatrix);     // SAVE world coord system;
    	//-------Draw Spinning Cylinder:
    modelMatrix.translate(-0.4,-0.4, 0.3);  // 'set' means DISCARD old matrix,
    						// (drawing axes centered in CVV), and then make new
    						// drawing axes moved to the lower-left corner of CVV. 
    modelMatrix.scale(0.2, 0.2, 0.2);
    						// if you DON'T scale, cyl goes outside the CVV; clipped!
		modelMatrix.rotate(0, 0, 1, 0);  // spin around y axis.
		setMVPMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
    // Draw the cylinder's vertices, and no other vertices:
    gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
    							cylStart/floatsPerVertex, // start at this vertex number, and
    							cylVerts.length/floatsPerVertex);	// draw this many vertices.
  modelMatrix = popMatrix();  // RESTORE 'world' drawing coords.
  //===========================================================
   
  pushMatrix(modelMatrix);  // SAVE world drawing coords.
    //--------Draw Spinning Sphere
    modelMatrix.translate( -0.5, 2.0, 0.3); // 'set' means DISCARD old matrix,
    						// (drawing axes centered in CVV), and then make new
    						// drawing axes moved to the lower-left corner of CVV.
                          // to match WebGL display canvas.
    modelMatrix.scale(0.3, 0.3, 0.3);
								// Make it smaller:
		
	  modelMatrix.rotate(g_aimTheta + 90, 0.0, 0.0, 1.0); // make sure Quaternion rotation works at all camera angles
		quatMatrix.setFromQuat(qTot.x, qTot.y, qTot.z, qTot.w);	// Quaternion-->Matrix

		modelMatrix.concat(quatMatrix);	// apply that matrix.

  	setMVPMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
    		// Draw just the sphere's vertices
    gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
    							sphStart/floatsPerVertex,	// start at this vertex number, and 
									sphVerts.length/floatsPerVertex);	// draw this many vertices.
		pushMatrix(modelMatrix);
			modelMatrix.translate(0.0, 0.0, 1.0);
			setMVPMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
			gl.drawArrays(gl.TRIANGLE_STRIP, torStart/floatsPerVertex, torVerts.length/floatsPerVertex);
		modelMatrix = popMatrix();

		modelMatrix.translate(0.0, 0.0, -1.0);

		setMVPMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
		gl.drawArrays(gl.TRIANGLE_STRIP, torStart/floatsPerVertex, torVerts.length/floatsPerVertex);

	modelMatrix = popMatrix();  // RESTORE 'world' drawing coords.
	pushMatrix(modelMatrix);
			modelMatrix.translate(-2.0, 0.7, 0.7);
			modelMatrix.scale(0.3, 0.5, 0.5);
			modelMatrix.rotate(90, 0.0, 1.0, 0.0);
			modelMatrix.rotate(currentAngle, 0.0, 0.0, 1.0);
			setMVPMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
			gl.drawArrays(gl.TRIANGLE_STRIP, torStart/floatsPerVertex, torVerts.length/floatsPerVertex);
	modelMatrix = popMatrix();
	pushMatrix(modelMatrix);
		modelMatrix.translate(-2.3, 0.7, 0.7);
		modelMatrix.scale(0.3, 0.5, 0.5);
		modelMatrix.rotate(90, 0.0, 1.0, 0.0);
		modelMatrix.rotate(currentAngle, 0.0, 0.0, -1.0);
		setMVPMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
		gl.drawArrays(gl.TRIANGLE_STRIP, torStart/floatsPerVertex, torVerts.length/floatsPerVertex);

	modelMatrix = popMatrix();
	pushMatrix(modelMatrix);
		modelMatrix.translate(-2.6, 0.7, 0.7);
		modelMatrix.scale(0.3, 0.5, 0.5);
		modelMatrix.rotate(90, 0.0, 1.0, 0.0);
		modelMatrix.rotate(currentAngle, 0.0, 0.0, 1.0);
		setMVPMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
		gl.drawArrays(gl.TRIANGLE_STRIP, torStart/floatsPerVertex, torVerts.length/floatsPerVertex);
		


	modelMatrix = popMatrix();
	pushMatrix(modelMatrix);
		modelMatrix.translate(-2.9, 0.7, 0.7);
		modelMatrix.scale(0.3, 0.5, 0.5);
		modelMatrix.rotate(90, 0.0, 1.0, 0.0);
		modelMatrix.rotate(currentAngle, 0.0, 0.0, -1.0);
		setMVPMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
		gl.drawArrays(gl.TRIANGLE_STRIP, torStart/floatsPerVertex, torVerts.length/floatsPerVertex);

	modelMatrix = popMatrix();
	pushMatrix(modelMatrix);
		modelMatrix.translate(-2.6, 0.7, 0.7);
		modelMatrix.scale(0.1, 0.1, 0.1);
		modelMatrix.rotate(90, 0.0, 1.0, 0.0);
		modelMatrix.rotate(currentAngle, 1.0, 0.0, 1.0);
		modelMatrix.translate(0.0, 0.0, 0.5);
		setMVPMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
		gl.drawArrays(gl.TRIANGLES, hexagramStart/floatsPerVertex, hexagramVerts.length/floatsPerVertex);

	modelMatrix = popMatrix();
	pushMatrix(modelMatrix);
		modelMatrix.translate(-2.3, 0.7, 0.7);
		modelMatrix.scale(0.1, 0.1, 0.1);
		modelMatrix.rotate(90, 0.0, 1.0, 0.0);
		modelMatrix.rotate(currentAngle, -1.0, 0.0, -1.0);
		modelMatrix.translate(0.0, 0.0, 0.5);
		setMVPMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
		gl.drawArrays(gl.TRIANGLES, hexagramStart/floatsPerVertex, hexagramVerts.length/floatsPerVertex);

	modelMatrix = popMatrix();
  pushMatrix(modelMatrix);  // SAVE world drawing coords.
  	//---------Draw Ground Plane, without spinning.
  	// position it.
  	modelMatrix.translate( 0.4, -0.4, 0.0);	
  	modelMatrix.scale(0.1, 0.1, 0.1);				// shrink by 10X:

  	// Drawing:
  	// Pass our current matrix to the vertex shaders:
    setMVPMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
    // Draw just the ground-plane's vertices
    gl.drawArrays(gl.LINES, 								// use this drawing primitive, and
    						  gndStart/floatsPerVertex,	// start at this vertex number, and
    						  gndVerts.length/floatsPerVertex);	// draw this many vertices.
  modelMatrix = popMatrix();  // RESTORE 'world' drawing coords.
  //===========================================================
}

function setModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix) {
	ModelMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
	gl.uniformMatrix4fv(u_ModelMatrix, false, ModelMatrix.elements);
}

// Last time that this function was called:  (used for animation timing)
var g_last = Date.now();




function animate(angle) {
//==============================================================================
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;    
 
	var g_angle01min = -60.0;
	var g_angle01max =  60.0;

	var angleLink1min = -60.0;
	var angleLink1max =  60.0;

	var angleLink2min = -50.0;
	var angleLink2max =  50.0;

	var angleLink3min = -40.0;
	var angleLink3max =  40.0; 

	var angleHeadmin = -45.0;
	var angleHeadmax =  45.0;

	// Update the current rotation angle (adjusted by the elapsed time)
  //  limit the angle to move smoothly between +120 and -120 degrees:
  if(g_angle01 >  g_angle01max && g_angle01Rate > 0) g_angle01Rate = -g_angle01Rate;
	if(g_angle01 <  g_angle01min && g_angle01Rate < 0) g_angle01Rate = -g_angle01Rate;

	if(g_angleLink1 >  angleLink1max && g_angleLink1Rate > 0) g_angleLink1Rate = -g_angleLink1Rate;
	if(g_angleLink1 <  angleLink1min && g_angleLink1Rate < 0) g_angleLink1Rate = -g_angleLink1Rate;

	if(g_angleLink2 >  angleLink2max && g_angleLink2Rate > 0) g_angleLink2Rate = -g_angleLink2Rate;
	if(g_angleLink2 <  angleLink2min && g_angleLink2Rate < 0) g_angleLink2Rate = -g_angleLink2Rate;

	if(g_angleLink3 >  angleLink3max && g_angleLink3Rate > 0) g_angleLink3Rate = -g_angleLink3Rate;
	if(g_angleLink3 <  angleLink3min && g_angleLink3Rate < 0) g_angleLink3Rate = -g_angleLink3Rate;
	
	if(g_angleLink3 >  angleHeadmax && g_angleHeadRate > 0) g_angleHeadRate = -g_angleHeadRate;
	if(g_angleLink3 <  angleHeadmin && g_angleHeadRate < 0) g_angleHeadRate = -g_angleHeadRate;
	
	g_angleLink1 = (g_angleLink1 + (g_angleLink1Rate * elapsed) / 1000.0)  % 360;
	g_angleLink2 = (g_angleLink2 + (g_angleLink2Rate * elapsed) / 1000.0)  % 360;
	g_angleLink3 = (g_angleLink3 + (g_angleLink3Rate * elapsed) / 1000.0)  % 360;	
	g_angleHead  = (g_angleHead  + (g_angleHeadRate  * elapsed) / 1000.0)  % 360;
  
  var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
  return newAngle %= 360;
}

function drawResize(gl, canvas, currentAngle, modelMatrix, viewMatrix, projMatrix, ModelMatrix, u_ModelMatrix) {
	
	//Make canvas fill the top 3/4 of our browser window:
	var xtraMargin = 130;    // keep a margin (otherwise, browser adds scroll-bars)
	canvas.width = innerWidth - xtraMargin;
	canvas.height = (innerHeight*3/4) - xtraMargin;
	// IMPORTANT!  Need a fresh drawing in the re-sized viewports.
	drawAll(gl, canvas, currentAngle, modelMatrix, viewMatrix, projMatrix, ModelMatrix, u_ModelMatrix);				// draw in all viewports.
}

function keyDown(ev) {

	var xd = g_camX - g_lookX;
	var yd = g_camY - g_lookY;
	var zd = g_camZ - g_lookZ;

	var len = Math.sqrt(Math.pow(xd, 2) + Math.pow(yd, 2) + Math.pow(zd, 2));

	var moveRateRad = toRadians(g_moveRate);
	
	switch(ev.keyCode) {
		case LEFT_ARROW:
			g_aimTheta += g_moveRate;

			if(g_aimTheta > 360) g_aimTheta -= 360.0;
			if(g_aimTheta < 0) g_aimTheta += 360.0;

			break;
		case RIGHT_ARROW: 
			g_aimTheta -= g_moveRate;

			if(g_aimTheta > 360) g_aimTheta -= 360.0;
			if(g_aimTheta < 0) g_aimTheta += 360.0;

			break;
		case UP_ARROW:
			g_aimZDiff += moveRateRad;
			break;
		case DOWN_ARROW:
			g_aimZDiff -= moveRateRad;
			break;
		case W: 
			g_lookX -= (xd / len);
			g_lookY -= (yd / len);
			g_lookZ -= (zd / len);

			g_camX -= (xd / len);
			g_camY -= (yd / len);
			g_camZ -= (zd / len);

			break;
		case S: 
			g_lookX += (xd / len);
			g_lookY += (yd / len);
			g_lookZ += (zd / len);

			g_camX += (xd / len);
			g_camY += (yd / len);
			g_camZ += (zd / len);

			break;
		case A:
			var xStrafe = Math.cos(toRadians(g_aimTheta + 90));
			var yStrafe = Math.sin(toRadians(g_aimTheta + 90));

			g_camX += xStrafe / len;
			g_camY += yStrafe / len;

			break;
		case D:
			var xStrafe = Math.cos(toRadians(g_aimTheta + 90));
			var yStrafe = Math.sin(toRadians(g_aimTheta + 90));

			g_camX -= xStrafe / len;
			g_camY -= yStrafe / len;

			break;
	}
	printLookAtData();
}

function myMouseDown(ev, gl, canvas) {
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

function myMouseMove(ev, gl, canvas) {
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


function myMouseUp(ev, gl, canvas) {
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

function dragQuat(xdrag, ydrag) {
	//==============================================================================
	// Called when user drags mouse by 'xdrag,ydrag' as measured in CVV coords.
	// We find a rotation axis perpendicular to the drag direction, and convert the 
	// drag distance to an angular rotation amount, and use both to set the value of 
	// the quaternion qNew.  We then combine this new rotation with the current 
	// rotation stored in quaternion 'qTot' by quaternion multiply.  Note the 
	// 'draw()' function converts this current 'qTot' quaternion to a rotation 
	// matrix for drawing. 
		var res = 5;
		var qTmp = new Quaternion(0,0,0,1);
		
		var dist = Math.sqrt(xdrag*xdrag + ydrag*ydrag);
		// console.log('xdrag,ydrag=',xdrag.toFixed(5),ydrag.toFixed(5),'dist=',dist.toFixed(5));
		qNew.setFromAxisAngle(-ydrag + 0.0001, xdrag + 0.0001, 0.0, dist*150.0);
		// (why add tiny 0.0001? To ensure we never have a zero-length rotation axis)
								// why axis (x,y,z) = (-yMdrag,+xMdrag,0)? 
								// -- to rotate around +x axis, drag mouse in -y direction.
								// -- to rotate around +y axis, drag mouse in +x direction.
								
		qTmp.multiply(qNew,qTot);			// apply new rotation to current rotation. 
		//--------------------------
		// IMPORTANT! Why qNew*qTot instead of qTot*qNew? (Try it!)
		// ANSWER: Because 'duality' governs ALL transformations, not just matrices. 
		// If we multiplied in (qTot*qNew) order, we would rotate the drawing axes
		// first by qTot, and then by qNew--we would apply mouse-dragging rotations
		// to already-rotated drawing axes.  Instead, we wish to apply the mouse-drag
		// rotations FIRST, before we apply rotations from all the previous dragging.
		//------------------------
		// IMPORTANT!  Both qTot and qNew are unit-length quaternions, but we store 
		// them with finite precision. While the product of two (EXACTLY) unit-length
		// quaternions will always be another unit-length quaternion, the qTmp length
		// may drift away from 1.0 if we repeat this quaternion multiply many times.
		// A non-unit-length quaternion won't work with our quaternion-to-matrix fcn.
		// Matrix4.prototype.setFromQuat().
		qTmp.normalize();						// normalize to ensure we stay at length==1.0.
		qTot.copy(qTmp);
}

function toRadians(angle) {
	return angle * (Math.PI/180);
}

function toDegrees(angle) {
	return angle * (180/Math.PI);
}

//==================HTML Button Callbacks
function nextShape() {
	shapeNum += 1;
	if(shapeNum >= shapeMax) shapeNum = 0;
}

function spinDown() {
 ANGLE_STEP -= 25; 
}

function spinUp() {
  ANGLE_STEP += 25; 
}

function runStop() {
  if(ANGLE_STEP*ANGLE_STEP > 1) {
		myTmp = ANGLE_STEP;
		g_angle01RateTmp = g_angle01Rate;  // store the current rate,
		g_angleHeadRateTmp = g_angleHeadRate;
		g_angleLink1RateTmp = g_angleLink1Rate;
		g_angleLink2RateTmp = g_angleLink2Rate;
		g_angleLink3RateTmp = g_angleLink3Rate;

		g_angle01Rate = 0;      // and set to zero.  
		g_angleHeadRate = 0;
		g_angleLink1Rate = 0;
		g_angleLink2Rate = 0;
		g_angleLink3Rate = 0;
		ANGLE_STEP = 0;
		
  }
  else {
		ANGLE_STEP = myTmp;
		g_angle01Rate = g_angle01RateTmp;  // use the stored rate.
		g_angleHeadRate = g_angleHeadRateTmp;
		g_angleLink1Rate = g_angleLink1RateTmp;
		g_angleLink2Rate = g_angleLink2RateTmp;
		g_angleLink3Rate = g_angleLink3RateTmp;
  }
}
 