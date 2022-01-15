//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
// (JT: why the numbers? counts columns, helps me keep 80-char-wide listings)
//
// Chapter 7: HelloCube.js (c) 2012 matsuda
// became:
//
// HelloCube_Resize.js  MODIFIED for EECS 351-1, 
//									Northwestern Univ. Jack Tumblin
//		--replaced cuon-matrix.js library with cuon-matrix-quat.js library
//				(has push-down stack and quaternions, demonstrated in 
//				starter code  '5.04jt.ControlQuaternion.html'
//		--resize 'g_canvas' to fill top 3/4 of browser window's available space
//		--demonstrate multiple viewports (see 'gl.viewport()' functions
//		--Adjust camera aspect ratios to match viewport aspect ratios
//
//	1/2017 J. Tumblin fix:
//		--moved 'draw()' command inside drawResize() to ensure initial on-screen
//			result is correct, as well as re-drawing when browser gets re-sized.
// 11/2019 J. Tumblin fix:
//    --Drop fcn args, create global vars for gl, g_canvas, g_mvpMatrix, etc.
//    --GLOBAL search/replace: gl.drawingBufferHeight -->  g_canvas.height
//                             gl.drawingBufferWidth  -->  g_canvas.width
//      (Why? drawingBufferHeight is read-only, *current* gl buffer size;
//        instead, use the new canvas size we must fill(g_canvas.height, width).
//            
//------------------------------------------------------------------------------

// Vertex shader program:
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'uniform mat4 u_MvpMatrix;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = u_MvpMatrix * a_Position;\n' +
  '  v_Color = a_Color;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';

//Global vars (so we can call draw() and other fcns without arguments)
//==============================================================================
// (later: organize these in one (or a few) global JS object...

var gl;                 // WebGL rendering context
var g_canvas = document.getElementById('webgl');  // Retrieve HTML <canvas> element
var g_mvpMatrix = new Matrix4();  // model-view-projection matrix (for 3D camera view)
var g_mvpMatrixLoc;     // GPU location for the u_mvpMatrix uniform var
var g_vertCount = 0;    // # of vertices to draw

function main() {
//==============================================================================
  // Get the rendering context for WebGL; 
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

  // Set up the vertices, colors, and vertex-indices; set the g_vertCount value.
  initVertexBuffers();
  if (g_vertCount < 0) {
    console.log('Failed to send vertex info to GPU (set up, fill VBO) ');
    return;
  }

  // Set clear color and enable hidden surface removal
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  // Get the GPU storage location for the u_mvpMatrix uniform
  g_mvpMatrixLoc = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
  if (!g_mvpMatrixLoc) { 
    console.log('Failed to get GPU storage location of u_MvpMatrix');
    return;
  }
	// Draw our canvas, re-sized to current browser-window 'inner' drawing area
  drawResize();   
  // All subsequent screen re-drawing is done when user re-sizes the browser,
  // which is  done by this line in the HTML file:
  //         <body onload="main()" onresize="drawResize()">
  
  // CHALLENGE:  Suppose we draw something ANIMATED (e.g. BasicShapes);
  //						How can you do this double-call when the program starts, but
  //						call drawResize() only once for all subsequent re-drawing?
}

function initVertexBuffers() {
//==============================================================================
  // Create a cube
  //    v6----- v5
  //   /|      /|
  //  v1------v0|
  //  | |     | |
  //  | |v7---|-|v4
  //  |/      |/
  //  v2------v3
  var verticesColors = new Float32Array([
    // Vertex coordinates and color
     1.0,  1.0,  1.0,     1.0,  1.0,  1.0,  // v0 White
    -1.0,  1.0,  1.0,     1.0,  0.0,  1.0,  // v1 Magenta
    -1.0, -1.0,  1.0,     1.0,  0.0,  0.0,  // v2 Red
     1.0, -1.0,  1.0,     1.0,  1.0,  0.0,  // v3 Yellow
     1.0, -1.0, -1.0,     0.0,  1.0,  0.0,  // v4 Green
     1.0,  1.0, -1.0,     0.0,  1.0,  1.0,  // v5 Cyan
    -1.0,  1.0, -1.0,     0.0,  0.0,  1.0,  // v6 Blue
    -1.0, -1.0, -1.0,     0.0,  0.0,  0.0   // v7 Black
  ]);

  // Indices of the vertices
  var indices = new Uint8Array([
    0, 1, 2,   0, 2, 3,    // front
    0, 3, 4,   0, 4, 5,    // right
    0, 5, 6,   0, 6, 1,    // up
    1, 6, 7,   1, 7, 2,    // left
    7, 4, 3,   7, 3, 2,    // down
    4, 7, 6,   4, 6, 5     // back
 ]);

  // Create a VBO and vertex-index array: get their locations in GPU:
  var vertexColorBufferLoc = gl.createBuffer();
  var indexBufferLoc = gl.createBuffer();
  if (!vertexColorBufferLoc || !indexBufferLoc) {
    return -1;
  }

  // Write the vertex coordinates and color to the vertex buffer object (VBO)
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBufferLoc);
  gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

  var FSIZE = verticesColors.BYTES_PER_ELEMENT;
  // Assign the buffer object to a_Position attribute & enable assignment in GPU
  var a_PositionLoc = gl.getAttribLocation(gl.program, 'a_Position');
  if(a_PositionLoc < 0) {
    console.log('Failed to get GPU storage location of a_Position');
    return -1;
  }
  gl.vertexAttribPointer(a_PositionLoc, 3, gl.FLOAT, false, FSIZE * 6, 0);
  gl.enableVertexAttribArray(a_PositionLoc);
  // Assign the buffer object to a_Color attribute & enable assignment in GPU
  var a_ColorLoc = gl.getAttribLocation(gl.program, 'a_Color');
  if(a_ColorLoc < 0) {
    console.log('Failed to get GPU storage location of a_Color');
    return -1;
  }
  gl.vertexAttribPointer(a_ColorLoc, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3);
  gl.enableVertexAttribArray(a_ColorLoc);

  // Write the indices to the buffer object
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBufferLoc);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  g_vertCount = indices.length;  // number of vertices to draw
}

function draw() {
//==============================================================================
// re-draw contents of all viewports.

  // Clear color and depth buffer for ENTIRE GPU drawing buffer:
  // (careful! clears contents of ALL viewports!)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
	//----------------------Create, fill UPPER viewport------------------------
	gl.viewport(0,											// Viewport lower-left corner
							g_canvas.height/2, 			// location(in pixels)
  						g_canvas.width, 				// viewport width,
  						g_canvas.height/2);			// viewport height in pixels.

	var vpAspect = g_canvas.width /			// On-screen aspect ratio for
								(g_canvas.height/2);	// this camera: width/height.

  // For this viewport, set camera's eye point and the viewing volume:
  g_mvpMatrix.setPerspective(30,			// fovy: y-axis field-of-view in degrees 	
  																		// (top <-> bottom in view frustum)
  													vpAspect, // aspect ratio: width/height
  													1, 100);	// near, far (always >0).
  g_mvpMatrix.lookAt(	3, 3, 7, 				// 'Center' or 'Eye Point',
  									0, 0, 0, 					// look-At point,
  									0, 1, 0);					// View UP vector, all in 'world' coords.

  // Pass the model view projection matrix to graphics hardware thru u_MvpMatrix
  gl.uniformMatrix4fv(g_mvpMatrixLoc, false, g_mvpMatrix.elements);
  // Draw the cube
  gl.drawElements(gl.TRIANGLES, g_vertCount, gl.UNSIGNED_BYTE, 0);
  
	//----------------------Create, fill LOWER viewport------------------------
	gl.viewport(0,											 	// Viewport lower-left corner
							0, 												// location(in pixels)
  						g_canvas.width, 					// viewport width,
  						g_canvas.height/2);			  // viewport height in pixels.

	vpAspect = g_canvas.width /					  // On-screen aspect ratio for
						(g_canvas.height/2);				// this camera: width/height.

  // For this viewport, set camera's eye point and the viewing volume:
  g_mvpMatrix.setPerspective(24.0, 		// fovy: y-axis field-of-view in degrees 	
  																		// (top <-> bottom in view frustum)
  													vpAspect, // aspect ratio: width/height
  													1, 100);	// near, far (always >0).
  g_mvpMatrix.lookAt(	4, 2, 8, 				// 'Center' or 'Eye Point',
  									  0, 0, 0, 				// look-At point,
  									  0, 1, 0);				// View UP vector, all in 'world' coords.

  // Pass the model view projection matrix to graphics hardware thru u_MvpMatrix
  gl.uniformMatrix4fv(g_mvpMatrixLoc, false, g_mvpMatrix.elements);
  // Draw the cube
  gl.drawElements(gl.TRIANGLES, g_vertCount, gl.UNSIGNED_BYTE, 0);
}

function drawResize() {
//==============================================================================
// Called when user re-sizes their browser window , because our HTML file
// contains:  <body onload="main()" onresize="winResize()">

	//Report our current browser-window contents:

	console.log('g_Canvas width,height=', g_canvas.width, g_canvas.height);		
 console.log('Browser window: innerWidth,innerHeight=', 
																innerWidth, innerHeight);	
																// http://www.w3schools.com/jsref/obj_window.asp

	
	//Make canvas fill the top 3/4 of our browser window:
	var xtraMargin = 16;    // keep a margin (otherwise, browser adds scroll-bars)
	g_canvas.width = innerWidth - xtraMargin;
	g_canvas.height = (innerHeight*3/4) - xtraMargin;
	// IMPORTANT!  Need a fresh drawing in the re-sized viewports.
	draw();				// draw in all viewports.
}
