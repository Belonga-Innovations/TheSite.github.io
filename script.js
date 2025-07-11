// =====================================================
// THEME TOGGLE
// =====================================================
const toggleBtn = document.getElementById('theme-toggle');
toggleBtn.addEventListener('click', () => {
  document.body.classList.toggle('light');
  localStorage.setItem('theme', document.body.classList.contains('light') ? 'light' : 'dark');
});

// Load saved theme preference
if (localStorage.getItem('theme') === 'light') {
  document.body.classList.add('light');
}

// =====================================================
// FORM HANDLING
// =====================================================
const form = document.getElementById('contact-form');
const formMsg = document.getElementById('form-message');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = form.email.value.trim();

  if (!validateEmail(email)) {
    formMsg.textContent = "Please enter a valid email address.";
    return;
  }

  // Simulated success (replace with real backend later)
  formMsg.textContent = "Thank you! You’re on the list.";
  form.reset();
});

function validateEmail(email) {
  // Basic email validation
  return /\S+@\S+\.\S+/.test(email);
}

// =====================================================
// IDLE DETECTION FOR SHADER
// =====================================================
let idle = false;
let idleTimer;

function resetIdleTimer() {
  idle = false;
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => { idle = true; }, 5000);
}

window.addEventListener('mousemove', resetIdleTimer);
window.addEventListener('keydown', resetIdleTimer);
resetIdleTimer();  // initialize

// =====================================================
// SHADER CANVAS SETUP
// =====================================================
const canvas = document.getElementById('background-canvas');
const gl = canvas.getContext('webgl');

if (!gl) {
  console.error("WebGL not supported");
} else {
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  let program;
  let timeUniform;
  let idleUniform;
  let startTime = Date.now();

  fetchShaderFiles().then(([vertexSrc, fragmentSrc]) => {
    program = initShaderProgram(gl, vertexSrc, fragmentSrc);
    gl.useProgram(program);

    timeUniform = gl.getUniformLocation(program, 'u_time');
    idleUniform = gl.getUniformLocation(program, 'u_idle');

    render();
  });

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  }

  async function fetchShaderFiles() {
    const vert = await fetch('shader/liquidShader.vert').then(res => res.text());
    const frag = await fetch('shader/liquidShader.frag').then(res => res.text());
    return [vert, frag];
  }

  function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      console.error('Unable to initialize the shader program:', gl.getProgramInfoLog(shaderProgram));
      return null;
    }
    return shaderProgram;
  }

  function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('An error occurred compiling the shaders:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  function render() {
    const now = (Date.now() - startTime) / 1000;
    gl.uniform1f(timeUniform, now);
    gl.uniform1i(idleUniform, idle ? 1 : 0);

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    requestAnimationFrame(render);
  }
}
