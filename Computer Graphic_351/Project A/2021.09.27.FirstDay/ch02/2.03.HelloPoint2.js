// HelloPoint2.js (c) 2012 matsuda
//     Transfers JUST ONE attribute (one part of one vertex) to the
// 		'vertex shader program' that runs on MANY processors on the graphics 
//       hardware. 
//		Written in GLSL, 'vertex shader' programs 
//		run once for each vertex of every drawing primitive (point).
//
// Vertex shader program
var VSHADER_SOURCE = 
  'attribute vec4 a_Position;\n' + // attribute variable INSIDE THE VERTEX SHADER
  'void main() {\n' +
  '  gl_Position = a_Position;\n' +
  '  gl_PointSize = 10.0;\n' +
  '}\n'; 

// Fragment shader program
var FSHADER_SOURCE = 
  'void main() {\n' +
  '  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n' +
  '}\n';

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

  // Get the storage location of a_Position
  var a_PositionID = gl.getAttribLocation(gl.program, 'a_Position'); 
  	// TRICKY TRICKY!! This var is in JAVASCRIPT, and *NOT* in Vertex Shader!
  	//
  	// It is ONLY a 'handle or 'address' or 'location' or 'magic number'
  	// that IDENTIFIES the 'a_Position' that exists separately and inside
  	// the Fragment shader. 
  	// We can't set the vertex shader's a_Position values by changing
  	// the JavaScript 'a_Position' value, because they're not part of the
  	// same processor or even the same memory space.
  	//  Instead, we use the JavaScript  a_Position ONLY to tell the
  	// JavaScript gl.vertexAttrib() function how to set a new value
  	// for a Vertex Shader attribute variable. Using JavaScript a_Position as
  	// an arg to the JavaScript gl.vertexAttrib() function will cause the 
  	// to change VERTEX SHADER's attribute variable.
  	// Don't confuse this JavaScript attribute 'handle' with the
  	// Vertex shader's attribute variable that it uniquely identifies!
  	// 
  if (a_PositionID < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Pass the one single vertex position value to shader's attribute variable
  gl.vertexAttrib3f(a_PositionID, 0.3, 0.5, 0.0);
	// NOTE: WebGL draws in a +/-1 cube,
	//	known as the 'CVV' -- the 'canonical view volume'
	//  Any drawing done outside of the CVV will not appear on-screen.
  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
    
  // Draw
  gl.drawArrays(gl.POINTS, 0, 1);
  //
  console.log("Draw once. Bye!");
}
