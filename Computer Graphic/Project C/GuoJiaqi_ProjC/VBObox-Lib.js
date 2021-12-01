
const floatsPerVertex = 6;

// ! Shape vertices
function makeGroundGrid() {

    var xcount = 100;			// # of lines to draw in x,y to make the grid.
    var ycount = 100;		
    var xymax	= 50.0;			// grid size; extends to cover +/-xymax in x and y.
     var xColr = new Float32Array([0.9, 0.9, 0.9]);	// bright yellow
     var yColr = new Float32Array([0.9, 0.9, 0.9]);	// bright green.
     
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

function VBObox0() {
	this.VERT_SRC =	//--------------------- VERTEX SHADER source code 
  'precision highp float;\n' +				// req'd in OpenGL ES if we use 'float'
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
		this.vboOffset_a_Pos0);						
  gl.vertexAttribPointer(this.a_ColrLoc, this.vboFcount_a_Colr0, 
                        gl.FLOAT, false, 
                        this.vboStride, this.vboOffset_a_Colr0);
  							
// --Enable this assignment of each of these attributes to its' VBO source:
  gl.enableVertexAttribArray(this.a_PosLoc);
  gl.enableVertexAttribArray(this.a_ColrLoc);
}

VBObox0.prototype.isReady = function() {
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
  var slices = 17;		// # of slices of the sphere along the z axis. >=3 req'd
  var sliceVerts = 25;	// # of vertices around the top edge of the slice
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
      if (s == slices - 1) isLast = 1;	// skip last vertex of last slice.
      for (v = isFirst; v < 2 * sliceVerts - isLast; v++, j += floatsPerVertex) {
          if (v % 2 == 0) {				// put even# vertices at the the slice's top edge
              sphVerts[j] = sin0 * Math.cos(Math.PI * (v) / sliceVerts);
              sphVerts[j + 1] = sin0 * Math.sin(Math.PI * (v) / sliceVerts);
              sphVerts[j + 2] = cos0;
          }
          else { 
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

function setMvpMatrix(gl,MvpMatrix, ModelMatrix, g_worldMat, u_MvpMatrixLoc, NormalMatrix, u_NormalMatrixLoc){
  NormalMatrix.setInverseOf(ModelMatrix);
  MvpMatrix.set(g_worldMat).multiply(ModelMatrix);
  NormalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrixLoc, false, NormalMatrix.elements);
  gl.uniformMatrix4fv(u_MvpMatrixLoc, false, MvpMatrix.elements)
}

function drawSphere(gl,MvpMatrix, ModelMatrix, g_worldMat, u_MvpMatrixLoc, NormalMatrix, u_NormalMatrixLoc){
  setMvpMatrix(gl,MvpMatrix, ModelMatrix, g_worldMat, u_MvpMatrixLoc, NormalMatrix, u_NormalMatrixLoc)								
  gl.drawArrays(gl.TRIANGLE_STRIP, sphStart / floatsPerVertex, sphVerts.length / floatsPerVertex);
}

function drawTree(gl,MvpMatrix, ModelMatrix, g_worldMat, u_MvpMatrixLoc, NormalMatrix,u_NormalMatrixLoc){
  ModelMatrix.setIdentity(); 
  MvpMatrix.setIdentity();
  ModelMatrix.translate(-2, 2.0, 0.0);
  ModelMatrix.scale(0.2, 0.2, 0.2);
  setMvpMatrix(gl,	MvpMatrix, 	ModelMatrix, g_worldMat, 	u_MvpMatrixLoc, 	NormalMatrix, 	u_NormalMatrixLoc)	
  gl.drawArrays(gl.TRIANGLES, 
    cube_vStart/floatsPerVertex, 
    cube_v.length/floatsPerVertex);
  ModelMatrix.translate(0, 0, 2);
  setMvpMatrix(gl,	MvpMatrix, 	ModelMatrix, g_worldMat, 	u_MvpMatrixLoc, 	NormalMatrix, 	u_NormalMatrixLoc)							
  gl.drawArrays(gl.TRIANGLES, 
    cube_vStart/floatsPerVertex, 
    cube_v.length/floatsPerVertex);
  ModelMatrix.translate(0, 0, 2);
  setMvpMatrix(gl,	MvpMatrix, 	ModelMatrix, g_worldMat, 	u_MvpMatrixLoc, 	NormalMatrix, 	u_NormalMatrixLoc)								
  gl.drawArrays(gl.TRIANGLES, 
  cube_vStart/floatsPerVertex, 
  cube_v.length/floatsPerVertex);
  ModelMatrix.setIdentity();
  ModelMatrix.translate(-2.5, 1.5, 0.7);
  ModelMatrix.rotate(g_angle03, 1, 0, 0);
  MvpMatrix.setIdentity();
  pushMatrix(	ModelMatrix);
  	ModelMatrix.rotate(90, 1, 0, 0);
  setMvpMatrix(gl,	MvpMatrix, 	ModelMatrix, g_worldMat, 	u_MvpMatrixLoc, 	NormalMatrix, 	u_NormalMatrixLoc)								
  gl.drawArrays(gl.TRIANGLES, 
  pyrStart/floatsPerVertex, 
  pyrVerts.length/floatsPerVertex);

  ModelMatrix = popMatrix();
  ModelMatrix.translate(0, 0, 0.7);
  ModelMatrix.scale(0.85, 0.85, 0.85);
  ModelMatrix.rotate(g_angle03, 1, 0, 0);
  pushMatrix(	ModelMatrix);
  ModelMatrix.rotate(90, 1, 0, 0);
  setMvpMatrix(gl,	MvpMatrix, 	ModelMatrix, g_worldMat, 	u_MvpMatrixLoc, 	NormalMatrix, 	u_NormalMatrixLoc)								
  gl.drawArrays(gl.TRIANGLES, 
  pyrStart/floatsPerVertex, 
  pyrVerts.length/floatsPerVertex);

  ModelMatrix = popMatrix();
  ModelMatrix.translate(0, 0, 0.68);
  ModelMatrix.scale(0.8, 0.8, 0.8);
  ModelMatrix.rotate(g_angle05, 1, 0, 0);
  pushMatrix(	ModelMatrix);
  ModelMatrix.rotate(90, 1, 0, 0);
  setMvpMatrix(gl,	MvpMatrix, 	ModelMatrix, g_worldMat, 	u_MvpMatrixLoc, 	NormalMatrix, 	u_NormalMatrixLoc)								
  gl.drawArrays(gl.TRIANGLES, 
    pyrStart/floatsPerVertex, 
    pyrVerts.length/floatsPerVertex);
}

function set_material(gl, g_currMaterial, mat, g_shiny){
  mat.setMatl(parseInt(g_currMaterial));
  gl.uniform3fv(mat.uLoc_Ke, mat.K_emit.slice(0,3)); 
  gl.uniform3fv(mat.uLoc_Ka, mat.K_ambi.slice(0,3)); 
  gl.uniform3fv(mat.uLoc_Kd, mat.K_diff.slice(0,3));
  gl.uniform3fv(mat.uLoc_Ks, mat.K_spec.slice(0,3));
  gl.uniform1i(mat.uLoc_Kshiny, parseInt(g_shiny, 10)); 
}

function drawFlower(gl,MvpMatrix, ModelMatrix, g_worldMat, u_MvpMatrixLoc, NormalMatrix,u_NormalMatrixLoc){
  ModelMatrix.setIdentity();
  MvpMatrix.setIdentity();
  ModelMatrix.translate(2.5, 1.5, 1);
  ModelMatrix.rotate(g_angle03, 1, 0, 0);
  ModelMatrix.rotate(180, 0, 1, 0);
  ModelMatrix.scale(0.5, 0.5, 0.5);
  pushMatrix(ModelMatrix);
  ModelMatrix.rotate(90, 1, 0, 0);
  setMvpMatrix(gl,MvpMatrix, ModelMatrix, g_worldMat, u_MvpMatrixLoc, NormalMatrix, u_NormalMatrixLoc)								
  gl.drawArrays(gl.TRIANGLES, concaveHexStart/floatsPerVertex, concaveHexVerts.length/floatsPerVertex);
  
  ModelMatrix = popMatrix();
  pushMatrix(ModelMatrix);
  ModelMatrix.translate(0, -0.25, -0.6);
  ModelMatrix.scale(0.3,0.3,0.3)
  drawSphere(gl,MvpMatrix, ModelMatrix, g_worldMat, u_MvpMatrixLoc, NormalMatrix, u_NormalMatrixLoc)

  ModelMatrix = popMatrix();
  ModelMatrix.translate(0, 0, 0.7);
  ModelMatrix.scale(0.85, 0.85, 0.85);
  ModelMatrix.rotate(g_angle03, 1, 0, 0);
  pushMatrix(ModelMatrix);
  ModelMatrix.rotate(90, 1, 0, 0);
  setMvpMatrix(gl, MvpMatrix, ModelMatrix, g_worldMat, 	u_MvpMatrixLoc, NormalMatrix, u_NormalMatrixLoc)								
  gl.drawArrays(gl.TRIANGLES, concaveHexStart/floatsPerVertex, concaveHexVerts.length/floatsPerVertex);

  ModelMatrix = popMatrix();
  ModelMatrix.translate(0, 0, 0.68);
  ModelMatrix.scale(0.8, 0.8, 0.8);
  ModelMatrix.rotate(g_angle05, 1, 0, 0);
  pushMatrix(ModelMatrix);
  ModelMatrix.rotate(90, 1, 0, 0);
  setMvpMatrix(gl, MvpMatrix, ModelMatrix, g_worldMat, u_MvpMatrixLoc, NormalMatrix, u_NormalMatrixLoc)								
  gl.drawArrays(gl.TRIANGLES, concaveHexStart/floatsPerVertex, concaveHexVerts.length/floatsPerVertex);
}

function drawAlienfish(gl,MvpMatrix, ModelMatrix, g_worldMat, u_MvpMatrixLoc, NormalMatrix,u_NormalMatrixLoc){
  stack = []
  ModelMatrix.setIdentity();
  MvpMatrix.setIdentity()
  ModelMatrix.rotate(45, 1, 1, 0);
  ModelMatrix.translate(-2.6, -1.5, 1);
  ModelMatrix.scale(0.4, 0.4, 0.4);
  pushMatrix(ModelMatrix);

  ModelMatrix = popMatrix();
  pushMatrix(ModelMatrix);
  ModelMatrix.rotate(g_angleNow1, 0, 0, 1);
  setMvpMatrix(gl, MvpMatrix, 	ModelMatrix, g_worldMat, u_MvpMatrixLoc, NormalMatrix, u_NormalMatrixLoc)	
  gl.drawArrays(gl.TRIANGLES, 
    cube_vStart/floatsPerVertex, 
    cube_v.length/floatsPerVertex);
  ModelMatrix.translate(0, 0, 2);
  setMvpMatrix(gl, MvpMatrix, ModelMatrix, g_worldMat, u_MvpMatrixLoc, NormalMatrix, u_NormalMatrixLoc)							
  gl.drawArrays(gl.TRIANGLES, 
    cube_vStart/floatsPerVertex, 
    cube_v.length/floatsPerVertex);
  ModelMatrix.translate(0, 0, 1.6);
  setMvpMatrix(gl, MvpMatrix, 	ModelMatrix, g_worldMat, u_MvpMatrixLoc, NormalMatrix, u_NormalMatrixLoc)								
  drawSphere(gl,MvpMatrix, ModelMatrix, g_worldMat, u_MvpMatrixLoc, NormalMatrix, u_NormalMatrixLoc)
  stack.push(new Matrix4(ModelMatrix))
  ModelMatrix.translate(0, 0.9, 0.4);
  ModelMatrix.scale(0.25, 0.25, 0.25);
  drawSphere(gl, MvpMatrix, ModelMatrix, g_worldMat,	u_MvpMatrixLoc, NormalMatrix, u_NormalMatrixLoc)
  ModelMatrix = stack.pop();
  stack.push(new Matrix4(ModelMatrix));
  ModelMatrix.translate(0, -0.9, 0.4);
  ModelMatrix.scale(0.25, 0.25, 0.25);
  drawSphere(gl, MvpMatrix, ModelMatrix, g_worldMat, u_MvpMatrixLoc, NormalMatrix, u_NormalMatrixLoc)
  ModelMatrix = popMatrix();
  ModelMatrix.translate(0, 0.3, -1.7);
  ModelMatrix.scale(1.3, 1.3, 1.3);
  pushMatrix(ModelMatrix);
  ModelMatrix.rotate(90, 1, 0, 0);
  setMvpMatrix(gl, MvpMatrix, ModelMatrix, g_worldMat, u_MvpMatrixLoc, NormalMatrix, u_NormalMatrixLoc)								
  gl.drawArrays(gl.TRIANGLES, concaveHexStart/floatsPerVertex, concaveHexVerts.length/floatsPerVertex);
  ModelMatrix = popMatrix();
  ModelMatrix.scale(0.8, 0.8, 0.8);
  ModelMatrix.translate(0, 0, -0.4);
  ModelMatrix.rotate(g_angle05, 1, 0, 0);
  ModelMatrix.translate(0, 0, -0.4);
  pushMatrix(ModelMatrix);
  ModelMatrix.rotate(90, 1, 0, 0);
  setMvpMatrix(gl, MvpMatrix, ModelMatrix, g_worldMat, u_MvpMatrixLoc, NormalMatrix, u_NormalMatrixLoc)								
  gl.drawArrays(gl.TRIANGLES, concaveHexStart/floatsPerVertex, concaveHexVerts.length/floatsPerVertex);
  ModelMatrix = popMatrix();
  ModelMatrix.translate(0, 0, -0.68);
  ModelMatrix.scale(0.8, 0.8, 0.8);
  ModelMatrix.rotate(g_angle05, 1, 0, 0);
  pushMatrix(ModelMatrix);
  ModelMatrix.rotate(90, 1, 0, 0);
  setMvpMatrix(gl, MvpMatrix, ModelMatrix, g_worldMat, u_MvpMatrixLoc, NormalMatrix, u_NormalMatrixLoc)								
  gl.drawArrays(gl.TRIANGLES, concaveHexStart/floatsPerVertex, concaveHexVerts.length/floatsPerVertex);
}

const glsl = x => x;

function VBObox1() { 
	this.VERT_SRC =	//--------------------- VERTEX SHADER source code 
  glsl` 
  precision highp float;
  precision highp int;


  struct LampT {
    vec3 pos;
    vec3 ambi; //* ambient light source strength
    vec3 diff; //* diffuse light source strength
    vec3 spec; //* e64 light source strength
  };

  struct MatlT {
    vec3 emit; //* emissive - surface glow
    vec3 ambi; //* ambient reflectance
    vec3 diff; //* diffuse reflectance
    vec3 spec; //* e64 reflectance
    int shiny; //* e64 exponent
  };

  uniform LampT u_LampSet[1];
  uniform MatlT u_MatlSet[1];
  uniform mat4 u_ModelMatrix, u_NormalMatrix, u_MvpMatrix;
  

  uniform bool u_isBlinn;

  attribute vec4 a_Pos1;
  attribute vec4 a_Normal;
  varying vec4 v_Pos1;
  varying vec4 v_Color;

  varying vec3 v_Kd;
  varying vec3 v_Normal;
  uniform vec3 u_eyePosWorld;
  


  void main() {
    gl_Position = u_MvpMatrix * a_Pos1;
    v_Pos1 = u_ModelMatrix * a_Pos1;
    
    v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));
    v_Kd = u_MatlSet[0].diff;
    vec3 normal = normalize(v_Normal);
    vec3 lightDirection = normalize(u_LampSet[0].pos - vec3(v_Pos1));
    vec3 eyeDirection = normalize(u_eyePosWorld - vec3(v_Pos1));
    // ? Lambertian's cosine law
    float nDotL = max(dot(lightDirection, normal), 0.0);
    float e64 = 0.0;

    if(!u_isBlinn) {
      vec3 R = reflect(-lightDirection, normal);
      float specAngle = max(dot(R, eyeDirection), 0.0);
      e64 = pow(specAngle, float(u_MatlSet[0].shiny));
    } else {
      vec3 H = normalize(lightDirection + eyeDirection);
      float nDotH = max(dot(H, normal), 0.0);
      e64 = pow(nDotH, float(u_MatlSet[0].shiny));
    }
    vec3 emissive = u_MatlSet[0].emit;
    vec3 ambient = u_LampSet[0].ambi * u_MatlSet[0].ambi;
    vec3 diffuse = u_LampSet[0].diff * v_Kd * nDotL;
    vec3 speculr = u_LampSet[0].spec * u_MatlSet[0].spec * e64;

  	v_Color = vec4(emissive + ambient + diffuse + speculr, 1.0);
   }`;

 // SHADED, sphere-like dots:
  this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
  glsl`
  #ifdef GL_ES 
  precision mediump float;
  #endif
  varying vec4 v_Color;
  void main() {
    gl_FragColor = v_Color; 
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
  this.vboBytes = this.vboContents.length * this.FSIZE;               
	this.vboStride = this.vboBytes / this.vboVerts;     
  this.vboFcount_a_Pos1 =  3;    // # of floats in the VBO needed to store the
                                // attribute named a_Pos1. (4: x,y,z,w values)
  this.vboFcount_a_Normal = 3;  // # of floats for this attrib (just one!)   
  console.assert(((this.vboFcount_a_Pos1 +     // check the size of each and 
                  this.vboFcount_a_Normal) *   // every attribute in our VBO
                  this.FSIZE == this.vboStride), // for agreeement with'stride'
                  "Uh oh! VBObox1.vboStride disagrees with attribute-size values!");
                  
              //----------------------Attribute offsets
	this.vboOffset_a_Pos1 = 0;    //# of bytes from START of vbo to the START
  this.vboOffset_a_Normal = (this.vboFcount_a_Pos1) * this.FSIZE;                                
	this.vboLoc;									// GPU Location for Vertex Buffer Object, 
	this.shaderLoc;								// GPU Location for compiled Shader-program  
	this.a_Pos1Loc;							  // GPU location: shader 'a_Pos1' attribute
  this.a_Normal;              // GPU location: shader 'a_Normal' attribute
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

  this.a_Pos1Loc = gl.getAttribLocation(this.shaderLoc, 'a_Pos1');
  this.a_Normal = gl.getAttribLocation(this.shaderLoc, 'a_Normal');
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
  this.lamp1.u_diff = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[0].diff');
  this.lamp1.u_ambi = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[0].ambi');
  this.lamp1.u_spec = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[0].spec');

  if( !this.lamp1.u_pos || !this.lamp1.u_diff 
  || !this.lamp1.u_ambi || !this.lamp1.u_spec) {
    console.log(this.constructor.name + ' failed to get one or more lighting uniform storage locations.');
    return;
  }

  this.matl1.uLoc_Ke = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].emit');
  this.matl1.uLoc_Ka = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].ambi');
  this.matl1.uLoc_Kd = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].diff');
  this.matl1.uLoc_Ks = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].spec');
  this.matl1.uLoc_Kshiny = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].shiny');
  if(!this.matl1.uLoc_Ke || !this.matl1.uLoc_Ka || !this.matl1.uLoc_Kd|| !this.matl1.uLoc_Kshiny) {
    console.log('Failed to get one or more reflectance storage locations');
    return;
  }  
}

VBObox1.prototype.switchToMe = function () {
  gl.useProgram(this.shaderLoc);	
  gl.uniform1i(this.u_isBlinnLoc, g_isBlinn);
  gl.uniform3fv(this.u_eyePosWorldLoc, this.eyePosWorld);
	gl.bindBuffer(gl.ARRAY_BUFFER,	    // GLenum 'target' for this GPU buffer 
										this.vboLoc);			// the ID# the GPU uses for our VBO.

  gl.vertexAttribPointer(
		this.a_Pos1Loc,//index == ID# for the attribute var in GLSL shader pgm;
		this.vboFcount_a_Pos1, // # of floats used by this attribute: 1,2,3 or 4?
		gl.FLOAT,		  // type == what data type did we use for those numbers?
		false,				// isNormalized == are these fixed-point values that we need
		this.vboStride,// Stride == #bytes we must skip in the VBO to move from the
		this.vboOffset_a_Pos1);						
  gl.vertexAttribPointer(this.a_Normal,this.vboFcount_a_Normal, 
                         gl.FLOAT, false, 
							           this.vboStride,	this.vboOffset_a_Normal);	
  //-- Enable this assignment of the attribute to its' VBO source:
  gl.enableVertexAttribArray(this.a_Pos1Loc);
  gl.enableVertexAttribArray(this.a_Normal);
// if(!initArrayBuffer(gl, this.shaderLoc,'a_Pos1', new Float32Array(this.vboPositions), gl.FLOAT, 3)) return -1;
// if(!initArrayBuffer(gl, this.shaderLoc, 'a_Normal', new Float32Array(this.vboPositions), gl.FLOAT, 3)) return -1;
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


  this.lamp1.I_pos.elements.set([g_lightPosX, g_lightPosY, g_lightPosZ]);
  this.lamp1.I_ambi.elements.set([g_ambientR, g_ambientG, g_ambientB]); 
  this.lamp1.I_diff.elements.set([g_diffuseR, g_diffuseG, g_diffuseB]); //* set diffuse light (white)
  this.lamp1.I_spec.elements.set([g_specularR, g_specularG, g_specularB]); //* set e64 light (white)

  gl.uniform3fv(this.lamp1.u_pos, this.lamp1.I_pos.elements.slice(0,3));
  gl.uniform3fv(this.lamp1.u_ambi, this.lamp1.I_ambi.elements);
  gl.uniform3fv(this.lamp1.u_diff, this.lamp1.I_diff.elements);
  gl.uniform3fv(this.lamp1.u_spec, this.lamp1.I_spec.elements);

  // for material objects
  this.eyePosWorld.set([g_camX, g_camY, g_camZ]); // set the eye position to the position of our camera
  // **************** Central Sphere *****************
  set_material(gl, g_currMatl3, this.matl1, g_shiny)
  drawTree(gl,this.MvpMatrix, this.ModelMatrix, g_worldMat, this.u_MvpMatrixLoc, this.NormalMatrix, this.u_NormalMatrixLoc)
  // **************** Central Sphere *****************
  set_material(gl, g_currMatl1, this.matl1, g_shiny)
  this.ModelMatrix.setTranslate(0, 0, 0);	
  this.ModelMatrix.rotate(g_angleNow1, 0, 0, 1);
  drawSphere(gl,this.MvpMatrix, this.ModelMatrix, g_worldMat, this.u_MvpMatrixLoc, this.NormalMatrix, this.u_NormalMatrixLoc)
  // **************** Draw flower *****************
  set_material(gl, g_currMatl4, this.matl1, g_shiny)
  drawFlower(gl,this.MvpMatrix, this.ModelMatrix, g_worldMat, this.u_MvpMatrixLoc, this.NormalMatrix, this.u_NormalMatrixLoc)
  // **************** Draw alien fish *****************
  set_material(gl, g_currMatl2, this.matl1, g_shiny)
  drawAlienfish(gl,this.MvpMatrix, this.ModelMatrix, g_worldMat, this.u_MvpMatrixLoc, this.NormalMatrix, this.u_NormalMatrixLoc)
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


    struct MatlT {
      vec3 emit; //* emissive - surface glow
      vec3 ambi; //* ambient reflectance
      vec3 diff; //* diffuse reflectance
      vec3 spec; //* e64 reflectance
      int shiny; //* e64 exponent
    };
  
    attribute vec4 a_Pos1;
    attribute vec4 a_Normal;

    uniform MatlT u_MatlSet[1];
    uniform mat4 u_ModelMatrix, u_NormalMatrix, u_MvpMatrix;
  
    varying vec3 v_Kd;
    varying vec4 v_Position;
    varying vec3 v_Normal;
  
    void main() {
      gl_Position = u_MvpMatrix * a_Pos1;
      v_Position = u_ModelMatrix * a_Pos1;
      v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));
      v_Kd = u_MatlSet[0].diff;
     }`;
 
    this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
    glsl`
    #ifdef GL_ES 
    precision highp float;
    precision highp int;
    #endif

    struct LampT {
      vec3 pos;
      vec3 ambi; //* ambient light source strength
      vec3 diff; //* diffuse light source strength
      vec3 spec; //* e64 light source strength
    };
    

    struct MatlT {
      vec3 emit; //* emissive - surface glow
      vec3 ambi; //* ambient reflectance
      vec3 diff; //* diffuse reflectance
      vec3 spec; //* e64 reflectance
      int shiny; //* e64 exponent
    };

    uniform LampT u_LampSet[1];
    uniform MatlT u_MatlSet[1];
    uniform vec3 u_eyePosWorld;

    uniform bool u_isBlinn;
    
    varying vec3 v_Normal;
    varying vec4 v_Position;
    varying vec3 v_Kd;

    void main() {
      vec3 normal = normalize(v_Normal);//
      vec3 lightDirection = normalize(u_LampSet[0].pos - v_Position.xyz);
      vec3 eyeDirection = normalize(u_eyePosWorld - v_Position.xyz);
      
      float nDotL = max(dot(lightDirection, normal), 0.0);
      vec3 R = reflect(-lightDirection, normal);
      vec3 H = normalize(lightDirection + eyeDirection);
      float e64 = 0.0;


      if(!u_isBlinn) {
        float specAngle = max(dot(R, eyeDirection), 0.0);
        e64 = pow(specAngle, float(u_MatlSet[0].shiny));
      } else {
        float nDotH = max(dot(H, normal), 0.0);
        e64 = pow(nDotH, float(u_MatlSet[0].shiny));
      }

    
      vec3 emissive = u_MatlSet[0].emit;
      vec3 ambient = u_LampSet[0].ambi * u_MatlSet[0].ambi;
      vec3 diffuse = u_LampSet[0].diff * v_Kd * nDotL;
      vec3 speculr = u_LampSet[0].spec * u_MatlSet[0].spec * e64;
      gl_FragColor = vec4(emissive + ambient + diffuse + speculr, 1.0);
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
    this.vboBytes = this.vboContents.length * this.FSIZE;               
    this.vboStride = this.vboBytes / this.vboVerts;     
    this.vboFcount_a_Position =  3;    // # of floats in the VBO needed to store the
    this.vboFcount_a_Normal = 3;  // # of floats for this attrib (just one!)   
    console.assert(((this.vboFcount_a_Position +     // check the size of each and 
                    this.vboFcount_a_Normal) *   // every attribute in our VBO
                    this.FSIZE == this.vboStride), // for agreeement with'stride'
                    "Uh oh! VBObox1.vboStride disagrees with attribute-size values!");
    this.vboOffset_a_Position = 0;    //# of bytes from START of vbo to the START
    this.vboOffset_a_Normal = (this.vboFcount_a_Position) * this.FSIZE;                                 
    this.vboLoc;									// GPU Location for Vertex Buffer Object, 
    this.shaderLoc;								// GPU Location for compiled Shader-program  
    this.a_Pos1Loc;							  // GPU location: shader 'a_Pos1' attribute
    this.a_Normal;              // GPU location: shader 'a_Normal' attribute

  
    this.u_NormalMatrixLoc;           // GPU location for u_NormalMatrix uniform
    this.u_ModelMatrixLoc;						// GPU location for u_ModelMatrix uniform
    this.u_MvpMatrixLoc;
    this.u_eyePosWorldLoc;
    this.u_isBlinnLoc;
    this.matlSel;
    
    this.eyePosWorld = new Float32Array(3); 
    this.matl2 = new Material();
    this.lamp2 = new LightsT();
    this.ModelMatrix = new Matrix4();	// Transforms CVV axes to model axes.
    this.NormalMatrix = new Matrix4();
    this.MvpMatrix = new Matrix4();
  };

  
  VBObox2.prototype.init = function() {
    this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
    if (!this.shaderLoc) {
      console.log(this.constructor.name + 
                  '.init() failed to create executable Shaders on the GPU. Bye!');
      return;
    }
    gl.program = this.shaderLoc;		// (to match cuon-utils.js -- initShaders())
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
                     
                     
    this.a_Pos1Loc = gl.getAttribLocation(this.shaderLoc, 'a_Pos1');
    if(this.a_Pos1Loc < 0) {
      console.log(this.constructor.name + 
                  '.init() Failed to get GPU location of attribute a_Pos1');
      return -1;	// error exit.
    }


    this.a_Normal = gl.getAttribLocation(this.shaderLoc, 'a_Normal');
    if(this.a_Normal < 0) {
      console.log(this.constructor.name + 
                  '.init() failed to get the GPU location of attribute a_Normal');
      return -1;	// error exit.
    }
    
    // c2) Find All Uniforms:-----------------------------------------------------
    //Get GPU storage location for each uniform var used in our shader programs: 
    this.u_isBlinnLoc = gl.getUniformLocation(this.shaderLoc, 'u_isBlinn');
    this.u_eyePosWorldLoc = gl.getUniformLocation(this.shaderLoc, 'u_eyePosWorld');
    this.u_MvpMatrixLoc = gl.getUniformLocation(this.shaderLoc, 'u_MvpMatrix');
    
    this.u_ModelMatrixLoc = gl.getUniformLocation(this.shaderLoc, 'u_ModelMatrix');
    if (!this.u_ModelMatrixLoc) { 
      console.log(this.constructor.name + 
                  '.init() failed to get GPU location for u_ModelMatrix uniform');
      return;
    }
    
    this.u_NormalMatrixLoc = gl.getUniformLocation(this.shaderLoc, 'u_NormalMatrix');
    if(!this.u_NormalMatrixLoc) {
      console.log('Failed to get GPU storage location for u_NormalMatrix');
      return
    }

    if (!this.u_ModelMatrixLoc || !this.u_MvpMatrixLoc 
    || !this.u_NormalMatrixLoc || !this.u_eyePosWorldLoc) {
      console.log(this.constructor.name + ' failed to get one or more \'matrix\' uniform locations');
    }
  
    this.lamp2.u_pos = gl.getUniformLocation(this.shaderLoc,  'u_LampSet[0].pos');
    this.lamp2.u_diff = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[0].diff');
    this.lamp2.u_ambi = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[0].ambi');
    this.lamp2.u_spec = gl.getUniformLocation(this.shaderLoc, 'u_LampSet[0].spec');
  
    if( !this.lamp2.u_pos || !this.lamp2.u_diff 
    || !this.lamp2.u_ambi || !this.lamp2.u_spec) {
      console.log(this.constructor.name + ' failed to get one or more lighting uniform storage locations.');
      return;
    }
  
    this.matl2.uLoc_Ke = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].emit');
    this.matl2.uLoc_Ka = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].ambi');
    this.matl2.uLoc_Kd = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].diff');
    this.matl2.uLoc_Ks = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].spec');
    this.matl2.uLoc_Kshiny = gl.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].shiny');
    if(!this.matl2.uLoc_Ke || !this.matl2.uLoc_Ka || !this.matl2.uLoc_Kd|| !this.matl2.uLoc_Kshiny) {
      console.log('Failed to get one or more reflectance storage locations');
      return;
    }  
  }
  
   
  VBObox2.prototype.switchToMe = function () {
  gl.useProgram(this.shaderLoc);	

  gl.bindBuffer(gl.ARRAY_BUFFER,	    // GLenum 'target' for this GPU buffer 
                      this.vboLoc);			// the ID# the GPU uses for our VBO.

  gl.vertexAttribPointer(
  		this.a_Pos1Loc,//index == ID# for the attribute var in GLSL shader pgm;
  		this.vboFcount_a_Position, // # of floats used by this attribute: 1,2,3 or 4?
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
  		this.vboOffset_a_Position);						
  		              // Offset == how many bytes from START of buffer to the first
    								// value we will actually use?  (we start with position).
    gl.vertexAttribPointer(this.a_Normal,this.vboFcount_a_Normal, 
                           gl.FLOAT, false, 
  							           this.vboStride,	this.vboOffset_a_Normal);	
    //-- Enable this assignment of the attribute to its' VBO source:
    gl.enableVertexAttribArray(this.a_Pos1Loc);
    gl.enableVertexAttribArray(this.a_Normal);
  }
  
  VBObox2.prototype.isReady = function() {
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
  
  gl.uniform1i(this.u_isBlinnLoc, g_isBlinn);
  gl.uniform3fv(this.u_eyePosWorldLoc, this.eyePosWorld);

  this.lamp2.I_pos.elements.set([g_lightPosX, g_lightPosY, g_lightPosZ]);
  this.lamp2.I_ambi.elements.set([g_ambientR, g_ambientG, g_ambientB]); 
  this.lamp2.I_diff.elements.set([g_diffuseR, g_diffuseG, g_diffuseB]); //* set diffuse light (white)
  this.lamp2.I_spec.elements.set([g_specularR, g_specularG, g_specularB]); //* set e64 light (white)

  gl.uniform3fv(this.lamp2.u_pos, this.lamp2.I_pos.elements.slice(0,3));
  gl.uniform3fv(this.lamp2.u_ambi, this.lamp2.I_ambi.elements);
  gl.uniform3fv(this.lamp2.u_diff, this.lamp2.I_diff.elements);
  gl.uniform3fv(this.lamp2.u_spec, this.lamp2.I_spec.elements);

  // **************** Central Sphere *****************
  set_material(gl, g_currMatl3, this.matl2, g_shiny)
  drawTree(gl,this.MvpMatrix, this.ModelMatrix, g_worldMat, this.u_MvpMatrixLoc, this.NormalMatrix, this.u_NormalMatrixLoc)
  // **************** Central Sphere *****************
  set_material(gl, g_currMatl1, this.matl2, g_shiny)
  this.ModelMatrix.setTranslate(0, 0, 0);	
  this.ModelMatrix.rotate(g_angleNow1, 0, 0, 1);
  drawSphere(gl,this.MvpMatrix, this.ModelMatrix, g_worldMat, this.u_MvpMatrixLoc, this.NormalMatrix, this.u_NormalMatrixLoc)
  // **************** Draw flower *****************
  set_material(gl, g_currMatl4, this.matl2, g_shiny)
  drawFlower(gl,this.MvpMatrix, this.ModelMatrix, g_worldMat, this.u_MvpMatrixLoc, this.NormalMatrix, this.u_NormalMatrixLoc)
  // **************** Draw alien fish *****************
  set_material(gl, g_currMatl2, this.matl2, g_shiny)
  drawAlienfish(gl,this.MvpMatrix, this.ModelMatrix, g_worldMat, this.u_MvpMatrixLoc, this.NormalMatrix, this.u_NormalMatrixLoc)
}
  
  VBObox2.prototype.draw = function() {
  //=============================================================================
  // Send commands to GPU to select and render current VBObox contents.
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
