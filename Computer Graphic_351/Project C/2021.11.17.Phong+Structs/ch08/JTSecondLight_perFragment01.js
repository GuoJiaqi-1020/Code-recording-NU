//23456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
//
// PointLightedSphere_perFragment.js (c) 2012 matsuda and kanda
// MODIFIED for EECS 351-1, Northwestern Univ. Jack Tumblin:
//
//		GOAL: Complete the Blinn-Phong lighting model: add emissive and specular:
//		--Ke, Ka, Kd, Ks: K==Reflectance; emissive, ambient, diffuse, specular.
//		--Kshiny: specular exponent for 'shinyness'.
//		--Ia, Id, Is:		I==Illumination:          ambient, diffuse, specular.
//		-- Implemented Blinn-Phong 'half-angle' specular term (from class)
//
//	JTSecondLight_perFragment.js:
//  Version 01: Same as JTPointBlinnPhongSphere_perFragment.js
//	Version 02: add mouse, keyboard callbacks with on-screen display.

//	STILL TO DO:
//			--Re-organize for selectable Phong Materials (see 'materials_Ayerdi.js')
//=============================================================================
// Vertex shader program
//=============================================================================
var VSHADER_SOURCE =
	//-------------ATTRIBUTES: of each vertex, read from our Vertex Buffer Object
  'attribute vec4 a_Position; \n' +		// vertex position (model coord sys)
  'attribute vec4 a_Normal; \n' +			// vertex normal vector (model coord sys)
//  'attribute vec4 a_color;\n' + 		// What would 'per-vertex colors' mean in
										//	in Phong lighting implementation?  disable!
										// (LATER: replace with attrib. for diffuse reflectance?)
	//-------------UNIFORMS: values set from JavaScript before a drawing command.
 	'uniform vec3 u_Kd; \n' +						//	Instead, we'll use this 'uniform' 
													// Phong diffuse reflectance for the entire shape
  'uniform mat4 u_MvpMatrix; \n' +
  'uniform mat4 u_ModelMatrix; \n' + 		// Model matrix
  'uniform mat4 u_NormalMatrix; \n' +  	// Inverse Transpose of ModelMatrix;
  																			// (doesn't distort normal directions)
  
	//-------------VARYING:Vertex Shader values sent per-pixel to Fragment shader:
	'varying vec3 v_Kd; \n' +							// Phong Lighting: diffuse reflectance
																				// (I didn't make per-pixel Ke,Ka,Ks;
																				// we use 'uniform' values instead)
  'varying vec4 v_Position; \n' +				
  'varying vec3 v_Normal; \n' +					// Why Vec3? its not a point, hence w==0
//---------------
  'void main() { \n' +
		// Compute CVV coordinate values from our given vertex. This 'built-in'
		// per-vertex value gets interpolated to set screen position for each pixel.
  '  gl_Position = u_MvpMatrix * a_Position;\n' +
     // Calculate the vertex position & normal vec in the WORLD coordinate system
     // for use as a 'varying' variable: fragment shaders get per-pixel values
     // (interpolated between vertices for our drawing primitive (TRIANGLE)).
  '  v_Position = u_ModelMatrix * a_Position; \n' +
		// 3D surface normal of our vertex, in world coords.  ('varying'--its value
		// gets interpolated (in world coords) for each pixel's fragment shader.
  '  v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
	'	 v_Kd = u_Kd; \n' +		// find per-pixel diffuse reflectance from per-vertex
													// (no per-pixel Ke,Ka, or Ks, but you can do it...)
//	'  v_Kd = vec3(1.0, 1.0, 0.0); \n'	+ // TEST; fixed at green
  '}\n';

//=============================================================================
// Fragment shader program
//=============================================================================
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  
  // first light source: (YOU write a second one...)
  'uniform vec4 u_Lamp0Pos;\n' + 			// Phong Illum: position
  'uniform vec3 u_Lamp0Amb;\n' +   		// Phong Illum: ambient
  'uniform vec3 u_Lamp0Diff;\n' +     // Phong Illum: diffuse
	'uniform vec3 u_Lamp0Spec;\n' +			// Phong Illum: specular
	
	// first material definition: you write 2nd, 3rd, etc.
  'uniform vec3 u_Ke;\n' +						// Phong Reflectance: emissive
  'uniform vec3 u_Ka;\n' +						// Phong Reflectance: ambient
	// Phong Reflectance: diffuse? -- use v_Kd instead for per-pixel value
  'uniform vec3 u_Ks;\n' +						// Phong Reflectance: specular
//  'uniform int u_Kshiny;\n' +				// Phong Reflectance: 1 < shiny < 200
//	
  'uniform vec4 u_eyePosWorld; \n' + 	// Camera/eye location in world coords.
  
  'varying vec3 v_Normal;\n' +				// Find 3D surface normal at each pix
  'varying vec4 v_Position;\n' +			// pixel's 3D pos too -- in 'world' coords
  'varying vec3 v_Kd;	\n' +						// Find diffuse reflectance K_d per pix
  													// Ambient? Emissive? Specular? almost
  													// NEVER change per-vertex: I use'uniform'

  'void main() { \n' +
     	// Normalize! !!IMPORTANT!! TROUBLE if you don't! 
     	// normals interpolated for each pixel aren't 1.0 in length any more!
	'  vec3 normal = normalize(v_Normal); \n' +
//	'  vec3 normal = v_Normal; \n' +
     	// Calculate the light direction vector, make it unit-length (1.0).
	'  vec3 lightDirection = normalize(u_Lamp0Pos.xyz - v_Position.xyz);\n' +
     	// The dot product of the light direction and the normal
     	// (use max() to discard any negatives from lights below the surface)
     	// (look in GLSL manual: what other functions would help?)
	'  float nDotL = max(dot(lightDirection, normal), 0.0); \n' +
  	 	// The Blinn-Phong lighting model computes the specular term faster 
  	 	// because it replaces the (V*R)^shiny weighting with (H*N)^shiny,
  	 	// where 'halfway' vector H has a direction half-way between L and V"
  	 	// H = norm(norm(V) + norm(L)) 
  	 	// (see http://en.wikipedia.org/wiki/Blinn-Phong_shading_model)
  '  vec3 eyeDirection = normalize(u_eyePosWorld.xyz - v_Position.xyz); \n' +
	'  vec3 H = normalize(lightDirection + eyeDirection); \n' +
	'  float nDotH = max(dot(H, normal), 0.0); \n' +
			// (use max() to discard any negatives from lights below the surface)
			// Apply the 'shininess' exponent K_e:
	'  float e02 = nDotH*nDotH; \n' +
	'  float e04 = e02*e02; \n' +
	'  float e08 = e04*e04; \n' +
	'	 float e16 = e08*e08; \n' +
	'	 float e32 = e16*e16; \n' + 
	'	 float e64 = e32*e32;	\n' +
		// Can you find a better way to do this? SEE GLSL 'pow()'.
     	// Calculate the final color from diffuse reflection and ambient reflection
  '	 vec3 emissive = u_Ke;' +
  '  vec3 ambient = u_Lamp0Amb * u_Ka;\n' +
  '  vec3 diffuse = u_Lamp0Diff * v_Kd * nDotL;\n' +
  '	 vec3 speculr = u_Lamp0Spec * u_Ks * e64;\n' +
  '  gl_FragColor = vec4(emissive + ambient + diffuse + speculr , 1.0);\n' +
//  '  gl_FragColor = vec4(emissive, 1.0);\n' +
//  '  gl_FragColor = vec4(emissive + ambient, 1.0);\n' +
// '  gl_FragColor = vec4(emissive + ambient + diffuse, 1.0);\n' +
//  '  gl_FragColor = vec4(ambient + speculr , 1.0);\n' +
  '}\n';
//=============================================================================
//=============================================================================
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

  // 
  var n = initVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  // Set the clear color and enable the depth test
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  // Get the storage locations of uniform variables: the scene
  var u_eyePosWorld = gl.getUniformLocation(gl.program, 'u_eyePosWorld');
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  var u_MvpMatrix = gl.getUniformLocation(gl.program, 	'u_MvpMatrix');
  var u_NormalMatrix = gl.getUniformLocation(gl.program,'u_NormalMatrix');
  if (!u_ModelMatrix	|| !u_MvpMatrix || !u_NormalMatrix) {
  	console.log('Failed to get matrix storage locations');
  	return;
  	}
	//  ... for Phong light source:
  var u_Lamp0Pos  = gl.getUniformLocation(gl.program, 	'u_Lamp0Pos');
  var u_Lamp0Amb  = gl.getUniformLocation(gl.program, 	'u_Lamp0Amb');
  var u_Lamp0Diff = gl.getUniformLocation(gl.program, 	'u_Lamp0Diff');
  var u_Lamp0Spec	= gl.getUniformLocation(gl.program,		'u_Lamp0Spec');
  if( !u_Lamp0Pos || !u_Lamp0Amb	) {//|| !u_Lamp0Diff	) { // || !u_Lamp0Spec	) {
    console.log('Failed to get the Lamp0 storage locations');
    return;
  }
	// ... for Phong material/reflectance:
	var u_Ke = gl.getUniformLocation(gl.program, 'u_Ke');
	var u_Ka = gl.getUniformLocation(gl.program, 'u_Ka');
	var u_Kd = gl.getUniformLocation(gl.program, 'u_Kd');
	var u_Ks = gl.getUniformLocation(gl.program, 'u_Ks');
//	var u_Kshiny = gl.getUniformLocation(gl.program, 'u_Kshiny');
	
	if(!u_Ke || !u_Ka || !u_Kd 
//		 || !u_Ks || !u_Kshiny
		 ) {
		console.log('Failed to get the Phong Reflectance storage locations');
		return;
	}

  // Position the first light source in World coords: 
  gl.uniform4f(u_Lamp0Pos, 6.0, 6.0, 0.0, 1.0);
	// Set its light output:  
  gl.uniform3f(u_Lamp0Amb,  0.4, 0.4, 0.4);		// ambient
  gl.uniform3f(u_Lamp0Diff, 1.0, 1.0, 1.0);		// diffuse
  gl.uniform3f(u_Lamp0Spec, 1.0, 1.0, 1.0);		// Specular

	// Set the Phong materials' reflectance:
	gl.uniform3f(u_Ke, 0.0, 0.0, 0.0);				// Ke emissive
	gl.uniform3f(u_Ka, 0.6, 0.0, 0.0);				// Ka ambient
  gl.uniform3f(u_Kd, 0.8, 0.0, 0.0);				// Kd	diffuse
	gl.uniform3f(u_Ks, 0.8, 0.8, 0.8);				// Ks specular
//	gl.uniform1i(u_Kshiny, 4);							// Kshiny shinyness exponent
	
  var modelMatrix = new Matrix4();  // Model matrix
  var mvpMatrix = new Matrix4();    // Model view projection matrix
  var normalMatrix = new Matrix4(); // Transformation matrix for normals
	
  // Calculate the model matrix
  modelMatrix.setRotate(90, 0, 1, 0); // Rotate around the y-axis
  // Calculate the view projection matrix
  mvpMatrix.setPerspective(30, canvas.width/canvas.height, 1, 100);
  mvpMatrix.lookAt(	6,  0, 0, 				// eye pos (in world coords)
  									0,  0, 0, 				// aim-point (in world coords)
									  0,  0, 1);				// up (in world coords)
  mvpMatrix.multiply(modelMatrix);
  // Calculate the matrix to transform the normal based on the model matrix
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();

	// Pass the eye position to u_eyePosWorld
	gl.uniform4f(u_eyePosWorld, 6,0,0, 1);
  // Pass the model matrix to u_ModelMatrix
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

  // Pass the model view projection matrix to u_mvpMatrix
  gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

  // Pass the transformation matrix for normals to u_NormalMatrix
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

  // Clear color and depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Draw the cube
  gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_SHORT, 0);

}

function initVertexBuffers(gl) { // Create a sphere
  var SPHERE_DIV = 13;

  var i, ai, si, ci;
  var j, aj, sj, cj;
  var p1, p2;

  var positions = [];
  var indices = [];

  // Generate coordinates
  for (j = 0; j <= SPHERE_DIV; j++) {
    aj = j * Math.PI / SPHERE_DIV;
    sj = Math.sin(aj);
    cj = Math.cos(aj);
    for (i = 0; i <= SPHERE_DIV; i++) {
      ai = i * 2 * Math.PI / SPHERE_DIV;
      si = Math.sin(ai);
      ci = Math.cos(ai);

      positions.push(si * sj);  // X
      positions.push(cj);       // Y
      positions.push(ci * sj);  // Z
    }
  }

  // Generate indices
  for (j = 0; j < SPHERE_DIV; j++) {
    for (i = 0; i < SPHERE_DIV; i++) {
      p1 = j * (SPHERE_DIV+1) + i;
      p2 = p1 + (SPHERE_DIV+1);

      indices.push(p1);
      indices.push(p2);
      indices.push(p1 + 1);

      indices.push(p1 + 1);
      indices.push(p2);
      indices.push(p2 + 1);
    }
  }

  // Write the vertex property to buffers (coordinates and normals)
  // Use the same data for each vertex and its normal because the sphere is
  // centered at the origin, and has radius of 1.0.
  // We create two separate buffers so that you can modify normals if you wish.
  if (!initArrayBuffer(gl, 'a_Position', new Float32Array(positions), gl.FLOAT, 3)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', new Float32Array(positions), gl.FLOAT, 3))  return -1;
  
  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

  return indices.length;
}

function initArrayBuffer(gl, attribute, data, type, num) {
  // Create a buffer object
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  // Assign the buffer object to the attribute variable
  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  if (a_attribute < 0) {
    console.log('Failed to get the storage location of ' + attribute);
    return false;
  }
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute);

  return true;
}
