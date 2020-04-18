/**
 * Universidad de La Laguna
 * Escuela Superior de Ingeniería y Tecnología
 * Grado en Ingeniería Informática
 * Asignatura: Programación de Aplicaciones Interactivas
 * Curso: 3º
 * Fecha: 18/04/2020
 *
 * @author Luciana Varela Díaz
 * @author Cristo Daniel Navarro Rodríguez
 * @file  This file contains the implementation of ejemplo1.js. This program 
 *        uses WebGL to print a figure of a star with different colors.
 * @link  https://github.com/ULL-ESIT-INF-PAI-2019-2020/2019-2020-pai-trabajo-webgl-webgl
 */

'use strict';

let canvas;
let context;
let rotation = 0.0;
let previousTime = 0;

/**
 * @description Gets the element corresponding with the canvas from the DOM by
 * its ID. In this case, the ID of the canvas is 'star'. Then it gets the
 * context to draw in it; because whe are going to use WebGL, the context is
 * 'webgl'.
 */
function setContext() {
  canvas = document.getElementById('star');
  context = canvas.getContext('webgl');
}

/**
 * @description This function creates the arrays that have the coordinates for
 * each vertex of the triangles that form the figure and stores them in a buffer
 * that will be used later. As we are working with 3 dimensions, the coordinates
 * have 3 elements.
 * The values are between -1.0 and 1.0, because the clipspace of WebGL
 * represents the information that way.
 * Then, it does the same for the colors of each of the triangles. The colors
 * are codified in RGB with values from 0.0 to 1.0.
 * @return {Object} - Returns an object containing both buffers
 */
function createBuffer() {
  const VERTEX = [-1.0, 0.0, 0.0,    -0.25, 0.25, 0.0,    0.0, 0.0, 0.25, 
                   0.0, 0.0, 0.25,   -0.25, 0.25, 0.0,    0.0, 1.0, 0.0,
                   0.0, 1.0, 0.0,     0.25, 0.25, 0.0,    0.0, 0.0, 0.25,
                   0.0, 0.0, 0.25,    0.25, 0.25, 0.0,    1.0, 0.0, 0.0,
                   0.0, 0.0, 0.25,    1.0, 0.0, 0.0,      0.25, -0.25, 0.0,
                   0.0, 0.0, 0.25,    0.25, -0.25, 0.0,   0.0, -1.0, 0.0,
                   0.0, 0.0, 0.25,    0.0, -1.0, 0.0,    -0.25, -0.25, 0.0,
                   0.0, 0.0, 0.25,   -0.25, -0.25, 0.0,  -1.0, 0.0, 0.0,

                  -1.0, 0.0, 0.0,    -0.25, 0.25, 0.0,    0.0, 0.0, -0.25, 
                   0.0, 0.0, -0.25,  -0.25, 0.25, 0.0,    0.0, 1.0, 0.0,
                   0.0, 1.0, 0.0,     0.25, 0.25, 0.0,    0.0, 0.0, -0.25,
                   0.0, 0.0, -0.25,   0.25, 0.25, 0.0,    1.0, 0.0, 0.0,
                   0.0, 0.0, -0.25,   1.0, 0.0, 0.0,      0.25, -0.25, 0.0,
                   0.0, 0.0, -0.25,   0.25, -0.25, 0.0,   0.0, -1.0, 0.0,
                   0.0, 0.0, -0.25,   0.0, -1.0, 0.0,    -0.25, -0.25, 0.0,
                   0.0, 0.0, -0.25,  -0.25, -0.25, 0.0,  -1.0, 0.0, 0.0];
  const VERTEX_BUFFER = context.createBuffer();
  context.bindBuffer(context.ARRAY_BUFFER, VERTEX_BUFFER);
  context.bufferData(context.ARRAY_BUFFER, new Float32Array(VERTEX),
      context.STATIC_DRAW);
  context.bindBuffer(context.ARRAY_BUFFER, null);
  const TRIANGLE_COLORS = [[1.0, 0.0, 1.0, 1.0],
                        [1.0, 0.0, 0.0, 1.0],
                        [0.0, 1.0, 0.0, 1.0],
                        [0.0, 0.0, 1.0, 1.0],
                        [0.0, 0.0, 0.0, 1.0],
                        [1.0, 1.0, 0.0, 1.0],
                        [0.0, 1.0, 1.0, 1.0],
                        [1.0, 0.5, 0.5, 1.0],

                        [1.0, 0.0, 1.0, 0.8],
                        [1.0, 0.0, 0.0, 0.8],
                        [0.0, 1.0, 0.0, 0.8],
                        [0.0, 0.0, 1.0, 0.8],
                        [0.0, 0.0, 0.0, 0.8],
                        [1.0, 1.0, 0.0, 0.8],
                        [0.0, 1.0, 1.0, 0.8],
                        [1.0, 0.5, 0.5, 0.8]];
  // The color of each triangle is assigned to each vertex of it; 3 in this case
  let colors = [];
  for (let index = 0; index < TRIANGLE_COLORS.length; index++) {
    const element = TRIANGLE_COLORS[index];
    colors = colors.concat(element, element, element);
  }
  const COLOR_BUFFER = context.createBuffer();
  context.bindBuffer(context.ARRAY_BUFFER, COLOR_BUFFER);
  context.bufferData(context.ARRAY_BUFFER, new Float32Array(colors),
      context.STATIC_DRAW);
  context.bindBuffer(context.ARRAY_BUFFER, null);
  return {vertex: VERTEX_BUFFER, color: COLOR_BUFFER};
}

/**
 * @description This function creates the program that contains both shaders,
 * the one corresponding to the position of the vertices (Vertex Shader) and the
 * one corresponding to the colors of the vertices (Fragment Shader).
 * To achieve this, it first creates the code for each shader and compiles them.
 * After that, it creates the program and link both shaders into it.
 * To write the shaders, it's used the C-like language GLSL.
 * Aside form the coordinates and the color, the vertex shader receives a
 * transformation matrix to apply to the coordinates so the figure can rotate.
 * @return {WebGLProgram} - Returns the program with the two shaders linked
 */
function createShaders() {
  // Vertex Shader code
  const VERTEX_CODE = `
    attribute vec3 coordinates;
    attribute vec4 aVertexColor;
    uniform mat4 uModelViewMatrix;
    varying lowp vec4 vColor;
    void main(void) {
      gl_Position = vec4(coordinates, 1.0) * uModelViewMatrix;
      vColor = aVertexColor;
    }`;
  const VERTEX_SHADER = context.createShader(context.VERTEX_SHADER);
  context.shaderSource(VERTEX_SHADER, VERTEX_CODE);
  context.compileShader(VERTEX_SHADER);
  // Fragment Shader code
  const FRAG_CODE = `
    varying lowp vec4 vColor;
    void main(void) {
      gl_FragColor = vColor;
    }`;
  const FRAG_SHADER = context.createShader(context.FRAGMENT_SHADER);
  context.shaderSource(FRAG_SHADER, FRAG_CODE);
  context.compileShader(FRAG_SHADER);
  // Creates the program and links the shaders to it
  const SHADER_PROGRAM = context.createProgram();
  context.attachShader(SHADER_PROGRAM, VERTEX_SHADER); 
  context.attachShader(SHADER_PROGRAM, FRAG_SHADER);
  context.linkProgram(SHADER_PROGRAM);
  context.useProgram(SHADER_PROGRAM);
  return SHADER_PROGRAM;
}

/**
 * @description This function assigns the values from the corresponding buffers
 * to the 'attribute' variables of the program. First, it associates the values
 * from the buffer of positions to the variable from the shader program with
 * name 'coordinates' and enables it. Then, it repeats this process with the
 * colors buffer and the variable with name 'aVertexColor'.
 * After that, it generates a transformation matrix that will apply a rotation
 * to the figure.
 * @param {Object} buffers - Object containing the positions and colors buffers
 * @param {WebGLProgram} shaderProgram - Program with both shaders linked
 */
function associateShaders(buffers, shaderProgram) {
  let numComponents = 3;
  const TYPE = context.FLOAT;
  const NORMALIZE = false;
  const STRIDE = 0;
  const OFFSET = 0;
  // Positions buffer
  context.bindBuffer(context.ARRAY_BUFFER, buffers.vertex);
  let coord = context.getAttribLocation(shaderProgram, 'coordinates');
  context.vertexAttribPointer(coord, numComponents, TYPE, NORMALIZE, STRIDE,
      OFFSET);
  context.enableVertexAttribArray(coord);
  // Colors buffer
  numComponents = 4;
  context.bindBuffer(context.ARRAY_BUFFER, buffers.color);
  coord = context.getAttribLocation(shaderProgram, 'aVertexColor');
  context.vertexAttribPointer(coord, numComponents, TYPE, NORMALIZE, STRIDE,
      OFFSET);
  context.enableVertexAttribArray(coord);
  // Transformation matrix
  coord = context.getUniformLocation(shaderProgram, 'uModelViewMatrix');
  const MODEL_VIEW_MATRIX = mat4.create();
  const TRANSPOSE = false;
  const AXIS = [1, 1, 0];
  mat4.rotate(MODEL_VIEW_MATRIX, MODEL_VIEW_MATRIX, rotation, AXIS);
  context.uniformMatrix4fv(coord, TRANSPOSE, MODEL_VIEW_MATRIX);
}

/**
 * @description This function draws the different triangles that form the figure
 * with their corresponding colors. To do so, it first calls the function to
 * generate the shader program. Then it paints the background
 * with the given color and after that, it draws the figure with the Vertex
 * Attribute Arrays that were enabled before.
 */
function draw() {
  const RED = 0.62;
  const GREEN = 0.865;
  const BLUE = 0.940;
  const GAMMA = 1.0;
  const MODE = context.TRIANGLE_STRIP;
  const FIRST_VERTEX = 0;
  const NUM_VERTEX = 48;
  context.clearColor(RED, GREEN, BLUE, GAMMA);
  context.enable(context.DEPTH_TEST); 
  context.clear(context.COLOR_BUFFER_BIT);
  context.drawArrays(MODE, FIRST_VERTEX, NUM_VERTEX);
}

/**
 * @description This function is executed continuously to make possible that the
 * figure is animated. It first makes the associaten of the buffers and the
 * shaders, then it passes the current time to seconds and calculates the
 * rotation that is going to be applied to the figure and then draws it.
 * Finally, it calls requestAnimationFrame with itself as a callback so the
 * animation continues.
 * @param {Number} currentTime - Current time in milliseconds given by
 * requestAnimationFrame
 */
function render(currentTime) {
  associateShaders(createBuffer(), createShaders());
  currentTime *= 0.001;
  let rotationIncrease = currentTime - previousTime;
  previousTime = currentTime;
  draw(rotationIncrease);
  rotation += rotationIncrease;
  requestAnimationFrame(render);
}

/**
 * @description This is the main function of the program and makes the propper
 * calls to print the figure. It calls requestAnimationFrame with render as it's
 * callback to generate the animation.
 */
function main() {
  setContext();
  requestAnimationFrame(render);
}
