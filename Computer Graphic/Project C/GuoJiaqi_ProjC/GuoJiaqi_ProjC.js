var gl;													// WebGL rendering context -- the 'webGL' object
																// in JavaScript with all its member fcns & data
var g_canvas;									// HTML-5 'canvas' element ID#

// For multiple VBOs & Shaders:-----------------
worldBox = new VBObox0();		  // Holds VBO & shaders for 3D 'world' ground-plane grid, etc;
GouraudBox = new VBObox1();		  // "  "  for first set of custom-shaded 3D parts
PhongBox = new VBObox2();     // "  "  for second set of custom-shaded 3D parts

// For animation:---------------------
var g_last = Date.now();
// For mouse click:---------------------
var g_isDrag=false;		// mouse-drag: true when user holds down mouse button
var g_xMclik=0.0;			// last mouse button-down position (in CVV coords)
var g_yMclik=0.0;   
var g_digits = 3.0

// All time-dependent params (you can add more!)
var g_angleNow0  =  0.0; 			  // Current rotation angle, in degrees.
var g_angleRate0 = 45.0;				// Rotation angle rate, in degrees/second.
                                //---------------
var g_angleSphere  = 100.0;       // current angle, in degrees
var g_angleRate1 =  10.0;        // rotation angle rate, degrees/sec
var g_angleMax1  = 150.0;       // max, min allowed angle, in degrees
var g_angleMin1  =  60.0;

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

var g_angle03 = 0.0;
var g_angle03Rate = 20.0;

var g_angle04 = 0.0;
var g_angle04Rate = 15.0;

var g_angle05 = 0.0;
var g_angle05Rate = 20.0;

var g_angle06 = 0.0;
var g_angle06Rate = 20.0;

var g_angleTail = 0.0;
var g_angleTailRate = 20.0;

// For mouse/keyboard:------------------------
var show_VBO_0 = 1;								// 0==Show, 1==Hide VBO0 contents on-screen.
var show_VBO_1 = 1;								// 	"					"			VBO1		"				"				" 
var show_VBO_2 = 1;                //  "         "     VBO2    "       "       "

var g_currMatl1;
var g_currMatl2;
var g_currMatl3;
var g_currMatl4;
var g_isBlinn = true;
var g_shiny1;
var g_shinyInit1;
var g_shiny2;
var g_shinyInit2;
var g_shiny3;
var g_shinyInit3;
var g_shiny4;
var g_shinyInit4;

var g_lightPosXInit = document.getElementById('posX').value;
var g_lightPosYInit = document.getElementById('posY').value;
var g_lightPosZInit = document.getElementById('posZ').value;

var g_diffuseRInit = document.getElementById('diffR').value;
var g_diffuseGInit = document.getElementById('diffG').value;
var g_diffuseBInit = document.getElementById('diffB').value;

var g_ambientRInit = document.getElementById('ambiR').value;
var g_ambientGInit = document.getElementById('ambiG').value;
var g_ambientBInit = document.getElementById('ambiB').value;

var g_specularRInit = document.getElementById('specR').value;
var g_specularGInit = document.getElementById('specG').value;
var g_specularBInit = document.getElementById('specB').value;

var g_lightPosX;
var g_lightPosY;
var g_lightPosZ;

var g_diffuseR;
var g_diffuseG;
var g_diffuseB;

var g_ambientR;
var g_ambientG;
var g_ambientB;

var g_specularR;
var g_specularG;
var g_specularB;

// Perspective Camera Setting
var g_camXInit = 6.5, g_camYInit = 6, g_camZInit = 5.55;
var g_lookXInit = 1.5, g_lookYInit = 1.5, g_lookZInit = 5;
var g_DInit = g_lookZInit - g_camZInit
var g_ThetaInit = -142.0
// initialize the camera's position
var g_camX = g_camXInit, g_camY = g_camYInit, g_camZ = g_camZInit;  
var g_lookX = g_lookXInit, g_lookY = g_lookYInit, g_lookZ = g_lookZInit; 
var g_Theta = g_ThetaInit;
var g_D = g_lookZ - g_camZ;
var g_moveRate = 2.5;


// ! Global camera control
g_worldMatrix = new Matrix4();

function main() {
  g_canvas = document.getElementById('webgl');	
  gl = g_canvas.getContext("webgl", { preserveDrawingBuffer: true});
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

	// Event Listerner: keyboard and mouse
  window.addEventListener('keydown', mykeyDown, false);
	window.addEventListener("mousedown", myMouseDown); 
  window.addEventListener("mousemove", myMouseMove); 
	window.addEventListener("mouseup", myMouseUp);	


  gl.clearColor(0.2, 0.2, 0.2, 1);	  // RGBA color for clearing <canvas>
  gl.enable(gl.DEPTH_TEST);
  // Initialization of three shaders
  worldBox.init(gl);		// VBO + shaders + uniforms + attribs for our 3D world,               
  GouraudBox.init(gl);		//  "		"		"  for 1st kind of shading & lighting
  PhongBox.init(gl);    //  "   "   "  for 2nd kind of shading & lighting

  var tick = function() {		    // locally (within main() only), define our 
    g_canvas = Resized_Web(g_canvas); 
    requestAnimationFrame(tick, g_canvas); 
    animate(); 
    drawAll();
    };
  //------------------------------------
  tick();                       // do it again!
}

function Resized_Web(g_canvas) {
  // Set aside 16 pixels to avoid scorll bars 
  g_canvas.width = innerWidth - 19;
  // Make canvas fill the top 70% of our browser height
  g_canvas.height = (innerHeight*0.7);
   return g_canvas
  }

function animate() {
  var now = Date.now();
  var elapsed = now - g_last; 
  g_last = now; 

  if(elapsed > 1000.0) {            
    elapsed = 1000.0/30.0;
    }
 
  g_angleNow0 = g_angleNow0 + (g_angleRate0 * elapsed) / 1000.0;
  g_angleSphere = g_angleSphere + (g_angleRate1 * elapsed) / 1000.0;

  
 
  g_posNow0 += g_posRate0 * elapsed / 1000.0;
  g_angleNow0 %= 360.0;
  if(g_posNow0 > g_posMax0 || g_posNow0 < g_posMin0) {   // above the max?
    g_posNow0 = g_posMax0;      // move back down to the max, and
    g_posRate0 = -g_posRate0;   // reverse direction of change
    }

  g_posNow1 += g_posRate1 * elapsed / 1000.0;
  g_angleSphere %= 360.0; 
  if(g_posNow1 > g_posMax1 || g_posNow1 < g_posMin1) {   // above the max?
    g_posNow1 = g_posMax1;      // move back down to the max, and
    g_posRate1 = -g_posRate1;   // reverse direction of change
    }

  if(g_angle01 >  60 && g_angle01Rate > 0) g_angle01Rate = -g_angle01Rate;
	if(g_angle01 <  -60 && g_angle01Rate < 0) g_angle01Rate = -g_angle01Rate;

  g_angle03 = (g_angle03 + (g_angle03Rate * elapsed) / 1000.0)  % 360;
	if(g_angle03 >  15 && g_angle03Rate > 0) g_angle03Rate = -g_angle03Rate;
	if(g_angle03 <  -15 && g_angle03Rate < 0) g_angle03Rate = -g_angle03Rate;
  
  g_angle04 = (g_angle04 + (g_angle04Rate * elapsed) / 1000.0)  % 360;
	if(g_angle04 >  15 && g_angle04Rate > 0) g_angle04Rate = -g_angle04Rate;
	if(g_angle04 <  -15 && g_angle04Rate < 0) g_angle04Rate = -g_angle04Rate;
  
  g_angle05 = (g_angle05 + (g_angle05Rate * elapsed) / 1000.0)  % 360;	
	if(g_angle05 >  20 && g_angle05Rate > 0) g_angle05Rate = -g_angle05Rate;
	if(g_angle05 <  -20 && g_angle05Rate < 0) g_angle05Rate = -g_angle05Rate;
  
	g_angle06  = (g_angle06  + (g_angle06Rate  * elapsed) / 1000.0)  % 360;
	if(g_angle06 >  45 && g_angle06Rate > 0) g_angle06Rate = -g_angle06Rate;
	if(g_angle06 <  -45 && g_angle06Rate < 0) g_angle06Rate = -g_angle06Rate;
}

function drawAll() {
//=============================================================================
  // Clear on-screen HTML-5 <canvas> object:
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  g_currMatl1 = getMaterial_S();
  g_currMatl2 = getMaterial_A();
  g_currMatl3 = getMaterial_T();
  g_currMatl4 = getMaterial_F();
  g_shiny1 = document.getElementById("shiny1").value;
  g_shiny2 = document.getElementById("shiny2").value;
  g_shiny3 = document.getElementById("shiny3").value;
  g_shiny4 = document.getElementById("shiny4").value;
  
  setCamera();
  getWebInput();

	if(show_VBO_0 == 1) {	// IF user didn't press HTML button to 'hide' VBO0:
	  worldBox.switchToMe();  // Set WebGL to render from this VBObox.
		worldBox.adjust();		  // Send new values for uniforms to the GPU, and
		worldBox.draw();			  // draw our VBO's contents using our shaders.
  }
  if(show_VBO_1 == 1) { // IF user didn't press HTML button to 'hide' VBO1:
    GouraudBox.switchToMe(); 
    GouraudBox.isReady(); 
  	GouraudBox.adjust();		  // Send new values for uniforms to the GPU, and
  	GouraudBox.draw();			  // draw our VBO's contents using our shaders.
	  }
	if(show_VBO_2 == 1) { // IF user didn't press HTML button to 'hide' VBO2:
	  PhongBox.switchToMe();  // Set WebGL to render from this VBObox.
    PhongBox.isReady();
  	PhongBox.adjust();		  // Send new values for uniforms to the GPU, and
  	PhongBox.draw();			  // draw our VBO's contents using our shaders.
  	}
}

function VBO0toggle() {
//=============================================================================
// Called when user presses HTML-5 button 'Show/Hide VBO0'.
  if(show_VBO_0 != 1) show_VBO_0 = 1;				// show,
  else show_VBO_0 = 0;										// hide.
  console.log('show_VBO_0: '+show_VBO_0);
}

function VBO1toggle() {
//=============================================================================
// Called when user presses HTML-5 button 'Show/Hide VBO1'.
  if(show_VBO_1 == 1) {
    show_VBO_1 = 0;			// show,
    console.log('Hide shader VBO1');
    show_VBO_2 = 1;
    console.log('Show shader VBO2');
    document.getElementById('toggleShading').innerText = "Switch Phong Shading";
  } else {
    show_VBO_1 = 1;
    console.log('Show shader VBO1');
    show_VBO_2 = 0;
    console.log('Hide shader VBO2');
    document.getElementById('toggleShading').innerText= "Switch Gouraud Shading";
  }									// hide.

}

function toggleBlinn() {
  if(!g_isBlinn) g_isBlinn = true;
  else g_isBlinn = false;
  console.log('g_isBlinn: '+ g_isBlinn);
}

function setCamera() {
  g_worldMatrix.setIdentity();

  g_lookX = g_camX + Math.cos(Angle2Radians(g_Theta));
	g_lookY = g_camY + Math.sin(Angle2Radians(g_Theta));
  g_lookZ = g_camZ + g_D;

  gl.viewport(0,											 				// Viewport lower-left corner
    0, 			// location(in pixels)
    g_canvas.width, 					// viewport width,
    g_canvas.height);			// viewport height in pixels.

  
  g_worldMatrix.perspective(30.0, // FOV
    g_canvas.width/g_canvas.height, // Aspect ratio
    1.0, // z-near
    100.0,); // z-far
    
  g_worldMatrix.lookAt( g_camX,  g_camY,  g_camZ, // camera position
                     g_lookX, g_lookY, g_lookZ, // looking position
                     0.0,     0.0,     1.0,);// up vector
}

// define the key number
const A = 65;
const D = 68;
const W = 87;
const S = 83;
const R = 82;
const UP_ARROW    = 38;
const LEFT_ARROW  = 37;
const RIGHT_ARROW = 39;
const DOWN_ARROW  = 40;

function mykeyDown(ev) {
  var xd = g_camX - g_lookX;
	var yd = g_camY - g_lookY;
	var zd = g_camZ - g_lookZ;
	var len = Math.sqrt(Math.pow(xd, 2) + Math.pow(yd, 2) + Math.pow(zd, 2));
	var moveRateRad = Angle2Radians(g_moveRate);
	
	switch(ev.keyCode) {
		case LEFT_ARROW:
      console.log(' left-arrow.');
			g_Theta += g_moveRate;

			if(g_Theta > 360) g_Theta -= 360.0;
			if(g_Theta < 0) g_Theta += 360.0;

			break;
		case RIGHT_ARROW: 
      console.log('right-arrow.');
			g_Theta -= g_moveRate;

			if(g_Theta > 360) g_Theta -= 360.0;
			if(g_Theta < 0) g_Theta += 360.0;

			break;
		case UP_ARROW:
      console.log('up-arrow.');
			g_D += moveRateRad;
			break;
		case DOWN_ARROW:
      console.log('down-arrow.');
			g_D -= moveRateRad;
			break;
    case A:
      console.log("d/D key: Strafe LEFT!\n");
      var xStrafe = Math.cos(Angle2Radians(g_Theta + 90));
      var yStrafe = Math.sin(Angle2Radians(g_Theta + 90));
      g_camX += xStrafe / len;
      g_camY += yStrafe / len;

      break;
    case D:
      console.log("d/D key: Strafe RIGHT!\n");
      var xStrafe = Math.cos(Angle2Radians(g_Theta + 90));
      var yStrafe = Math.sin(Angle2Radians(g_Theta + 90));

      g_camX -= xStrafe / len;
      g_camY -= yStrafe / len;

      break;
		case W: 
      console.log("w/W key: Move FWD!\n");
			g_lookX -= (xd / len);
			g_lookY -= (yd / len);
			g_lookZ -= (zd / len);
			g_camX -= (xd / len);
			g_camY -= (yd / len);
			g_camZ -= (zd / len);

			break;
		case S: 
    console.log("s/S key: Move BACK!\n");
			g_lookX += (xd / len);
			g_lookY += (yd / len);
			g_lookZ += (zd / len);
			g_camX += (xd / len);
			g_camY += (yd / len);
			g_camZ += (zd / len);

			break;
      
    case R: 
    console.log("r/R key: Reset\n");
      g_lookX = g_lookXInit;
      g_lookY = g_lookYInit;
      g_lookZ = g_lookZInit;
      g_camX = g_camXInit;
      g_camY = g_camYInit;
      g_camZ = g_camZInit;
      g_Theta = g_ThetaInit
      g_D = g_DInit

      break;
    default:
      console.log("UNUSED!");
      break;
	}
}

function Angle2Radians(angle) {
	return angle * (Math.PI/180);
}

function getMaterial_S() {
  matlSelect = document.getElementById('Spherematerials').value;
  if (g_currMatl1 != matlSelect){
    var matl = new Material(parseInt(matlSelect));
    g_shinyInit1 = matl.K_shiny;
    document.getElementById('shiny1').value = g_shinyInit1;
    return matlSelect;
  }
  return g_currMatl1;
}

function getMaterial_A() {
  matlSelect = document.getElementById('Fishmaterials').value;
  if (g_currMatl2 != matlSelect){
    var matl = new Material(parseInt(matlSelect));
    g_shinyInit2 = matl.K_shiny;
    document.getElementById('shiny2').value = g_shinyInit2;
    return matlSelect;
  }
  return g_currMatl2;
}

function getMaterial_T() {
  matlSelect = document.getElementById('Treematerials').value;
  if (g_currMatl3 != matlSelect){
    var matl = new Material(parseInt(matlSelect));
    g_shinyInit3 = matl.K_shiny;
    document.getElementById('shiny3').value = g_shinyInit3;
    return matlSelect;
  }
  return g_currMatl3;
}

function getMaterial_F() {
  matlSelect = document.getElementById('materials').value;
  if (g_currMatl4 != matlSelect){
    var matl = new Material(parseInt(matlSelect));
    g_shinyInit4 = matl.K_shiny;
    document.getElementById('shiny4').value = g_shinyInit4;
    return matlSelect;
  }
  return g_currMatl4;
}

function getWebInput() {
  var lightPosX, lightPosY, lightPosZ, 
      AmbiR, AmbiG, AmbiB, 
      DiffuR, DiffuG, DiffuB, 
      SpecR, SpecG, SpecB;

  
  lightPosX = document.getElementById('posX').value;
  if(!isNaN(lightPosX)) g_lightPosX = lightPosX;

  lightPosY = document.getElementById('posY').value;
  if(!isNaN(lightPosY)) g_lightPosY = lightPosY

  lightPosZ = document.getElementById('posZ').value;
  if(!isNaN(lightPosZ)) g_lightPosZ = lightPosZ;

  AmbiR = document.getElementById('ambiR').value;
  if(!isNaN(AmbiR)) g_ambientR = AmbiR;

  AmbiG = document.getElementById('ambiG').value;
  if(!isNaN(AmbiG)) g_ambientG = AmbiG;

  AmbiB = document.getElementById('ambiB').value;
  if(!isNaN(AmbiB)) g_ambientB = AmbiB;

  DiffuR = document.getElementById('diffR').value;
  if(!isNaN(DiffuR)) g_diffuseR = DiffuR;

  DiffuG = document.getElementById('diffG').value;
  if(!isNaN(DiffuG)) g_diffuseG = DiffuG;

  DiffuB = document.getElementById('diffB').value;
  if(!isNaN(DiffuB)) g_diffuseB = DiffuB;

  SpecR = document.getElementById('specR').value;
  if(!isNaN(SpecR)) g_specularR = SpecR;

  SpecG = document.getElementById('specG').value;
  if(!isNaN(SpecG)) g_specularG = SpecG;

  SpecB = document.getElementById('specB').value;
  if(!isNaN(SpecB)) g_specularB = SpecB;
}

function resetLightPos() {
  document.getElementById('posX').value = g_lightPosXInit;
  document.getElementById('posY').value = g_lightPosYInit;
  document.getElementById('posZ').value = g_lightPosZInit;
}

function resetAmbi() {
  document.getElementById('ambiR').value = g_ambientRInit;
  document.getElementById('ambiG').value = g_ambientGInit;
  document.getElementById('ambiB').value = g_ambientBInit;
}

function resetDiffu() {
  document.getElementById('diffR').value = g_diffuseRInit;
  document.getElementById('diffG').value = g_diffuseGInit;
  document.getElementById('diffB').value = g_diffuseBInit;
}

function resetSpec() {
  document.getElementById('specR').value = g_specularRInit;
  document.getElementById('specG').value = g_specularGInit;
  document.getElementById('specB').value = g_specularBInit;
}

function resetShiny() {
  document.getElementById('shiny1').value = g_shinyInit1;
  document.getElementById('shiny2').value = g_shinyInit2;
  document.getElementById('shiny3').value = g_shinyInit3;
  document.getElementById('shiny4').value = g_shinyInit4;
}

function myMouseDown(ev) {
    var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
    var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
    var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge

    var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
                 (g_canvas.width/2);			// normalize canvas to -1 <= x < +1,
    var y = (yp - g_canvas.height/2) /		//										 -1 <= y < +1.
                 (g_canvas.height/2);
    if (ev.clientY/g_canvas.height >1.05)
      g_isDrag = false
    else
      g_isDrag = true;											// set our mouse-dragging flag
    
    g_xMclik = x;	
    g_yMclik = y;   
}
  
function myMouseMove(ev) {
  var Amp = 15.0 // set the mouse drag sensitivity
  if(g_isDrag==false) return;				// IGNORE all mouse-moves except 'dragging'
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
  var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
  var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
                (g_canvas.width/2);		// normalize canvas to -1 <= x < +1,
  var y = (yp - g_canvas.height/2) /		//									-1 <= y < +1.
                (g_canvas.height/2);
  g_Theta += (x-g_xMclik)*Amp;
  g_D -= Angle2Radians(y - g_yMclik)*Amp;
      if(g_Theta > 360) g_Theta -= 360.0;
      if(g_Theta < 0) g_Theta += 360.0;

  g_xMclik = x;											// Make next drag-measurement from here.
	g_yMclik = y;
}

function myMouseUp(ev) {
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
  var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
  var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
                (g_canvas.width/2);			// normalize canvas to -1 <= x < +1,
  var y = (yp - g_canvas.height/2) /		//										 -1 <= y < +1.
                (g_canvas.height/2);
  g_isDrag = false;											// CLEAR our mouse-dragging flag, and
}
  
function myMouseClick(ev) {
  console.log("myMouseClick() on button: ", ev.button); 
}	