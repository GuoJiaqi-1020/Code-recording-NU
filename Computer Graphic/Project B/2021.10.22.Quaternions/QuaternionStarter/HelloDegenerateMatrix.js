// HelloPoint1.js (c) 2012 matsuda
// Vertex shader program
/*
// MODIFIED J. Tumblin 1/2017  to make 'HelloMatrixDegen.js'. 
// MODIFIED J. Tumblin 1/2017 to make 'HelloQuaternion.js' 

Simple program to test massively-accumulated irrational rotations.

Nothing interesting happens in the canvas -- it's all in the console!
*/

var VSHADER_SOURCE = 
  'void main() {\n' +
  '  gl_Position = vec4(0.0, 0.0, 0.0, 1.0);\n' + // Set the vertex coordinates of the one and only point
  '  gl_PointSize = 10.0;\n' +                    // Set the point size. CAREFUL! MUST be float, not integer value!!
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  'void main() {\n' +
  '  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n' + // Set the point color
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
  console.log('Hey! we have all our shaders initialized!');

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Draw a point
  gl.drawArrays(gl.POINTS, 0, 1);
	
  //============================================================
	// Lets play around with Matrix4 objects
  //============================================================
  var aMat = new Matrix4();
	aMat.setIdentity();
	var mySiz = 3000;
	var count;
	
	console.log('Rotate aMat by (360/'+mySiz+') degrees\n around the (1,3,5) axis,'+mySiz+' times:');
	for(count = 0; count < mySiz; count++) {
			aMat.rotate(-360.0/mySiz, 1.0, 3.0, 5.0);
		}
		console.log('Result SHOULD be a perfect identity matrix, but it is not:');
		aMat.printMe();
		console.log('Instead, this degenerate matrix accumulated errors that');
		console.log('cause other, unpredictable, non-rotation transforms.  BAD!');
		console.log('THUS you should never use matrix multiplies to combine a');
		console.log('long series of rotations.  Instead, use quaternions.');
		console.log('NOTE: open the .js file and the HTML file; \n Plenty to explore, comment & uncomment!');

	}
