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
 * that will be used later. As we are working with 2 dimensions, the coordinates
 * only have 2 elements.
 * The values are between -1.0 and 1.0, because the clipspace of WebGL
 * represents the information that way.
 * Then, it does the same for the colors of each of the triangles. The colors
 * are codified in RGB with values from 0.0 to 1.0.
 * @return {Object} - Returns an object containing both buffers
 */
function createBuffer() {
  // Coordinates of each vertex of each triangle that forms the figure
  const VERTEX = [0.0, 0.0,   -0.25, 0.25,   -1.0, 0.0, 
                  0.0, 0.0,   -0.25, 0.25,    0.0, 1.0,
                  0.0, 1.0,    0.25, 0.25,    0.0, 0.0,
                  0.0, 0.0,    0.25, 0.25,    1.0, 0.0,
                  0.0, 0.0,    1.0, 0.0,      0.25, -0.25,
                  0.0, 0.0,    0.25, -0.25,   0.0, -1.0,
                  0.0, 0.0,    0.0, -1.0,    -0.25, -0.25,
                  0.0, 0.0,   -0.25, -0.25,  -1.0, 0.0];
  const VERTEX_BUFFER = context.createBuffer();
  // Binds the buffer so we can access to it
  context.bindBuffer(context.ARRAY_BUFFER, VERTEX_BUFFER);
  // Saves the data of the positions into the buffer
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
                          [1.0, 0.5, 0.5, 1.0]];
  // The color of each triangle is assigned to each vertex of it; 3 in this case
  let colors = [];
  for (let triangle = 0; triangle < TRIANGLE_COLORS.length; triangle++) {
    const CURRENT_COLOR = TRIANGLE_COLORS[triangle];
    colors = colors.concat(CURRENT_COLOR, CURRENT_COLOR, CURRENT_COLOR);
  }
  const COLOR_BUFFER = context.createBuffer();
  context.bindBuffer(context.ARRAY_BUFFER, COLOR_BUFFER);
  context.bufferData(context.ARRAY_BUFFER, new Float32Array(colors), context.STATIC_DRAW);
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
 * @return {WebGLProgram} - Returns the program with the two shaders linked
 */
function createShaders() {
  // Code for the Vertex Shader
  const VERTEX_CODE = `
    attribute vec2 coordinates;
    attribute vec4 aVertexColor;
    varying lowp vec4 vColor;
    void main(void) {
      gl_Position = vec4(coordinates, 0.0, 1.0);
      vColor = aVertexColor;
    }`;
  const VERTEX_SHADER = context.createShader(context.VERTEX_SHADER);
  context.shaderSource(VERTEX_SHADER, VERTEX_CODE);
  context.compileShader(VERTEX_SHADER);
  // Code for the Fragment Shader
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
 * @param {Object} buffers - Object containing the positions and colors buffers
 * @param {WebGLProgram} shaderProgram - Program with both shaders linked
 */
function associateShaders(buffers, shaderProgram) {
  let numComponents = 2;
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
}

/**
 * @description This function draws the different triangles that form the figure
 * with their corresponding colors. To do so, it first paints the background
 * with the given color and then, it draws the figure with the Vertex Attribute
 * Arrays that were enabled before.
 */
function draw() {
  const RED = 0.62;
  const GREEN = 0.865;
  const BLUE = 0.940;
  const GAMMA = 1.0;
  const MODE = context.TRIANGLE_STRIP;
  const FIRST_VERTEX = 0;
  const NUM_VERTEX = 24;
  context.clearColor(RED, GREEN, BLUE, GAMMA);
  context.enable(context.DEPTH_TEST); 
  context.clear(context.COLOR_BUFFER_BIT);
  context.drawArrays(MODE, FIRST_VERTEX, NUM_VERTEX);
}

/**
 * @description This is the main function of the program and makes the propper
 * calls to print the figure. 
 */
function main() {
  setContext();
  associateShaders(createBuffer(), createShaders());
  draw();
}
