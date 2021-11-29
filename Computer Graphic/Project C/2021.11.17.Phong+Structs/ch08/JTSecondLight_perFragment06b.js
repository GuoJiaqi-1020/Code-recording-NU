//23456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
//
// PointLightedSphere_perFragment.js (c) 2012 matsuda and kanda
// MODIFIED for EECS 351-1, Northwestern Univ. Jack Tumblin:
//
//		Completed the Blinn-Phong lighting model: add emissive and specular:
//		--Ke, Ka, Kd, Ks: K==Reflectance; emissive, ambient, diffuse, specular.
//		--Kshiny: specular exponent for 'shinyness'.
//		--Ia, Id, Is:		I==Illumination:          ambient, diffuse, specular.
//		-- Implemented Blinn-Phong 'half-angle' specular term (from class)
//
//	JTSecondLight_perFragment.js:
//  Version 01: Same as JTPointBlinnPhongSphere_perFragment.js
//	Version 02: add mouse, keyboard callbacks with on-screen display.
//	Version 03: add 'draw()' function (ugly!) to call whenever we need to 
//							re-draw the screen (e.g. after mouse-drag). Convert all 'handles'
//							for GPU storage locations (supplied by gl.getUniformLocation() 
//							to GLOBAL vars to prevent large argument lists for the draw() 
//							fcn.  Apply K_shiny uniform in GLSL using pow() fcn; test it
//							with K_shiny values of 10 and 100.
//	Version 04: eliminate arguments to 'draw()' function by converting them to
//							'global' variables; then we can call 'draw()' from any fcn.  
//							In keypress() fcn, make s/S keys decrease/increase K_shiny by 1
//							and call the 'draw()' function to show result on-screen. 
//							Add JavaScript global variables for existing lamp0 uniforms;
//							(Temporarily) use mouse-drag to modify lamp0 position & redraw;
//							and make 'clear' button re-set the lamp0 position.
//							Note how AWKWARDLY mouse-dragging moved the light: can we fix it?
//	Version 05: YES! first, lets' understand what we see on-screen:
//						--Prev. versions set Camera position to (6,0,0) in world coords,  
//							(eyeWorldPos[] value set in main()), aimed at origin, 'up'==+z.
//							THUS camera's x,y axes are aligned with world-space y,z axes! 
//						--Prev. versions set lamp0Pos[] to world coords (6,6,0) in main(),
//							thus it's on-screen location is center-right.  Our mouseDrag() 
//							code causes left/right drag to adjust lamp0 +/-x in world space, 
//							(towards/away from camera), and up/down drag adjusts lamp0 +/-y 
//							(left/right on-screen). No wonder the result looks weird!
//							FIX IT: change mouseDrag() to map x,y drags to lamp0 y,z values
//								instead of x,y.  We will keep x value fixed at +6, so that
//								mouse-drags move lamp0 in the same yz plane as the camera.
//								ALSO -- change lamp0 position to better-looking (6,5,5). 
//								(don't forget HTML button handler 'clearDrag()' fcn below).
//				PUZZLE:  What limits specular highlight to 45deg from world +x axis? 
//								 How could you fix that?
//	Version 06: Create GLSL struct 'LampT' & prove we can use it as a uniform
//							that affects Vertex Shader's on-screen result (see version0 6a)
//							In Fragment shader, create a 1-element array of 'LampT' structs 
//							and use it to replace the uniforms for 'lamp0' (see version 06b)
//
//  Wed Mar 7 2018 in-class activity:
//	Version 06: Step 1 to remove Global variables by object-oriented design;
//							LET US TRY IT!   Organize collections of objects: 
//							--Best way to create a JavaScript 'Lamp' object?
//							--Best way to transfer contents to GLSL? GLSL 'Lamp' struct?
// (try: https://www.opengl.org/wiki/Uniform_%28GLSL%29 
//							--find 'struct Thingy', note how uniforms set struct contents
//								in sequential locations, and/or fill them as arrays...
// (try: http://wiki.lwjgl.org/wiki/GLSL_Tutorial:_Communicating_with_Shaders)
//
//	STILL TO DO:
//							--add direction/spotlight mode (Lengyel, Section 7.2.4 pg. 160)
//							by adding a 'look-at' point member.
//							--add a user-interface to aim the spotlight ('glass cylinder'?) 
//							--add a new light that recreates the Version 01 light at (6,6,0).
//							--add user-interface to (fixed) light at (6,6,0).  How shall we 
//							organize MULTIPLE lights (up to 8?) by object-oriented methods?

//			--Re-organize for selectable Phong Materials (see 'materials_Ayerdi.js')
//			--Further object-oriented re-organizing: can we make objects for 
//				User-Interface? Shapes? Textures? Camera? Animation? can we fit them 
//				inside a Scene object? etc

//=============================================================================
// Vertex shader program
//=============================================================================
var VSHADER_SOURCE =
	//-------------Set precision.
	// GLSL-ES 2.0 defaults (from spec; '4.5.3 Default Precision Qualifiers'):
	// DEFAULT for Vertex Shaders: 	precision highp float; precision highp int;
	//									precision lowp sampler2D; precision lowp samplerCube;
	// DEFAULT for Fragment Shaders:  UNDEFINED for float; precision mediump int;
	//									precision lowp sampler2D;	precision lowp samplerCube;
																		
	//-------------ATTRIBUTES of each vertex, read from our Vertex Buffer Object
  'attribute vec4 a_Position; \n' +		// vertex position (model coord sys)
  'attribute vec4 a_Normal; \n' +			// vertex normal vector (model coord sys)

										
	//-------------UNIFORMS: values set from JavaScript before a drawing command.
 	'uniform vec3 u_Kd; \n' +						// Phong diffuse reflectance for the 
 																			// entire shape
  'uniform int u_Kshiny;\n' +				// Phong Reflectance Exponent: 1 to 128
  'uniform mat4 u_MvpMatrix; \n' +
  'uniform mat4 u_ModelMatrix; \n' + 		// Model matrix
  'uniform mat4 u_NormalMatrix; \n' +  	// Inverse Transpose of ModelMatrix;
  																			// (won't distort normal vec directions
  																			// but it usually WILL change its length)
  
	//-------------VARYING:Vertex Shader values sent per-pixel to Fragment shader:
	'varying vec3 v_Kd; \n' +							// Phong Lighting: diffuse reflectance
																				// (I didn't make per-pixel Ke,Ka,Ks;
																				// we use 'uniform' values instead)
  'varying vec4 v_Position; \n' +				
  'varying vec3 v_Normal; \n' +					// Why Vec3? its not a point, hence w==0
	//-----------------------------------------------------------------------------
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
	//-------------Set precision.
	// GLSL-ES 2.0 defaults (from spec; '4.5.3 Default Precision Qualifiers'):
	// DEFAULT for Vertex Shaders: 	precision highp float; precision highp int;
	//									precision lowp sampler2D; precision lowp samplerCube;
	// DEFAULT for Fragment Shaders:  UNDEFINED for float; precision mediump int;
	//									precision lowp sampler2D;	precision lowp samplerCube;
	// MATCH the Vertex shader precision for float and int:
  'precision highp float;\n' +
  'precision highp int;\n' +
  //
	//--------------- GLSL Struct Definitions:
	'struct LampT {\n' +		// Describes one point-like Phong light source
	'		vec3 pos;\n' +			// (x,y,z,w); w==1.0 for local light at x,y,z position
													//		   w==0.0 for distant light from x,y,z direction 
	' 	vec3 ambi;\n' +			// Ia ==  ambient light source strength (r,g,b)
	' 	vec3 diff;\n' +			// Id ==  diffuse light source strength (r,g,b)
	'		vec3 spec;\n' +			// Is == specular light source strength (r,g,b)
	'}; \n' +
  //
	//-------------UNIFORMS: values set from JavaScript before a drawing command.
  // first light source: (YOU write a second one...)
	'uniform LampT u_LampSet[1];\n' +		// Array of all light sources.
	// OLD uniforms replaced by lampSet[0] struct's contents
//  'uniform vec3 u_Lamp0Pos;\n' + 			// Phong Illum: position
//  'uniform vec3 u_Lamp0Amb;\n' +   		// Phong Illum: ambient
//  'uniform vec3 u_Lamp0Diff;\n' +     // Phong Illum: diffuse
//	'uniform vec3 u_Lamp0Spec;\n' +			// Phong Illum: specular

	
	// first material definition: you write 2nd, 3rd, etc.
  'uniform vec3 u_Ke;\n' +						// Phong Reflectance: emissive
  'uniform vec3 u_Ka;\n' +						// Phong Reflectance: ambient
	// no Phong Reflectance: diffuse? -- no: use v_Kd instead for per-pixel value
  'uniform vec3 u_Ks;\n' +						// Phong Reflectance: specular
  'uniform int u_Kshiny;\n' +				// Phong Reflectance: 1 < shiny < 128
//
  'uniform vec3 u_eyePosWorld; \n' + 	// Camera/eye location in world coords.
  
 	//-------------VARYING:Vertex Shader values sent per-pix'''''''''''''''';el to Fragment shader: 
  'varying vec3 v_Normal;\n' +				// Find 3D surface normal at each pix
  'varying vec4 v_Position;\n' +			// pixel's 3D pos too -- in 'world' coords
  'varying vec3 v_Kd;	\n' +						// Find diffuse reflectance K_d per pix
  													// Ambient? Emissive? Specular? almost
  													// NEVER change per-vertex: I use 'uniform' values

  'void main() { \n' +
     	// Normalize! !!IMPORTANT!! TROUBLE if you don't! 
     	// normals interpolated for each pixel aren't 1.0 in length any more!
	'  vec3 normal = normalize(v_Normal); \n' +
//	'  vec3 normal = v_Normal; \n' +
     	// Find the unit-length light dir vector 'L' (surface pt --> light):
	'  vec3 lightDirection = normalize(u_LampSet[0].pos - v_Position.xyz);\n' +
			// Find the unit-length eye-direction vector 'V' (surface pt --> camera)
  '  vec3 eyeDirection = normalize(u_eyePosWorld - v_Position.xyz); \n' +
     	// The dot product of (unit-length) light direction and the normal vector
     	// (use max() to discard any negatives from lights below the surface) 
     	// (look in GLSL manual: what other functions would help?)
     	// gives us the cosine-falloff factor needed for the diffuse lighting term:
	'  float nDotL = max(dot(lightDirection, normal), 0.0); \n' +
  	 	// The Blinn-Phong lighting model computes the specular term faster 
  	 	// because it replaces the (V*R)^shiny weighting with (H*N)^shiny,
  	 	// where 'halfway' vector H has a direction half-way between L and V
  	 	// H = norm(norm(V) + norm(L)).  Note L & V already normalized above.
  	 	// (see http://en.wikipedia.org/wiki/Blinn-Phong_shading_model)
	'  vec3 H = normalize(lightDirection + eyeDirection); \n' +
	'  float nDotH = max(dot(H, normal), 0.0); \n' +
			// (use max() to discard any negatives from lights below the surface)
			// Apply the 'shininess' exponent K_e:
			// Try it two different ways:		The 'new hotness': pow() fcn in GLSL.
			// CAREFUL!  pow() won't accept integer exponents! Convert K_shiny!  
	'  float e64 = pow(nDotH, float(u_Kshiny));\n' +
 	// Calculate the final color from diffuse reflection and ambient reflection
  '	 vec3 emissive = u_Ke;' +
  '  vec3 ambient = u_LampSet[0].ambi * u_Ka;\n' +
  '  vec3 diffuse = u_LampSet[0].diff * v_Kd * nDotL;\n' +
  '	 vec3 speculr = u_LampSet[0].spec * u_Ks * e64;\n' +
  '  gl_FragColor = vec4(emissive + ambient + diffuse + speculr , 1.0);\n' +
  '}\n';
//=============================================================================
// Global vars for mouse click-and-drag for rotation.
var isDrag=false;		// mouse-drag: true when user holds down mouse button
var xMclik=0.0;			// last mouse button-down position (in CVV coords)
var yMclik=0.0;   
var xMdragTot=0.0;	// total (accumulated) mouse-drag amounts (in CVV coords).
var yMdragTot=0.0;  

// Global vars for GPU 'storage locations' -- you need these integer 'handles' 
// to select and modify the value of the GPU's 'uniform' vars that we created
// in main(). 
// *****!!!UGLY_UGLY_UGLY!!!*** in later versions, remove these globals and
// replace them with sensible object-oriented methods. e.g. create separate
// multi-member objects for 'lamp' (light source), 'camera', 'material', 'shape',
// 'controls'(mouse/keyboard/GUI/animation values and functions) and one big 
// master all-inclusive 'scene' (contains all shapes, materials, lamps, cameras, 
// gand any/all matrices and functions and animation needed to assemble them into
// a complete animated interactive 3D scene.
//		-- For 3D scene
var uLoc_eyePosWorld 	= false;
var uLoc_ModelMatrix 	= false;
var uLoc_MvpMatrix 		= false;
var uLoc_NormalMatrix = false;
//		-- For Lamp0 (our 1st light source)
var uLoc_Lamp0Pos   = false;
var uLoc_Lamp0Ambi  = false;
var uLoc_Lamp0Diff  = false;
var uLoc_Lamp0Spec	= false;
// ... for Phong material/reflectance:
var uLoc_Ke = false;
var uLoc_Ka = false;
var uLoc_Kd = false;
var uLoc_Ks = false;
var uLoc_Kshiny = false;

//  ... for 3D scene variables (previously used as arguments to draw() function)
var canvas 	= false;
var gl 			= false;
var n_vcount= false;	// formerly 'n', but that name is far too vague and terse
											// to use safely as a global variable.
var modelMatrix = new Matrix4();  // Model matrix
var	mvpMatrix 	= new Matrix4();	// Model-view-projection matrix
var	normalMatrix= new Matrix4();	// Transformation matrix for normals

// NEXT, create global vars that contain the values we send thru those uniforms,
//  ... for our camera:
var	eyePosWorld = new Float32Array(3);	// x,y,z in world coords

//	... for our first light source:   (stays false if never initialized)
var lamp0Pos  = new Float32Array(3);	// x,y,z in world coords
var	lamp0Ambi = new Float32Array(3);	// r,g,b for ambient illumination
var lamp0Diff = new Float32Array(3);	// r,g,b for diffuse illumination
var lamp0Spec	= new Float32Array(3);	// r,g,b for specular illumination

	// ... for our first material:
var	matl0_Ke = new Float32Array(3);					// r,g,b for emissive 'reflectance'
var	matl0_Ka = new Float32Array(3);					// r,g,b for ambient reflectance
var	matl0_Kd = new Float32Array(3);					// r,g,b for diffuse reflectance
var	matl0_Ks = new Float32Array(3);					// r,g,b for specular reflectance
var matl0_Kshiny = false;										// specular shinyness exponent.
// ---------------END of global vars----------------------------

//=============================================================================
function main() {
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context \'gl\' for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // 
  n_vcount = initVertexBuffers(gl);		// vertex count.
  if (n_vcount < 0) {
    console.log('Failed to set the vertex information: n_vcount false');
    return;
  }

  // Set the clear color and enable the depth test
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

	// Register the Mouse & Keyboard Event-handlers-------------------------------
	// If users move, click or drag the mouse, or they press any keys on the 
	// the operating system will sense them immediately as 'events'.  
	// If you would like your program to respond to any of these events, you must // tell JavaScript exactly how to do it: you must write your own 'event 
	// handler' functions, and then 'register' them; tell JavaScript WHICH 
	// events should cause it to call WHICH of your event-handler functions.
	//
	// First, register all mouse events found within our HTML-5 canvas:
  canvas.onmousedown	=	function(ev){myMouseDown( ev, gl, canvas) }; 
  
  					// when user's mouse button goes down call mouseDown() function
  canvas.onmousemove = 	function(ev){myMouseMove( ev, gl, canvas) };
  
											// call mouseMove() function					
  canvas.onmouseup = 		function(ev){myMouseUp(   ev, gl, canvas)};
  					// NOTE! 'onclick' event is SAME as on 'mouseup' event
  					// in Chrome Brower on MS Windows 7, and possibly other 
  					// operating systems; use 'mouseup' instead.
  					
  // Next, register all keyboard events found within our HTML webpage window:
	window.addEventListener("keydown", myKeyDown, false);
	window.addEventListener("keyup", myKeyUp, false);
	window.addEventListener("keypress", myKeyPress, false);
  // The 'keyDown' and 'keyUp' events respond to ALL keys on the keyboard,
  // 			including shift,alt,ctrl,arrow, pgUp, pgDn,f1,f2...f12 etc. 
  //			I find these most useful for arrow keys; insert/delete; home/end, etc.
  // The 'keyPress' events respond only to alpha-numeric keys, and sense any 
  //  		modifiers such as shift, alt, or ctrl.  I find these most useful for
  //			single-number and single-letter inputs that include SHIFT,CTRL,ALT.
	// END Mouse & Keyboard Event-Handlers-----------------------------------

  // Create, save the storage locations of uniform variables: ... for the scene
  // (Version 03: changed these to global vars (DANGER!) for use inside any func)
  uLoc_eyePosWorld  = gl.getUniformLocation(gl.program, 'u_eyePosWorld');
  uLoc_ModelMatrix  = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  uLoc_MvpMatrix    = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
  uLoc_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  if (!uLoc_eyePosWorld ||
      !uLoc_ModelMatrix	|| !uLoc_MvpMatrix || !uLoc_NormalMatrix) {
  	console.log('Failed to get uLoc_ matrix storage locations');
  	return;
  	}
	//  ... for Phong light source:
	// NEW!  Note we're getting the location of a GLSL struct array member:
  uLoc_Lamp0Pos  = gl.getUniformLocation(gl.program, 'u_LampSet[0].pos');	
  uLoc_Lamp0Ambi = gl.getUniformLocation(gl.program, 'u_LampSet[0].ambi');
  uLoc_Lamp0Diff = gl.getUniformLocation(gl.program, 'u_LampSet[0].diff');
  uLoc_Lamp0Spec = gl.getUniformLocation(gl.program, 'u_LampSet[0].spec');
  if( !uLoc_Lamp0Pos || !uLoc_Lamp0Ambi	|| !uLoc_Lamp0Diff || !uLoc_Lamp0Spec	) {
    console.log('Failed to get the Lamp0 storage locations');
    return;
  }
	// ... for Phong material/reflectance:
	uLoc_Ke = gl.getUniformLocation(gl.program, 'u_Ke');
	uLoc_Ka = gl.getUniformLocation(gl.program, 'u_Ka');
	uLoc_Kd = gl.getUniformLocation(gl.program, 'u_Kd');
	uLoc_Ks = gl.getUniformLocation(gl.program, 'u_Ks');
	uLoc_Kshiny = gl.getUniformLocation(gl.program, 'u_Kshiny');
	
	if(!uLoc_Ke || !uLoc_Ka || !uLoc_Kd 
		  		    || !uLoc_Ks || !uLoc_Kshiny
		 ) {
		console.log('Failed to get the Phong Reflectance storage locations');
		return;
	}
	// Position the camera in world coordinates:
	eyePosWorld.set([6.0, 0.0, 0.0]);
	gl.uniform3fv(uLoc_eyePosWorld, eyePosWorld);// use it to set our uniform
	// (Note: uniform4fv() expects 4-element float32Array as its 2nd argument)
	
  // Init World-coord. position & colors of first light source in global vars;
  lamp0Pos.set( [6.0, 5.0, 5.0]);
  lamp0Ambi.set([0.4, 0.4, 0.4]);
  lamp0Diff.set([1.0, 1.0, 1.0]);
  lamp0Spec.set([1.0, 1.0, 1.0]);
  // then use those global vars to set 'uniform' vars values inside the GPU:
  gl.uniform3fv(uLoc_Lamp0Pos, lamp0Pos); 
  gl.uniform3fv(uLoc_Lamp0Ambi, lamp0Ambi);		// ambient
  gl.uniform3fv(uLoc_Lamp0Diff, lamp0Diff);		// diffuse
  gl.uniform3fv(uLoc_Lamp0Spec, lamp0Spec);		// Specular
	// Init reflectance values for our (first) Phong material in global variables;
	matl0_Ke.set([0.0, 0.0, 0.0]);
	matl0_Ka.set([0.6, 0.0, 0.0]);
	matl0_Kd.set([0.8, 0.0, 0.0]);
	matl0_Ks.set([0.8, 0.8, 0.8]);
	matl0_Kshiny = 16;			// Specular shinyness exponent
	// then use those global vars to set 'uniform' vars in the GPU:
	gl.uniform3fv(uLoc_Ke, matl0_Ke);				// Ke emissive
	gl.uniform3fv(uLoc_Ka, matl0_Ka);				// Ka ambient
  gl.uniform3fv(uLoc_Kd, matl0_Kd);				// Kd	diffuse
	gl.uniform3fv(uLoc_Ks, matl0_Ks);				// Ks specular
	gl.uniform1i(uLoc_Kshiny, matl0_Kshiny);					// Kshiny shinyness exponent
	
	draw();
}

function draw() {
//-------------------------------------------------------------------------------
  // Calculate the model matrix:
  modelMatrix.setRotate(90, 0, 1, 0); // Rotate around the y-axis
  // Calculate the view projection matrix
  mvpMatrix.setPerspective(30, canvas.width/canvas.height, 1, 100);
  mvpMatrix.lookAt(	eyePosWorld[0], eyePosWorld[1], eyePosWorld[2], // eye pos
  									0,  0, 0, 				// aim-point (in world coords)
									  0,  0, 1);				// up (in world coords)
  mvpMatrix.multiply(modelMatrix);
  // Calculate the matrix to transform the normal based on the model matrix
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();

  // Pass the model matrix to u_ModelMatrix
  gl.uniformMatrix4fv(uLoc_ModelMatrix, false, modelMatrix.elements);

  // Pass the model view projection matrix to u_mvpMatrix
  gl.uniformMatrix4fv(uLoc_MvpMatrix, false, mvpMatrix.elements);

  // Pass the transformation matrix for normals to u_NormalMatrix
  gl.uniformMatrix4fv(uLoc_NormalMatrix, false, normalMatrix.elements);

  // Clear color and depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Draw the cube
  gl.drawElements(gl.TRIANGLES, n_vcount, gl.UNSIGNED_SHORT, 0);
}

function initVertexBuffers(gl) { // Create a sphere
//-------------------------------------------------------------------------------
  var SPHERE_DIV = 13; //default: 13.  JT: try others: 11,9,7,5,4,3,2,

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
//-------------------------------------------------------------------------------
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

//==================HTML Button Callbacks======================

function clearDrag() {
// Called when user presses 'Clear' button in our webpage
	xMdragTot = 0.0;
	yMdragTot = 0.0;
		  // REPORT updated mouse position on-screen
	document.getElementById('Mouse').innerHTML=
			'Mouse Drag totals (CVV coords):\t'+xMdragTot+', \t'+yMdragTot;	

	// NEW!  re-set the light-source global vars to its original values:
  lamp0Pos.set( [6.0, 5.0, 5.0]);
  // then use those global vars to set 'uniform' vars values inside the GPU:
  gl.uniform3fv(uLoc_Lamp0Pos, lamp0Pos); 
  draw();		// draw the newly-updated image.
}


//==================================Mouse and Keyboard event-handling Callbacks,
//								(modified from Week04 starter code: 5.04jt.ControlMulti.html))

function myMouseDown(ev, gl, canvas) {
//==============================================================================
// Called when user PRESSES down any mouse button;
// 									(Which button?    console.log('ev.button='+ev.button);   )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
  var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseDown(pixel coords): xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  / 		// move origin to center of canvas and
  						 (canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - canvas.height/2) /		//										 -1 <= y < +1.
							 (canvas.height/2);
//	console.log('myMouseDown(CVV coords  ):  x, y=\t',x,',\t',y);
	
	isDrag = true;											// set our mouse-dragging flag
	xMclik = x;													// record where mouse-dragging began
	yMclik = y;
};


function myMouseMove(ev, gl, canvas) {
//==============================================================================
// Called when user MOVES the mouse with a button already pressed down.
// 									(Which button?   console.log('ev.button='+ev.button);    )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

	if(isDrag==false) return;				// IGNORE all mouse-moves except 'dragging'

	// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
	var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseMove(pixel coords): xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  / 		// move origin to center of canvas and
  						 (canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - canvas.height/2) /		//										 -1 <= y < +1.
							 (canvas.height/2);
//	console.log('myMouseMove(CVV coords  ):  x, y=\t',x,',\t',y);

//Mouse-Drag Moves Lamp0 ========================================================
	// Use accumulated mouse-dragging to change the global var 'lamp0Pos';
	// (note how accumulated mouse-dragging sets xmDragTot, ymDragTot below:
	//  use the same method to change the y,z coords of lamp0Pos)
	lamp0Pos.set([lamp0Pos[0],										// don't change world x;
								lamp0Pos[1] + 4.0*(x - xMclik),		// Horiz drag*4 changes world y
						    lamp0Pos[2] + 4.0*(y - yMclik)]);	// Vert drag*4 changes world z

	// VERY IMPORTANT!
	// We changed our JavaScript global variable, but not the 'uniform' value
	// inside the GPU.  Be SURE you update the 'uniform' value too!
	gl.uniform3fv(uLoc_Lamp0Pos, lamp0Pos); 
	draw();				// re-draw the image using this updated uniform's value
// REPORT new lamp0 position on-screen
		document.getElementById('Mouse').innerHTML=
			'Lamp0 position(x,y,z):\t('+ lamp0Pos[0].toFixed(5) +
			                      '\t' + lamp0Pos[1].toFixed(5) +
														'\t' + lamp0Pos[2].toFixed(5) + ')';	
	
//END=====================================================================

	// find how far we dragged the mouse:
	xMdragTot += (x - xMclik);					// Accumulate change-in-mouse-position,&
	yMdragTot += (y - yMclik);
	xMclik = x;													// Make next drag-measurement from here.
	yMclik = y;
	
/*	  // REPORT updated mouse position on-screen
		document.getElementById('Mouse').innerHTML=
			'Mouse Drag totals (CVV coords):\t'+xMdragTot+', \t'+yMdragTot;	
*/
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
	var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseUp  (pixel coords): xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  / 		// move origin to center of canvas and
  						 (canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - canvas.height/2) /		//										 -1 <= y < +1.
							 (canvas.height/2);
	console.log('myMouseUp  (CVV coords  ):  x, y=\t',x,',\t',y);
	
	isDrag = false;											// CLEAR our mouse-dragging flag, and
	// accumulate any final bit of mouse-dragging we did:
	xMdragTot += (x - xMclik);
	yMdragTot += (y - yMclik);
	console.log('myMouseUp: xMdragTot,yMdragTot =',xMdragTot,',\t',yMdragTot);
};


function myKeyDown(ev) {
//===============================================================================
// Called when user presses down ANY key on the keyboard, and captures the 
// keyboard's scancode or keycode(varies for different countries and alphabets).
//  CAUTION: You may wish to avoid 'keydown' and 'keyup' events: if you DON'T 
// need to sense non-ASCII keys (arrow keys, function keys, pgUp, pgDn, Ins, 
// Del, etc), then just use the 'keypress' event instead.
//	 The 'keypress' event captures the combined effects of alphanumeric keys and // the SHIFT, ALT, and CTRL modifiers.  It translates pressed keys into ordinary
// ASCII codes; you'll get the ASCII code for uppercase 'S' if you hold shift 
// and press the 's' key.
// For a light, easy explanation of keyboard events in JavaScript,
// see:    http://www.kirupa.com/html5/keyboard_events_in_javascript.htm
// For a thorough explanation of the messy way JavaScript handles keyboard events
// see:    http://javascript.info/tutorial/keyboard-events
//

	switch(ev.keyCode) {			// keycodes !=ASCII, but are very consistent for 
	//	nearly all non-alphanumeric keys for nearly all keyboards in all countries.
		case 37:		// left-arrow key
			// print in console:
			console.log(' left-arrow.');
			// and print on webpage in the <div> element with id='Result':
  		document.getElementById('Result').innerHTML =
  			' Left Arrow:keyCode='+ev.keyCode;
			break;
		case 38:		// up-arrow key
			console.log('   up-arrow.');
  		document.getElementById('Result').innerHTML =
  			'   Up Arrow:keyCode='+ev.keyCode;
			break;
		case 39:		// right-arrow key
			console.log('right-arrow.');
  		document.getElementById('Result').innerHTML =
  			'Right Arrow:keyCode='+ev.keyCode;
  		break;
		case 40:		// down-arrow key
			console.log(' down-arrow.');
  		document.getElementById('Result').innerHTML =
  			' Down Arrow:keyCode='+ev.keyCode;
  		break;
		default:
			console.log('myKeyDown()--keycode=', ev.keyCode, ', charCode=', ev.charCode);
  		document.getElementById('Result').innerHTML =
  			'myKeyDown()--keyCode='+ev.keyCode;
			break;
	}
}

function myKeyUp(ev) {
//===============================================================================
// Called when user releases ANY key on the keyboard; captures scancodes well

	console.log('myKeyUp()--keyCode='+ev.keyCode+' released.');
}

function myKeyPress(ev) {
//===============================================================================
// Best for capturing alphanumeric keys and key-combinations such as 
// CTRL-C, alt-F, SHIFT-4, etc.
	switch(ev.keyCode)
	{
		case 83: // UPPER-case 's' key:
			matl0_Kshiny += 1;								// INCREASE shinyness, but with a
			if(matl0_Kshiny > 128) matl0_Kshiny = 128;	// upper limit.
			console.log('UPPERcase S: ++K_shiny ==', matl0_Kshiny,'\n');	
				gl.uniform1i(uLoc_Kshiny, matl0_Kshiny);		// Set new value of Kshiny uniform 
			draw();														// re-draw on-screen image.
			break;
		case 115:	// LOWER-case 's' key:
			matl0_Kshiny -= 1;										// DECREASE shinyness, but with a
			if(matl0_Kshiny < 1) matl0_Kshiny = 1;		// lower limit.
			console.log('lowercase s: --K_shiny ==', matl0_Kshiny, '\n');
			gl.uniform1i(uLoc_Kshiny, matl0_Kshiny);		// Set new value of Kshiny uniform 
			draw();													// re-draw on-screen image.
			break;
		default:
		console.log('myKeyPress():keyCode=' +ev.keyCode  +', charCode=' +ev.charCode+
													', shift='    +ev.shiftKey + ', ctrl='    +ev.ctrlKey +
													', altKey='   +ev.altKey   +
													', metaKey(Command key or Windows key)='+ev.metaKey);
		break;
	}												
}