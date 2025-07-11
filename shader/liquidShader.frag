#ifdef GL_ES
precision mediump float;
#endif

uniform float u_time;
uniform int u_idle;
varying vec2 v_uv;

// Random hash
float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

// Value noise
float noise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);
  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

// Fractal Brownian Motion
float fbm(vec2 st) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(st);
    st *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  vec2 uv = v_uv * 4.0;

  // Speed varies with idle
  float speed = (u_idle == 1) ? 0.01 : 0.08;
  uv += vec2(u_time * speed, u_time * speed * 0.4);

  // Base FBM noise
  float n = fbm(uv);

  // Sharper threshold for "surfacing" logic
  float intensity = smoothstep(0.49, 0.51, n);

  // Layered color bands - feels like code/logic surfacing
  vec3 layer1 = vec3(0.0, 0.4, 0.2);  // muted green
  vec3 layer2 = vec3(0.0, 0.2, 0.4);  // dark cyan
  vec3 layer3 = vec3(0.05, 0.1, 0.3); // slate blue

  // Blend based on noise
  vec3 color = mix(layer1, layer2, n);
  color = mix(color, layer3, n * 0.5);

  // Idle state fades it almost to black
  float fade = (u_idle == 1) ? 0.02 : 0.2;
  vec3 finalColor = color * intensity * fade;

  // Clamp and output
  gl_FragColor = vec4(clamp(finalColor, 0.0, 1.0), 1.0);
}
