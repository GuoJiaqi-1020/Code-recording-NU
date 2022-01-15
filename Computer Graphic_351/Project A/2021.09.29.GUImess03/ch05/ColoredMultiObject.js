//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
// (JT: why the numbers? counts columns, helps me keep 80-char-wide listings)
//
// Chapter 5: ColoredTriangle.js (c) 2012 matsuda  AND
// Chapter 4: RotatingTriangle_withButtons.js (c) 2012 matsuda
// became:
//
// ColoredMultiObject.js  MODIFIED for EECS 351-1, 
//									Northwestern Univ. Jack Tumblin
//    --converted from 2D to 4D (x,y,z,w) vertices
//    --demonstrate how to keep & use MULTIPLE colored shapes in just one
//			Vertex Buffer Object(VBO). 
//    --demonstrate 'nodes' vs. 'vertices'; geometric corner locations where
//				OpenGL/WebGL requires multiple co-located vertices to implement the
//				meeting point of multiple diverse faces.
//    --Simplify fcn calls: make easy-access global vars for gl,g_nVerts, etc.
//
// Vertex shader program----------------------------------
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

// Easy-Access Global Variables-----------------------------
// (simplifies function calls. LATER: merge them into one 'myApp' object)
var ANGLE_STEP = 45.0;  // -- Rotation angle rate (degrees/second)
var gl;                 // WebGL's rendering context; value set in main()
var g_nVerts;           // # of vertices in VBO; value set in main()

function main() {
//==============================================================================
  // Retrieve <canvas> element we created in HTML file:
  var myCanvas = document.getElementById('HTML5_canvas');

  // Get rendering context from our HTML-5 canvas needed for WebGL use.
 	// Success? if so, all WebGL functions are now members of the 'gl' object.
 	// For example, gl.clearColor() calls the WebGL function 'clearColor()'.
  gl = getWebGLContext(myCanvas);
  if (!gl) {
    console.log('Failed to get the WebGL rendering context from myCanvas');
    return;
  }

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Create a Vertex Buffer Object (VBO) in the GPU, and then fill it with
  // g_nVerts vertices.  (builds a float32array in JS, copies contents to GPU)
  g_nVerts = initVertexBuffer();
  if (g_nVerts < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

	// NEW!! Enable 3D depth-test when drawing: don't over-draw at any pixel 
	// unless the new Z value is closer to the eye than the old one..
//	gl.depthFunc(gl.LESS);
	gl.enable(gl.DEPTH_TEST); 	  
	
  // Create, init current rotation angle value in JavaScript
  var currentAngle = 0.0;

  // Get handle to graphics system's storage location of u_ModelMatrix
  var u_ModelLoc = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelLoc) { 
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }
  // Create a local version of our model matrix in JavaScript 
  var modelMatrix = new Matrix4();
  // Constructor for 4x4 matrix, defined in the 'cuon-matrix-quat03.js' library
  // supplied by your textbook.  (Chapter 3)
  
  // Initialize the matrix: 
  modelMatrix.setIdentity(); // (not req'd: constructor makes identity matrix)
  
  // Transfer modelMatrix values to the u_ModelMatrix variable in the GPU
   gl.uniformMatrix4fv(u_ModelLoc, false, modelMatrix.elements);
   
//-----------------  DRAW STUFF!
  //---------------Beginner's method: DRAW ONCE and END the program.
  // (makes a static, non-responsive image)
  gl.drawArrays(gl.TRIANGLES,   // drawing primitive. (try gl.LINE_LOOP too!)
                0, 
                12);
  // says to WebGL: draw these vertices held in the currently-bound VBO.

  //---------------Interactive Animation: draw repeatedly
  // Create an endlessly repeated 'tick()' function by this clever method:
  // a)  Declare the 'tick' variable whose value is this function:
  var tick = function() {
    currentAngle = animate(currentAngle);  // Update the rotation angle
    draw(currentAngle, modelMatrix, u_ModelLoc);   // Draw shapes
//    console.log('currentAngle=',currentAngle);
    requestAnimationFrame(tick, myCanvas);   
    									// Request that the browser re-draw the webpage
  };
  // AFTER that, call the function.
  tick();							// start (and continue) animation: 
                      // HOW?  Execution jumps to the 'tick()' function; it
                      // completes each statement inside the curly-braces {}
                      // and then goes on to the next statement.  That next
                      // statement calls 'tick()'--thus an infinite loop!

}     

function initVertexBuffer() {
//==============================================================================
	var c30 = Math.sqrt(0.75);					// == cos(30deg) == sqrt(3) / 2
	var sq2	= Math.sqrt(2.0);						 

  var colorShapes = new Float32Array([
  // Vertex coordinates(x,y,z,w) and color (R,G,B) for a color tetrahedron:
	//		Apex on +z axis; equilateral triangle base at z=0
/*	Nodes:  (a 'node' is a 3D location where we specify 1 or more vertices)
		 0.0,	 0.0, sq2, 1.0,			1.0, 	1.0,	1.0,	// Node 0 (apex, +z axis;  white)
     c30, -0.5, 0.0, 1.0, 		0.0,  0.0,  1.0, 	// Node 1 (base: lower rt; red)
     0.0,  1.0, 0.0, 1.0,  		1.0,  0.0,  0.0,	// Node 2 (base: +y axis;  grn)
    -c30, -0.5, 0.0, 1.0, 		0.0,  1.0,  0.0, 	// Node 3 (base:lower lft; blue)

  Build tetrahedron from individual triangles (gl.TRIANGLES); each triangle
  requires us to specify 3 vertices in CCW order.  
*/
			// Face 0: (left side)
     0.0,	 0.0, sq2, 1.0,			1.0, 	0.0,	0.0,	// Node 0
     c30, -0.5, 0.0, 1.0, 		1.0,  0.0,  0.0, 	// Node 1
     0.0,  1.0, 0.0, 1.0,  		1.0,  0.0,  0.0,	// Node 2
			// Face 1: (right side)
		 0.0,	 0.0, sq2, 1.0,			1.0, 	1.0,	1.0,	// Node 0
     0.0,  1.0, 0.0, 1.0,  		1.0,  0.0,  0.0,	// Node 2
    -c30, -0.5, 0.0, 1.0, 		0.0,  1.0,  0.0, 	// Node 3
    	// Face 2: (lower side)
		 0.0,	 0.0, sq2, 1.0,			1.0, 	1.0,	1.0,	// Node 0 
    -c30, -0.5, 0.0, 1.0, 		0.0,  1.0,  0.0, 	// Node 3
     c30, -0.5, 0.0, 1.0, 		0.0,  0.0,  1.0, 	// Node 1 
     	// Face 3: (base side)  
    -c30, -0.5, 0.0, 1.0, 		0.0,  1.0,  0.0, 	// Node 3
     0.0,  1.0, 0.0, 1.0,  	1.0,  0.0,  0.0,	// Node 2
     c30, -0.5, 0.0, 1.0, 		0.0,  0.0,  1.0, 	// Node 1
 
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
     1.0, -1.0, -1.0, 1.0,		1.0, 0.0, 0.0,	// Node 3
     1.0,  1.0, -1.0, 1.0,		1.0, 0.0, 0.0,	// Node 2
     1.0,  1.0,  1.0, 1.0,	  1.0, 0.0, 0.0,  // Node 4
     
     1.0,  1.0,  1.0, 1.0,	  1.0, 0.1, 0.1,	// Node 4
     1.0, -1.0,  1.0, 1.0,	  1.0, 0.1, 0.1,	// Node 7
     1.0, -1.0, -1.0, 1.0,	  1.0, 0.1, 0.1,	// Node 3

		// +y face: GREEN
    -1.0,  1.0, -1.0, 1.0,	  0.0, 1.0, 0.0,	// Node 1
    -1.0,  1.0,  1.0, 1.0,	  0.0, 1.0, 0.0,	// Node 5
     1.0,  1.0,  1.0, 1.0,	  0.0, 1.0, 0.0,	// Node 4

     1.0,  1.0,  1.0, 1.0,	  0.1, 1.0, 0.1,	// Node 4
     1.0,  1.0, -1.0, 1.0,	  0.1, 1.0, 0.1,	// Node 2 
    -1.0,  1.0, -1.0, 1.0,	  0.1, 1.0, 0.1,	// Node 1

		// +z face: BLUE
    -1.0,  1.0,  1.0, 1.0,	  0.0, 0.0, 1.0,	// Node 5
    -1.0, -1.0,  1.0, 1.0,	  0.0, 0.0, 1.0,	// Node 6
     1.0, -1.0,  1.0, 1.0,	  0.0, 0.0, 1.0,	// Node 7

     1.0, -1.0,  1.0, 1.0,	  0.1, 0.1, 1.0,	// Node 7
     1.0,  1.0,  1.0, 1.0,	  0.1, 0.1, 1.0,	// Node 4
    -1.0,  1.0,  1.0, 1.0,	  0.1, 0.1, 1.0,	// Node 5

		// -x face: CYAN
    -1.0, -1.0,  1.0, 1.0,	  0.0, 1.0, 1.0,	// Node 6	
    -1.0,  1.0,  1.0, 1.0,	  0.0, 1.0, 1.0,	// Node 5 
    -1.0,  1.0, -1.0, 1.0,	  0.0, 1.0, 1.0,	// Node 1
    
    -1.0,  1.0, -1.0, 1.0,	  0.1, 1.0, 1.0,	// Node 1
    -1.0, -1.0, -1.0, 1.0,	  0.1, 1.0, 1.0,	// Node 0  
    -1.0, -1.0,  1.0, 1.0,	  0.1, 1.0, 1.0,	// Node 6  
    
		// -y face: MAGENTA
     1.0, -1.0, -1.0, 1.0,	  1.0, 0.0, 1.0,	// Node 3
     1.0, -1.0,  1.0, 1.0,	  1.0, 0.0, 1.0,	// Node 7
    -1.0, -1.0,  1.0, 1.0,	  1.0, 0.0, 1.0,	// Node 6

    -1.0, -1.0,  1.0, 1.0,	  1.0, 0.1, 1.0,	// Node 6
    -1.0, -1.0, -1.0, 1.0,	  1.0, 0.1, 1.0,	// Node 0
     1.0, -1.0, -1.0, 1.0,	  1.0, 0.1, 1.0,	// Node 3

     // -z face: YELLOW
     1.0,  1.0, -1.0, 1.0,	  1.0, 1.0, 0.0,	// Node 2
     1.0, -1.0, -1.0, 1.0,	  1.0, 1.0, 0.0,	// Node 3
    -1.0, -1.0, -1.0, 1.0,	  1.0, 1.0, 0.0,	// Node 0		

    -1.0, -1.0, -1.0, 1.0,	  1.0, 1.0, 0.1,	// Node 0
    -1.0,  1.0, -1.0, 1.0,	  1.0, 1.0, 0.1,	// Node 1
     1.0,  1.0, -1.0, 1.0,	  1.0, 1.0, 0.1,	// Node 2
 
  ]);
  var nn = 48;		// 12 tetrahedron vertices; 36 cube verts (6 per side*6 sides)
	
  // Create a buffer object
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

  var FSIZE = colorShapes.BYTES_PER_ELEMENT; // how many bytes per stored value?
  
  // Connect a VBO Attribute to Shaders------------------------------------------
  //Get GPU's handle for our Vertex Shader's position-input variable: 
  var a_PositionLoc = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_PositionLoc < 0) {
    console.log('Failed to get attribute storage location of a_Position');
    return -1;
  }
  // Use handle to specify how to Vertex Shader retrieves position data from VBO:
  gl.vertexAttribPointer(
  		a_PositionLoc, 	// choose Vertex Shader attribute to fill with data
  		4, 						// how many values? 1,2,3 or 4.  (we're using x,y,z,w)
  		gl.FLOAT, 		// data type for each value: usually gl.FLOAT
  		false, 				// did we supply fixed-point data AND it needs normalizing?
  		FSIZE * 7, 		// Stride -- how many bytes used to store each vertex?
  									// (x,y,z,w, r,g,b) * bytes/value
  		0);						// Offset -- now many bytes from START of buffer to the
  									// value we will actually use?
  gl.enableVertexAttribArray(a_PositionLoc);  
  									// Enable assignment of vertex buffer object's position data
//-----------done.
// Connect a VBO Attribute to Shaders-------------------------------------------
  // Get graphics system's handle for our Vertex Shader's color-input variable;
  var a_ColorLoc = gl.getAttribLocation(gl.program, 'a_Color');
  if(a_ColorLoc < 0) {
    console.log('Failed to get the attribute storage location of a_Color');
    return -1;
  }
  // Use handle to specify how Vertex Shader retrieves color data from our VBO:
  gl.vertexAttribPointer(
  	a_ColorLoc, 				// choose Vertex Shader attribute to fill with data
  	3, 							// how many values? 1,2,3 or 4. (we're using R,G,B)
  	gl.FLOAT, 			// data type for each value: usually gl.FLOAT
  	false, 					// did we supply fixed-point data AND it needs normalizing?
  	FSIZE * 7, 			// Stride -- how many bytes used to store each vertex?
  									// (x,y,z,w, r,g,b) * bytes/value
  	FSIZE * 4);			// Offset -- how many bytes from START of buffer to the
  									// value we will actually use?  Need to skip over x,y,z,w 									
  gl.enableVertexAttribArray(a_ColorLoc);  
  									// Enable assignment of vertex buffer object's position data
//-----------done.
  // UNBIND the buffer object: we have filled the VBO & connected its attributes
  // to our shader, so no more modifications needed.
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return nn;
}

function draw(currentAngle, modelMatrix, u_ModelLoc) {
//==============================================================================
  // Clear <canvas>  colors AND the depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  //-------Draw Spinning Tetrahedron
  modelMatrix.setTranslate(-0.4,-0.4, 0.0);  // 'set' means DISCARD old matrix,
  						// (drawing axes centered in CVV), and then make new
  						// drawing axes moved to the lower-left corner of CVV. 
  modelMatrix.scale(1,1,-1);							// convert to left-handed coord sys
  																				// to match WebGL display canvas.
  modelMatrix.scale(0.5, 0.5, 0.5);
  						// if you DON'T scale, tetra goes outside the CVV; clipped!
  modelMatrix.rotate(currentAngle, 0, 1, 0);  // Make new drawing axes that
  // modelMatrix.rotate(90.0, 0,1,0);
  						// that spin around y axis (0,1,0) of the previous 
  						// drawing axes, using the same origin.

  // DRAW TETRA:  Use this matrix to transform & draw 
  //						the first set of vertices stored in our VBO:
  		// Pass our current matrix to the vertex shaders:
  gl.uniformMatrix4fv(u_ModelLoc, false, modelMatrix.elements);
  		// Draw just the first set of vertices: start at vertex 0...
  gl.drawArrays(gl.TRIANGLES, 0, 12);
//  gl.drawArrays(gl.LINE_LOOP, 0, 12);   // TRY THIS INSTEAD of gl.TRIANGLES... 
  
  // NEXT, create different drawing axes, and...
  modelMatrix.setTranslate(0.4, 0.4, 0.0);  // 'set' means DISCARD old matrix,
  						// (drawing axes centered in CVV), and then make new
  						// drawing axes moved to the lower-left corner of CVV.
  modelMatrix.scale(1,1,-1);							// convert to left-handed coord sys
  																				// due to lack of projection matrix
  modelMatrix.scale(0.3, 0.3, 0.3);
  						// Make it smaller:
  modelMatrix.rotate(currentAngle, 1, 1, 0);  // Spin on XY diagonal axis
	// DRAW CUBE:		Use ths matrix to transform & draw
	//						the second set of vertices stored in our VBO:
  gl.uniformMatrix4fv(u_ModelLoc, false, modelMatrix.elements);
  		// Draw just the first set of vertices: start at vertex SHAPE_0_SIZE
  gl.drawArrays(gl.TRIANGLES,           // draw triangles from verts in VBO
                12,                     // start at vertex 12,
                36);                    // and draw exactly 36 vertices.
}

// Last time that this function was called:  (used for animation timing)
var g_last = Date.now();

function animate(angle) {
//==============================================================================
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;
  
  // Update the current rotation angle (adjusted by the elapsed time)
  //  limit the angle to move smoothly between +20 and -85 degrees:
//  if(angle >  120.0 && ANGLE_STEP > 0) ANGLE_STEP = -ANGLE_STEP;
//  if(angle < -120.0 && ANGLE_STEP < 0) ANGLE_STEP = -ANGLE_STEP;
  
  var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
  return newAngle %= 360;
}

//==================HTML Button Callbacks
function spinUp() {
  ANGLE_STEP += 25; 
}

function spinDown() {
 ANGLE_STEP -= 25; 
}

function runStop() {
  if(ANGLE_STEP*ANGLE_STEP > 1) {
    myTmp = ANGLE_STEP;
    ANGLE_STEP = 0;
  }
  else {
  	ANGLE_STEP = myTmp;
  }
}
 