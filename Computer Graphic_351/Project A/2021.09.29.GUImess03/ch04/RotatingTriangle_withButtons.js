// RotatingTranslatedTriangle.js (c) 2012 matsuda
// Vertex shader program..
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'uniform mat4 u_ModelMatrix;\n' +
  'void main() {\n' +
  '  gl_Position = u_ModelMatrix * a_Position;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  'uniform int u_colr;\n' +
  'void main() {\n' +
  '   if(u_colr == 0) {' +
  '       gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n' + // RED if u_colr==0
  '   } else { '+
  '       gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);\n' + // GREEN otherwise
  '   }\n;' +
  '}\n';

// Rotation angle (degrees/second)
var ANGLE_STEP = 45.0;

function main() {
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

  // Write the positions of vertices to a vertex shader
  var n = initVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to set the positions of the vertices');
    return;
  }

  // Specify the color for clearing <canvas>
  gl.clearColor(0, 0, 0, 1);
	// NEW!! Enable 3D depth-test when drawing: don't over-draw at any pixel 
	// unless the new Z value is closer to the eye than the old one..	
	gl.enable(gl.DEPTH_TEST); 
	
  // Get,save GPU storage location of the u_ModelMatrix uniform 
  var u_ModelMatrixLoc = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrixLoc) { 
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }
	// Get,save GPU storage location of the u_color uniform
	var u_colrLoc = gl.getUniformLocation(gl.program, 'u_colr');
	if(!u_colrLoc) {
		console.log('Failed to get the storage location of u_colr');
		return;
		}
  // Current rotation angle
  var currentAngle = 0.0;
  // Create, JS matrix whose values we will send to GPU to set the 'uniform'
  // (a 4x4 matrix in a single var) named u_ModelMatrix
  var modelMatrix = new Matrix4();
	
  // Start drawing
  var tick = function() {
    currentAngle = animate(currentAngle);  // Update the rotation angle
    draw(gl, n, currentAngle, modelMatrix, u_ModelMatrixLoc, u_colrLoc);   
    // Draw the triangle
    requestAnimationFrame(tick, canvas);   // Request that the browser ?calls tick
  };
  tick();
}

function initVertexBuffers(gl) {
  var vertices = new Float32Array ([
    0, 0.5,   -0.5, -0.5,   0.5, -0.5
  ]);
  var n = 3;   // The number of vertices

  // Create a buffer object
  var vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  // Write date into the buffer object
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  // Assign the buffer object to a_Position variable
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if(a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

  // Enable the assignment to a_Position variable
  gl.enableVertexAttribArray(a_Position);

  return n;
}

function draw(gl, n, currentAngle, modelMatrix, u_ModelMatrixLoc, u_colrLoc) {
//==========================================================================
  // Clear <canvas> AND clear the Z-buffer for proper occlusion/depth test.
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

//--------------------RED triangle at Z== -0.5
  // Set the rotation matrix
  modelMatrix.setRotate(currentAngle, 0, 0, 1);
  modelMatrix.translate(0.35, 0, -0.5); // -z is away from eye
 
  // Pass the rotation matrix to the vertex shader
  gl.uniformMatrix4fv(u_ModelMatrixLoc, false, modelMatrix.elements);
	// Pass the 'colr' value  to the fragment shader:
	gl.uniform1i(u_colrLoc, 0);	// set value for RED.

  // Draw the triangle
  gl.drawArrays(gl.TRIANGLES, 0, n);
//--------------------------------  

//---------------------GREEN triangle at Z== +0.5
  modelMatrix.setRotate(-currentAngle, 0, 0, 1);
  modelMatrix.translate(0.35, 0, 0.5);	// +z is towards eye
 
  // Pass the rotation matrix to the vertex shader
  gl.uniformMatrix4fv(u_ModelMatrixLoc, false, modelMatrix.elements);
	// Pass the 'colr' value  to the fragment shader:
	gl.uniform1i(u_colrLoc, 1);	// set value for GREEN.
	
  // Draw the triangle
  gl.drawArrays(gl.TRIANGLES, 0, n);
//--------------------------------

}

// Last time that this function was called:  (used for animation timing)
var g_last = Date.now();

function animate(angle) {
//==========================================================================
// Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;
  // Update the current rotation angle (adjusted by the elapsed time)
  var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
  return newAngle %= 360;
}

function moreCCW() {
  ANGLE_STEP += 10; 
}

function lessCCW() {
  ANGLE_STEP -= 10; 
}
