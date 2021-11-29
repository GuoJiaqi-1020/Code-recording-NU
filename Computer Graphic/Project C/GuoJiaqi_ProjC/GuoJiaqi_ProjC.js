var gl;													// WebGL rendering context -- the 'webGL' object
																// in JavaScript with all its member fcns & data
var g_canvasID;									// HTML-5 'canvas' element ID#

// For multiple VBOs & Shaders:-----------------
worldBox = new VBObox0();		  // Holds VBO & shaders for 3D 'world' ground-plane grid, etc;
GouraudBox = new VBObox1();		  // "  "  for first set of custom-shaded 3D parts
PhongBox = new VBObox2();     // "  "  for second set of custom-shaded 3D parts

// For animation:---------------------
var g_lastMS = Date.now();			// Timestamp (in milliseconds) for our 
                                // most-recently-drawn WebGL screen contents.  
                                // Set & used by moveAll() fcn to update all
                                // time-varying params for our webGL drawings.
  // All time-dependent params (you can add more!)
var g_angleNow0  =  0.0; 			  // Current rotation angle, in degrees.
var g_angleRate0 = 45.0;				// Rotation angle rate, in degrees/second.
                                //---------------
var g_angleNow1  = 100.0;       // current angle, in degrees
var g_angleRate1 =  95.0;        // rotation angle rate, degrees/sec
var g_angleMax1  = 150.0;       // max, min allowed angle, in degrees
var g_angleMin1  =  60.0;
                                //---------------
var g_angleNow2  =  0.0; 			  // Current rotation angle, in degrees.
var g_angleRate2 = -62.0;				// Rotation angle rate, in degrees/second.

                                //---------------
var g_posNow0 =  0.0;           // current position
var g_posRate0 = 0.6;           // position change rate, in distance/second.
var g_posMax0 =  0.5;           // max, min allowed for g_posNow;
var g_posMin0 = -0.5;           
                                // ------------------
var g_posNow1 =  0.0;           // current position
var g_posRate1 = 0.5;           // position change rate, in distance/second.
var g_posMax1 =  1.0;           // max, min allowed positions
var g_posMin1 = -1.0;
                                //---------------
var g_angle01 = 0.0;                  // initial rotation angle
var g_angle01Rate = 45.0;           // rotation speed, in degrees/second 

var g_angle02 = 0.0;
var g_angle02Rate = 20.0;

var g_angleLink1 = 0.0;
var g_angleLink1Rate = 10.0;

var g_angleLink2 = 0.0;
var g_angleLink2Rate = 15.0;

var g_angleLink3 = 0.0;
var g_angleLink3Rate = 20.0;

var g_angleHead = 0.0;
var g_angleHeadRate = 20.0;

// For mouse/keyboard:------------------------
var g_show0 = 1;								// 0==Show, 1==Hide VBO0 contents on-screen.
var g_show1 = 1;								// 	"					"			VBO1		"				"				" 
var g_show2 = 1;                //  "         "     VBO2    "       "       "

var g_currMatl;
var g_isBlinn = false;
var g_shiny;
var g_shinyInit;

var g_lightPosXInit = document.getElementById('posX').value;
var g_lightPosYInit = document.getElementById('posY').value;
var g_lightPosZInit = document.getElementById('posZ').value;

var g_lightDiffRInit = document.getElementById('diffR').value;
var g_lightDiffGInit = document.getElementById('diffG').value;
var g_lightDiffBInit = document.getElementById('diffB').value;

var g_lightAmbiRInit = document.getElementById('ambiR').value;
var g_lightAmbiGInit = document.getElementById('ambiG').value;
var g_lightAmbiBInit = document.getElementById('ambiB').value;

var g_lightSpecRInit = document.getElementById('specR').value;
var g_lightSpecGInit = document.getElementById('specG').value;
var g_lightSpecBInit = document.getElementById('specB').value;

var g_lightPosX;
var g_lightPosY;
var g_lightPosZ;

var g_lightDiffR;
var g_lightDiffG;
var g_lightDiffB;

var g_lightAmbiR;
var g_lightAmbiG;
var g_lightAmbiB;

var g_lightSpecR;
var g_lightSpecG;
var g_lightSpecB;



// ? -------------- Copied from ProjectB.js ---------------

const UP_ARROW    = 38;
const LEFT_ARROW  = 37;
const RIGHT_ARROW = 39;
const DOWN_ARROW  = 40;

const W = 87;
const A = 65;
const S = 83;
const D = 68;

var g_camXInit = 6.5, g_camYInit = 5.5, g_camZInit = 5.0;
var g_lookXInit = 1.0, g_lookYInit = 1.0, g_lookZInit = 4.5;

var g_aimThetaInit = 215.0

var g_camX = g_camXInit, g_camY = g_camYInit, g_camZ = g_camZInit; //! Location of our camera
var g_lookX = g_lookXInit, g_lookY = g_lookYInit, g_lookZ = g_lookZInit; //! Where our camera is looking

var g_aimTheta = g_aimThetaInit;

var g_aimZDiff = g_lookZ - g_camZ;

var g_moveRate = 3.0;

// ? --------------------- End copy -----------------------



// ! Global camera control
g_worldMat = new Matrix4();

function main() {
//=============================================================================
  // Retrieve the HTML-5 <canvas> element where webGL will draw our pictures:
  g_canvasID = document.getElementById('webgl');	
  // Create the the WebGL rendering context: one giant JavaScript object that
  // contains the WebGL state machine adjusted by large sets of WebGL functions,
  // built-in variables & parameters, and member data. Every WebGL function call
  // will follow this format:  gl.WebGLfunctionName(args);

  // Create the the WebGL rendering context: one giant JavaScript object that
  // contains the WebGL state machine, adjusted by big sets of WebGL functions,
  // built-in variables & parameters, and member data. Every WebGL func. call
  // will follow this format:  gl.WebGLfunctionName(args);
  //SIMPLE VERSION:  gl = getWebGLContext(g_canvasID); 
  // Here's a BETTER version:
  gl = g_canvasID.getContext("webgl", { preserveDrawingBuffer: true});
	// This fancier-looking version disables HTML-5's default screen-clearing, so 
	// that our drawMain() 
	// function will over-write previous on-screen results until we call the 
	// gl.clear(COLOR_BUFFER_BIT); function. )
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  window.addEventListener('keydown', keyDown, false); // add event listener for the keyboard

  gl.clearColor(0.2, 0.1, 0.3, 1);	  // RGBA color for clearing <canvas>

  gl.enable(gl.DEPTH_TEST);

  // Initialize each of our 'vboBox' objects: 
  worldBox.init(gl);		// VBO + shaders + uniforms + attribs for our 3D world,
                        // including ground-plane,                       
  GouraudBox.init(gl);		//  "		"		"  for 1st kind of shading & lighting
  PhongBox.init(gl);    //  "   "   "  for 2nd kind of shading & lighting
  
  // ==============ANIMATION=============
  // Quick tutorials on synchronous, real-time animation in JavaScript/HTML-5: 
  //    https://webglfundamentals.org/webgl/lessons/webgl-animation.html
  //  or
  //  	http://creativejs.com/resources/requestanimationframe/
  //		--------------------------------------------------------
  // Why use 'requestAnimationFrame()' instead of the simpler-to-use
  //	fixed-time setInterval() or setTimeout() functions?  Because:
  //		1) it draws the next animation frame 'at the next opportunity' instead 
  //			of a fixed time interval. It allows your browser and operating system
  //			to manage its own processes, power, & computing loads, and to respond 
  //			to on-screen window placement (to skip battery-draining animation in 
  //			any window that was hidden behind others, or was scrolled off-screen)
  //		2) it helps your program avoid 'stuttering' or 'jittery' animation
  //			due to delayed or 'missed' frames.  Your program can read and respond 
  //			to the ACTUAL time interval between displayed frames instead of fixed
  //		 	fixed-time 'setInterval()' calls that may take longer than expected.
  //------------------------------------
  var tick = function() {		    // locally (within main() only), define our 
                                // self-calling animation function. 
    g_canvasID.width = innerWidth;
    g_canvasID.height = innerHeight *0.75;
    requestAnimationFrame(tick, g_canvasID); // browser callback request; wait
                                // til browser is ready to re-draw canvas, then
    timerAll();  // Update all time-varying params, and
    drawAll();                // Draw all the VBObox contents
    };
  //------------------------------------
  tick();                       // do it again!
}

function timerAll() {
//=============================================================================
// Find new values for all time-varying parameters used for on-screen drawing
  // use local variables to find the elapsed time.
  var nowMS = Date.now();             // current time (in milliseconds)
  var elapsed = nowMS - g_lastMS;   // 
  g_lastMS = nowMS;                   // update for next webGL drawing.
  if(elapsed > 1000.0) {            
    // Browsers won't re-draw 'canvas' element that isn't visible on-screen 
    // (user chose a different browser tab, etc.); when users make the browser
    // window visible again our resulting 'elapsedMS' value has gotten HUGE.
    // Instead of allowing a HUGE change in all our time-dependent parameters,
    // let's pretend that only a nominal 1/30th second passed:
    elapsed = 1000.0/30.0;
    }
  // Find new time-dependent parameters using the current or elapsed time:
  // Continuous rotation:
  g_angleNow0 = g_angleNow0 + (g_angleRate0 * elapsed) / 1000.0;
  g_angleNow1 = g_angleNow1 + (g_angleRate1 * elapsed) / 1000.0;
  g_angleNow2 = g_angleNow2 + (g_angleRate2 * elapsed) / 1000.0;
  g_angleNow0 %= 360.0;   // keep angle >=0.0 and <360.0 degrees  
  g_angleNow1 %= 360.0;   
  g_angleNow2 %= 360.0;
  // if(g_angleNow1 > g_angleMax1) { // above the max?
  //   g_angleNow1 = g_angleMax1;    // move back down to the max, and
  //   g_angleRate1 = -g_angleRate1; // reverse direction of change.
  //   }
  // else if(g_angleNow1 < g_angleMin1) {  // below the min?
  //   g_angleNow1 = g_angleMin1;    // move back up to the min, and
  //   g_angleRate1 = -g_angleRate1;
  //   }
  // Continuous movement:
  g_posNow0 += g_posRate0 * elapsed / 1000.0;
  g_posNow1 += g_posRate1 * elapsed / 1000.0;
  // apply position limits
  if(g_posNow0 > g_posMax0) {   // above the max?
    g_posNow0 = g_posMax0;      // move back down to the max, and
    g_posRate0 = -g_posRate0;   // reverse direction of change
    }
  else if(g_posNow0 < g_posMin0) {  // or below the min? 
    g_posNow0 = g_posMin0;      // move back up to the min, and
    g_posRate0 = -g_posRate0;   // reverse direction of change.
    }
  if(g_posNow1 > g_posMax1) {   // above the max?
    g_posNow1 = g_posMax1;      // move back down to the max, and
    g_posRate1 = -g_posRate1;   // reverse direction of change
    }
  else if(g_posNow1 < g_posMin1) {  // or below the min? 
    g_posNow1 = g_posMin1;      // move back up to the min, and
    g_posRate1 = -g_posRate1;   // reverse direction of change.
    }

  var g_angle01min = -60.0;
	var g_angle01max =  60.0;

	var angleLink1min = -60.0;
	var angleLink1max =  60.0;

	var angleLink2min = -50.0;
	var angleLink2max =  50.0;

	var angleLink3min = -40.0;
	var angleLink3max =  40.0; 

	var angleHeadmin = -45.0;
	var angleHeadmax =  45.0;

	// Update the current rotation angle (adjusted by the elapsed time)
  //  limit the angle to move smoothly between +120 and -120 degrees:
  if(g_angle01 >  g_angle01max && g_angle01Rate > 0) g_angle01Rate = -g_angle01Rate;
	if(g_angle01 <  g_angle01min && g_angle01Rate < 0) g_angle01Rate = -g_angle01Rate;

	if(g_angleLink1 >  angleLink1max && g_angleLink1Rate > 0) g_angleLink1Rate = -g_angleLink1Rate;
	if(g_angleLink1 <  angleLink1min && g_angleLink1Rate < 0) g_angleLink1Rate = -g_angleLink1Rate;

	if(g_angleLink2 >  angleLink2max && g_angleLink2Rate > 0) g_angleLink2Rate = -g_angleLink2Rate;
	if(g_angleLink2 <  angleLink2min && g_angleLink2Rate < 0) g_angleLink2Rate = -g_angleLink2Rate;

	if(g_angleLink3 >  angleLink3max && g_angleLink3Rate > 0) g_angleLink3Rate = -g_angleLink3Rate;
	if(g_angleLink3 <  angleLink3min && g_angleLink3Rate < 0) g_angleLink3Rate = -g_angleLink3Rate;
	
	if(g_angleLink3 >  angleHeadmax && g_angleHeadRate > 0) g_angleHeadRate = -g_angleHeadRate;
	if(g_angleLink3 <  angleHeadmin && g_angleHeadRate < 0) g_angleHeadRate = -g_angleHeadRate;
	
	g_angleLink1 = (g_angleLink1 + (g_angleLink1Rate * elapsed) / 1000.0)  % 360;
	g_angleLink2 = (g_angleLink2 + (g_angleLink2Rate * elapsed) / 1000.0)  % 360;
	g_angleLink3 = (g_angleLink3 + (g_angleLink3Rate * elapsed) / 1000.0)  % 360;	
	g_angleHead  = (g_angleHead  + (g_angleHeadRate  * elapsed) / 1000.0)  % 360;

}

function drawAll() {
//=============================================================================
  // Clear on-screen HTML-5 <canvas> object:
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  g_currMatl = getMatl();
  g_shiny = document.getElementById("shiny").value;
  setCamera();
  getUsrValues();

var b4Draw = Date.now();
var b4Wait = b4Draw - g_lastMS;

	if(g_show0 == 1) {	// IF user didn't press HTML button to 'hide' VBO0:
	  worldBox.switchToMe();  // Set WebGL to render from this VBObox.
		worldBox.adjust();		  // Send new values for uniforms to the GPU, and
		worldBox.draw();			  // draw our VBO's contents using our shaders.
  }
  if(g_show1 == 1) { // IF user didn't press HTML button to 'hide' VBO1:
    GouraudBox.switchToMe();  // Set WebGL to render from this VBObox.
  	GouraudBox.adjust();		  // Send new values for uniforms to the GPU, and
  	GouraudBox.draw();			  // draw our VBO's contents using our shaders.
	  }
	if(g_show2 == 1) { // IF user didn't press HTML button to 'hide' VBO2:
	  PhongBox.switchToMe();  // Set WebGL to render from this VBObox.
  	PhongBox.adjust();		  // Send new values for uniforms to the GPU, and
  	PhongBox.draw();			  // draw our VBO's contents using our shaders.
  	}
/* // ?How slow is our own code?  	
var aftrDraw = Date.now();
var drawWait = aftrDraw - b4Draw;
console.log("wait b4 draw: ", b4Wait, "drawWait: ", drawWait, "mSec");
*/
}

function VBO0toggle() {
//=============================================================================
// Called when user presses HTML-5 button 'Show/Hide VBO0'.
  if(g_show0 != 1) g_show0 = 1;				// show,
  else g_show0 = 0;										// hide.
  console.log('g_show0: '+g_show0);
}

function VBO1toggle() {
//=============================================================================
// Called when user presses HTML-5 button 'Show/Hide VBO1'.
  if(g_show1 != 1) {
    g_show1 = 1;			// show,
    document.getElementById('toggleShading').innerText = "Toggle Phong Shading";
  } else {
    g_show1 = 0;
    document.getElementById('toggleShading').innerText= "Toggle Gouraud Shading";
  }									// hide.
  
  console.log('g_show1: '+g_show1);
}

function VBO2toggle() {
//=============================================================================
// Called when user presses HTML-5 button 'Show/Hide VBO2'.
  if(g_show2 != 1) g_show2 = 1;			// show,
  else g_show2 = 0;									// hide.
  console.log('g_show2: '+g_show2);
}

function toggleBlinn() {
  if(!g_isBlinn) g_isBlinn = true;
  else g_isBlinn = false;
  console.log('g_isBlinn: '+ g_isBlinn);
}

function setCamera() {
  g_worldMat.setIdentity();

  g_lookX = g_camX + Math.cos(toRadians(g_aimTheta));
	g_lookY = g_camY + Math.sin(toRadians(g_aimTheta));
  g_lookZ = g_camZ + g_aimZDiff;

  gl.viewport(0,											 				// Viewport lower-left corner
    0, 			// location(in pixels)
    g_canvasID.width, 					// viewport width,
    g_canvasID.height);			// viewport height in pixels.

  
  g_worldMat.perspective(42.0, // FOV
    g_canvasID.width/g_canvasID.height, // Aspect ratio
    1.0, // z-near
    100.0,); // z-far
    
  g_worldMat.lookAt( g_camX,  g_camY,  g_camZ, // camera position
                     g_lookX, g_lookY, g_lookZ, // looking position
                     0.0,     0.0,     1.0,);// up vector
}

function keyDown(ev) {
  var xd = g_camX - g_lookX;
	var yd = g_camY - g_lookY;
	var zd = g_camZ - g_lookZ;

	var len = Math.sqrt(Math.pow(xd, 2) + Math.pow(yd, 2) + Math.pow(zd, 2));

	var moveRateRad = toRadians(g_moveRate);
	
	switch(ev.keyCode) {
		case LEFT_ARROW:
			g_aimTheta += g_moveRate;

			if(g_aimTheta > 360) g_aimTheta -= 360.0;
			if(g_aimTheta < 0) g_aimTheta += 360.0;

			break;
		case RIGHT_ARROW: 
			g_aimTheta -= g_moveRate;

			if(g_aimTheta > 360) g_aimTheta -= 360.0;
			if(g_aimTheta < 0) g_aimTheta += 360.0;

			break;
		case UP_ARROW:
			g_aimZDiff += moveRateRad;
			break;
		case DOWN_ARROW:
			g_aimZDiff -= moveRateRad;
			break;
		case W: 
			g_lookX -= (xd / len);
			g_lookY -= (yd / len);
			g_lookZ -= (zd / len);

			g_camX -= (xd / len);
			g_camY -= (yd / len);
			g_camZ -= (zd / len);

			break;
		case S: 
			g_lookX += (xd / len);
			g_lookY += (yd / len);
			g_lookZ += (zd / len);

			g_camX += (xd / len);
			g_camY += (yd / len);
			g_camZ += (zd / len);

			break;
		case A:
			var xStrafe = Math.cos(toRadians(g_aimTheta + 90));
			var yStrafe = Math.sin(toRadians(g_aimTheta + 90));

			g_camX += xStrafe / len;
			g_camY += yStrafe / len;

			break;
		case D:
			var xStrafe = Math.cos(toRadians(g_aimTheta + 90));
			var yStrafe = Math.sin(toRadians(g_aimTheta + 90));

			g_camX -= xStrafe / len;
			g_camY -= yStrafe / len;

			break;
	}
}

function toRadians(angle) {
	return angle * (Math.PI/180);
}

function getMatl() {
  matlSelect = document.getElementById('materials').value;
  if (g_currMatl != matlSelect){
    var matl = new Material(parseInt(matlSelect));
    g_shinyInit = matl.K_shiny;
    document.getElementById('shiny').value = g_shinyInit;
    return matlSelect;
  }
  return g_currMatl;
}

function getUsrValues() {
  var usrPosX, usrPosY, usrPosZ, 
      usrAmbiR, usrAmbiG, usrAmbiB, 
      usrDiffR, usrDiffG, usrDiffB, 
      usrSpecR, usrSpecG, usrSpecB;


  // * Light position in world coords
  
  usrPosX = document.getElementById('posX').value;
  if(!isNaN(usrPosX)) g_lightPosX = usrPosX;

  usrPosY = document.getElementById('posY').value;
  if(!isNaN(usrPosY)) g_lightPosY = usrPosY

  usrPosZ = document.getElementById('posZ').value;
  if(!isNaN(usrPosZ)) g_lightPosZ = usrPosZ;

  // * Ambient light color

  usrAmbiR = document.getElementById('ambiR').value;
  if(!isNaN(usrAmbiR)) g_lightAmbiR = usrAmbiR;

  usrAmbiG = document.getElementById('ambiG').value;
  if(!isNaN(usrAmbiG)) g_lightAmbiG = usrAmbiG;

  usrAmbiB = document.getElementById('ambiB').value;
  if(!isNaN(usrAmbiB)) g_lightAmbiB = usrAmbiB;

  // * Diffuse light color

  usrDiffR = document.getElementById('diffR').value;
  if(!isNaN(usrDiffR)) g_lightDiffR = usrDiffR;

  usrDiffG = document.getElementById('diffG').value;
  if(!isNaN(usrDiffG)) g_lightDiffG = usrDiffG;

  usrDiffB = document.getElementById('diffB').value;
  if(!isNaN(usrDiffB)) g_lightDiffB = usrDiffB;

  // * Specular light color

  usrSpecR = document.getElementById('specR').value;
  if(!isNaN(usrSpecR)) g_lightSpecR = usrSpecR;

  usrSpecG = document.getElementById('specG').value;
  if(!isNaN(usrSpecG)) g_lightSpecG = usrSpecG;

  usrSpecB = document.getElementById('specB').value;
  if(!isNaN(usrSpecB)) g_lightSpecB = usrSpecB;
}

function resetLightPos() {
  document.getElementById('posX').value = g_lightPosXInit;
  document.getElementById('posY').value = g_lightPosYInit;
  document.getElementById('posZ').value = g_lightPosZInit;
}

function resetLightAmbi() {
  document.getElementById('ambiR').value = g_lightAmbiRInit;
  document.getElementById('ambiG').value = g_lightAmbiGInit;
  document.getElementById('ambiB').value = g_lightAmbiBInit;
}

function resetLightDiff() {
  document.getElementById('diffR').value = g_lightDiffRInit;
  document.getElementById('diffG').value = g_lightDiffGInit;
  document.getElementById('diffB').value = g_lightDiffBInit;
}

function resetLightSpec() {
  document.getElementById('specR').value = g_lightSpecRInit;
  document.getElementById('specG').value = g_lightSpecGInit;
  document.getElementById('specB').value = g_lightSpecBInit;
}

function resetShiny() {
  document.getElementById('shiny').value = g_shinyInit;
}
