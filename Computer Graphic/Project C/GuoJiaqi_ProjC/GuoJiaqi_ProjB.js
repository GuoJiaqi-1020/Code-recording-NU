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
  'precision mediump float;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';

// Global Variables

// Shift variable for the small robot
var g_last = Date.now();

var angel_limit = 45;
// shifting variable for the robots
var g_digits = 5;
var hori_shift = 0;
var vert_shift = 0;

var ANGLE_STEP = 45.0;		// Rotation angle rate (degrees/second)
var floatsPerVertex = 7;	// # of Float32Array elements used for each vertex
var g_canvas = document.getElementById('webgl');

var qNew = new Quaternion(0,0,0,1); // most-recent mouse drag's rotation
var qTot = new Quaternion(0,0,0,1);	// 'current' orientation (made from qNew)
var quatMatrix = new Matrix4();	

//------------For mouse click-and-drag: -------------------------------
var g_isDrag=false;		// mouse-drag: true when user holds down mouse button
var g_xMclik=0.0;			// last mouse button-down position (in CVV coords)
var g_yMclik=0.0;   
var g_xMdragTot=0.0;	// total (accumulated) mouse-drag amounts (in CVV coords).
var g_yMdragTot=0.0; 
			
// Define varibles for the camera's sys point and look-at point											
var cam_Px = 2, cam_Py = -9.4, cam_Pz = 6.0; //! Location of our camera
var look_Px = 4.5, look_Py = 4.5, look_Pz = 5.5; //! Where our camera is look_ing
var ini_Theta = 111;
var g_Theta = ini_Theta;
var ini_Gz = look_Pz - cam_Pz;
var G_z = look_Pz - cam_Pz;
var perspective_changing_rate = 2.0;

//Animation Angle For Animation 
var g_angle01 = 0.0;
var g_angle01Rate = 40.0;

var g_butter = 0;
var g_butterRate = 20.0;

var g_angle02 = 0;
var g_angle02Rate = 80.0;

var g_angle03 = 0; 
var g_angle03Rate = 120.0;

var g_planet = 0;
var g_planetRate = 100.0;

var g_angle_leg1 = 10;
var g_angle04Rate = 80.0;

var g_angle_leg2 = -45;
var g_angle05Rate = 80.0; 

var g_angle06 = 0.0;
var g_angle06Rate = 60.0;

var g_angle07 = 0.0;
var g_angle07Rate = 60.0;


function main() {
	var modelMatrix = new Matrix4();
	var viewMatrix = new Matrix4();
	var projMatrix = new Matrix4();
	var ModelMatrix = new Matrix4();

	// Event Listerner: keyboard and mouse
	window.addEventListener("keydown", myKeyDown, false);
	window.addEventListener("keyup", myKeyUp, false);
	window.addEventListener("mousedown", myMouseDown); 
    window.addEventListener("mousemove", myMouseMove); 
	window.addEventListener("mouseup", myMouseUp);	

	// Get the rendering context for WebGL
	var gl = getWebGLContext(g_canvas);
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

	var currentAngle = 0.0;
    var tick = function() {
        currentAngle = animate(currentAngle);
        g_canvas = Resized_Web(g_canvas);   // Draw shapes
        drawAll(gl, g_canvas, modelMatrix, viewMatrix, projMatrix, ModelMatrix, u_ModelMatrix);               // draw in all viewports.
        requestAnimationFrame(tick, g_canvas);   
    };
    tick();
}

function Resized_Web(g_canvas) {
    g_canvas.width = innerWidth - 15;
    //Make canvas fill the top 70% of our browser height
    g_canvas.height = (innerHeight*0.7);
    // IMPORTANT!  Need a fresh drawing in the re-sized viewports.
    return g_canvas
}

function initVertexBuffer(gl) {
	makeCylinder();
	makeSphere();
	makeAxis();
	butter_body();
	butter_wing();
	cube();
	makeWhitecube();
	makeBlackcube();
	makeConcaveHex();
	makeTetrahedron();
	makeRobotbody();
	makeTorus();
	makeGroundGrid();
	var subsiz = (butter_wing_v.length + butter_body_v.length + cube_v.length + 
		BlackcubeVerts.length + WhitecubeVerts.length + tetrahedronVerts.length
		+ RobotbodyVerts.length + ConcaVerts.length);
	var mySiz = (cylVerts.length + sphVerts.length + axis.length +
							 torVerts.length + gndVerts.length + subsiz);						
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
		axisStart = i;
	for(j=0; j<axis.length; i++, j++){  // store the axis
		colorShapes[i] = axis[j];
		}
		butter_wing_vStart = i
	for(j=0; j<butter_wing_v.length; i++, j++){  // store the axis
		colorShapes[i] = butter_wing_v[j];
		}
		butter_body_vStart = i
	for(j=0; j<butter_body_v.length; i++, j++){  // store the axis
		colorShapes[i] = butter_body_v[j];
		}	
		cube_vStart = i	
	for(j=0; j<cube_v.length; i++, j++){  // store the axis
		colorShapes[i] = cube_v[j];
		}	
		tetrahedronStart = i	
	for(j=0; j<tetrahedronVerts.length; i++, j++){  // store the axis
		colorShapes[i] = tetrahedronVerts[j];
		}	
		WhitecubeStart = i	
	for(j=0; j<WhitecubeVerts.length; i++, j++){  // store the axis
		colorShapes[i] = WhitecubeVerts[j];
		}	
		BlackcubeStart = i	
	for(j=0; j<BlackcubeVerts.length; i++, j++){  // store the axis
		colorShapes[i] = BlackcubeVerts[j];
		}	
		RobotbodyStart = i	
	for(j=0; j<RobotbodyVerts.length; i++, j++){  // store the axis
		colorShapes[i] = RobotbodyVerts[j];
		}
		ConcaStart = i
	for(j=0; j<ConcaVerts.length; i++, j++){  // store the axis
		colorShapes[i] = ConcaVerts[j];
		}	
		

	
	// Create a buffer object on the graphics hardware:
	var shapeBufferHandle = gl.createBuffer();  
	if (!shapeBufferHandle) {
		console.log('Failed to create the shape buffer object');
		return false;
	}

	// Bind the the buffer object to target:
	gl.bindBuffer(gl.ARRAY_BUFFER, shapeBufferHandle);
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
	gl.bindBuffer(gl.ARRAY_BUFFER, null);
	return nn;
}


function makeConcaveHex() {
	const s30 = 0.5;										 // == sin(30deg) == 1 / 2
	const c30 = Math.sqrt(3.0)/2.0;			 // == cos(30deg) == sqrt(3) / 2

	ConcaVerts = new Float32Array([
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

function makeRobotbody() {
	RobotbodyVerts = new Float32Array([
		1.0, -1.0, -1.0, 1.0,	  1.0, 0.0, 0.0,	// Node 3
		1.0,  1.0, -1.0, 1.0,	  1.0, 1.0, 0.0,	// Node 2
		1.0,  1.0,  1.0, 1.0,	  1.0, 0.0, 0.0,  // Node 4
		
		1.0,  1.0,  1.0, 1.0,	  1.0, 0.1, 0.1,	// Node 4
		1.0, -1.0,  1.0, 1.0,	  1.0, 0.1, 0.1,	// Node 7
		1.0, -1.0, -1.0, 1.0,	  1.0, 0.1, 0.1,	// Node 3
   
		   // +y face: GREEN
	   -1.0,  1.0, -1.0, 1.0,	  0.5, 0.5, 0.6,	// Node 1
	   -1.0,  1.0,  1.0, 1.0,	  0.7, 1.0, 0.1,	// Node 5
		1.0,  1.0,  1.0, 1.0,	  0.6, 0.3, 0.2,	// Node 4
   
		1.0,  1.0,  1.0, 1.0,	  0.7, 0.3, 0.8,	// Node 4
		1.0,  1.0, -1.0, 1.0,	  0.5, 0.2, 0.1,	// Node 2 
	   -1.0,  1.0, -1.0, 1.0,	  0.5, 0.3, 0.1,	// Node 1
   
		   // +z face: BLUE
	   -1.0,  1.0,  1.0, 1.0,	  1.0, 0.4, 1.0,	// Node 5
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
   
	   -1.0, -1.0,  1.0, 1.0,	  0.0, 1.0, 1.0,	// Node 6
	   -1.0, -1.0, -1.0, 1.0,	  1.0, 1.0, 0.0,	// Node 0
		1.0, -1.0, -1.0, 1.0,	  1.0, 1.0, 1.0,	// Node 3
   
		// -z face: YELLOW
		1.0,  1.0, -1.0, 1.0,	  0.5, 1.0, 1.0,	// Node 2
		1.0, -1.0, -1.0, 1.0,	  1.0, 0.7, 1.0,	// Node 3
	   -1.0, -1.0, -1.0, 1.0,	  0.0, 1.0, 1.0,	// Node 0		
   
	   -1.0, -1.0, -1.0, 1.0,	  1.0, 1.0, 0.0,	// Node 0
	   -1.0,  1.0, -1.0, 1.0,	  0.0, 1.0, 0.3,	// Node 1
		1.0,  1.0, -1.0, 1.0,	  1.0, 0.2, 1.0,	// Node 2
	
 
 
 
 // Added
		1.0, -1.0,  1.0, 1.0,	  0.5, 0.2, 1.0,	// Node 2
		1.0, 1.0, 1.0, 1.0,	      0.0, 0.7, 1.0,	// Node 3
		0.0, 0.0,  2.0, 1.0,	  1.0, 0.1, 0.3,	// Node 0		
   
		1.0, -1.0,  1.0, 1.0,	  0.5, 1.0, 1.0,	// Node 2
		-1.0, -1.0, 1.0, 1.0,	  1.0, 0.7, 1.0,	// Node 3
		0.0, 0.0,  2.0, 1.0,	  0.5, 0.2, 1.0,	// Node 0	
 
		-1.0, 1.0, 1.0, 1.0,	  0.5, 1.0, 1.0,	// Node 2
		-1.0, -1.0, 1.0, 1.0,	  0.0, 0.7, 1.0,	// Node 3
		0.0, 0.0,  2.0, 1.0,	  0.4, 1.0, 0.4,	// Node 0	
 
		-1.0, 1.0, 1.0, 1.0,	  0.5, 1.0, 0.6,	// Node 2
		 1.0, 1.0, 1.0, 1.0,	  1.0, 0.7, 1.0,	// Node 3
		 0.0, 0.0,  2.0, 1.0,	  1.0, 0.2, 0.8,	// Node 0	
	]);
}

function makeCylinder() {
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
	var slices = 13;
	var sliceVerts	= 27;
	var topColr = new Float32Array([0.9, 0.9, 0.9]);	// North Pole: light gray
	var equColr = new Float32Array([0.9, 0.9, 0.9]);	// Equator:    bright green
	var botColr = new Float32Array([0.9, 0.9, 0.9]);	// South Pole: brightest gray.
	var sliceAngle = Math.PI/slices;	// lattitude angle spanned by one slice.
	sphVerts = new Float32Array(  ((slices * 2* sliceVerts) -2) * floatsPerVertex);
	var cos0 = 0.0;					// sines,cosines of slice's top, bottom edge.
	var sin0 = 0.0;
	var cos1 = 0.0;
	var sin1 = 0.0;	
	var j = 0;							// initialize our array index
	var isLast = 0;
	var isFirst = 1;
	for(s=0; s<slices; s++) {	// for each slice of the sphere,
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
					// sphVerts[j+4]=Math.random();// equColr[0]; 
					// sphVerts[j+5]=Math.random();// equColr[1]; 
					// sphVerts[j+6]=Math.random();// equColr[2];		
				    sphVerts[j+4]=equColr[0]; 
					sphVerts[j+5]=Math.random();
					sphVerts[j+6]=equColr[2];			
			}
		}
	}
}

function makeTorus() {

var rbend = 1.5;										// Radius of circle formed by torus' bent bar
var rbar = 0.2;											// radius of the bar we bent to form torus
var barSlices = 23;									// # of bar-segments in the torus: >=3 req'd;
																		// more segments for more-circular torus
var barSides = 13;										// # of sides of the bar (and thus the 

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
// centered at x=y=z=0.  Draw this shape using the GL_LINES primitive
	var xcount = 100;			// # of lines to draw in x,y to make the grid.
	var ycount = 100;		
	var xymax	= 50.0;			// grid size; extends to cover +/-xymax in x and y.
 	var xColr = new Float32Array([0.4, 0.4, 0.4]);	// bright yellow
 	var yColr = new Float32Array([0.4, 0.4, 0.4]);	// bright green.
 	
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

function makeAxis(){
	axis = new Float32Array([
		0.0,  0.0,  0.0, 1.0,		1.0,  0.0,  0.0,
		1.0,  0.0,  0.0, 1.0,		1.0,  0.0,  0.0,	// 						 (endpoint: red)
		
		0.0,  0.0,  0.0, 1.0,       0.0,  1.0,  0.0,	// Y axis line (origin: white)
		0.0,  1.0,  0.0, 1.0,		0.0,  1.0,  0.0,	//						 (endpoint: green)

		0.0,  0.0,  0.0, 1.0,		0.0,  0.0,  1.0,	// Z axis line (origin:white)
		0.0,  0.0,  1.0, 1.0,		0.0,  0.0,  1.0,	//						 (endpoint: blue)
		]);
}

function butter_wing() {
//==============================================================================
	var sq2	= Math.sqrt(2.0);	
	const c30 = Math.sqrt(3.0)/2.0;			// == cos(30deg) == sqrt(3) / 2
	butter_wing_v = new Float32Array([
		// buttterfly wings
		0.0, 0.5 , 0.25, 1.0,       0.6, 0.3, 0.2,
		1.0, 0.0, 0.0, 1.0,         0.5, 0.1, 0.2,
		0.0, -0.5, 0.25, 1.0,       1.0, 0.9, 1.0,

		0.0, 0.5 , 0.25, 1.0,       0.6, 0.8, 0.2,
		1.0,  0.0,  0.0, 1.0,        0.5, 0.1, 0.2,
		-1.0, 0.0, 0.0, 1.0,        0.5, 0.1, 0.2,

		1.0, 0.0, 0.0, 1.0,         0.5, 0.1, 0.2,
		0.0, -0.5, 0.25, 1.0,       1.0, 0.0, 0.0,
		-1.0, 0.0, 0.0, 1.0,        0.5, 0.1, 0.2,

		0.0, -0.5, 0.25, 1.0,       1.0, 0.0, 1.0,
		-1.0, 0.0, 0.0, 1.0,        0.5, 0.1, 0.2,
		1.0, 0.0, 0.0, 1.0,         0.5, 0.1, 0.2,

	]);
}

function butter_body() {
	//==================================   30   =======================================
		butter_body_v = new Float32Array([
			// buttterfly wings
			0.0, 0.0, 0.25, 1.0,      0.5, 1.0, 0.6,
			0.25, 0.0, 0.0, 1.0,      0.9, 0.6, 0.5,
			0.0,  1.0, 0.0, 1.0,      0.6, 0.1, 0.4,
   
			0.0, 0.0, 0.25, 1.0,      0.5, 1.0, 0.6,
			-0.25, 0.0, 0.0, 1.0,      0.9, 0.6, 0.5,
			0.0,  1.0, 0.0, 1.0,      0.4, 0.1, 0.4,
   
			0.0, 0.0, 0.25, 1.0,      0.5, 1.0, 0.6,
			-0.25, 0.0, 0.0, 1.0,      0.9, 0.6, 0.5,
			0.0,  -0.5, 0.0, 1.0,      0.6, 0.8, 0.4,
   
			0.0, 0.0, 0.25, 1.0,      0.5, 1.0, 0.6,
			0.25, 0.0, 0.0, 1.0,      0.9, 0.6, 0.5,
			0.0,  -0.5, 0.0, 1.0,      0.6, 0.8, 0.4,
   
			0.0,  -0.5, 0.0, 1.0,      0.2, 0.8, 0.4,
			-0.25, 0.0, 0.0, 1.0,      0.4, 0.6, 0.5,
			0.25, 0.0, 0.0, 1.0,       0.3, 0.1, 0.5,
   
			0.25, 0.0, 0.0, 1.0,       0.3, 0.7, 0.5,
			0.0,  1.0, 0.0, 1.0,       0.6, 0.8, 0.4,
			0.0,  1.0, 0.0, 1.0,      0.6, 0.8, 0.4,
   
			0.0, 0.0, -0.25, 1.0,      0.5, 1.0, 0.6,
			0.25, 0.0, 0.0, 1.0,      0.9, 0.6, 0.5,
			0.0,  1.0, 0.0, 1.0,      0.6, 0.1, 0.4,
   
			0.0, 0.0, -0.25, 1.0,      0.5, 1.0, 0.6,
			-0.25, 0.0, 0.0, 1.0,      0.9, 0.6, 0.5,
			0.0,  1.0, 0.0, 1.0,      0.4, 0.1, 0.4,
   
			0.0, 0.0, -0.25, 1.0,      0.5, 1.0, 0.6,
			-0.25, 0.0, 0.0, 1.0,      0.9, 0.6, 0.5,
			0.0,  -0.5, 0.0, 1.0,      0.6, 0.8, 0.4,
   
			0.0, 0.0, -0.25, 1.0,      0.5, 1.0, 0.6,
			0.25, 0.0, 0.0, 1.0,      0.9, 0.6, 0.5,
			0.0,  -0.5, 0.0, 1.0,      0.6, 0.8, 0.4,
		]);
}

function cube() {
//==================================   30   =======================================
	cube_v = new Float32Array([
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
	
		-1.0, -1.0, -1.0, 1.0,	  1.0, 1.0, 0.0,	// Node 0
		-1.0,  1.0, -1.0, 1.0,	  1.0, 1.0, 0.3,	// Node 1
		1.0,  1.0, -1.0, 1.0,	  1.0, 0.2, 1.0,
	]);
}

function makeTetrahedron() {
	//==================================   12   =======================================
	var c30 = Math.sqrt(0.75);					// == cos(30deg) == sqrt(3) / 2
	var sq2	= Math.sqrt(2.0);	
	tetrahedronVerts = new Float32Array([
			0.0,  0.0, sq2, 1.0,		1.0,  0.0,  1.0,	// Node 0
			c30, -0.5, 0.0, 1.0, 		1.0,  1.0,  1.0, 	// Node 1
			0.0,  1.0, 0.0, 1.0,  		1.0,  0.0,  1.0,	// Node 2
				   // Face 1: (right side)
		    0.0,  0.0, sq2, 1.0,		1.0,  0.0,  1.0,	// Node 0
			0.0,  1.0, 0.0, 1.0,  		1.0,  1.0,  1.0,	// Node 2
		   -c30, -0.5, 0.0, 1.0, 		1.0,  0.0,  1.0, 	// Node 3
			   // Face 2: (lower side)
			0.0,  0.0, sq2, 1.0,	    1.0,  0.0,  1.0,	// Node 0 
		   -c30, -0.5, 0.0, 1.0, 		1.0,  1.0,  1.0, 	// Node 3
			c30, -0.5, 0.0, 1.0, 		1.0,  0.0,  1.0, 	// Node 1 
				// Face 3: (base side)  
		   -c30, -0.5, 0.0, 1.0, 		1.0,  0.0,  1.0, 	// Node 3
			0.0,  1.0, 0.0, 1.0,  	    1.0,  1.0,  1.0,	// Node 2
			c30, -0.5, 0.0, 1.0, 		1.0,  0.0,  1.0, 	// Node 1
		
		]);
}

function makeWhitecube() {
	//==================================   12   =======================================
	WhitecubeVerts = new Float32Array([
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
	]);
}

function makeBlackcube() {
	//==================================   12   =======================================
	BlackcubeVerts = new Float32Array([
		// Draw the White cube
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
	   -1.0, -1.0, -1.0, 1.0,	  0.0, 0.0, 0.0,	// Node 0		
   
	   -1.0, -1.0, -1.0, 1.0,	  0.0, 0.0, 0.0,	// Node 0
	   -1.0,  1.0, -1.0, 1.0,	  0.0, 0.0, 0.0,	// Node 1
		1.0,  1.0, -1.0, 1.0,	  0.0, 0.0, 0.0,	// Node 2
	]);
}

function drawAll(gl, g_canvas, modelMatrix, viewMatrix, projMatrix, ModelMatrix, u_ModelMatrix) {
	var fov = 35.0
	var far = 21.1
	var near = 0.1
	look_Px = cam_Px + Math.cos(Angle2Rad(g_Theta));
	look_Py = cam_Py + Math.sin(Angle2Rad(g_Theta));
	look_Pz = cam_Pz + G_z;

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	modelMatrix.setIdentity();
	ModelMatrix.setIdentity();
	projMatrix.setIdentity();
	viewMatrix.setIdentity();

	// set the ViewPoint accoding the requirement
	gl.viewport(0, 0, innerWidth / 2, innerWidth / 2);
	projMatrix.setPerspective(fov, // FOV = 35 fixed value
		g_canvas.width/g_canvas.height/2, // Aspect ratio
		near,
		far);
    //set the 3D perspective camera
	viewMatrix.setLookAt(cam_Px,  cam_Py,  cam_Pz, // center of projection
		look_Px, look_Py, look_Pz, // look-at point
		0.0,     0.0,    1.0); // View UP vector

	draw_Scene(gl, modelMatrix, viewMatrix, projMatrix, ModelMatrix, u_ModelMatrix);

    //Set the orthographic camera (with same eye_point, look at poiny, up vector, z_near, z_far values)
	modelMatrix.setIdentity();
	ModelMatrix.setIdentity();
	projMatrix.setIdentity();
	viewMatrix.setIdentity();

	var vpAspect = g_canvas.width/2 / (g_canvas.height);
	var OrthH = 2.0*((far-near)/3)*Math.tan(fov * 0.5 / 180.0 * Math.PI);
	var OrthoW = OrthH*vpAspect;

	projMatrix.setOrtho(-OrthoW, OrthoW, -OrthH, OrthH, 
		near, 
		far);

	// projMatrix.setOrtho(-3, 3, -3, 3,   //x, y, z, w 
	// 	near,
	// 	far);

	viewMatrix.setLookAt(cam_Px,  cam_Py,  cam_Pz, // center of projection
		look_Px, look_Py, look_Pz, // look-at point
		0.0,     0.0,     1.0); // View UP vector
		
	gl.viewport(innerWidth / 2, 0, innerWidth / 2, innerWidth / 2);
	draw_Scene(gl, modelMatrix, viewMatrix, projMatrix, ModelMatrix, u_ModelMatrix);
}

function Draw_axis(gl, modelMatrix, viewMatrix, projMatrix, ModelMatrix, u_ModelMatrix){
	modelMatrix.scale(1,1,1)
	Set_ModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
	gl.drawArrays(gl.LINES, axisStart/floatsPerVertex,6);
}

function draw_Scene(gl, modelMatrix, viewMatrix, projMatrix, ModelMatrix, u_ModelMatrix) {
	modelMatrix.setIdentity();
	Draw_axis(gl, modelMatrix, viewMatrix, projMatrix, ModelMatrix, u_ModelMatrix)
 	pushMatrix(modelMatrix);
///////////////////////////////////////////////////
	modelMatrix = popMatrix(gl, modelMatrix, viewMatrix, projMatrix, ModelMatrix, u_ModelMatrix);  
	pushMatrix(modelMatrix);
	Draw_butterfly(gl, 0.18, 1 ,1 , modelMatrix, viewMatrix, projMatrix, ModelMatrix, u_ModelMatrix)

	modelMatrix = popMatrix(gl, modelMatrix, viewMatrix, projMatrix, ModelMatrix, u_ModelMatrix);  
	pushMatrix(modelMatrix);
	Draw_butterfly(gl, 0.1, 1.3, -1, modelMatrix, viewMatrix, projMatrix, ModelMatrix, u_ModelMatrix)

	modelMatrix = popMatrix(gl, modelMatrix, viewMatrix, projMatrix, ModelMatrix, u_ModelMatrix);  
	pushMatrix(modelMatrix);
	Draw_Robot(gl, modelMatrix, viewMatrix, projMatrix, ModelMatrix, u_ModelMatrix)

	modelMatrix = popMatrix(gl, modelMatrix, viewMatrix, projMatrix, ModelMatrix, u_ModelMatrix);  
	pushMatrix(modelMatrix);
	Draw_moon(gl, modelMatrix, viewMatrix, projMatrix, ModelMatrix, u_ModelMatrix)

	modelMatrix = popMatrix(gl, modelMatrix, viewMatrix, projMatrix, ModelMatrix, u_ModelMatrix);  
	pushMatrix(modelMatrix);
	Draw_planet(gl, modelMatrix, viewMatrix, projMatrix, ModelMatrix, u_ModelMatrix)

	modelMatrix = popMatrix(gl, modelMatrix, viewMatrix, projMatrix, ModelMatrix, u_ModelMatrix);  
	pushMatrix(modelMatrix);
	Draw_spaceship(gl, modelMatrix, viewMatrix, projMatrix, ModelMatrix, u_ModelMatrix)

	modelMatrix = popMatrix(gl, modelMatrix, viewMatrix, projMatrix, ModelMatrix, u_ModelMatrix);  
	pushMatrix(modelMatrix);
	Draw_GroundAxis(gl, modelMatrix, viewMatrix, projMatrix, ModelMatrix, u_ModelMatrix)
}

function Draw_GroundAxis(gl, modelMatrix, viewMatrix, projMatrix, ModelMatrix, u_ModelMatrix){
	modelMatrix.translate( 0.4, -0.4, 0.0);	
	modelMatrix.scale(0.1, 0.1, 0.1);				// shrink by 10X:
    Set_ModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
    gl.drawArrays(gl.LINES, 								// use this drawing primitive, and
					gndStart/floatsPerVertex,	// start at this vertex number, and
					gndVerts.length/floatsPerVertex);	// draw this many vertices.
}

function Draw_spaceship(gl, modelMatrix, viewMatrix, projMatrix, ModelMatrix, u_ModelMatrix){
	let stack =[]
	modelMatrix.translate(-3.3, -3.1, 0.0); 
	modelMatrix.rotate(g_angle07*0.5, 0, 1, 0);  
	modelMatrix.rotate(-g_angle07*0.45, 1, 0.2, 0);
	stack.push(new Matrix4(modelMatrix));  
	Draw_axis(gl, modelMatrix, viewMatrix, projMatrix, ModelMatrix, u_ModelMatrix)
	modelMatrix.scale(0.2, 0.2, 0.2);
	Set_ModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
    gl.drawArrays(gl.TRIANGLE_STRIP, 								// use this drawing primitive, and
		cylStart/floatsPerVertex,	// start at this vertex number, and
		cylVerts.length/floatsPerVertex);	// draw this many vertices.

	modelMatrix = stack.pop();
	stack.push(new Matrix4(modelMatrix));
	modelMatrix.scale(0.18, 0.18, 0.18);
	Set_ModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
	gl.drawArrays(gl.TRIANGLE_STRIP, 				// use this drawing primitive, and
		torStart/floatsPerVertex,	// start at this vertex number, and
		torVerts.length/floatsPerVertex);	// draw this many vertices.
	
	modelMatrix = stack.pop();
	stack.push(new Matrix4(modelMatrix));
	modelMatrix.scale(0.23, 0.23, 0.23);
	Set_ModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
	gl.drawArrays(gl.TRIANGLE_STRIP, 				// use this drawing primitive, and
		torStart/floatsPerVertex,	// start at this vertex number, and
		torVerts.length/floatsPerVertex);	// draw this many vertices.

	modelMatrix = stack.pop();
	stack.push(new Matrix4(modelMatrix));
	modelMatrix.scale(0.28, 0.28, 0.28);
	Set_ModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
	gl.drawArrays(gl.TRIANGLE_STRIP, 				// use this drawing primitive, and
		torStart/floatsPerVertex,	// start at this vertex number, and
		torVerts.length/floatsPerVertex);	// draw this many vertices.

	modelMatrix = stack.pop();
	stack.push(new Matrix4(modelMatrix));
	modelMatrix.scale(0.33, 0.33, 0.33);
	Set_ModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
	gl.drawArrays(gl.TRIANGLE_STRIP, 				// use this drawing primitive, and
		torStart/floatsPerVertex,	// start at this vertex number, and
		torVerts.length/floatsPerVertex);	// draw this many vertices.

	modelMatrix = stack.pop();

	modelMatrix.translate(0, 0.1, 0.15);
	modelMatrix.scale(0.1, 0.1, 0.1);
	modelMatrix.rotate(150.0, 0.0, 0.0, 1.0);
	modelMatrix.rotate(90, -1, 0, 0);
	modelMatrix.rotate(g_angle07*0.7, 0.0, 0.0, 1.0);
	modelMatrix.translate(0.0, -1.0, 0.0);
	modelMatrix.rotate(g_angle07*0.4, 0.0, 0.5, 0.0);
	Set_ModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
	gl.drawArrays(gl.TRIANGLES, ConcaStart/floatsPerVertex, ConcaVerts.length/floatsPerVertex);
	stack.push(new Matrix4(modelMatrix));
	modelMatrix.rotate(g_angle07*0.5, 0.0, 0.0, 1.0);
	modelMatrix.translate(0.0, -1.0, 0.0);
	Set_ModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
	gl.drawArrays(gl.TRIANGLES, ConcaStart/floatsPerVertex, ConcaVerts.length/floatsPerVertex);
	
	modelMatrix = stack.pop();
	stack.push(new Matrix4(modelMatrix));
	modelMatrix.rotate(g_angle07*0.5, 0.0, 0.0, 1.0);
	modelMatrix.translate(0.0, -1.0, 0.0);
	Set_ModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
	gl.drawArrays(gl.TRIANGLES, ConcaStart/floatsPerVertex, ConcaVerts.length/floatsPerVertex);

	modelMatrix.rotate(g_angle07, 0.0, 0.0, 1.0);
	modelMatrix.translate(0.0, -1.0, 0.0);
	Set_ModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
	gl.drawArrays(gl.TRIANGLES, ConcaStart/floatsPerVertex, ConcaVerts.length/floatsPerVertex);

	modelMatrix.translate(0.0, -0.7, 0.35);
	modelMatrix.scale(0.4, 0.4, 0.4);
	Set_ModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
	gl.drawArrays(gl.TRIANGLE_STRIP,				// use this drawing primitive, and
		sphStart/floatsPerVertex,	// start at this vertex number, and 
		sphVerts.length/floatsPerVertex);
				
}

function Draw_planet(gl, modelMatrix, viewMatrix, projMatrix, ModelMatrix, u_ModelMatrix){
	let stack = []
	modelMatrix.translate(-0.75, -0.6, 0.0); 
	modelMatrix.rotate(g_butter, 0, 0, 1);  
	modelMatrix.translate(-1.4,-0.7, 0);
	stack.push(new Matrix4(modelMatrix));  
	modelMatrix.scale(0.13, 0.13, 0.13);
	Set_ModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
	gl.drawArrays(gl.TRIANGLE_STRIP,	// use this drawing primitive, and
		sphStart/floatsPerVertex,	// start at this vertex number, and 
		sphVerts.length/floatsPerVertex);	// draw this many vertices.
	
	modelMatrix = stack.pop();
	stack.push(new Matrix4(modelMatrix));
	modelMatrix.rotate(g_planet, 0, 0, 1);  
	modelMatrix.rotate(g_planet, 1, 0, 1); 
	modelMatrix.scale(0.23, 0.23, 0.23);
	Set_ModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
	gl.drawArrays(gl.TRIANGLE_STRIP, 	// use this drawing primitive, and
		torStart/floatsPerVertex,	// start at this vertex number, and
		torVerts.length/floatsPerVertex);	// draw this many vertices.


	modelMatrix = stack.pop();
	stack.push(new Matrix4(modelMatrix));
	modelMatrix.rotate(-g_planet, 0, 0, 1);  
	modelMatrix.rotate(g_planet, 0, 1, 1); 
	modelMatrix.scale(0.23, 0.23, 0.23);
	Set_ModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
	gl.drawArrays(gl.TRIANGLE_STRIP, 	// use this drawing primitive, and
		torStart/floatsPerVertex,	// start at this vertex number, and
		torVerts.length/floatsPerVertex);	// draw this many vertices.


}

function Draw_Robot(gl, modelMatrix, viewMatrix, projMatrix, ModelMatrix, u_ModelMatrix){
	let stack = []
	modelMatrix.translate(-0.75, -0.6, 0.0); 
	modelMatrix.rotate(g_butter, 0, 0, 1);  
	modelMatrix.translate(-2.4,-1.7, 0);  
	modelMatrix.scale(1,1,-1);
	modelMatrix.scale(0.2, 0.2, 0.2);
	modelMatrix.rotate(g_angle01, 2, 1, 0.2);  
	modelMatrix.translate(1.4, -2.2, 1.4);
	modelMatrix.rotate(g_angle02, 8, 2, -0.3);
	Set_ModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
	stack.push(new Matrix4(modelMatrix));
	gl.drawArrays(gl.TRIANGLES, 
		RobotbodyStart/floatsPerVertex ,
		RobotbodyVerts.length/floatsPerVertex);
	modelMatrix.translate(-1.2, -0.3, 0);
	modelMatrix.scale(1,1,-1);
	Draw_claw_left(1,0,0, gl , modelMatrix, viewMatrix, projMatrix, ModelMatrix, u_ModelMatrix)

	modelMatrix = stack.pop();
	stack.push(new Matrix4(modelMatrix));
	modelMatrix.translate(1.2, -0.3, 0.0);
	modelMatrix.scale(1,1,-1);
	Draw_claw_right(1,0,0,gl, modelMatrix, viewMatrix, projMatrix, ModelMatrix, u_ModelMatrix)

	modelMatrix = stack.pop();
	stack.push(new Matrix4(modelMatrix));
	modelMatrix.translate(-0.5, -1.2, 0);
	modelMatrix.scale(1,1,-1,gl, modelMatrix, viewMatrix, projMatrix, ModelMatrix, u_ModelMatrix);
	Draw_leg(g_angle_leg1, gl, modelMatrix, viewMatrix, projMatrix, ModelMatrix, u_ModelMatrix)
	modelMatrix = stack.pop();
	stack.push(new Matrix4(modelMatrix));
	modelMatrix.translate(0.5, -1.2, 0);
	modelMatrix.scale(1,1,-1);
	Draw_leg(g_angle_leg2,gl, modelMatrix, viewMatrix, projMatrix, ModelMatrix, u_ModelMatrix)
	modelMatrix = stack.pop();
	stack.push(new Matrix4(modelMatrix));
	modelMatrix.translate(0, 1.8, 0.0);
	modelMatrix.scale(1,1,-1);
	modelMatrix.rotate(20,1,0,0)
	modelMatrix.rotate(180,1,0,0)
	Set_ModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
	gl.drawArrays(gl.TRIANGLES, 
		tetrahedronStart/floatsPerVertex ,
		tetrahedronVerts.length/floatsPerVertex);
	Draw_eyes(gl, modelMatrix, viewMatrix, projMatrix, ModelMatrix, u_ModelMatrix)
}

function Draw_eyes(gl, modelMatrix, viewMatrix, projMatrix, ModelMatrix, u_ModelMatrix){
	let stack3 = []
	modelMatrix.rotate(160,1,0,0)
	stack3.push(new Matrix4(modelMatrix));
	modelMatrix.scale(0.2,0.2,0.2)
	modelMatrix.translate(2.5,2,-4)
	Set_ModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
	gl.drawArrays(gl.TRIANGLES, 
		WhitecubeStart/floatsPerVertex ,
		WhitecubeVerts.length/floatsPerVertex);
	modelMatrix.scale(0.5,0.5,0.5)
	modelMatrix.translate(-0.5,-0.5,-2.1)
	Set_ModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
	gl.drawArrays(gl.TRIANGLES, 
		BlackcubeStart/floatsPerVertex ,
		BlackcubeVerts.length/floatsPerVertex);
	modelMatrix = stack3.pop();
	modelMatrix.scale(0.2,0.2,0.2)
	modelMatrix.translate(-2.5,2,-4)
	Set_ModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
	gl.drawArrays(gl.TRIANGLES, 
		WhitecubeStart/floatsPerVertex ,
		WhitecubeVerts.length/floatsPerVertex);
	modelMatrix.scale(0.5,0.5,0.5)
	modelMatrix.translate(-0.5,-0.5,-2.1)
	Set_ModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
	gl.drawArrays(gl.TRIANGLES, 
		BlackcubeStart/floatsPerVertex ,
		BlackcubeVerts.length/floatsPerVertex);
}

function Draw_leg(g, gl, modelMatrix, viewMatrix, projMatrix, ModelMatrix, u_ModelMatrix){
	modelMatrix.scale(0.2, 0.2, 0.2);
	modelMatrix.rotate(g, 1,0,0);  // Make new drawing axes that
	Set_ModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
	DrawCube(gl);
	modelMatrix.translate(0, -1.5, -1.5);
	modelMatrix.rotate(g, 1, 0, 0);
	Set_ModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
	DrawCube(gl);
	modelMatrix.translate(0, -1.5, -1.5);
	modelMatrix.scale(2, 1, 2);
	modelMatrix.rotate(g, 1, 0, 0);
	Set_ModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
	DrawCube(gl);
}

function Draw_claw_right(x,y,z,gl, modelMatrix, viewMatrix, projMatrix, ModelMatrix, u_ModelMatrix){
	modelMatrix.scale(0.2, 0.2, 0.2);
	modelMatrix.rotate(90, 0, -1, 0);
	modelMatrix.rotate(g_angle02, x, y, z);
	Set_ModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
	DrawCube(gl);
	modelMatrix.translate(0, -1.5, -1.5);
	modelMatrix.rotate(g_angle02, x, y, z);
	Set_ModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
	DrawCube(gl);
	modelMatrix.translate(0, -1.5, -1.5);
	modelMatrix.rotate(g_angle02, x, y, z);
	Set_ModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
	DrawCube(gl);
	modelMatrix.translate(0, -1.5, -1.5);
	modelMatrix.rotate(g_angle02, x, y, z);
	Set_ModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
	DrawCube(gl);
	modelMatrix.translate(0, -1.5, -1.5);
	modelMatrix.rotate(g_angle02, x, y, z);
	Set_ModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
	DrawCube(gl);
}

function Draw_claw_left(x,y,z,gl, modelMatrix, viewMatrix, projMatrix, ModelMatrix, u_ModelMatrix){
	modelMatrix.scale(0.2, 0.2, 0.2);
	modelMatrix.rotate(90, 0, 1, 0);
	modelMatrix.rotate(g_angle02, x, y, z);  
	Set_ModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
	DrawCube(gl);
	modelMatrix.translate(0, -1.5, -1.5);
	modelMatrix.rotate(g_angle02, x, y, z);
	// modelMatrix.rotate(g_angle02, 0, 1, 0);
	Set_ModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
	DrawCube(gl);
	modelMatrix.translate(0, -1.5, -1.5);
	modelMatrix.rotate(g_angle02, x, y, z);
	// modelMatrix.rotate(g_angle02, 0, -1, 0);
	Set_ModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
	DrawCube(gl);
	modelMatrix.translate(0, -1.5, -1.5);
	modelMatrix.rotate(g_angle02, x, y, z);
	// modelMatrix.rotate(g_angle02, 0, -1, 0);
	Set_ModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
	DrawCube(gl);
	modelMatrix.translate(0, -1.5, -1.5);
	modelMatrix.rotate(g_angle02, x, y, z);
	// modelMatrix.rotate(g_angle02, 0, -1, 0);
	Set_ModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
	DrawCube(gl);
	

}

function Draw_moon(gl, modelMatrix, viewMatrix, projMatrix, ModelMatrix, u_ModelMatrix){
	let stack4 = []
	modelMatrix.translate(-0.75, -0.6, 0.0); 											// to match WebGL display canvas.
	// modelMatrix.rotate(g_Theta + 90, 0.0, 0.0, 1.0);

	quatMatrix.setFromQuat(qTot.x*Math.cos(Angle2Rad(g_Theta+90))-qTot.y*Math.sin(Angle2Rad(g_Theta+90)), 
							qTot.x*Math.sin(Angle2Rad(g_Theta+90))+qTot.y*Math.cos(Angle2Rad(g_Theta+90)),
							qTot.z, 
							qTot.w);	

	modelMatrix.concat(quatMatrix);
	Draw_axis(gl, modelMatrix, viewMatrix, projMatrix, ModelMatrix, u_ModelMatrix)
	modelMatrix.scale(0.35, 0.35, 0.35);
	Set_ModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);

	
	gl.drawArrays(gl.TRIANGLES, 
		WhitecubeStart/floatsPerVertex ,
		WhitecubeVerts.length/floatsPerVertex);
	stack4.push(new Matrix4(modelMatrix));
// RIGHT SIDE
	modelMatrix.translate(0.36,0,0)
	modelMatrix.scale(0.8,0.8,0.8);
	Set_ModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
	gl.drawArrays(gl.TRIANGLES, 
		WhitecubeStart/floatsPerVertex ,
		WhitecubeVerts.length/floatsPerVertex);
	modelMatrix = stack4.pop();
	stack4.push(new Matrix4(modelMatrix));
	modelMatrix.translate(0.78,0,0)
	modelMatrix.scale(0.5, 0.5, 0.5);
	Set_ModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
	gl.drawArrays(gl.TRIANGLES, 
		WhitecubeStart/floatsPerVertex ,
		WhitecubeVerts.length/floatsPerVertex);
	modelMatrix = stack4.pop();
	stack4.push(new Matrix4(modelMatrix));
	modelMatrix.translate(1.1,0,0)
	modelMatrix.scale(0.3, 0.3, 0.3);
	Set_ModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
	gl.drawArrays(gl.TRIANGLES, 
		WhitecubeStart/floatsPerVertex ,
		WhitecubeVerts.length/floatsPerVertex);
// LEFT SIDE
	modelMatrix = stack4.pop();
	stack4.push(new Matrix4(modelMatrix));
	modelMatrix.translate(-0.36,0,0)
	modelMatrix.scale(0.8,0.8,0.8);
	Set_ModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
	gl.drawArrays(gl.TRIANGLES, 
		WhitecubeStart/floatsPerVertex ,
		WhitecubeVerts.length/floatsPerVertex);
	modelMatrix = stack4.pop();
	stack4.push(new Matrix4(modelMatrix));
	modelMatrix.translate(-0.78,0,0)
	modelMatrix.scale(0.5, 0.5, 0.5);
	Set_ModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
	gl.drawArrays(gl.TRIANGLES, 
		WhitecubeStart/floatsPerVertex ,
		WhitecubeVerts.length/floatsPerVertex);
	modelMatrix = stack4.pop();
	stack4.push(new Matrix4(modelMatrix));
	modelMatrix.translate(-1.1,0,0)
	modelMatrix.scale(0.3, 0.3, 0.3);
	Set_ModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
	gl.drawArrays(gl.TRIANGLES, 
		WhitecubeStart/floatsPerVertex ,
		WhitecubeVerts.length/floatsPerVertex);
// UPPER SIDE
	modelMatrix = stack4.pop();
	stack4.push(new Matrix4(modelMatrix));
	modelMatrix.translate(0,0.36,0)
	modelMatrix.scale(0.8,0.8,0.8);
	Set_ModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
	gl.drawArrays(gl.TRIANGLES, 
		WhitecubeStart/floatsPerVertex ,
		WhitecubeVerts.length/floatsPerVertex);
	modelMatrix = stack4.pop();
	stack4.push(new Matrix4(modelMatrix));
	modelMatrix.translate(0,0.78,0)
	modelMatrix.scale(0.5, 0.5, 0.5);
	Set_ModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
	gl.drawArrays(gl.TRIANGLES, 
		WhitecubeStart/floatsPerVertex ,
		WhitecubeVerts.length/floatsPerVertex);
	modelMatrix = stack4.pop();
	stack4.push(new Matrix4(modelMatrix));
	modelMatrix.translate(0,1.1,0)
	modelMatrix.scale(0.3, 0.3, 0.3);
	Set_ModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
	gl.drawArrays(gl.TRIANGLES, 
		WhitecubeStart/floatsPerVertex ,
		WhitecubeVerts.length/floatsPerVertex);
	// LOWER SIDE
	modelMatrix = stack4.pop();
	stack4.push(new Matrix4(modelMatrix));
	modelMatrix.translate(0,-0.36,0)
	modelMatrix.scale(0.8,0.8,0.8);
	Set_ModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
	gl.drawArrays(gl.TRIANGLES, 
		WhitecubeStart/floatsPerVertex ,
		WhitecubeVerts.length/floatsPerVertex);
	modelMatrix = stack4.pop();
	stack4.push(new Matrix4(modelMatrix));
	modelMatrix.translate(0,-0.78,0)
	modelMatrix.scale(0.5, 0.5, 0.5);
	Set_ModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
	gl.drawArrays(gl.TRIANGLES, 
		WhitecubeStart/floatsPerVertex ,
		WhitecubeVerts.length/floatsPerVertex);
	modelMatrix = stack4.pop();
	stack4.push(new Matrix4(modelMatrix));
	modelMatrix.translate(0,-1.1,0)
	modelMatrix.scale(0.3, 0.3, 0.3);
	Set_ModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
	gl.drawArrays(gl.TRIANGLES, 
		WhitecubeStart/floatsPerVertex ,
		WhitecubeVerts.length/floatsPerVertex);

	// BACK SIDE
	modelMatrix = stack4.pop();
	stack4.push(new Matrix4(modelMatrix));
	modelMatrix.translate(0,0.0,-0.36)
	modelMatrix.scale(0.8,0.8,0.8);
	Set_ModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
	gl.drawArrays(gl.TRIANGLES, 
		WhitecubeStart/floatsPerVertex ,
		WhitecubeVerts.length/floatsPerVertex);
	modelMatrix = stack4.pop();
	stack4.push(new Matrix4(modelMatrix));
	modelMatrix.translate(0,0,-0.78)
	modelMatrix.scale(0.5, 0.5, 0.5);
	Set_ModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
	gl.drawArrays(gl.TRIANGLES, 
		WhitecubeStart/floatsPerVertex ,
		WhitecubeVerts.length/floatsPerVertex);
	modelMatrix = stack4.pop();
	stack4.push(new Matrix4(modelMatrix));
	modelMatrix.translate(0,0,-1.1)
	modelMatrix.scale(0.3, 0.3, 0.3);
	Set_ModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
	gl.drawArrays(gl.TRIANGLES, 
		WhitecubeStart/floatsPerVertex ,
		WhitecubeVerts.length/floatsPerVertex);


	// BACK SIDE
	modelMatrix = stack4.pop();
	stack4.push(new Matrix4(modelMatrix));
	modelMatrix.translate(0,0.0,0.36)
	modelMatrix.scale(0.8,0.8,0.8);
	Set_ModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
	gl.drawArrays(gl.TRIANGLES, 
		WhitecubeStart/floatsPerVertex ,
		WhitecubeVerts.length/floatsPerVertex);
	modelMatrix = stack4.pop();
	stack4.push(new Matrix4(modelMatrix));
	modelMatrix.translate(0,0,0.78)
	modelMatrix.scale(0.5, 0.5, 0.5);
	Set_ModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
	gl.drawArrays(gl.TRIANGLES, 
		WhitecubeStart/floatsPerVertex ,
		WhitecubeVerts.length/floatsPerVertex);
	modelMatrix = stack4.pop();
	stack4.push(new Matrix4(modelMatrix));
	modelMatrix.translate(0,0,1.1)
	modelMatrix.scale(0.3, 0.3, 0.3);
	Set_ModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
	gl.drawArrays(gl.TRIANGLES, 
		WhitecubeStart/floatsPerVertex ,
		WhitecubeVerts.length/floatsPerVertex);

}

function DrawCube(gl){
	gl.drawArrays(gl.TRIANGLES, cube_vStart/floatsPerVertex, cube_v.length/floatsPerVertex);
}

function Draw_butterfly(gl, size, coff, inv , modelMatrix, viewMatrix, projMatrix, ModelMatrix, u_ModelMatrix){
	let stack = []
	let stack2 = []
	modelMatrix.translate(-0.75, -0.6, 0.0); 
	modelMatrix.rotate(inv*g_butter, 0, 0, 1);  
	modelMatrix.translate(1, -1.7, 0.0); 
	modelMatrix.translate(-3.0*coff, 3.0*coff, 0);
	
	modelMatrix.rotate(inv*g_butter, -4, 2, 0);  
	modelMatrix.translate(-1, -2, 1);
	modelMatrix.translate(2, -2, 1);
	modelMatrix.rotate(g_angle02, 1, 4, 3);  // Make new drawing axes th
	Draw_axis(gl, modelMatrix, viewMatrix, projMatrix, ModelMatrix, u_ModelMatrix);
	modelMatrix.scale(size,size,size);
	stack.push(new Matrix4(modelMatrix));
	Set_ModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
	gl.drawArrays(gl.TRIANGLES, butter_body_vStart/floatsPerVertex, 
		butter_body_v.length/floatsPerVertex);
	modelMatrix.translate(0.0, -0.5, 0)
	modelMatrix.scale(0.15, 0.15, 0.15);
	Set_ModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
	gl.drawArrays(gl.TRIANGLES, 
				cube_vStart/floatsPerVertex,
				cube_v.length/floatsPerVertex);
	modelMatrix = stack.pop();
	stack.push(new Matrix4(modelMatrix));
	modelMatrix.scale(0.8, 0.8, 0.8);
	modelMatrix.rotate(g_angle03,0,1,0);
	modelMatrix.rotate(20,0,0,1);
	modelMatrix.translate(0.25,0, 0);
	stack2.push(new Matrix4(modelMatrix));
	modelMatrix.translate(1,0, 0);
	Set_ModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
	gl.drawArrays(gl.TRIANGLES, 
	butter_wing_vStart/floatsPerVertex,
	butter_wing_v.length/floatsPerVertex);
	modelMatrix = stack2.pop();
	modelMatrix.translate(-0.36,0, 0);
	modelMatrix.rotate(g_angle03,0,1,0);
	modelMatrix.rotate(-40,0,0,1);
	modelMatrix.translate(1.36,0, 0);
	Set_ModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
	gl.drawArrays(gl.TRIANGLES, 
		butter_wing_vStart/floatsPerVertex,
		butter_wing_v.length/floatsPerVertex);
	modelMatrix = stack.pop();
	modelMatrix.rotate(180,1,0,0)
	modelMatrix.scale(0.8, 0.8, 0.8);
	modelMatrix.rotate(g_angle03,0,1,0)
	modelMatrix.rotate(20,0,0,1)
	modelMatrix.translate(-0.25,0, 0);
	stack2.push(new Matrix4(modelMatrix));
	modelMatrix.translate(-1,0, 0);
	// modelMatrix.rotate()
	Set_ModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
	gl.drawArrays(gl.TRIANGLES, 
		butter_wing_vStart/floatsPerVertex,
		butter_wing_v.length/floatsPerVertex);
	modelMatrix = stack2.pop();
	modelMatrix.translate(0.36,0, 0);
	modelMatrix.rotate(g_angle03,0,1,0);
	modelMatrix.rotate(-40,0,0,1);
	modelMatrix.translate(-1.36,0, 0);
	// modelMatrix.rotate()
	Set_ModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix);
	gl.drawArrays(gl.TRIANGLES, 
		butter_wing_vStart/floatsPerVertex,
		butter_wing_v.length/floatsPerVertex);
}

function Set_ModelMatrix(gl, ModelMatrix, u_ModelMatrix, projMatrix, viewMatrix, modelMatrix) {
	ModelMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
	gl.uniformMatrix4fv(u_ModelMatrix, false, ModelMatrix.elements);
}

function animate(angle) {
	var now = Date.now();
	var elapsed = now - g_last;
	g_last = now;    

	g_angle_leg1 = g_angle_leg1 - (g_angle04Rate * elapsed) / 1000.0;
		if(g_angle_leg1 < -50.0 && g_angle04Rate > 0) g_angle04Rate *= -1.0;
		if(g_angle_leg1 > 10.0 && g_angle04Rate < 0) g_angle04Rate *= -1.0;

	g_angle_leg2 = g_angle_leg2 + (g_angle05Rate * elapsed) / 1000.0;
		if(g_angle_leg2 > 10 && g_angle05Rate > 0) g_angle05Rate *= -1.0;
		if(g_angle_leg2 < -50.0  && g_angle05Rate < 0) g_angle05Rate *= -1.0;

	g_angle01 = g_angle01 + (g_angle01Rate * elapsed) / 1000.0;
		if(g_angle01 > 180.0) g_angle01 = g_angle01 - 360.0;
		if(g_angle01 <-180.0) g_angle01 = g_angle01 + 360.0;
	
	g_angle02 = g_angle02 + (g_angle02Rate * elapsed) / 1000.0;
		if(g_angle02 > angel_limit && g_angle02Rate > 0) g_angle02Rate *= -1.0;
		if(g_angle02 < 0.0  && g_angle02Rate < 0) g_angle02Rate *= -1.0;

	g_butter = g_butter + (g_butterRate * elapsed) / 1000.0;
		if(g_butter > 180.0) g_butter = g_butter - 360.0;
		if(g_butter <-180.0) g_butter = g_butter + 360.0;

	g_planet = g_planet + (g_planetRate * elapsed) / 1000.0;
		if(g_planet > 180.0) g_planet = g_planet - 360.0;
		if(g_planet <-180.0) g_planet = g_planet + 360.0;

	g_angle03 = g_angle03 + (g_angle03Rate * elapsed) / 1000.0;
		if(g_angle03 > 30.0 && g_angle03Rate > 0) g_angle03Rate *= -1.0;
		if(g_angle03 < -20.0  && g_angle03Rate < 0) g_angle03Rate *= -1.0;

	g_angle06 = g_angle06 + (g_angle06Rate * elapsed) / 1000.0;
		if(g_angle06 > 180.0 && g_angle06Rate > 0) g_angle06Rate -360.0;
		if(g_angle06 < -180.0  && g_angle06Rate < 0) g_angle06Rate +360.0;


	g_angle07 = g_angle07 + (g_angle07Rate * elapsed) / 1000.0;
		if(g_angle07 > 30.0 && g_angle07Rate > 0) g_angle07Rate *= -1.0;
		if(g_angle07 < -30.0  && g_angle07Rate < 0) g_angle07Rate *= -1.0;
		
	var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
	return newAngle %= 360;
}

function dragQuat(xdrag, ydrag) {
	var qTmp = new Quaternion(0,0,0,1);
	var dist = Math.sqrt(xdrag*xdrag + ydrag*ydrag);
	console.log('xdrag,ydrag=',xdrag.toFixed(5),ydrag.toFixed(5),'dist=',dist.toFixed(5));
	// qNew.setFromAxisAngle(ydrag*Math.sin(Math.PI/2-phase1) + xdrag*Math.sin(-phase2)*Math.cos(-Math.PI/2-phase1) + 0.0001, -ydrag*Math.cos(Math.PI/2-phase1) - xdrag*Math.sin(-phase2)*Math.sin(Math.PI/2-phase1) + 0.0001 , xdrag*Math.cos(-phase2) , dist*150.0);
	qNew.setFromAxisAngle(-ydrag + 0.0001, xdrag + 0.0001, 0.0, dist*150.0);
	qTmp.multiply(qNew,qTot);			 // apply new rotation to current rotation. 
	qTmp.normalize();		 // normalize to ensure we stay at length==1.0.
	qTot.copy(qTmp);
}

function myMouseDown(ev) {
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
}

function myMouseMove(ev) {
	var Amp = 23.0 //set the sensitivity of mouse drag
	if(g_isDrag==false) return;				// IGNORE all mouse-moves except 'dragging'
	var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
	var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
	var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge

	var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
							(g_canvas.width/2);		// normalize canvas to -1 <= x < +1,
	var y = (yp - g_canvas.height/2) /		//									-1 <= y < +1.
							(g_canvas.height/2);
	//	console.log('myMouseMove(CVV coords  ):  x, y=\t',x,',\t',y);
	// 	g_Theta += (x-g_xMclik)*Amp;
	// 	G_z -= Angle2Rad(y - g_yMclik)*Amp;
	//     if(g_Theta > 360) g_Theta -= 360.0;
	//     if(g_Theta < 0) g_Theta += 360.0;
	//     
	// find how far we dragged the mouse:
	g_xMdragTot += (x - g_xMclik);
	g_yMdragTot += (y - g_yMclik);
	// Report new mouse position & how far we moved on webpage:
	document.getElementById('MouseAtResult').innerHTML = 
		'Mouse At: '+x.toFixed(g_digits)+', '+y.toFixed(g_digits);
	document.getElementById('MouseDragResult').innerHTML = 
		'Mouse Drag: '+(x - g_xMclik).toFixed(g_digits)+', ' 
								+(y - g_yMclik).toFixed(g_digits)
	dragQuat(-(x - g_xMclik), -(y - g_yMclik));
	g_xMclik = x;											// Make next drag-measurement from here.
	g_yMclik = y;
}

function myMouseUp(ev) {
	var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
	var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
	var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
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
	dragQuat(-(x - g_xMclik), -(y - g_yMclik));
}

function myKeyDown(kev) {
	//added need to modify
	var xd = cam_Px - look_Px;
	var yd = cam_Py - look_Py;
	var zd = cam_Pz - look_Pz;
	var len = Math.sqrt(Math.pow(xd, 2) + Math.pow(yd, 2) + Math.pow(zd, 2));
	var moveRateRad = Angle2Rad(perspective_changing_rate);
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
			case "KeyW":
				console.log("w/W key: Move FWD!\n");
				look_Px -= (xd / len);
				look_Py -= (yd / len);
				look_Pz -= (zd / len);
				cam_Px -= (xd / len);
				cam_Py -= (yd / len);
				cam_Pz -= (zd / len);
				break;

			case "KeyA":
				var xStrafe = Math.cos(Angle2Rad(g_Theta + 45));
				var yStrafe = Math.sin(Angle2Rad(g_Theta + 45));
				cam_Px += xStrafe / len;
				cam_Py += yStrafe / len;
				break;

			case "KeyD":
				console.log("d/D key: Strafe RIGHT!\n");
				var xStrafe = Math.cos(Angle2Rad(g_Theta + 45));
				var yStrafe = Math.sin(Angle2Rad(g_Theta + 45));
				cam_Px -= xStrafe / len;
				cam_Py -= yStrafe / len;
				break;

			case "KeyS":
				console.log("s/S key: Move BACK!\n");
				look_Px += (xd / len);
				look_Py += (yd / len);
				look_Pz += (zd / len);
				cam_Px += (xd / len);
				cam_Py += (yd / len);
				cam_Pz += (zd / len);
				break;

			case "KeyR":
				console.log("a/A key: Reset the shifting!\n");
				document.getElementById('KeyDownResult').innerHTML =  
				'myKeyDown() found a/A key. Reset the robot shifting!';
				hori_shift = 0;
				vert_shift = 0;
				g_Theta = ini_Theta;
				G_z = ini_Gz;
				cam_Px = 2, cam_Py = -9.4, cam_Pz = 6.0; 
				look_Px = 4.5, look_Py = 4.5, look_Pz = 5.5;
				break;

			//----------------Arrow keys------------------------
			case "ArrowLeft": 	
				console.log(' left-arrow.');
				g_Theta += perspective_changing_rate;
				if(g_Theta > 360) g_Theta -= 360.0;
				if(g_Theta < 0) g_Theta += 360.0;
				hori_shift -=0.05
				break;
			case "ArrowRight":
				console.log(' right-arrow.');	
				g_Theta -= perspective_changing_rate;
				if(g_Theta > 360) g_Theta -= 360.0;
				if(g_Theta < 0) g_Theta += 360.0;
				hori_shift +=0.05
				break;
			case "ArrowUp":	
				console.log(' up-arrow.');	
				G_z += moveRateRad;
				vert_shift +=0.05
				break;
			case "ArrowDown":
				console.log(' down-arrow.');
				G_z -= moveRateRad;
				vert_shift -=0.05
			break;	
		default:
		console.log("UNUSED!");
			document.getElementById('KeyDownResult').innerHTML =
				'myKeyDown(): UNUSED!';
		break;
		}
}


function myKeyUp(kev) {
	console.log('myKeyUp()--keyCode='+kev.keyCode+' released.');
}	

function Angle2Rad(angle) {
	return angle * (Math.PI/180);
}

function nextShape() {
	shapeNum += 1;
	if(shapeNum >= shapeMax) shapeNum = 0;
}

function spinDown() {
	ANGLE_STEP -= 25; 
	g_butterRate -= 10 
	g_angle01Rate -= 25; 
}

function spinUp() {
  ANGLE_STEP += 25; 
  g_angle01Rate += 25;
  g_butterRate += 10 
}

function runStop() {
  if(ANGLE_STEP*ANGLE_STEP > 1) {
    myTmp = ANGLE_STEP;
    ANGLE_STEP = 0;
	myTmp = g_angle01Rate;  // store the current rate,
    g_angle01Rate = 0;      // and set to zero.
	g_butterRate = 0;
  }
  else {
  	ANGLE_STEP = myTmp;
	g_angle01Rate = myTmp; 
	g_butterRate = myTmp; // 
  }
}

function num_stars() {
	var UsrTxt = document.getElementById('angel_limit').value;	
	document.getElementById('EditBoxOut').innerHTML ='You Typed: '+UsrTxt;
	console.log('NumSubmit: UsrTxt:', UsrTxt); // print in console, and
	var cache = angel_limit
	angel_limit = parseFloat(UsrTxt);     // convert string to float number 
	if (angel_limit<0 || angel_limit>40){
		angel_limit = cache
	}

  };
 