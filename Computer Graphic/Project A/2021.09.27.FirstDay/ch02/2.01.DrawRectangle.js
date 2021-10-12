//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
// (JT: why the numbers? counts columns, helps me keep 80-char-wide listings)
//
// DrawRectangle.js (c) 2012 matsuda 
// DrawTriangleJT.js  MODIFIED for EECS 351-1, Northwestern Univ. Jack Tumblin
//										more comments, show a few more canvas drawing abilities.
//
 
//  NOTE!
//=========================================================================
// EECS351-1 ignores nearly all the 'canvas' drawing facilities, because:
//  --they're restricted to flat, 2D drawings, shading, and text (no 3D)
//	--their drawing axes put origin at UPPER LEFT, 
//			x increases rightwards and y increases DOWNWARDS (left-handed!)
//	--WebGL uses 'canvas' only for showing results on-screen 
//=========================================================================

function main() {  
  // Retrieve (a reference to) the <canvas> element we created in the HTML file,
  // identified by the ID name we gave it: 'example'.
  var canvas = document.getElementById('example');  
  if (!canvas) { 
    console.log('Failed to retrieve the <canvas> element');
    return false; 
  } 

  // Get the rendering context for drawing with
  //  HTML-5 canvas' own 2D computer graphics API:
  var myContext = canvas.getContext('2d'); 
  //NOTE: to get rendering context for drawing with webGL, we would say:
  // var gl = getWebGLContext(canvas, true); 
  // then use WebGL commands such as gl.clearColor()
  
  // Draw a blue CANVAS rectangle:
  myContext.fillStyle = 'rgba(0, 0, 255, 1.0)'; // Set color to blue. How?
  												// values are: (R,G,B,A) where 0 <= R,G,B <= 255 sets color
  												// and 0.0 <= A <= 1.0 sets opacity used by this 'brush'.
  myContext.fillRect(120, 10, 150, 150);        
  												// color-filled rectangle within our canvas area.
  												// fillRect(xUL,yUL,width,height) xUL, yUL== upper left corner...
  												// note x,y == 0,0 (origin) is UPPER left corner; 
  												// x increases rightward, y increases DOWNWARD in pixel units.
//  Web-search for 'HTML5 canvas class' explains more 'canvas' drawing features
//  http://www.w3schools.com/html/html5_canvas.asp
// and this canvas reference:  http://www.w3schools.com/tags/ref_canvas.asp
// 
	myContext.beginPath();	// start drawing a connected sequence of lines:
		myContext.strokeStyle = 'black';
		myContext.moveTo( 20, 20);
		myContext.lineTo(200, 30);
	myContext.stroke();
	//Next,
  myContext.rect(188, 50, 200, 100);	// 	draw rectangle, then
  myContext.fillStyle = 'rgba(255,255,0, 0.5)';		
  												// define half-transparent yellow and
	myContext.fill();				// fill that rectangle with it.
  myContext.lineWidth = 7;							// define pen width, color
	myContext.strokeStyle = 'black';				
  myContext.stroke();		// draw the shape using that style.
	// try other HTML-5 Canvas features here!
	
}
