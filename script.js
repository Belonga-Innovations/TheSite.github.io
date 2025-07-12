const canvas = document.getElementById('background-canvas');
const gl = canvas.getContext('webgl2');
if (!gl) throw new Error('WebGL2 not supported');

let programMain, programTrail;
let fbTrailA, fbTrailB, texTrailA, texTrailB;
let fbMain, texMain;
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
window.addEventListener('resize', () => {
  resize();
  initFramebuffers();
});
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
  const [vsSrc, fsMainSrc, fsTrailSrc] = await Promise.all([
    loadShader('shader/liquidShader.vert'),
    loadShader('shader/liquidShader.frag'),
    loadShader('shader/trailShader.frag')
  ]);

  programMain = initProgram(vsSrc, fsMainSrc);
  programTrail = initProgram(vsSrc, fsTrailSrc);

  initFramebuffers();
  requestAnimationFrame(render);
}
main();

function initFramebuffers() {
  texTrailA = createTexture();
  texTrailB = createTexture();
  fbTrailA = createFramebuffer(texTrailA);
  fbTrailB = createFramebuffer(texTrailB);
  texMain = createTexture();
  fbMain = createFramebuffer(texMain);
}

function createTexture() {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  return tex;
}

function createFramebuffer(tex) {
  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  return fb;
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

  // PASS 1: Update Trail Buffer
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbTrailA);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.useProgram(programTrail);
  setupQuad(programTrail);

  setUniforms(programTrail, {
    u_time: now,
    u_mouse: mouse,
    u_velocity: velocity,
    u_idle: idle ? 1 : 0,
    u_resolution: [canvas.width, canvas.height],
    u_trail: texTrailB
  });
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  // PASS 2: Main Composition
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbMain);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.useProgram(programMain);
  setupQuad(programMain);

  setUniforms(programMain, {
    u_time: now,
    u_mouse: mouse,
    u_velocity: velocity,
    u_idle: idle ? 1 : 0,
    u_resolution: [canvas.width, canvas.height],
    u_feedback: texMain,
    u_trail: texTrailA
  });
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  // Draw to screen
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.useProgram(programMain);
  setupQuad(programMain);
  setUniforms(programMain, {
    u_time: now,
    u_mouse: mouse,
    u_velocity: velocity,
    u_idle: idle ? 1 : 0,
    u_resolution: [canvas.width, canvas.height],
    u_feedback: texMain,
    u_trail: texTrailA
  });
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  // Swap trail buffers
  [fbTrailA, fbTrailB] = [fbTrailB, fbTrailA];
  [texTrailA, texTrailB] = [texTrailB, texTrailA];

  velocity *= 0.95;
  requestAnimationFrame(render);
}

function setupQuad(program) {
  const posBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1, 1, -1, -1, 1,
    -1, 1, 1, -1, 1, 1
  ]), gl.STATIC_DRAW);

  const posLoc = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
}

function setUniforms(program, uniforms) {
  for (const [name, value] of Object.entries(uniforms)) {
    const loc = gl.getUniformLocation(program, name);
    if (typeof value === 'number') gl.uniform1f(loc, value);
    else if (Array.isArray(value) && value.length === 2) gl.uniform2f(loc, value[0], value[1]);
    else if (typeof value === 'boolean' || Number.isInteger(value)) gl.uniform1i(loc, value);
    else if (value instanceof WebGLTexture) {
      const unit = 0;
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, value);
      gl.uniform1i(loc, unit);
    }
  }
}
