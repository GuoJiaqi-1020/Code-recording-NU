//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
// (JT: why the numbers? counts columns, helps me keep 80-char-wide listings)
//
// MultiPoint.js (c) 2012 matsuda
// MultiPointJT.js  MODIFIED for EECS 351-1, Northwestern Univ. Jack Tumblin
//						(converted to 2D->4D; 3 verts --> 6 verts; draw as
//						gl.POINTS and as gl.LINE_LOOP, change color.
//
// Vertex shader program.  
//  Each instance computes all the on-screen attributes for just one VERTEX,
//  specifying that vertex so that it can be used as part of a drawing primitive
//  depicted in the CVV coord. system (+/-1, +/-1, +/-1) that fills our HTML5
//  'canvas' object.
// Each time the shader program runs it gets info for just one vertex from our 
//	Vertex Buffer Object (VBO); specifically, the value of its 'attribute' 
// variable a_Position, is supplied by the VBO.
// 
//   CHALLENGE: Change the program to get different pictures. 
//	See if you can:
//	EASY:
//    --change the background color?
//		--change the dot positions? 
//		--change the size of the dots?
//    --change the color of the dots-and-lines?
//	HARDER: (HINT: read about 'uniform' vars in your textbook...)
//    --change the number of dots?
//    --get all dots in one color, and all lines in another color?
//    --set each dot color individually? (what happens to the line colors?)

var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'uniform mat4 u_ModelMatrix;\n' +
  'attribute vec4 a_Color;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = u_ModelMatrix * a_Position;\n' +
  '  gl_PointSize = 10.0;\n' +
  '  v_Color = a_Color;\n' +
  '}\n';

// Fragment shader program
//  Each instance computes all the on-screen attributes for just one PIXEL
var FSHADER_SOURCE =
  'precision mediump float;\n' +
//  '#endif GL_ES\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  'gl_FragColor = v_Color;\n' +
  '}\n';


var ANGLE_STEP = 45.0;

function main() {
//==============================================================================
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
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

  // Write buffer full of vertices to the GPU, and make it available to shaders
  var n = initVertexBuffers(gl);	
  if (n < 0) {
    console.log('Failed to load vertices into the GPU');
    return;
  }

  // Specify the color for clearing <canvas>: (Northwestern purple)
  gl.clearColor(78/255, 90/255, 132/255 , 1.0);	// R,G,B,A (A==opacity)
 
 
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) { 
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }
 
  var currentAngle = 0.0;
  // Model matrix
  var modelMatrix = new Matrix4();
  var tick = function() {
    currentAngle = animate(currentAngle);  // Update the rotation angle
    draw(gl, n, currentAngle, modelMatrix, u_ModelMatrix);   // Draw the triangle
    requestAnimationFrame(tick, canvas);   // Request that the browser ?calls tick
  };
  tick();
}



function draw(gl, n, currentAngle, modelMatrix, u_ModelMatrix){
  gl.clear(gl.COLOR_BUFFER_BIT);
  modelMatrix.setTranslate(-0.45,0.0, 0);
  modelMatrix.scale(0.4,0.4,0.4)
  modelMatrix.rotate(currentAngle, 1, 0, 1)
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawArrays(gl.LINE_LOOP, 0, n); // gl.drawArrays(mode, first, count)
  gl.drawArrays(gl.POINTS, 0, n); // gl.drawArrays(mode, first, count)
}



function initVertexBuffers(gl) {
//==============================================================================
// first, create an array with all our vertex attribute values:
var vertices = new Float32Array([
   1.00, 1.00, 1.00, 1.0,     1.0, 	0.0,	0.3,
   2.00, 1.00, 1.00, 1.0,     0.0,  1.0,  1.0,
   1.00, 2.00, 1.00, 1.0,     0.6,  0.0,  1.0,
   1.00, 1.00, 2.00, 1.0,     0.5,  0.0,  1.0,


   1.00, 1.00, 1.00, 1.0,     1.0, 	0.6,	1.0,
   1.00, 2.00, 1.00, 1.0,     0.0,  1.0,  0.0,

   2.00, 1.00, 1.00, 1.0,     1.0,  0.0,  0.5,
   1.00, 1.00, 2.00, 1.0,     0.0,  1.0,  0.0,
   ]);
var n = 8

  // var vertices = new Float32Array([
  //    0.0,  0.5, 0.0,  1.0,	// CAREFUL! I made these into 4D points/ vertices: x,y,z,w.
  //   -0.16, 0.15, 0.0, 1.0,	// new point!  (? What happens if I make w=0 instead of 1.0?)
  //   -0.65, 0.1, 0.0,  1.0,
  //   -0.3,  -0.1, 0.0, 1.0,
  //   -0.5,  -0.5, 0.0, 1.0,   
  //   -0.0,  -0.2, 0.0, 1.0, 	// new point!
  //    0.5,  -0.5, 0.0, 1.0,
  //    0.3,  -0.1, 0.0, 1.0,//
  //    0.65,  0.1, 0.0, 1.0,
  //    0.16,  0.15, 0.0, 1.0, 	// new point!  (note we need a trailing comma here)
  // ]);
  // var n = 10; // The number of vertices


  // Then in the Graphics hardware, create a vertex buffer object (VBO)
  var vertexBuffer = gl.createBuffer();	// get it's 'handle'
  if (!vertexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  // COPY data from our 'vertices' array into the vertex buffer object in GPU:
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  var FSIZE = vertices.BYTES_PER_ELEMENT;


  var a_PositionID = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_PositionID < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  // Assign the buffer object to a_Position variable
  gl.vertexAttribPointer(a_PositionID, 4, gl.FLOAT, false, FSIZE * 7, 0);
  // vertexAttributePointer(index, x,y,z,w size=4, type=FLOAT, 
  // NOT normalized, NO stride)

  // Enable the assignment to a_Position variable
  gl.enableVertexAttribArray(a_PositionID);

  var a_ColorLoc = gl.getAttribLocation(gl.program, 'a_Color');
  if(a_ColorLoc < 0) {
    console.log('Failed to get the attribute storage location of a_Color');
    return -1;
  }

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
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return n;
}


var g_last = Date.now()

function animate(angle) {
  //==============================================================================
    // Calculate the elapsed time

    var now = Date.now();
    var elapsed = now - g_last;
    g_last = now;
    
    // Update the current rotation angle (adjusted by the elapsed time)
    //  limit the angle to move smoothly between +20 and -85 degrees:
    // if(angle >   180.0 && ANGLE_STEP > 0) ANGLE_STEP = -ANGLE_STEP;
    // if(angle <  -180.0 && ANGLE_STEP < 0) ANGLE_STEP = -ANGLE_STEP;
    
    if (ANGLE_STEP <=0){
      ANGLE_STEP = 0
    }
      
    var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
    return newAngle %= 360;
  }
  

function moreCCW() {
  //==============================================================================
    ANGLE_STEP += 10; 
  }
  
function lessCCW() {
  //==============================================================================
    ANGLE_STEP -= 10; 
  }
  