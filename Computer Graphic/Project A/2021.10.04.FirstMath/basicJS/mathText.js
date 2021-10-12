function main() {
  myLibInit();

  console.log("Let's try some 3D Math:");
  console.log("Note: we can use 'console.log()' to print text & JS values.\n");
  var ModelMatrix = new Matrix4();
//  ModelMatrix.setTranslate(-0.5,0,0);  // move to left half of canvas
  // ModelMatrix.rotate(25.0,0,1,0);     // then rotate by 25 deg around y axis
  updateModelMatrix(ModelMatrix);

  var hEdge = 0.4/Math.sin(Math.PI/3);   // find equilateral edge half-length
  console.log("width +/-hEdge:", hEdge);
/* check my work:
console.log("base edge^2: 4*hEdge*hEdge==", 4*hEdge*hEdge);
console.log("side edge^2: hEdge^2+0.8^2==", hEdge*hEdge + 0.8*0.8);
*/
  // send vertex positions to the GPU.
  //  Note screen limits:  +/-1
  // NOTE THE SQUARE-BRACKETS! creates an array as the fcn argument.
  appendPositions([     0.0,-0.8, 0.0, 1.0, // vertex 0 (x,y,z,w)
                      hEdge, 0.0, 0.0, 1.0, // vertex 1
                     -hEdge, 0.0, 0.0, 1.0, // vertex 2
                        0.0, 0.8, 0.0, 1.0, // vertex 3
                  ]);
  appendColors([1.0, 0.0, 0.0, 1.0,     // Vertex 0 color 0.0 <= (R,G,B,A) < 1.0 
                0.0, 1.0, 0.0, 1.0,     // Vertex 1 color 0.0 <= (R,G,B,A) < 1.0 
                0.0, 0.0, 1.0, 1.0,     // Vertex 2 color 0.0 <= (R,G,B,A) < 1.0 
                1.0, 1.0, 1.0, 1.0,     // Vertex 3 (white!)
              ]); 

  // NEW WebGL command!
  gl.disable(gl.CULL_FACE); // SHOW BOTH SIDES of all triangles
  
  // draw the vertices we sent to the GPU:
  
  gl.drawArrays(gl.POINTS,0,4); // (large point size was set in lib1.js)


  //============================================================
  // Lets play around with Vector4 objects:
  //============================================================
  var aVec = new Vector4();   
  // TWO ways to init a Vector4: (don't forget []!!)
  var bVec = new Vector4([1,2,3,0]);  // by using array arg
  aVec.elements[0] = 4.1;             // or by setting each individual element
  aVec.elements[1] = 3.2; 
  aVec.elements[2] = 2.3; 
  aVec.elements[3] = 0.0;   
// BUT  ***DON'T*** DO THIS!!! 
// bVec[0] = 1.0; bVec[1] = 2.0; bVec[2] = 3.0; bVec[3] = 0.0;
// because it doesn't set values inside the bVec object's float32 array...

  // x,y,z,w=0 (vector, not point)
  console.log('\n---------------Vector4 Ops------------\n');
  res = 8;		// number of digits we will print on console log
  console.log('aVec: x=', aVec.elements[0].toFixed(res), 
										'y=', aVec.elements[1].toFixed(res), 
									  'z=', aVec.elements[2].toFixed(res), 
									 	'w=', aVec.elements[3].toFixed(res),'\n');
  tmp = bVec;
  console.log('bVec: x=', tmp.elements[0].toFixed(res), 
										'y=', tmp.elements[1].toFixed(res), 
										'z=', tmp.elements[2].toFixed(res), 
									 	'w=', tmp.elements[3].toFixed(res),'\n');
								 	
// BUT THERE'S AN EASIER WAY:
// JT added a 'printMe() member function to Vector3 and Vector4 objects:
  aVec.printMe('aVec.printMe fcn:');
  bVec.printMe('bVec.printMe fcn:');

	// You add more here ... see our HTML file for instructions...

// Here's my version: un-comment it
  //============================================================
	// Lets play around with Matrix 4 objects
  //============================================================
  var aMat = new Matrix4();
	console.log("setIdentity();");
	aMat.setIdentity();
	aMat.printMe();
	console.log("then translate(1,2,3);");
	aMat.translate(1,2,3);	// translate drawing axes by x,y,z 
	aMat.printMe();
	console.log("then rotate(45 degrees around 0,0,1 axis);");
	aMat.rotate(45,0,0,1);				// rotate 45 deg around 0,0,1 axis 
	aMat.printMe();
	console.log("Now try opposite order: setIdentity();");
	aMat.setIdentity();
	aMat.printMe();
	console.log("rotate(45 deg around 0,0,1 axis);");
	aMat.rotate(45,0,0,1);
	aMat.printMe();
	console.log("then translate(1,2,3);");
	aMat.translate(1,2,3);
	aMat.printMe();
	console.log("(Geometrically, we translated along our rotated drawing axes.");
// 

	// You add more here ... see our HTML file for instructions...

  var cVec = new Vector3([5,6,7]);
  cVec.printMe('myName');
  console.log(  'cVec.elements[0]: ', cVec.elements[0], 
              '  ,[1]: ', cVec.elements[1],
              '  ,[2]: ', cVec.elements[2], '\n');
  console.log('now try setting Vec3 elements to 1,2,3:\n');
  //cVec[0] = 1.0;  // CAUTION!! THIS DOES NOTHING!
  cVec.elements[0] = 1.0; 
  cVec.elements[1] = 2.0; 
  cVec.elements[2] = 3.0;
  // OR I could just write: cVec.elements = [1.0, 2.0, 3.0];
  cVec.printMe();
  cVec.printMe('myLabel');
 
  console.log('Test aMat.multiplyVector4() =====================');
  aVec.elements[3] = 1.0;
  aVec.printMe('aVec BEFORE');
  bVec.printMe('bVec BEFORE');  
  aMat.setTranslate(1,2,3);
  aMat.printMe('aMat BEFORE');
	console.log('now set bVec = aMat.multiplyVector4(aVec);');
	bVec = aMat.multiplyVector4(aVec);
  aVec.printMe('aVec AFTER ');
  bVec.printMe('bVec AFTER ');
// */
/*
  console.log('================Test Vec3 dot product------------');
  var dVec = new Vector3([9,8,7]);
  cVec.printMe("cVec");
  dVec.printMe("dVec");
  console.log('cVec.dot(dVec) is:', cVec.dot(dVec));
  console.log('dVec.dot(cVec) is:', dVec.dot(cVec));
  console.log('================Test Vec4 dot product------------');
  aVec.printMe('aVec');
  bVec.printMe('bVec');
  console.log('aVec.dot(bVec) is:', aVec.dot(bVec));
  console.log('WHOOPS! w should be zero! Set aVec.elements[3] to zero:');
  aVec.elements[3] = 0;
  aVec.printMe('aVec');
  console.log('bVec.dot(aVec) is:', bVec.dot(aVec));
  console.log('===============Test Vec3 cross product-----------');
  cVec.elements = [1.0, 0.0, 0.0];  // x axis
  dVec.elements = [0.0, 1.0, 0.0];  // y axis. 
  cVec.printMe('cVec');
  dVec.printMe('dVec');
  var jVec = new Vector3();
  jVec = cVec.cross(dVec);
  console.log('AFTER jVec = cVec.cross(dVec): ');
  jVec.printMe('jVec AFTER:');
  console.log('===============Test Vec4 cross product-----------');
  aVec.elements = [1.0, 0.0, 0.0, 1.0];  // x axis vector (w==0)
  bVec.elements = [0.0, 1.0, 0.0, 0.0];  // y axis vector (w==0)
  aVec.printMe('aVec');
  bVec.printMe('bVec');
  var kVec = new Vector4();
  kVec = aVec.cross(bVec);
  console.log('AFTER kVec = aVec.cross(bVec): ');
  kVec.printMe('kVec AFTER:');
  console.log('Whoops! aVec w value was 1-- fix it:');
  aVec.elements[3] = 0.0;
  aVec.printMe('new aVec');
  kVec = bVec.cross(aVec);
  console.log('AFTER kVec = bVec.cross(aVec): ');
  kVec.printMe('kVec AFTER: ');
// */


}
