// HelloCanvas.js (c) 2012 matsuda
// JTumblin comments,mods

function main() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas, true);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  // Set clear color for the WebGL drawing area.
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
  // report that in browser's 'console':
  console.log("WebGL 'cleared' screen to black(0.0, 0.0, 0.0).");
  console.log("WebGL white is (R,G,B) = (1.0, 1.0, 1.0)");
}
