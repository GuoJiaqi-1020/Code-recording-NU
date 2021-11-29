//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
// (JT: why the numbers? counts columns, helps me keep 80-char-wide listings)

// Tabs set to 2

/*=====================
  VBObox-Lib.js library: 
  ===================== 
Note that you don't really need 'VBObox' objects for any simple, 
    beginner-level WebGL/OpenGL programs: if all vertices contain exactly 
		the same attributes (e.g. position, color, surface normal), and use 
		the same shader program (e.g. same Vertex Shader and Fragment Shader), 
		then our textbook's simple 'example code' will suffice.
		  
***BUT*** that's rare -- most genuinely useful WebGL/OpenGL programs need 
		different sets of vertices with  different sets of attributes rendered 
		by different shader programs.  THUS a customized VBObox object for each 
		VBO/shader-program pair will help you remember and correctly implement ALL 
		the WebGL/GLSL steps required for a working multi-shader, multi-VBO program.
		
One 'VBObox' object contains all we need for WebGL/OpenGL to render on-screen a 
		set of shapes made from vertices stored in one Vertex Buffer Object (VBO), 
		as drawn by calls to one 'shader program' that runs on your computer's 
		Graphical Processing Unit(GPU), along with changes to values of that shader 
		program's one set of 'uniform' varibles.  
The 'shader program' consists of a Vertex Shader and a Fragment Shader written 
		in GLSL, compiled and linked and ready to execute as a Single-Instruction, 
		Multiple-Data (SIMD) parallel program executed simultaneously by multiple 
		'shader units' on the GPU.  The GPU runs one 'instance' of the Vertex 
		Shader for each vertex in every shape, and one 'instance' of the Fragment 
		Shader for every on-screen pixel covered by any part of any drawing 
		primitive defined by those vertices.
The 'VBO' consists of a 'buffer object' (a memory block reserved in the GPU),
		accessed by the shader program through its 'attribute' variables. Shader's
		'uniform' variable values also get retrieved from GPU memory, but their 
		values can't be changed while the shader program runs.  
		Each VBObox object stores its own 'uniform' values as vars in JavaScript; 
		its 'adjust()'	function computes newly-updated values for these uniform 
		vars and then transfers them to the GPU memory for use by shader program.
EVENTUALLY you should replace 'cuon-matrix-quat03.js' with the free, open-source
   'glmatrix.js' library for vectors, matrices & quaternions: Google it!
		This vector/matrix library is more complete, more widely-used, and runs
		faster than our textbook's 'cuon-matrix-quat03.js' library.  
		--------------------------------------------------------------
		I recommend you use glMatrix.js instead of cuon-matrix-quat03.js
		--------------------------------------------------------------
		for all future WebGL programs. 
You can CONVERT existing cuon-matrix-based programs to glmatrix.js in a very 
    gradual, sensible, testable way:
		--add the glmatrix.js library to an existing cuon-matrix-based program;
			(but don't call any of its functions yet).
		--comment out the glmatrix.js parts (if any) that cause conflicts or in	
			any way disrupt the operation of your program.
		--make just one small local change in your program; find a small, simple,
			easy-to-test portion of your program where you can replace a 
			cuon-matrix object or function call with a glmatrix function call.
			Test; make sure it works. Don't make too large a change: it's hard to fix!
		--Save a copy of this new program as your latest numbered version. Repeat
			the previous step: go on to the next small local change in your program
			and make another replacement of cuon-matrix use with glmatrix use. 
			Test it; make sure it works; save this as your next numbered version.
		--Continue this process until your program no longer uses any cuon-matrix
			library features at all, and no part of glmatrix is commented out.
			Remove cuon-matrix from your library, and now use only glmatrix.

	------------------------------------------------------------------
	VBObox -- A MESSY SET OF CUSTOMIZED OBJECTS--NOT REALLY A 'CLASS'
	------------------------------------------------------------------
As each 'VBObox' object can contain:
  -- a DIFFERENT GLSL shader program, 
  -- a DIFFERENT set of attributes that define a vertex for that shader program, 
  -- a DIFFERENT number of vertices to used to fill the VBOs in GPU memory, and 
  -- a DIFFERENT set of uniforms transferred to GPU memory for shader use.  
  THUS:
		I don't see any easy way to use the exact same object constructors and 
		prototypes for all VBObox objects.  Every additional VBObox objects may vary 
		substantially, so I recommend that you copy and re-name an existing VBObox 
		prototype object, and modify as needed, as shown here. 
		(e.g. to make the VBObox3 object, copy the VBObox2 constructor and 
		all its prototype functions, then modify their contents for VBObox3 
		activities.)

*/

// Written for EECS 351-2,	Intermediate Computer Graphics,
//							Northwestern Univ. EECS Dept., Jack Tumblin
// 2016.05.26 J. Tumblin-- Created; tested on 'TwoVBOs.html' starter code.
// 2017.02.20 J. Tumblin-- updated for EECS 351-1 use for Project C.
// 2018.04.11 J. Tumblin-- minor corrections/renaming for particle systems.
//    --11e: global 'gl' replaced redundant 'myGL' fcn args; 
//    --12: added 'SwitchToMe()' fcn to simplify 'init()' function and to fix 
//      weird subtle errors that sometimes appear when we alternate 'adjust()'
//      and 'draw()' functions of different VBObox objects. CAUSE: found that
//      only the 'draw()' function (and not the 'adjust()' function) made a full
//      changeover from one VBObox to another; thus calls to 'adjust()' for one
//      VBObox could corrupt GPU contents for another.
//      --Created vboStride, vboOffset members to centralize VBO layout in the 
//      constructor function.
//    -- 13 (abandoned) tried to make a 'core' or 'resuable' VBObox object to
//      which we would add on new properties for shaders, uniforms, etc., but
//      I decided there was too little 'common' code that wasn't customized.
//=============================================================================
// ! Globals 
const floatsPerVertex = 6;

// ! Shape vertices
function makeGroundGrid() {

    var xcount = 100;			// # of lines to draw in x,y to make the grid.
    var ycount = 100;		
    var xymax	= 50.0;			// grid size; extends to cover +/-xymax in x and y.
     var xColr = new Float32Array([0.4, 0.4, 0.4]);	// bright yellow
     var yColr = new Float32Array([0.4, 0.4, 0.4]);	// bright green.
     
    // Create an (global) array to hold this ground-plane's vertices:
    gndVerts = new Float32Array(floatsPerVertex*2*(xcount+ycount));
 
    var xgap = xymax/(xcount-1);		// HALF-spacing between lines in x,y;
    var ygap = xymax/(ycount-1);		// (why half? because v==(0line number/2))

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
//=============================================================================
//=============================================================================
function VBObox0() {
	this.VERT_SRC =	//--------------------- VERTEX SHADER source code 
  'precision highp float;\n' +				// req'd in OpenGL ES if we use 'float'
  //
  'uniform mat4 u_ModelMat0;\n' +
  'attribute vec4 a_Pos0;\n' +
  'attribute vec3 a_Colr0;\n'+
  'varying vec3 v_Colr0;\n' +
  //
  'void main() {\n' +
  '  gl_Position = u_ModelMat0 * a_Pos0;\n' +
  '	 v_Colr0 = a_Colr0;\n' +
  ' }\n';

	this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
  'precision mediump float;\n' +
  'varying vec3 v_Colr0;\n' +
  'void main() {\n' +
  '  gl_FragColor = vec4(v_Colr0, 1.0);\n' + 
  '}\n';

  makeGroundGrid();

  this.vboContents = gndVerts;

  // 7 is the number of 
	this.vboVerts = this.vboContents.length / floatsPerVertex;						// # of vertices held in 'vboContents' array
	this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
	                              // bytes req'd by 1 vboContents array element;
																// (why? used to compute stride and offset 
																// in bytes for vertexAttribPointer() calls)
  this.vboBytes = this.vboContents.length * this.FSIZE;               
                                // total number of bytes stored in vboContents
                                // (#  of floats in vboContents array) * 
                                // (# of bytes/float).
	this.vboStride = this.vboBytes / this.vboVerts; 
	                              // (== # of bytes to store one complete vertex).
	                              // From any attrib in a given vertex in the VBO, 
	                              // move forward by 'vboStride' bytes to arrive 
	                              // at the same attrib for the next vertex. 

	            //----------------------Attribute sizes
  this.vboFcount_a_Pos0 =  3;    // # of floats in the VBO needed to store the
                                // attribute named a_Pos0. (4: x,y,z,w values)
  this.vboFcount_a_Colr0 = 3;   // # of floats for this attrib (r,g,b values) 
  console.assert((this.vboFcount_a_Pos0 +     // check the size of each and
                  this.vboFcount_a_Colr0) *   // every attribute in our VBO
                  this.FSIZE == this.vboStride, // for agreeement with'stride'
                  "Uh oh! VBObox0.vboStride disagrees with attribute-size values!");

              //----------------------Attribute offsets  
	this.vboOffset_a_Pos0 = 0;    // # of bytes from START of vbo to the START
	                              // of 1st a_Pos0 attrib value in vboContents[]
  this.vboOffset_a_Colr0 = this.vboFcount_a_Pos0 * this.FSIZE;    
                                // (4 floats * bytes/float) 
                                // # of bytes from START of vbo to the START
                                // of 1st a_Colr0 attrib value in vboContents[]
	            //-----------------------GPU memory locations:
	this.vboLoc;									// GPU Location for Vertex Buffer Object, 
	                              // returned by gl.createBuffer() function call
	this.shaderLoc;								// GPU Location for compiled Shader-program  
	                            	// set by compile/link of VERT_SRC and FRAG_SRC.
								          //------Attribute locations in our shaders:
	this.a_PosLoc;								// GPU location for 'a_Pos0' attribute
	this.a_ColrLoc;								// GPU location for 'a_Colr0' attribute

	            //---------------------- Uniform locations &values in our shaders
	this.ModelMat = new Matrix4();	// Transforms CVV axes to model axes.
	this.u_ModelMatLoc;							// GPU location for u_ModelMat uniform
}

VBObox0.prototype.init = function() {
	this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
	if (!this.shaderLoc) {
    console.log(this.constructor.name + 
    						'.init() failed to create executable Shaders on the GPU. Bye!');
    return;
  }

	gl.program = this.shaderLoc;		// (to match cuon-utils.js -- initShaders())

// b) Create VBO on GPU, fill it------------------------------------------------
	this.vboLoc = gl.createBuffer();	
  if (!this.vboLoc) {
    console.log(this.constructor.name + 
    						'.init() failed to create VBO in GPU. Bye!'); 
    return;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER,	      // GLenum 'target' for this GPU buffer 
  								this.vboLoc);				  // the ID# the GPU uses for this buffer.

  gl.bufferData(gl.ARRAY_BUFFER, 			  // GLenum target(same as 'bindBuffer()')
 					 				this.vboContents, 		// JavaScript Float32Array
  							 	gl.STATIC_DRAW);			// Usage hint.

  this.a_PosLoc = gl.getAttribLocation(this.shaderLoc, 'a_Pos0');
  if(this.a_PosLoc < 0) {
    console.log(this.constructor.name + 
    						'.init() Failed to get GPU location of attribute a_Pos0');
    return -1;	// error exit.
  }
 	this.a_ColrLoc = gl.getAttribLocation(this.shaderLoc, 'a_Colr0');
  if(this.a_ColrLoc < 0) {
    console.log(this.constructor.name + 
    						'.init() failed to get the GPU location of attribute a_Colr0');
    return -1;	// error exit.
  }
  // c2) Find All Uniforms:-----------------------------------------------------
  //Get GPU storage location for each uniform var used in our shader programs: 
	this.u_ModelMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_ModelMat0');
  if (!this.u_ModelMatLoc) { 
    console.log(this.constructor.name + 
    						'.init() failed to get GPU location for u_ModelMat1 uniform');
    return;
  }  
}

VBObox0.prototype.switchToMe = function() {

  gl.useProgram(this.shaderLoc);	
	gl.bindBuffer(gl.ARRAY_BUFFER,	        // GLenum 'target' for this GPU buffer 
										this.vboLoc);			    // the ID# the GPU uses for our VBO.
  gl.vertexAttribPointer(
		this.a_PosLoc,//index == ID# for the attribute var in your GLSL shader pgm;
		this.vboFcount_a_Pos0,// # of floats used by this attribute: 1,2,3 or 4?
		gl.FLOAT,			// type == what data type did we use for those numbers?
		false,				// isNormalized == are these fixed-point values that we need
									//									normalize before use? true or false
		this.vboStride,// Stride == #bytes we must skip in the VBO to move from the
		              // stored attrib for this vertex to the same stored attrib
		              //  for the next vertex in our VBO.  This is usually the 
									// number of bytes used to store one complete vertex.  If set 
									// to zero, the GPU gets attribute values sequentially from 
									// VBO, starting at 'Offset'.	
									// (Our vertex size in bytes: 4 floats for pos + 3 for color)
		this.vboOffset_a_Pos0);						
		              // Offset == how many bytes from START of buffer to the first
  								// value we will actually use?  (We start with position).
  gl.vertexAttribPointer(this.a_ColrLoc, this.vboFcount_a_Colr0, 
                        gl.FLOAT, false, 
                        this.vboStride, this.vboOffset_a_Colr0);
  							
// --Enable this assignment of each of these attributes to its' VBO source:
  gl.enableVertexAttribArray(this.a_PosLoc);
  gl.enableVertexAttribArray(this.a_ColrLoc);
}

VBObox0.prototype.isReady = function() {
//==============================================================================
// Returns 'true' if our WebGL rendering context ('gl') is ready to render using
// this objects VBO and shader program; else return false.
// see: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter

var isOK = true;

  if(gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc)  {
    console.log(this.constructor.name + 
    						'.isReady() false: shader program at this.shaderLoc not in use!');
    isOK = false;
  }
  if(gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
      console.log(this.constructor.name + 
  						'.isReady() false: vbo at this.vboLoc not in use!');
    isOK = false;
  }
  return isOK;
}

VBObox0.prototype.adjust = function() {
//==============================================================================
// Update the GPU to newer, current values we now store for 'uniform' vars on 
// the GPU; and (if needed) update each attribute's stride and offset in VBO.

  // check: was WebGL context set to use our VBO & shader program?
  if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name + 
  						'.adjust() call you needed to call this.switchToMe()!!');
  }  
  // Adjust values for our uniforms
  this.ModelMat.setIdentity(); // sanity check: clear modelMatrix
  this.ModelMat.set(g_worldMat); // use global camera 

  //this.ModelMat.translate(0.4, -0.4, 0.0);
  //this.ModelMat.scale(0.1, 0.1, 0.1)

  //  Transfer new uniforms' values to the GPU:-------------
  // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 
  gl.uniformMatrix4fv(this.u_ModelMatLoc,	// GPU location of the uniform
  										false, 				// use matrix transpose instead?
  										this.ModelMat.elements);	// send data from Javascript.
  // Adjust the attributes' stride and offset (if necessary)
  // (use gl.vertexAttribPointer() calls and gl.enableVertexAttribArray() calls)
}

VBObox0.prototype.draw = function() {
//=============================================================================
// Render current VBObox contents.

  // check: was WebGL context set to use our VBO & shader program?
  if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name + 
  						'.draw() call you needed to call this.switchToMe()!!');
  }  
  // ----------------------------Draw the contents of the currently-bound VBO:
  gl.drawArrays(gl.LINES, 	    // select the drawing primitive to draw,
                  // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
                  //          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
  								0, 								// location of 1st vertex to draw;
  								this.vboVerts);		// number of vertices to draw on-screen.
}

VBObox0.prototype.reload = function() {
 gl.bufferSubData(gl.ARRAY_BUFFER, 	// GLenum target(same as 'bindBuffer()')
                  0,                  // byte offset to where data replacement
                                      // begins in the VBO.
 					 				this.vboContents);   // the JS source-data array used to fill VBO

}

function makeConcaveHex() {
//==============================================================================
	const s30 = 0.5;										 // == sin(30deg) == 1 / 2
  const c30 = Math.sqrt(3.0)/2.0;			 // == cos(30deg) == sqrt(3) / 2

  // ! THIS IS A TERRIBLE WAY TO DO THIS!! I will make it better in the future, I'm just short on time.
  
  var fNorm = new Float32Array(getSurfNorm(new Vector3([-0.1, 0.1, 0.5]),
                                           new Vector3([0.0, -0.1, 0.5]),
                                           new Vector3([0.1,  0.1, 0.5])));

  var bNorm = new Float32Array(getSurfNorm(new Vector3([-0.1, 0.1, 0.0]),
                                           new Vector3([0.0, -0.1, 0.0]),
                                           new Vector3([0.1,  0.1, 0.0])));             
// ? ----------------------------------------------------------------------
  var ftpNorm = new Float32Array(getSurfNorm(new Vector3([-0.1, 0.1, 0.5]),
                                             new Vector3([0.1,  0.1, 0.5]),
                                             new Vector3([0.0,  1.0, 0.25])));

  var ltpNorm = new Float32Array(getSurfNorm(new Vector3([-0.1, 0.1, 0.5]),
                                             new Vector3([-0.1, 0.1, 0.0]),
                                             new Vector3([0.0,  1.0, 0.25])));

  var btpNorm = new Float32Array(getSurfNorm(new Vector3([-0.1, 0.1, 0.0]),
                                             new Vector3([0.1,  0.1, 0.0]),
                                             new Vector3([0.0,  1.0, 0.25])));

  var rtpNorm = new Float32Array(getSurfNorm(new Vector3([0.1, 0.1, 0.5]),
                                             new Vector3([0.1, 0.1, 0.0]),
                                             new Vector3([0.0, 1.0, 0.25])));
// ? ----------------------------------------------------------------------
  var flpNorm = new Float32Array(getSurfNorm(new Vector3([-0.1, 0.1, 0.5]),
                                             new Vector3([0.0, -0.1, 0.5]),
                                             new Vector3([-c30, -s30, 0.25]),));

  var llpNorm = new Float32Array(getSurfNorm(new Vector3([-0.1, 0.1, 0.5]),
                                             new Vector3([-0.1,  0.1, 0.0]),
                                             new Vector3([-c30, -s30, 0.25])));

  var blpNorm = new Float32Array(getSurfNorm(new Vector3([-0.1, 0.1, 0.0]),
                                             new Vector3([0.0, -0.1, 0.0]),
                                             new Vector3([-c30, -s30, 0.25])));

  var rlpNorm = new Float32Array(getSurfNorm(new Vector3([0.0, -0.1, 0.5]),
                                             new Vector3([0.0, -0.1, 0.0]),
                                             new Vector3([-c30, -s30, 0.25])));
// ? ----------------------------------------------------------------------
  var frpNorm = new Float32Array(getSurfNorm(new Vector3([0.0, -0.1, 0.5]),
                                             new Vector3([0.1,  0.1, 0.5]),
                                             new Vector3([c30,  -s30, 0.25])));

  var lrpNorm = new Float32Array(getSurfNorm(new Vector3([0.0, -0.1, 0.5]),
                                             new Vector3([0.0, -0.1, 0.0]),
                                             new Vector3([c30,  -s30, 0.25])));

  var brpNorm = new Float32Array(getSurfNorm(new Vector3([0.0, -0.1, 0.0]),
                                             new Vector3([0.1, 0.1, 0.0]),
                                             new Vector3([c30,  -s30, 0.25])));

  var rrpNorm = new Float32Array(getSurfNorm(new Vector3([0.1, 0.1, 0.5]),
                                             new Vector3([0.1, 0.1, 0.0]),
                                             new Vector3([c30, -s30, 0.25])));


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
			-0.1,  0.1,  0.5,     fNorm[0],  fNorm[1],  fNorm[2],  // Node 0 RED
			 0.0, -0.1,  0.5,     fNorm[0],  fNorm[1],  fNorm[2],  // Node 1 WHITE
			 0.1,  0.1,  0.5,     fNorm[0],  fNorm[1],  fNorm[2],  // Node 2 BLUE
		// * Back
			-0.1,  0.1,  0.0,     bNorm[0],  bNorm[1],  bNorm[2],  // Node 3 RED
			 0.0, -0.1,  0.0,     bNorm[0],  bNorm[1],  bNorm[2],  // Node 4 WHITE
			 0.1,  0.1,  0.0,     bNorm[0],  bNorm[1],  bNorm[2],  // Node 5 BLUE
		// ! ------------------- Top Point -------------------------
		// * Front Top Point Face
			-0.1,  0.1,  0.5,     ftpNorm[0],  ftpNorm[1],  ftpNorm[2],  // Node 0 RED
			 0.1,  0.1,  0.5,     ftpNorm[0],  ftpNorm[1],  ftpNorm[2],  // Node 2 BLUE
			 0.0,  1.0,  0.25,    ftpNorm[0],  ftpNorm[1],  ftpNorm[2],  // Node 6 RED
		// * Left Top Point Face
			-0.1,  0.1,  0.5,     ltpNorm[0],  ltpNorm[1],  ltpNorm[2],  // Node 0 RED
			-0.1,  0.1,  0.0,     ltpNorm[0],  ltpNorm[1],  ltpNorm[2],  // Node 3 RED
			 0.0,  1.0,  0.25,    ltpNorm[0],  ltpNorm[1],  ltpNorm[2],  // Node 6 RED
		// * Back Top Point Face
			-0.1,  0.1,  0.0,     btpNorm[0],  btpNorm[1],  btpNorm[2],  // Node 3 RED
			 0.1,  0.1,  0.0,     btpNorm[0],  btpNorm[1],  btpNorm[2],  // Node 5 BLUE
			 0.0,  1.0,  0.25,    btpNorm[0],  btpNorm[1],  btpNorm[2],  // Node 6 RED
		// * Right Top Point Face
			 0.1,  0.1,  0.5,     rtpNorm[0],  rtpNorm[1],  rtpNorm[2],  // Node 2 BLUE
			 0.1,  0.1,  0.0,     rtpNorm[0],  rtpNorm[1],  rtpNorm[2],  // Node 5 BLUE
			 0.0,  1.0,  0.25,    rtpNorm[0],  rtpNorm[1],  rtpNorm[2],  // Node 6 RED
		// ! ------------------- Left Point -------------------------
		// * Front Left Point Face
			-0.1,  0.1,  0.5,     flpNorm[0],  flpNorm[1],  flpNorm[2],  // Node 0 RED
			 0.0, -0.1,  0.5,     flpNorm[0],  flpNorm[1],  flpNorm[2],  // Node 1 WHITE
			-c30, -s30,  0.25,    flpNorm[0],  flpNorm[1],  flpNorm[2],  // Node 7 WHITE
		// * Left Left Point Face
			-0.1,  0.1,  0.5,     llpNorm[0],  llpNorm[1],  llpNorm[2],  // Node 0 RED
			-0.1,  0.1,  0.0,     llpNorm[0],  llpNorm[1],  llpNorm[2],  // Node 3 RED
			-c30, -s30,  0.25,    llpNorm[0],  llpNorm[1],  llpNorm[2],  // Node 7 WHITE
		// * Back Left Point Face
			-0.1,  0.1,  0.0,     blpNorm[0],  blpNorm[1],  blpNorm[2],  // Node 3 RED
			 0.0, -0.1,  0.0,     blpNorm[0],  blpNorm[1],  blpNorm[2],  // Node 4 WHITE
			-c30, -s30,  0.25,    blpNorm[0],  blpNorm[1],  blpNorm[2],  // Node 7 WHITE
		// * Right Left Point Face
			 0.0, -0.1,  0.5,     rlpNorm[0],  rlpNorm[1],  rlpNorm[2],  // Node 1 WHITE
			 0.0, -0.1,  0.0,     rlpNorm[0],  rlpNorm[1],  rlpNorm[2],  // Node 4 WHITE
			-c30, -s30,  0.25,    rlpNorm[0],  rlpNorm[1],  rlpNorm[2],  // Node 7 WHITE
		// ! -------------------- Right Point ------------------------
		// * Front Right Point Face 
			0.0, -0.1,  0.5,     frpNorm[0],  frpNorm[1],  frpNorm[2],  // Node 1 WHITE
			0.1,  0.1,  0.5,     frpNorm[0],  frpNorm[1],  frpNorm[2],  // Node 2 BLUE
			c30, -s30,  0.25,    frpNorm[0],  frpNorm[1],  frpNorm[2],  // Node 8 BLUE
		// * Left Right Point Face
			0.0, -0.1,  0.5,     lrpNorm[0],  lrpNorm[1],  lrpNorm[2],  // Node 1 WHITE
			0.0, -0.1,  0.0,     lrpNorm[0],  lrpNorm[1],  lrpNorm[2],  // Node 4 WHITE
			c30, -s30,  0.25,    lrpNorm[0],  lrpNorm[1],  lrpNorm[2],  // Node 8 BLUE
		// * Back Right Point Face
			0.0, -0.1,  0.0,     brpNorm[0],  brpNorm[1],  brpNorm[2],  // Node 4 WHITE
			0.1,  0.1,  0.0,     brpNorm[0],  brpNorm[1],  brpNorm[2],  // Node 5 BLUE
			c30, -s30,  0.25,    brpNorm[0],  brpNorm[1],  brpNorm[2],  // Node 8 BLUE
		// * Right Right Point Face
			0.1,  0.1,  0.5,     rrpNorm[0],  rrpNorm[1],  rrpNorm[2],  // Node 2 BLUE
			0.1,  0.1,  0.0,     rrpNorm[0],  rrpNorm[1],  rrpNorm[2], // Node 5 BLUE
			c30, -s30,  0.25,    rrpNorm[0],  rrpNorm[1],  rrpNorm[2],  // Node 8 BLUE 
			]);
}

function getSurfNorm(a, b, c) {
  var bSubA = b.sub(a);
  var cSubA = c.sub(a);
  var ans = new Vector3();
  ans = bSubA.cross(cSubA);
  ans = ans.normalize();

  return ans.elements;
}

function cube() {
  // +y
  var frontNorm = new Float32Array(getSurfNorm(new Vector3([-1.0,  1.0, -1.0]),
                                              new Vector3([-1.0,  1.0,  1.0]),
                                              new Vector3([1.0,  1.0,  1.0])));
  // +x
  var rightNorm = new Float32Array(getSurfNorm(new Vector3([1.0, -1.0, -1.0]),
                                              new Vector3([1.0,  1.0, -1.0]),
                                              new Vector3([1.0,  1.0,  1.0])));
  // -y
  var backNorm = new Float32Array(getSurfNorm(new Vector3([1.0, -1.0, -1.0]),
                                              new Vector3([1.0, -1.0,  1.0]),
                                              new Vector3([-1.0, -1.0,  1.0])));
  // -x
  var leftNorm = new Float32Array(getSurfNorm(new Vector3([-1.0, -1.0,  1.0]),
                                              new Vector3([-1.0,  1.0,  1.0]),
                                              new Vector3([-1.0,  1.0, -1.0])));
  // +z
  var upperNorm = new Float32Array(getSurfNorm(new Vector3([-1.0,  1.0,  1.0]),
                                              new Vector3([-1.0, -1.0,  1.0]),
                                              new Vector3([1.0, -1.0,  1.0])));
                                        
  var downNorm = new Float32Array(getSurfNorm(new Vector3([1.0,  1.0, -1.0]),
                                              new Vector3([1.0, -1.0, -1.0,]),
                                              new Vector3([-1.0, -1.0, -1.0])));
                      
  //=============================   30   ================================
  cube_v = new Float32Array([
      // +x face:
      1.0, -1.0, -1.0, 	  rightNorm[0],  rightNorm[1],  rightNorm[2],	// Node 3
      1.0,  1.0, -1.0, 	  rightNorm[0],  rightNorm[1],  rightNorm[2],	// Node 2
      1.0,  1.0,  1.0, 	  rightNorm[0],  rightNorm[1],  rightNorm[2],  // Node 4
      
      1.0,  1.0,  1.0, 	  rightNorm[0],  rightNorm[1],  rightNorm[2],	// Node 4
      1.0, -1.0,  1.0, 	  rightNorm[0],  rightNorm[1],  rightNorm[2],	// Node 7
      1.0, -1.0, -1.0, 	  rightNorm[0],  rightNorm[1],  rightNorm[2],	// Node 3
    
      // +y face:
      -1.0,  1.0, -1.0, 	  frontNorm[0],  frontNorm[1],  frontNorm[2],	// Node 1
      -1.0,  1.0,  1.0, 	  frontNorm[0],  frontNorm[1],  frontNorm[2],	// Node 5
      1.0,  1.0,  1.0, 	    frontNorm[0],  frontNorm[1],  frontNorm[2],	// Node 4
    
      1.0,  1.0,  1.0, 	  frontNorm[0],  frontNorm[1],  frontNorm[2],	// Node 4
      1.0,  1.0, -1.0, 	  frontNorm[0],  frontNorm[1],  frontNorm[2],	// Node 2 
      -1.0,  1.0, -1.0,	  frontNorm[0],  frontNorm[1],  frontNorm[2],	// Node 1
    
      // +z face: 
      -1.0,  1.0,  1.0, 	  upperNorm[0],  upperNorm[1],  upperNorm[2],	// Node 5
      -1.0, -1.0,  1.0, 	  upperNorm[0],  upperNorm[1],  upperNorm[2],	// Node 6
      1.0, -1.0,  1.0,  	  upperNorm[0],  upperNorm[1],  upperNorm[2],	// Node 7
    
      1.0, -1.0,  1.0, 	  upperNorm[0],  upperNorm[1],  upperNorm[2],	// Node 7
      1.0,  1.0,  1.0, 	  upperNorm[0],  upperNorm[1],  upperNorm[2],	// Node 4
      -1.0,  1.0,  1.0,	  upperNorm[0],  upperNorm[1],  upperNorm[2],	// Node 5
    
      // -x face: 
      -1.0, -1.0,  1.0, 	  leftNorm[0],  leftNorm[1],  leftNorm[2],	// Node 6	
      -1.0,  1.0,  1.0, 	  leftNorm[0],  leftNorm[1],  leftNorm[2],	// Node 5 
      -1.0,  1.0, -1.0, 	  leftNorm[0],  leftNorm[1],  leftNorm[2],	// Node 1
      
      -1.0,  1.0, -1.0, 	  leftNorm[0],  leftNorm[1],  leftNorm[2],	// Node 1
      -1.0, -1.0, -1.0,	    leftNorm[0],  leftNorm[1],  leftNorm[2],	// Node 0  
      -1.0, -1.0,  1.0, 	  leftNorm[0],  leftNorm[1],  leftNorm[2],	// Node 6  
      
      // -y face: 
      1.0, -1.0, -1.0, 	  backNorm[0],  backNorm[1],  backNorm[2],	// Node 3
      1.0, -1.0,  1.0, 	  backNorm[0],  backNorm[1],  backNorm[2],	// Node 7
      -1.0, -1.0,  1.0, 	 backNorm[0],  backNorm[1],  backNorm[2],	// Node 6
    
      -1.0, -1.0,  1.0, 	  backNorm[0],  backNorm[1],  backNorm[2],	// Node 6
      -1.0, -1.0, -1.0, 	  backNorm[0],  backNorm[1],  backNorm[2],	// Node 0
      1.0, -1.0, -1.0, 	  backNorm[0],  backNorm[1],  backNorm[2],	// Node 3
    
      // -z face: 
      1.0,  1.0, -1.0, 	  downNorm[0],  downNorm[1],  downNorm[2],	// Node 2
      1.0, -1.0, -1.0, 	  downNorm[0],  downNorm[1],  downNorm[2],	// Node 3
      -1.0, -1.0, -1.0, 	  downNorm[0],  downNorm[1],  downNorm[2],	// Node 0		
    
      -1.0, -1.0, -1.0, 	  downNorm[0],  downNorm[1],  downNorm[2],	// Node 0
      -1.0,  1.0, -1.0,	  downNorm[0],  downNorm[1],  downNorm[2],	// Node 1
      1.0,  1.0, -1.0, 	  downNorm[0],  downNorm[1],  downNorm[2],
    ]);
  }

function makePyramid() {
    var frontNorm = new Float32Array(getSurfNorm(new Vector3([0.0, 0.0, 0.0]),
                                                 new Vector3([1.0, 0.0, 0.0]),
                                                 new Vector3([0.5, 1.0, -0.5])));
                                                      
    var rightNorm = new Float32Array(getSurfNorm(new Vector3([1.0, 0.0, 0.0]),
                                                 new Vector3([1.0, 0.0, -1.0]),
                                                 new Vector3([0.5, 1.0, -0.5])));

    var backNorm = new Float32Array(getSurfNorm(new Vector3([1.0, 0.0, -1.0]),
                                                new Vector3([0.0, 0.0, -1.0]),
                                                new Vector3([0.5, 1.0, -0.5])));

    var leftNorm = new Float32Array(getSurfNorm(new Vector3([0.0, 0.0, -1.0]),
                                                new Vector3([0.0, 0.0, 0.0]),
                                                new Vector3([0.5, 1.0, -0.5])));
 
  	pyrVerts = new Float32Array([
			//! ------------------------ Pyramid ------------------------

			//* Bottom Face
			0.0,  0.0,  0.0,    0.0,  0.0,  -1.0, // Node 0 GREEN
			0.0,  0.0, -1.0,    0.0,  0.0,  -1.0, // Node 1 RED
			1.0,  0.0, -1.0,    0.0,  0.0,  -1.0, // Node 2 BLUE
			0.0,  0.0,  0.0,    0.0,  0.0,  -1.0, // Node 0 GREEN
			1.0,  0.0, -1.0,    0.0,  0.0,  -1.0, // Node 2 BLUE
			1.0,  0.0,  0.0,    0.0,  0.0,  -1.0, // Node 3 MAGENTA
			//* Front Face
			0.0,  0.0,  0.0,    frontNorm[0],  frontNorm[1],  frontNorm[2], // Node 3 MAGENTA
			1.0,  0.0,  0.0,    frontNorm[0],  frontNorm[1],  frontNorm[2], // Node 0 GREEN
			0.5,  1.0, -0.5,    frontNorm[0],  frontNorm[1],  frontNorm[2], // Node 4 CYAN
			//* Right Face
			1.0,  0.0,  0.0,    rightNorm[0],  rightNorm[1],  rightNorm[2], // Node 0 GREEN
			1.0,  0.0, -1.0,    rightNorm[0],  rightNorm[1],  rightNorm[2], // Node 3 MAGENTA
			0.5,  1.0, -0.5,    rightNorm[0],  rightNorm[1],  rightNorm[2], // Node 4 CYAN
			//* Back Face
			1.0,  0.0, -1.0,    backNorm[0],  backNorm[1],  backNorm[2], // Node 0 GREEN
			0.0,  0.0, -1.0,    backNorm[0],  backNorm[1],  backNorm[2], // Node 3 MAGENTA
			0.5,  1.0, -0.5,    backNorm[0],  backNorm[1],  backNorm[2], // Node 4 CYAN
			//* Left Face
			0.0,  0.0, -1.0,    leftNorm[0],  leftNorm[1],  leftNorm[2], // Node 0 GREEN
			0.0,  0.0,  0.0,    leftNorm[0],  leftNorm[1],  leftNorm[2], // Node 3 MAGENTA
			0.5,  1.0, -0.5,    leftNorm[0],  leftNorm[1],  leftNorm[2],
		]);
}

function makeSphere() {
  var slices = 55;		// # of slices of the sphere along the z axis. >=3 req'd
  var sliceVerts = 55;	// # of vertices around the top edge of the slice
  var topColr = new Float32Array([0.5, 0.5, 0.5]);	// North Pole:
  var equColr = new Float32Array([.3, .3, .3]);	// Equator:    
  var botColr = new Float32Array([1, 1, 1]);	// South Pole: 
  var sliceAngle = Math.PI / slices;	// lattitude angle spanned by one slice.
  sphVerts = new Float32Array(((slices * 2 * sliceVerts) - 2) * floatsPerVertex);
  var cos0 = 0.0;					// sines,cosines of slice's top, bottom edge.
  var sin0 = 0.0;
  var cos1 = 0.0;
  var sin1 = 0.0;
  var j = 0;							// initialize our array index
  var isLast = 0;
  var isFirst = 1;
  for (s = 0; s < slices; s++) {	// for each slice of the sphere,
      // find sines & cosines for top and bottom of this slice
      if (s == 0) {
          isFirst = 1;	// skip 1st vertex of 1st slice.
          cos0 = 1.0; 	// initialize: start at north pole.
          sin0 = 0.0;
      }
      else {					// otherwise, new top edge == old bottom edge
          isFirst = 0;
          cos0 = cos1;
          sin0 = sin1;
      }								// & compute sine,cosine for new bottom edge.
      cos1 = Math.cos((s + 1) * sliceAngle);
      sin1 = Math.sin((s + 1) * sliceAngle);
      // go around the entire slice, generating TRIANGLE_STRIP verts
      // (Note we don't initialize j; grows with each new attrib,vertex, and slice)
      if (s == slices - 1) isLast = 1;	// skip last vertex of last slice.
      for (v = isFirst; v < 2 * sliceVerts - isLast; v++, j += floatsPerVertex) {
          if (v % 2 == 0) {				// put even# vertices at the the slice's top edge
              sphVerts[j] = sin0 * Math.cos(Math.PI * (v) / sliceVerts);
              sphVerts[j + 1] = sin0 * Math.sin(Math.PI * (v) / sliceVerts);
              sphVerts[j + 2] = cos0;
          }
          else { 	// put odd# vertices around the slice's lower edge;
              // x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
              // 					theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
              sphVerts[j] = sin1 * Math.cos(Math.PI * (v - 1) / sliceVerts);		// x
              sphVerts[j + 1] = sin1 * Math.sin(Math.PI * (v - 1) / sliceVerts);		// y
              sphVerts[j + 2] = cos1;			
          }
          if (s == 0) {	// finally, set some interesting colors for vertices:

              sphVerts[j + 3] = sin1 * Math.cos(Math.PI * (v - 1) / sliceVerts);
              sphVerts[j + 4] = sin1 * Math.sin(Math.PI * (v - 1) / sliceVerts);
              sphVerts[j + 5] = cos1;
          }
          else if (s == slices - 1) {
              sphVerts[j + 3] = sin1 * Math.cos(Math.PI * (v - 1) / sliceVerts);
              sphVerts[j + 4] = sin1 * Math.sin(Math.PI * (v - 1) / sliceVerts);
              sphVerts[j + 5] = cos1;
          }
          else {
              sphVerts[j + 3] = sin1 * Math.cos(Math.PI * (v - 1) / sliceVerts);
              sphVerts[j + 4] = sin1 * Math.sin(Math.PI * (v - 1) / sliceVerts);
              sphVerts[j + 5] = cos1;
          }

      }
  }
}
// ! For GLSL syntax highlighting using JavaScript template strings
const glsl = x => x;
//=============================================================================
//=============================================================================
function VBObox1() { 
	this.VERT_SRC =	//--------------------- VERTEX SHADER source code 
  glsl` 
  precision highp float;
  precision highp int;

  // ? Struct Definitions
  struct MatlT {
    vec3 Ke; //* emissive - surface glow
    vec3 Ka; //* ambient reflectance
    vec3 Kd; //* diffuse reflectance
    vec3 Ks; //* specular reflectance
    int Kshiny; //* specular exponent
  };

  struct LampT {
    vec3 pos;
    vec3 Ia; //* ambient light source strength
    vec3 Id; //* diffuse light source strength
    vec3 Is; //* specular light source strength
  };
  
  // ? Uniforms 
  uniform MatlT u_MatlSet[1];
  uniform LampT u_LampSet[1];
  uniform mat4 u_ModelMatrix, u_NormalMatrix, u_MvpMatrix;
  uniform vec3 u_eyePosWorld;
  uniform bool u_isBlinn;

  // ? Attributes
  attribute vec4 a_Pos1;
  attribute vec4 a_Norm1;

  // ? Varying
  varying vec3 v_Kd;
  varying vec4 v_Pos1;
  varying vec3 v_Norm1;
  varying vec4 v_Colr1;

  // ? Main program 
  void main() {
    gl_Position = u_MvpMatrix * a_Pos1;
    v_Pos1 = u_ModelMatrix * a_Pos1;
    
    v_Norm1 = normalize(vec3(u_NormalMatrix * a_Norm1));
    v_Kd = u_MatlSet[0].Kd;
    vec3 N = normalize(v_Norm1);
    vec3 L = normalize(u_LampSet[0].pos - vec3(v_Pos1));
    vec3 V = normalize(u_eyePosWorld - vec3(v_Pos1));
    // ? Lambertian's cosine law
    float nDotL = max(dot(L, N), 0.0);
    float specular = 0.0;

    if(!u_isBlinn) {
      vec3 R = reflect(-L, N);
      float specAngle = max(dot(R, V), 0.0);
      specular = pow(specAngle, float(u_MatlSet[0].Kshiny));
    } else {
      vec3 H = normalize(L + V);
      float nDotH = max(dot(H, N), 0.0);
      specular = pow(nDotH, float(u_MatlSet[0].Kshiny));
    }
    vec3 emissive = u_MatlSet[0].Ke;
    vec3 ambient = u_LampSet[0].Ia * u_MatlSet[0].Ka;
    vec3 diffuse = u_LampSet[0].Id * v_Kd * nDotL;
    vec3 spec = u_LampSet[0].Is * u_MatlSet[0].Ks * specular;

  	v_Colr1 = vec4(emissive + ambient + diffuse + spec, 1.0);
   }`;

 // SHADED, sphere-like dots:
  this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
  glsl`
  #ifdef GL_ES 
  precision mediump float;
  #endif
  varying vec4 v_Colr1;
  void main() {
    gl_FragColor = v_Colr1; 
  }`;
  cube();
  makeSphere();
  makePyramid();
  makeConcaveHex(); 

  var mySize = sphVerts.length + pyrVerts.length + concaveHexVerts.length + cube_v.length;

  this.vboContents = new Float32Array(mySize);
  sphStart = 0;
  for(i = 0, j = 0; j < sphVerts.length; i++, j++) {
    this.vboContents[i] = sphVerts[j];
  }
  pyrStart = i;
  for(j = 0; j < pyrVerts.length; i++, j++) {
    this.vboContents[i] = pyrVerts[j];
  }
  concaveHexStart = i;
  for(j=0; j < concaveHexVerts.length; i++, j++) {
    this.vboContents[i] = concaveHexVerts[j];
  }
  cube_vStart = i	
	for(j=0; j<cube_v.length; i++, j++){  // store the axis
		this.vboContents[i] = cube_v[j];
	}	
  
	this.vboVerts = this.vboContents.length / floatsPerVertex;							// # of vertices held in 'vboContents' array;
	this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;  
	                              // bytes req'd by 1 vboContents array element;
																// (why? used to compute stride and offset 
																// in bytes for vertexAttribPointer() calls)
  this.vboBytes = this.vboContents.length * this.FSIZE;               
                                // (#  of floats in vboContents array) * 
                                // (# of bytes/float).
	this.vboStride = this.vboBytes / this.vboVerts;     
	                              // (== # of bytes to store one complete vertex).
	                              // From any attrib in a given vertex in the VBO, 
	                              // move forward by 'vboStride' bytes to arrive 
	                              // at the same attrib for the next vertex.
	                               
	            //----------------------Attribute sizes
  this.vboFcount_a_Pos1 =  3;    // # of floats in the VBO needed to store the
                                // attribute named a_Pos1. (4: x,y,z,w values)
  this.vboFcount_a_Norm1 = 3;  // # of floats for this attrib (just one!)   
  console.assert(((this.vboFcount_a_Pos1 +     // check the size of each and 
                  this.vboFcount_a_Norm1) *   // every attribute in our VBO
                  this.FSIZE == this.vboStride), // for agreeement with'stride'
                  "Uh oh! VBObox1.vboStride disagrees with attribute-size values!");
                  
              //----------------------Attribute offsets
	this.vboOffset_a_Pos1 = 0;    //# of bytes from START of vbo to the START
	                              // of 1st a_Pos1 attrib value in vboContents[]
                                // == 4 floats * bytes/float
                                //# of bytes from START of vbo to the START
                                // of 1st a_Colr1 attrib value in vboContents[]
  this.vboOffset_a_Norm1 = (this.vboFcount_a_Pos1) * this.FSIZE; 
	            //-----------------------GPU memory locations:                                
	this.vboLoc;									// GPU Location for Vertex Buffer Object, 
	                              // returned by gl.createBuffer() function call
	this.shaderLoc;								// GPU Location for compiled Shader-program  
	                            	// set by compile/link of VERT_SRC and FRAG_SRC.
								          //------Attribute locations in our shaders:
	this.a_Pos1Loc;							  // GPU location: shader 'a_Pos1' attribute
  this.a_Norm1Loc;              // GPU location: shader 'a_Norm1' attribute
	
	            //---------------------- Uniform locations &values in our shaders
  this.ModelMatrix = new Matrix4();	// Transforms CVV axes to model axes.
  this.NormalMatrix = new Matrix4();
  this.MvpMatrix = new Matrix4();
  this.eyePosWorld = new Float32Array(3); 

  this.u_NormalMatrixLoc;           // GPU location for u_NormalMatrix uniform
  this.u_ModelMatrixLoc;						// GPU location for u_ModelMatrix uniform
  this.u_MvpMatrixLoc;
  this.u_eyePosWorldLoc;
  this.u_isBlinnLoc;

  this.lamp1 = new LightsT();

  this.matlSel;
  this.matl1 = new Material();
};

VBObox1.prototype.init = function() {
//==============================================================================
// Prepare the GPU to use all vertices, GLSL shaders, attributes, & uniforms 
// kept in this VBObox. (This function usually called only once, within main()).
// Specifically:
// a) Create, compile, link our GLSL vertex- and fragment-shaders to form an 
//  executable 'program' stored and ready to use inside the GPU.  
// b) create a new VBO object in GPU memory and fill it by transferring in all
//  the vertex data held in our Float32array member 'VBOcontents'. 
// c) Find & save the GPU location of all our shaders' attribute-variables and 
//  uniform-variables (needed by switchToMe(), adjust(), draw(), reload(), etc.)
// -------------------
// CAREFUL!  before you can draw pictures using this VBObox contents, 
//  you must call this VBObox object's switchToMe() function too!
//--------------------
// a) Compile,link,upload shaders-----------------------------------------------
	this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
	if (!this.shaderLoc) {
    console.log(this.constructor.name + 
    						'.init() failed to create executable Shaders on the GPU. Bye!');
    return;
  }
// CUTE TRICK: let's print the NAME of this VBObox object: tells us which one!
//  else{console.log('You called: '+ this.constructor.name + '.init() fcn!');}

  gl.program = this.shaderLoc;		// (to match cuon-utils.js -- initShaders())
  
// b) Create VBO on GPU, fill it------------------------------------------------
	this.vboLoc = gl.createBuffer();	
  if (!this.vboLoc) {
    console.log(this.constructor.name + 
    						'.init() failed to create VBO in GPU. Bye!'); 
    return;
  }
  
  // Specify the purpose of our newly-created VBO on the GPU.  Your choices are:
  //	== "gl.ARRAY_BUFFER" : the VBO holds vertices, each made of attributes 
  // (positions, colors, normals, etc), or 
  //	== "gl.ELEMENT_ARRAY_BUFFER" : the VBO holds indices only; integer values 
  // that each select one vertex from a vertex array stored in another VBO.
  gl.bindBuffer(gl.ARRAY_BUFFER,	      // GLenum 'target' for this GPU buffer 
  								this.vboLoc);				  // the ID# the GPU uses for this buffer.
  											
  // Fill the GPU's newly-created VBO object with the vertex data we stored in
  //  our 'vboContents' member (JavaScript Float32Array object).
  //  (Recall gl.bufferData() will evoke GPU's memory allocation & management: 
  //	 use gl.bufferSubData() to modify VBO contents without changing VBO size)
  gl.bufferData(gl.ARRAY_BUFFER, 			  // GLenum target(same as 'bindBuffer()')
 					 				this.vboContents, 		// JavaScript Float32Array
  							 	gl.STATIC_DRAW);			// Usage hint.  
  //	The 'hint' helps GPU allocate its shared memory for best speed & efficiency
  //	(see OpenGL ES specification for more info).  Your choices are:
  //		--STATIC_DRAW is for vertex buffers rendered many times, but whose 
  //				contents rarely or never change.
  //		--DYNAMIC_DRAW is for vertex buffers rendered many times, but whose 
  //				contents may change often as our program runs.
  //		--STREAM_DRAW is for vertex buffers that are rendered a small number of 
  // 			times and then discarded; for rapidly supplied & consumed VBOs.

  this.a_Pos1Loc = gl.getAttribLocation(this.shaderLoc, 'a_Pos1');
  this.a_Norm1Loc = gl.getAttribLocation(this.shaderLoc, 'a_Norm1');
  // c2) Find All Uniforms:-----------------------------------------------------
  //Get GPU storage location for each uniform var used in our shader programs: 
  this.u_eyePosWorldLoc = gl.getUniformLocation(this.shaderLoc, 'u_eyePosWorld');
  this.u_MvpMatrixLoc = gl.getUniformLocation(this.shaderLoc, 'u_MvpMatrix');
  this.u_ModelMatrixLoc = gl.getUniformLocation(this.shaderLoc, 'u_ModelMatrix');
  this.u_NormalMatrixLoc = gl.getUniformLocation(this.shaderLoc, 'u_NormalMatrix');
  this.u_isBlinnLoc = gl.getUniformLocation(this.shaderLoc, 'u_isBlinn');

  if (!this.u_ModelMatrixLoc || !this.u_MvpMatrixLoc 
  || !this.u_NormalMatrixLoc || !this.u_eyePosWorldLoc) {
    console.log(this.constructor.name + ' failed to get one or more \'matrix\' uniform locations');
  }

  this.lamp1.u_pos = gl.getUniformLocation(this.shaderLoc,  'u_LampSet[0].pos');
  this.lamp1.u_diff = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[0].Id');
  this.lamp1.u_ambi = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[0].Ia');
  this.lamp1.u_spec = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[0].Is');

  if( !this.lamp1.u_pos || !this.lamp1.u_diff 
  || !this.lamp1.u_ambi || !this.lamp1.u_spec) {
    console.log(this.constructor.name + ' failed to get one or more lighting uniform storage locations.');
    return;
  }

  this.matl1.uLoc_Ke = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].Ke');
  this.matl1.uLoc_Ka = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].Ka');
  this.matl1.uLoc_Kd = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].Kd');
  this.matl1.uLoc_Ks = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].Ks');
  this.matl1.uLoc_Kshiny = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].Kshiny');
  if(!this.matl1.uLoc_Ke || !this.matl1.uLoc_Ka || !this.matl1.uLoc_Kd|| !this.matl1.uLoc_Kshiny) {
    console.log('Failed to get one or more reflectance storage locations');
    return;
  }  
  

}

VBObox1.prototype.switchToMe = function () {
  gl.useProgram(this.shaderLoc);	
  gl.uniform1i(this.u_isBlinnLoc, g_isBlinn);
  gl.uniform3fv(this.u_eyePosWorldLoc, this.eyePosWorld);

  this.lamp1.I_pos.elements.set([g_lightPosX, g_lightPosY, g_lightPosZ]);
  this.lamp1.I_ambi.elements.set([g_lightAmbiR, g_lightAmbiG, g_lightAmbiB]); 
  this.lamp1.I_diff.elements.set([g_lightDiffR, g_lightDiffG, g_lightDiffB]); //* set diffuse light (white)
  this.lamp1.I_spec.elements.set([g_lightSpecR, g_lightSpecG, g_lightSpecB]); //* set specular light (white)

  gl.uniform3fv(this.lamp1.u_pos, this.lamp1.I_pos.elements.slice(0,3));
  gl.uniform3fv(this.lamp1.u_ambi, this.lamp1.I_ambi.elements);
  gl.uniform3fv(this.lamp1.u_diff, this.lamp1.I_diff.elements);
  gl.uniform3fv(this.lamp1.u_spec, this.lamp1.I_spec.elements);

  this.matl1.setMatl(parseInt(g_currMatl));

  gl.uniform3fv(this.matl1.uLoc_Ke, this.matl1.K_emit.slice(0,3)); 
  gl.uniform3fv(this.matl1.uLoc_Ka, this.matl1.K_ambi.slice(0,3)); 
  gl.uniform3fv(this.matl1.uLoc_Kd, this.matl1.K_diff.slice(0,3));
  gl.uniform3fv(this.matl1.uLoc_Ks, this.matl1.K_spec.slice(0,3));
  gl.uniform1i(this.matl1.uLoc_Kshiny, parseInt(g_shiny, 10)); 
    
	gl.bindBuffer(gl.ARRAY_BUFFER,	    // GLenum 'target' for this GPU buffer 
										this.vboLoc);			// the ID# the GPU uses for our VBO.

  gl.vertexAttribPointer(
		this.a_Pos1Loc,//index == ID# for the attribute var in GLSL shader pgm;
		this.vboFcount_a_Pos1, // # of floats used by this attribute: 1,2,3 or 4?
		gl.FLOAT,		  // type == what data type did we use for those numbers?
		false,				// isNormalized == are these fixed-point values that we need
		this.vboStride,// Stride == #bytes we must skip in the VBO to move from the
		this.vboOffset_a_Pos1);						
  gl.vertexAttribPointer(this.a_Norm1Loc,this.vboFcount_a_Norm1, 
                         gl.FLOAT, false, 
							           this.vboStride,	this.vboOffset_a_Norm1);	
  //-- Enable this assignment of the attribute to its' VBO source:
  gl.enableVertexAttribArray(this.a_Pos1Loc);
  gl.enableVertexAttribArray(this.a_Norm1Loc);
// if(!initArrayBuffer(gl, this.shaderLoc,'a_Pos1', new Float32Array(this.vboPositions), gl.FLOAT, 3)) return -1;
// if(!initArrayBuffer(gl, this.shaderLoc, 'a_Norm1', new Float32Array(this.vboPositions), gl.FLOAT, 3)) return -1;
}

VBObox1.prototype.isReady = function() {
var isOK = true;
  if(gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc)  {
    console.log(this.constructor.name + 
    						'.isReady() false: shader program at this.shaderLoc not in use!');
    isOK = false;
  }
  if(gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
      console.log(this.constructor.name + 
  						'.isReady() false: vbo at this.vboLoc not in use!');
    isOK = false;
  }
  return isOK;
}

VBObox1.prototype.adjust = function() {
  if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name + 
  						'.adjust() call you needed to call this.switchToMe()!!');
  }
  this.eyePosWorld.set([g_camX, g_camY, g_camZ]); // set the eye position to the position of our camera
  this.ModelMatrix.setIdentity(); // sanity check
  this.MvpMatrix.setIdentity();
  this.MvpMatrix.set(g_worldMat);
  this.ModelMatrix.translate(-1.0, 2.0, 0.0);
  this.ModelMatrix.scale(0.9, 0.9, 0.9);
	this.ModelMatrix.rotate(140.0, 0.0, 0.0, 1.0);
	this.ModelMatrix.rotate(90, -1, 0, 0);
	this.ModelMatrix.rotate(g_angle01, 0.0, 0.0, 1.0);
	this.ModelMatrix.translate(0.0, -1.0, 0.0);
	this.ModelMatrix.rotate(g_angleLink1, 0.0, 0.5, 0.0);
	this.NormalMatrix.setInverseOf(this.ModelMatrix);
  this.NormalMatrix.transpose();
  // *: Update our world matrix with modelMatrix values
  this.MvpMatrix.multiply(this.ModelMatrix);
  gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	false, this.ModelMatrix.elements);									
  gl.uniformMatrix4fv(this.u_NormalMatrixLoc, false, this.NormalMatrix.elements);
  gl.uniformMatrix4fv(this.u_MvpMatrixLoc, false, this.MvpMatrix.elements);
	// * First link
  gl.drawArrays(gl.TRIANGLES, concaveHexStart/floatsPerVertex, concaveHexVerts.length/floatsPerVertex); // Draw a Concave Hexagon
  this.MvpMatrix.set(g_worldMat);
  this.ModelMatrix.rotate(g_angleLink2, 0.0, 0.0, 1.0);
  this.ModelMatrix.translate(0.0, -1.0, 0.0);
  pushMatrix(this.ModelMatrix);
  this.NormalMatrix.setInverseOf(this.ModelMatrix);
  this.NormalMatrix.transpose();
  // *: Update our world matrix with modelMatrix values
  this.MvpMatrix.multiply(this.ModelMatrix);
  gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	false, this.ModelMatrix.elements);									
  gl.uniformMatrix4fv(this.u_NormalMatrixLoc, false, this.NormalMatrix.elements);
  gl.uniformMatrix4fv(this.u_MvpMatrixLoc, false, this.MvpMatrix.elements);
  // * Second link
  gl.drawArrays(gl.TRIANGLES, concaveHexStart/floatsPerVertex, concaveHexVerts.length/floatsPerVertex);
  this.ModelMatrix = popMatrix();
  pushMatrix(this.ModelMatrix);
  this.MvpMatrix.set(g_worldMat);
  this.ModelMatrix.rotate(g_angleLink3, 0.0, 0.0, 1.0);
  this.ModelMatrix.translate(0.0, -1.0, 0.0);
  this.NormalMatrix.setInverseOf(this.ModelMatrix);
  this.NormalMatrix.transpose();
  // *: Update our world matrix with modelMatrix values
  this.MvpMatrix.multiply(this.ModelMatrix);
  gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	false, this.ModelMatrix.elements);									
  gl.uniformMatrix4fv(this.u_NormalMatrixLoc, false, this.NormalMatrix.elements);
  gl.uniformMatrix4fv(this.u_MvpMatrixLoc, false, this.MvpMatrix.elements);
  // * Third Link
  gl.drawArrays(gl.TRIANGLES, concaveHexStart/floatsPerVertex, concaveHexVerts.length/floatsPerVertex);





  // **************** Sphere *****************
  // ! Draw Sphere
  this.MvpMatrix.set(g_worldMat);
  this.ModelMatrix.rotate(g_angleNow1, 0, 0, 1);	// spin drawing axes,
  this.ModelMatrix.setTranslate(0, 0, 0);	// then translate them.
  // * Compute values for Normal matrix
  this.NormalMatrix.setInverseOf(this.ModelMatrix);
  this.NormalMatrix.transpose();
  // *: Update our world matrix with modelMatrix values
  this.MvpMatrix.multiply(this.ModelMatrix);
  gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	false, this.ModelMatrix.elements);									
  gl.uniformMatrix4fv(this.u_NormalMatrixLoc, false, this.NormalMatrix.elements);
  gl.uniformMatrix4fv(this.u_MvpMatrixLoc, false, this.MvpMatrix.elements);
  gl.drawArrays(gl.TRIANGLE_STRIP, sphStart / floatsPerVertex, sphVerts.length / floatsPerVertex);



  // **************** Pyramid *****************
  this.MvpMatrix.set(g_worldMat);
  this.ModelMatrix.setIdentity();
	pushMatrix(this.ModelMatrix);
  this.ModelMatrix.translate(-2.0, -2.0, 0.0);
  this.ModelMatrix.rotate(90.0, 1, 0, 0);
  this.ModelMatrix.rotate(g_angleNow1, 0, 1, 0);
  this.ModelMatrix.translate(-0.5, 0.0, 0.5);
  this.NormalMatrix.setInverseOf(this.ModelMatrix);
  this.NormalMatrix.transpose();
  this.MvpMatrix.multiply(this.ModelMatrix);
  gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	false, this.ModelMatrix.elements);									
  gl.uniformMatrix4fv(this.u_NormalMatrixLoc, false, this.NormalMatrix.elements);
  gl.uniformMatrix4fv(this.u_MvpMatrixLoc, false, this.MvpMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, 
                pyrStart/floatsPerVertex, 
                pyrVerts.length/floatsPerVertex);



  // **************** Cube *****************
  this.MvpMatrix.set(g_worldMat);
  this.ModelMatrix.setIdentity();
	pushMatrix(this.ModelMatrix);
  this.ModelMatrix.scale(0.5,0.5,0.5);
  this.ModelMatrix.translate(1.0, 5.0, 1.0);
  this.ModelMatrix.rotate(90.0, 1, 0, 0);
  this.ModelMatrix.rotate(g_angleNow1, 0, 1, 1);
  this.ModelMatrix.translate(-0.5, 0.0, 0.5);
  this.NormalMatrix.setInverseOf(this.ModelMatrix);
  this.NormalMatrix.transpose();
  this.MvpMatrix.multiply(this.ModelMatrix);
  gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	false, this.ModelMatrix.elements);									
  gl.uniformMatrix4fv(this.u_NormalMatrixLoc, false, this.NormalMatrix.elements);
  gl.uniformMatrix4fv(this.u_MvpMatrixLoc, false, this.MvpMatrix.elements);
  gl.drawArrays(gl.TRIANGLES, 
                cube_vStart/floatsPerVertex, 
                cube_v.length/floatsPerVertex);
}

VBObox1.prototype.draw = function() {
//=============================================================================
// Send commands to GPU to select and render current VBObox contents.

  // check: was WebGL context set to use our VBO & shader program?
  if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name + 
  						'.draw() call you needed to call this.switchToMe()!!');
  }
  
  // ----------------------------Draw the contents of the currently-bound VBO:
}


VBObox1.prototype.reload = function() {
//=============================================================================
// Over-write current values in the GPU for our already-created VBO: use 
// gl.bufferSubData() call to re-transfer some or all of our Float32Array 
// contents to our VBO without changing any GPU memory allocations.

 gl.bufferSubData(gl.ARRAY_BUFFER, 	// GLenum target(same as 'bindBuffer()')
                  0,                  // byte offset to where data replacement
                                      // begins in the VBO.
 					 				this.vboContents);   // the JS source-data array used to fill VBO
}

/*
VBObox1.prototype.empty = function() {
//=============================================================================
// Remove/release all GPU resources used by this VBObox object, including any 
// shader programs, attributes, uniforms, textures, samplers or other claims on 
// GPU memory.  However, make sure this step is reversible by a call to 
// 'restoreMe()': be sure to retain all our Float32Array data, all values for 
// uniforms, all stride and offset values, etc.
//
//
// 		********   YOU WRITE THIS! ********
//
//
//
}

VBObox1.prototype.restore = function() {
//=============================================================================
// Replace/restore all GPU resources used by this VBObox object, including any 
// shader programs, attributes, uniforms, textures, samplers or other claims on 
// GPU memory.  Use our retained Float32Array data, all values for  uniforms, 
// all stride and offset values, etc.
//
//
// 		********   YOU WRITE THIS! ********
//
//
//
}
*/

//=============================================================================
//=============================================================================
function VBObox2() {
    this.VERT_SRC =	//--------------------- VERTEX SHADER source code 
    glsl` 
    precision highp float;
    precision highp int;
  
    // ? Struct Definitions
    struct MatlT {
      vec3 Ke; //* emissive - surface glow
      vec3 Ka; //* ambient reflectance
      vec3 Kd; //* diffuse reflectance
      vec3 Ks; //* specular reflectance
      int Kshiny; //* specular exponent
    };

    
    // ? Uniforms 
    uniform MatlT u_MatlSet[1];
    uniform mat4 u_ModelMatrix, u_NormalMatrix, u_MvpMatrix;
  
    // ? Attributes
    attribute vec4 a_Pos2;
    attribute vec4 a_Norm2;
  
    // ? Varying
    varying vec3 v_Kd;
    varying vec4 v_Pos2;
    varying vec3 v_Norm2;
  
    // ? Main program 
    void main() {
      gl_Position = u_MvpMatrix * a_Pos2;
      v_Pos2 = u_ModelMatrix * a_Pos2;
      v_Norm2 = normalize(vec3(u_NormalMatrix * a_Norm2));
      v_Kd = u_MatlSet[0].Kd;
     }`;
  
   // SHADED, sphere-like dots:
    this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
    glsl`
    #ifdef GL_ES 
    precision highp float;
    precision highp int;
    #endif

    // ? Struct definitions
    struct MatlT {
      vec3 Ke; //* emissive - surface glow
      vec3 Ka; //* ambient reflectance
      vec3 Kd; //* diffuse reflectance
      vec3 Ks; //* specular reflectance
      int Kshiny; //* specular exponent
    };

    struct LampT {
      vec3 pos;
      vec3 Ia; //* ambient light source strength
      vec3 Id; //* diffuse light source strength
      vec3 Is; //* specular light source strength
    };
    
    // ? Uniforms
    uniform LampT u_LampSet[1];
    uniform MatlT u_MatlSet[1];
    uniform vec3 u_eyePosWorld;
    uniform bool u_isBlinn;
    
    // ? Varying
    varying vec3 v_Norm2;
    varying vec4 v_Pos2;
    varying vec3 v_Kd;

    void main() {
      vec3 N = normalize(v_Norm2);
      vec3 L = normalize(u_LampSet[0].pos - vec3(v_Pos2));
      vec3 V = normalize(u_eyePosWorld - vec3(v_Pos2));
      vec3 R = reflect(-L, N);
      float nDotL = max(dot(L, N), 0.0);
      float specular = 0.0;

      if(!u_isBlinn) {
        float specAngle = max(dot(R, V), 0.0);
        specular = pow(specAngle, float(u_MatlSet[0].Kshiny));
      } else {
        vec3 H = normalize(L + V);
        float nDotH = max(dot(H, N), 0.0);
        specular = pow(nDotH, float(u_MatlSet[0].Kshiny));
      }

    
      vec3 emissive = u_MatlSet[0].Ke;
      vec3 ambient = u_LampSet[0].Ia * u_MatlSet[0].Ka;
      vec3 diffuse = u_LampSet[0].Id * v_Kd * nDotL;
      vec3 spec = u_LampSet[0].Is * u_MatlSet[0].Ks * specular;
      gl_FragColor = vec4(emissive + ambient + diffuse + spec, 1.0);
    }`;
  
    // 
    
    cube();
    makeSphere();
    makePyramid();
    makeConcaveHex(); 
  
    var mySize = sphVerts.length + pyrVerts.length + concaveHexVerts.length + cube_v.length;
  
    this.vboContents = new Float32Array(mySize);
    sphStart = 0;
    for(i = 0, j = 0; j < sphVerts.length; i++, j++) {
      this.vboContents[i] = sphVerts[j];
    }
    pyrStart = i;
    for(j = 0; j < pyrVerts.length; i++, j++) {
      this.vboContents[i] = pyrVerts[j];
    }
    concaveHexStart = i;
    for(j=0; j < concaveHexVerts.length; i++, j++) {
      this.vboContents[i] = concaveHexVerts[j];
    }
    cube_vStart = i	
    for(j=0; j<cube_v.length; i++, j++){  // store the axis
      this.vboContents[i] = cube_v[j];
    }	
  

    this.vboVerts = this.vboContents.length / floatsPerVertex;							// # of vertices held in 'vboContents' array;
    this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;  
                                  // bytes req'd by 1 vboContents array element;
    															// (why? used to compute stride and offset 
    															// in bytes for vertexAttribPointer() calls)
    this.vboBytes = this.vboContents.length * this.FSIZE;               
                                  // (#  of floats in vboContents array) * 
                                  // (# of bytes/float).
    this.vboStride = this.vboBytes / this.vboVerts;     
                                  // (== # of bytes to store one complete vertex).
                                  // From any attrib in a given vertex in the VBO, 
                                  // move forward by 'vboStride' bytes to arrive 
                                  // at the same attrib for the next vertex.
                                   
                //----------------------Attribute sizes
    this.vboFcount_a_Pos2 =  3;    // # of floats in the VBO needed to store the
                                  // attribute named a_Pos1. (4: x,y,z,w values)
    this.vboFcount_a_Norm2 = 3;  // # of floats for this attrib (just one!)   
    console.assert(((this.vboFcount_a_Pos2 +     // check the size of each and 
                    this.vboFcount_a_Norm2) *   // every attribute in our VBO
                    this.FSIZE == this.vboStride), // for agreeement with'stride'
                    "Uh oh! VBObox1.vboStride disagrees with attribute-size values!");
                    
                //----------------------Attribute offsets
    this.vboOffset_a_Pos2 = 0;    //# of bytes from START of vbo to the START
                                  // of 1st a_Pos1 attrib value in vboContents[]
                                  // == 4 floats * bytes/float
                                  //# of bytes from START of vbo to the START
                                  // of 1st a_Colr1 attrib value in vboContents[]
    this.vboOffset_a_Norm2 = (this.vboFcount_a_Pos2) * this.FSIZE; 
                //-----------------------GPU memory locations:                                
    this.vboLoc;									// GPU Location for Vertex Buffer Object, 
                                  // returned by gl.createBuffer() function call
    this.shaderLoc;								// GPU Location for compiled Shader-program  
                                  // set by compile/link of VERT_SRC and FRAG_SRC.
                            //------Attribute locations in our shaders:
    this.a_Pos2Loc;							  // GPU location: shader 'a_Pos1' attribute
    this.a_Norm2Loc;              // GPU location: shader 'a_Norm1' attribute
    
                //---------------------- Uniform locations &values in our shaders
    this.ModelMatrix = new Matrix4();	// Transforms CVV axes to model axes.
    this.NormalMatrix = new Matrix4();
    this.MvpMatrix = new Matrix4();
    this.eyePosWorld = new Float32Array(3); 
  
    this.u_NormalMatrixLoc;           // GPU location for u_NormalMatrix uniform
    this.u_ModelMatrixLoc;						// GPU location for u_ModelMatrix uniform
    this.u_MvpMatrixLoc;
    this.u_eyePosWorldLoc;
    this.u_isBlinnLoc;
  
    this.lamp2 = new LightsT();
  
    this.matlSel;
    this.matl2 = new Material();
  };

  
  VBObox2.prototype.init = function() {
  //==============================================================================
  // Prepare the GPU to use all vertices, GLSL shaders, attributes, & uniforms 
  // kept in this VBObox. (This function usually called only once, within main()).
  // Specifically:
  // a) Create, compile, link our GLSL vertex- and fragment-shaders to form an 
  //  executable 'program' stored and ready to use inside the GPU.  
  // b) create a new VBO object in GPU memory and fill it by transferring in all
  //  the vertex data held in our Float32array member 'VBOcontents'. 
  // c) Find & save the GPU location of all our shaders' attribute-variables and 
  //  uniform-variables (needed by switchToMe(), adjust(), draw(), reload(), etc.)
  // -------------------
  // CAREFUL!  before you can draw pictures using this VBObox contents, 
  //  you must call this VBObox object's switchToMe() function too!
  //--------------------
  // a) Compile,link,upload shaders-----------------------------------------------
    this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
    if (!this.shaderLoc) {
      console.log(this.constructor.name + 
                  '.init() failed to create executable Shaders on the GPU. Bye!');
      return;
    }
  // CUTE TRICK: let's print the NAME of this VBObox object: tells us which one!
  //  else{console.log('You called: '+ this.constructor.name + '.init() fcn!');}
  
    gl.program = this.shaderLoc;		// (to match cuon-utils.js -- initShaders())
    
    // if(!initArrayBuffer(gl, this.shaderLoc,'a_Pos2', new Float32Array(this.vboPositions), gl.FLOAT, 3)) return -1;
    // if(!initArrayBuffer(gl, this.shaderLoc, 'a_Norm2', new Float32Array(this.vboPositions), gl.FLOAT, 3)) return -1;
  
    // gl.bindBuffer(gl.ARRAY_BUFFER, null);
  // b) Create VBO on GPU, fill it------------------------------------------------
    this.vboLoc = gl.createBuffer();	
    if (!this.vboLoc) {
      console.log(this.constructor.name + 
                  '.init() failed to create VBO in GPU. Bye!'); 
      return;
    }
    
    // Specify the purpose of our newly-created VBO on the GPU.  Your choices are:
    //	== "gl.ARRAY_BUFFER" : the VBO holds vertices, each made of attributes 
    // (positions, colors, normals, etc), or 
    //	== "gl.ELEMENT_ARRAY_BUFFER" : the VBO holds indices only; integer values 
    // that each select one vertex from a vertex array stored in another VBO.
    gl.bindBuffer(gl.ARRAY_BUFFER,	      // GLenum 'target' for this GPU buffer 
                    this.vboLoc);				  // the ID# the GPU uses for this buffer.
                          
    // Fill the GPU's newly-created VBO object with the vertex data we stored in
    //  our 'vboContents' member (JavaScript Float32Array object).
    //  (Recall gl.bufferData() will evoke GPU's memory allocation & management: 
    //	 use gl.bufferSubData() to modify VBO contents without changing VBO size)
    gl.bufferData(gl.ARRAY_BUFFER, 			  // GLenum target(same as 'bindBuffer()')
                    this.vboContents, 		// JavaScript Float32Array
                     gl.STATIC_DRAW);			// Usage hint.  
    //	The 'hint' helps GPU allocate its shared memory for best speed & efficiency
    //	(see OpenGL ES specification for more info).  Your choices are:
    //		--STATIC_DRAW is for vertex buffers rendered many times, but whose 
    //				contents rarely or never change.
    //		--DYNAMIC_DRAW is for vertex buffers rendered many times, but whose 
    //				contents may change often as our program runs.
    //		--STREAM_DRAW is for vertex buffers that are rendered a small number of 
    // 			times and then discarded; for rapidly supplied & consumed VBOs.

    this.a_Pos2Loc = gl.getAttribLocation(this.shaderLoc, 'a_Pos2');
    this.a_Norm2Loc = gl.getAttribLocation(this.shaderLoc, 'a_Norm2');
    
    // c2) Find All Uniforms:-----------------------------------------------------
    //Get GPU storage location for each uniform var used in our shader programs: 
    this.u_isBlinnLoc = gl.getUniformLocation(this.shaderLoc, 'u_isBlinn');
    this.u_eyePosWorldLoc = gl.getUniformLocation(this.shaderLoc, 'u_eyePosWorld');
    this.u_MvpMatrixLoc = gl.getUniformLocation(this.shaderLoc, 'u_MvpMatrix');
    this.u_ModelMatrixLoc = gl.getUniformLocation(this.shaderLoc, 'u_ModelMatrix');
    this.u_NormalMatrixLoc = gl.getUniformLocation(this.shaderLoc, 'u_NormalMatrix');
  
    if (!this.u_ModelMatrixLoc || !this.u_MvpMatrixLoc 
    || !this.u_NormalMatrixLoc || !this.u_eyePosWorldLoc) {
      console.log(this.constructor.name + ' failed to get one or more \'matrix\' uniform locations');
    }
  
    this.lamp2.u_pos = gl.getUniformLocation(this.shaderLoc,  'u_LampSet[0].pos');
    this.lamp2.u_diff = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[0].Id');
    this.lamp2.u_ambi = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[0].Ia');
    this.lamp2.u_spec = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[0].Is');
  
    if( !this.lamp2.u_pos || !this.lamp2.u_diff 
    || !this.lamp2.u_ambi || !this.lamp2.u_spec) {
      console.log(this.constructor.name + ' failed to get one or more lighting uniform storage locations.');
      return;
    }
  
    this.matl2.uLoc_Ke = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].Ke');
    this.matl2.uLoc_Ka = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].Ka');
    this.matl2.uLoc_Kd = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].Kd');
    this.matl2.uLoc_Ks = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].Ks');
    this.matl2.uLoc_Kshiny = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].Kshiny');
    if(!this.matl2.uLoc_Ke || !this.matl2.uLoc_Ka || !this.matl2.uLoc_Kd|| !this.matl2.uLoc_Kshiny) {
      console.log('Failed to get one or more reflectance storage locations');
      return;
    }  
    //TODO: generalize so the user can input desired amounts.
    
  }
  
  
  
  VBObox2.prototype.switchToMe = function () {
  //==============================================================================
  // Set GPU to use this VBObox's contents (VBO, shader, attributes, uniforms...)
  //
  // We only do this AFTER we called the init() function, which does the one-time-
  // only setup tasks to put our VBObox contents into GPU memory.  !SURPRISE!
  // even then, you are STILL not ready to draw our VBObox's contents onscreen!
  // We must also first complete these steps:
  //  a) tell the GPU to use our VBObox's shader program (already in GPU memory),
  //  b) tell the GPU to use our VBObox's VBO  (already in GPU memory),
  //  c) tell the GPU to connect the shader program's attributes to that VBO.
  
  // a) select our shader program:
  gl.useProgram(this.shaderLoc);	
  //		Each call to useProgram() selects a shader program from the GPU memory,
  // but that's all -- it does nothing else!  Any previously used shader program's 
  // connections to attributes and uniforms are now invalid, and thus we must now
  // establish new connections between our shader program's attributes and the VBO
  // we wish to use. 

  
  gl.uniform1i(this.u_isBlinnLoc, g_isBlinn);
  gl.uniform3fv(this.u_eyePosWorldLoc, this.eyePosWorld);
  
  this.lamp2.I_pos.elements.set([g_lightPosX, g_lightPosY, g_lightPosZ]);
  this.lamp2.I_ambi.elements.set([g_lightAmbiR, g_lightAmbiG, g_lightAmbiB]); 
  this.lamp2.I_diff.elements.set([g_lightDiffR, g_lightDiffG, g_lightDiffB]); //* set diffuse light (white)
  this.lamp2.I_spec.elements.set([g_lightSpecR, g_lightSpecG, g_lightSpecB]); //* set specular light (white)

  gl.uniform3fv(this.lamp2.u_pos, this.lamp2.I_pos.elements.slice(0,3));
  gl.uniform3fv(this.lamp2.u_ambi, this.lamp2.I_ambi.elements);
  gl.uniform3fv(this.lamp2.u_diff, this.lamp2.I_diff.elements);
  gl.uniform3fv(this.lamp2.u_spec, this.lamp2.I_spec.elements);
  
  this.matl2.setMatl(parseInt(g_currMatl));

  gl.uniform3fv(this.matl2.uLoc_Ke, this.matl2.K_emit.slice(0,3)); 
  gl.uniform3fv(this.matl2.uLoc_Ka, this.matl2.K_ambi.slice(0,3)); 
  gl.uniform3fv(this.matl2.uLoc_Kd, this.matl2.K_diff.slice(0,3));
  gl.uniform3fv(this.matl2.uLoc_Ks, this.matl2.K_spec.slice(0,3));
  gl.uniform1i(this.matl2.uLoc_Kshiny, parseInt(g_shiny, 10)); 
    
  // b) call bindBuffer to disconnect the GPU from its currently-bound VBO and
  //  instead connect to our own already-created-&-filled VBO.  This new VBO can 
  //    supply values to use as attributes in our newly-selected shader program:
  gl.bindBuffer(gl.ARRAY_BUFFER,	    // GLenum 'target' for this GPU buffer 
                      this.vboLoc);			// the ID# the GPU uses for our VBO.
  
  // c) connect our newly-bound VBO to supply attribute variable values for each
  // vertex to our SIMD shader program, using 'vertexAttribPointer()' function.
  // this sets up data paths from VBO to our shader units:
    // 	Here's how to use the almost-identical OpenGL version of this function:
  	//		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
    gl.vertexAttribPointer(
  		this.a_Pos2Loc,//index == ID# for the attribute var in GLSL shader pgm;
  		this.vboFcount_a_Pos2, // # of floats used by this attribute: 1,2,3 or 4?
  		gl.FLOAT,		  // type == what data type did we use for those numbers?
  		false,				// isNormalized == are these fixed-point values that we need
  									//									normalize before use? true or false
  		this.vboStride,// Stride == #bytes we must skip in the VBO to move from the
  		              // stored attrib for this vertex to the same stored attrib
  		              //  for the next vertex in our VBO.  This is usually the 
  									// number of bytes used to store one complete vertex.  If set 
  									// to zero, the GPU gets attribute values sequentially from 
  									// VBO, starting at 'Offset'.	
  									// (Our vertex size in bytes: 4 floats for pos + 3 for color)
  		this.vboOffset_a_Pos2);						
  		              // Offset == how many bytes from START of buffer to the first
    								// value we will actually use?  (we start with position).
    gl.vertexAttribPointer(this.a_Norm1Loc,this.vboFcount_a_Norm2, 
                           gl.FLOAT, false, 
  							           this.vboStride,	this.vboOffset_a_Norm2);	
    //-- Enable this assignment of the attribute to its' VBO source:
    gl.enableVertexAttribArray(this.a_Pos2Loc);
    gl.enableVertexAttribArray(this.a_Norm2Loc);
  }
  
  VBObox2.prototype.isReady = function() {
  //==============================================================================
  // Returns 'true' if our WebGL rendering context ('gl') is ready to render using
  // this objects VBO and shader program; else return false.
  // see: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter
  
  var isOK = true;
  
    if(gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc)  {
      console.log(this.constructor.name + 
                  '.isReady() false: shader program at this.shaderLoc not in use!');
      isOK = false;
    }
    if(gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
        console.log(this.constructor.name + 
                '.isReady() false: vbo at this.vboLoc not in use!');
      isOK = false;
    }
    return isOK;
  }
  
  VBObox2.prototype.adjust = function() {
  //==============================================================================
  // Update the GPU to newer, current values we now store for 'uniform' vars on 
  // the GPU; and (if needed) update each attribute's stride and offset in VBO.
  
    // check: was WebGL context set to use our VBO & shader program?
    if(this.isReady()==false) {
      console.log('ERROR! before' + this.constructor.name + 
            '.adjust() call you needed to call this.switchToMe()!!');
  }

  this.eyePosWorld.set([g_camX, g_camY, g_camZ]); // set the eye position to the position of our camera
  // ! This makes the specular highlight move with the camera. 
  // Adjust values for our uniforms,
  this.ModelMatrix.setIdentity(); // sanity check
  this.MvpMatrix.setIdentity();
  this.MvpMatrix.set(g_worldMat);
  this.ModelMatrix.translate(-1.0, 2.0, 0.0);
  this.ModelMatrix.scale(0.9, 0.9, 0.9);
	this.ModelMatrix.rotate(140.0, 0.0, 0.0, 1.0);
	this.ModelMatrix.rotate(90, -1, 0, 0);
	this.ModelMatrix.rotate(g_angle01, 0.0, 0.0, 1.0);
	this.ModelMatrix.translate(0.0, -1.0, 0.0);
	this.ModelMatrix.rotate(g_angleLink1, 0.0, 0.5, 0.0);
	this.NormalMatrix.setInverseOf(this.ModelMatrix);
  this.NormalMatrix.transpose();
  // *: Update our world matrix with modelMatrix values
  this.MvpMatrix.multiply(this.ModelMatrix);
  gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	false, this.ModelMatrix.elements);									
  gl.uniformMatrix4fv(this.u_NormalMatrixLoc, false, this.NormalMatrix.elements);
  gl.uniformMatrix4fv(this.u_MvpMatrixLoc, false, this.MvpMatrix.elements);

		// * First link
    gl.drawArrays(gl.TRIANGLES, concaveHexStart/floatsPerVertex, concaveHexVerts.length/floatsPerVertex); // Draw a Concave Hexagon
    
    this.MvpMatrix.set(g_worldMat);

		this.ModelMatrix.rotate(g_angleLink2, 0.0, 0.0, 1.0);
		this.ModelMatrix.translate(0.0, -1.0, 0.0);
			pushMatrix(this.ModelMatrix);
      this.NormalMatrix.setInverseOf(this.ModelMatrix);
      this.NormalMatrix.transpose();
      // *: Update our world matrix with modelMatrix values
      this.MvpMatrix.multiply(this.ModelMatrix);
      gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	false, this.ModelMatrix.elements);									
      gl.uniformMatrix4fv(this.u_NormalMatrixLoc, false, this.NormalMatrix.elements);
      gl.uniformMatrix4fv(this.u_MvpMatrixLoc, false, this.MvpMatrix.elements);
    
				// * Second link
				gl.drawArrays(gl.TRIANGLES, concaveHexStart/floatsPerVertex, concaveHexVerts.length/floatsPerVertex);

		this.ModelMatrix = popMatrix();
    pushMatrix(this.ModelMatrix);
    
      this.MvpMatrix.set(g_worldMat);

			this.ModelMatrix.rotate(g_angleLink3, 0.0, 0.0, 1.0);
			this.ModelMatrix.translate(0.0, -1.0, 0.0);
			this.NormalMatrix.setInverseOf(this.ModelMatrix);
      this.NormalMatrix.transpose();
    // *: Update our world matrix with modelMatrix values
      this.MvpMatrix.multiply(this.ModelMatrix);
      gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	false, this.ModelMatrix.elements);									
      gl.uniformMatrix4fv(this.u_NormalMatrixLoc, false, this.NormalMatrix.elements);
      gl.uniformMatrix4fv(this.u_MvpMatrixLoc, false, this.MvpMatrix.elements);

			// * Third Link
			gl.drawArrays(gl.TRIANGLES, concaveHexStart/floatsPerVertex, concaveHexVerts.length/floatsPerVertex);
		
  // ! Draw Sphere
  this.ModelMatrix.setIdentity();
  this.MvpMatrix.set(g_worldMat);
  this.ModelMatrix.rotate(g_angleNow1, 0, 0, 1);	// spin drawing axes,
  this.ModelMatrix.translate(0, 0, 0);	// then translate them.
  // * Compute values for Normal matrix
  this.NormalMatrix.setInverseOf(this.ModelMatrix);
  this.NormalMatrix.transpose();
  // *: Update our world matrix with modelMatrix values
  this.MvpMatrix.multiply(this.ModelMatrix);
  gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	false, this.ModelMatrix.elements);									
  gl.uniformMatrix4fv(this.u_NormalMatrixLoc, false, this.NormalMatrix.elements);
  gl.uniformMatrix4fv(this.u_MvpMatrixLoc, false, this.MvpMatrix.elements);

  gl.drawArrays(gl.TRIANGLE_STRIP, sphStart / floatsPerVertex, sphVerts.length / floatsPerVertex);
// ! Draw pyramid
  this.MvpMatrix.set(g_worldMat);
  this.ModelMatrix.setIdentity();
pushMatrix(this.ModelMatrix);
  this.ModelMatrix.translate(-2.0, -2.0, 0.0);
  this.ModelMatrix.rotate(90.0, 1, 0, 0);
  this.ModelMatrix.rotate(g_angleNow1, 0, 1, 0);
  this.ModelMatrix.translate(-0.5, 0.0, 0.5);
  
  this.NormalMatrix.setInverseOf(this.ModelMatrix);
  this.NormalMatrix.transpose();

  this.MvpMatrix.multiply(this.ModelMatrix);
  gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	false, this.ModelMatrix.elements);									
  gl.uniformMatrix4fv(this.u_NormalMatrixLoc, false, this.NormalMatrix.elements);
  gl.uniformMatrix4fv(this.u_MvpMatrixLoc, false, this.MvpMatrix.elements);

  // Draw pyramid
  gl.drawArrays(gl.TRIANGLES, 
                pyrStart/floatsPerVertex, 
                pyrVerts.length/floatsPerVertex);
  }
  
  VBObox2.prototype.draw = function() {
  //=============================================================================
  // Send commands to GPU to select and render current VBObox contents.
  
    // check: was WebGL context set to use our VBO & shader program?
    if(this.isReady()==false) {
          console.log('ERROR! before' + this.constructor.name + 
                '.draw() call you needed to call this.switchToMe()!!');
    }
    
    // ----------------------------Draw the contents of the currently-bound VBO:
  }
  
  
  VBObox2.prototype.reload = function() {
  //=============================================================================
  // Over-write current values in the GPU for our already-created VBO: use 
  // gl.bufferSubData() call to re-transfer some or all of our Float32Array 
  // contents to our VBO without changing any GPU memory allocations.
  
   gl.bufferSubData(gl.ARRAY_BUFFER, 	// GLenum target(same as 'bindBuffer()')
                    0,                  // byte offset to where data replacement
                                        // begins in the VBO.
                      this.vboContents);   // the JS source-data array used to fill VBO
  }
  
  /*
  VBObox2.prototype.empty = function() {
  //=============================================================================
  // Remove/release all GPU resources used by this VBObox object, including any 
  // shader programs, attributes, uniforms, textures, samplers or other claims on 
  // GPU memory.  However, make sure this step is reversible by a call to 
  // 'restoreMe()': be sure to retain all our Float32Array data, all values for 
  // uniforms, all stride and offset values, etc.
  //
  //
  // 		********   YOU WRITE THIS! ********
  //
  //
  //
  }
  
  VBObox2.prototype.restore = function() {
  //=============================================================================
  // Replace/restore all GPU resources used by this VBObox object, including any 
  // shader programs, attributes, uniforms, textures, samplers or other claims on 
  // GPU memory.  Use our retained Float32Array data, all values for  uniforms, 
  // all stride and offset values, etc.
  //
  //
  // 		********   YOU WRITE THIS! ********
  //
  //
  //
  }
*/

//=============================================================================
//=============================================================================
//=============================================================================
