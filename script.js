const canvas = document.getElementById('background-canvas');
const gl = canvas.getContext('webgl2');
if (!gl) throw new Error('WebGL2 not supported');

let program, buffer1, buffer2, fb1, fb2;
let mouse = [0.5, 0.5];
let lastMouse = [0.5, 0.5];
let velocity = 0.0;
let idle = false;
let idleTimer;
let startTime = Date.now();

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
}
window.addEventListener('resize', resize);
resize();

function resetIdleTimer() {
  idle = false;
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => idle = true, 5000);
}
window.addEventListener('mousemove', e => {
  resetIdleTimer();
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width;
  const y = 1 - (e.clientY - rect.top) / rect.height;
  velocity = Math.min(1.0, Math.hypot(x - lastMouse[0], y - lastMouse[1]) * 20);
  lastMouse = [x, y];
  mouse = [x, y];
});
resetIdleTimer();

async function loadShader(url) {
  return await fetch(url).then(res => res.text());
}

async function main() {
  const [vsSource, fsSource] = await Promise.all([
    loadShader('shader/liquidShader.vert'),
    loadShader('shader/liquidShader.frag')
  ]);
  program = initProgram(vsSource, fsSource);

  buffer1 = gl.createTexture();
  buffer2 = gl.createTexture();
  fb1 = gl.createFramebuffer();
  fb2 = gl.createFramebuffer();
  initBuffer(buffer1, fb1);
  initBuffer(buffer2, fb2);

  requestAnimationFrame(render);
}
main();

function initBuffer(tex, fb) {
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
}

function initProgram(vsSource, fsSource) {
  const vs = compile(gl.VERTEX_SHADER, vsSource);
  const fs = compile(gl.FRAGMENT_SHADER, fsSource);
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(prog));
    throw new Error('Shader program link failed');
  }
  return prog;
}

function compile(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    throw new Error('Shader compile failed');
  }
  return shader;
}

function render() {
  const now = (Date.now() - startTime) / 1000;

  gl.bindFramebuffer(gl.FRAMEBUFFER, fb1);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.useProgram(program);

  const posBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1, 1, -1, -1, 1,
    -1, 1, 1, -1, 1, 1
  ]), gl.STATIC_DRAW);

  const posLoc = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, buffer2);
  gl.uniform1i(gl.getUniformLocation(program, 'u_feedback'), 0);
  gl.uniform1f(gl.getUniformLocation(program, 'u_time'), now);
  gl.uniform2fv(gl.getUniformLocation(program, 'u_mouse'), mouse);
  gl.uniform1f(gl.getUniformLocation(program, 'u_velocity'), velocity);
  gl.uniform1i(gl.getUniformLocation(program, 'u_idle'), idle ? 1 : 0);
  gl.uniform2f(gl.getUniformLocation(program, 'u_resolution'), canvas.width, canvas.height);

  gl.drawArrays(gl.TRIANGLES, 0, 6);

  // Swap buffers
  [buffer1, buffer2] = [buffer2, buffer1];
  [fb1, fb2] = [fb2, fb1];

  // Render to screen
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.bindTexture(gl.TEXTURE_2D, buffer2);
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  velocity *= 0.95;
  requestAnimationFrame(render);
}
