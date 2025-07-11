// ========================================
// THEME TOGGLE
// ========================================
const toggleBtn = document.getElementById('theme-toggle');
toggleBtn?.addEventListener('click', () => {
  document.body.classList.toggle('light');
  localStorage.setItem('theme', document.body.classList.contains('light') ? 'light' : 'dark');
});

if (localStorage.getItem('theme') === 'light') {
  document.body.classList.add('light');
}

// ========================================
// CONTACT FORM HANDLING
// ========================================
const form = document.getElementById('contact-form');
const formMsg = document.getElementById('form-message');

form?.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = form.email.value.trim();

  if (!validateEmail(email)) {
    formMsg.textContent = "Please enter a valid email address.";
    return;
  }

  formMsg.textContent = "Thank you! You’re on the list.";
  form.reset();
});

function validateEmail(email) {
  return /\S+@\S+\.\S+/.test(email);
}

// ========================================
// IDLE DETECTION FOR SHADER
// ========================================
let idle = false;
let idleTimer;

function resetIdleTimer() {
  idle = false;
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => { idle = true; }, 5000);
}

window.addEventListener('mousemove', resetIdleTimer);
window.addEventListener('keydown', resetIdleTimer);
resetIdleTimer();

// ========================================
// SHADER CANVAS SETUP
// ========================================
const canvas = document.getElementById('background-canvas');
const gl = canvas?.getContext('webgl');

if (!gl) {
  console.error("WebGL not supported");
} else {
  let program;
  let timeUniform, idleUniform;
  let startTime = Date.now();
  let positionBuffer;
  let positionAttribLocation;

  // Resize canvas to fit window
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Fetch shader source
  fetchShaderFiles().then(([vertexSrc, fragmentSrc]) => {
    program = initShaderProgram(gl, vertexSrc, fragmentSrc);
    if (!program) return;

    gl.useProgram(program);

    // === Setup vertex buffer for fullscreen quad ===
    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1
    ]), gl.STATIC_DRAW);

    positionAttribLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionAttribLocation);
    gl.vertexAttribPointer(positionAttribLocation, 2, gl.FLOAT, false, 0, 0);

    // === Uniform locations ===
    timeUniform = gl.getUniformLocation(program, 'u_time');
    idleUniform = gl.getUniformLocation(program, 'u_idle');

    // Start render loop
    requestAnimationFrame(render);
  });

  // Render loop
  function render() {
    const now = (Date.now() - startTime) / 1000;

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    // Set uniforms
    gl.uniform1f(timeUniform, now);
    gl.uniform1i(idleUniform, idle ? 1 : 0);

    // Draw fullscreen quad
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(positionAttribLocation);
    gl.vertexAttribPointer(positionAttribLocation, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    requestAnimationFrame(render);
  }

  // Utility: Fetch shader files
  async function fetchShaderFiles() {
    try {
      const vert = await fetch('shader/liquidShader.vert').then(res => res.text());
      const frag = await fetch('shader/liquidShader.frag').then(res => res.text());
      return [vert, frag];
    } catch (e) {
      console.error("Error loading shaders:", e);
      return ['', ''];
    }
  }

  // Utility: Compile and link shader program
  function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    if (!vertexShader || !fragmentShader) return null;

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      console.error('Shader program failed to link:', gl.getProgramInfoLog(shaderProgram));
      return null;
    }
    return shaderProgram;
  }

  // Utility: Compile individual shader
  function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }
}
