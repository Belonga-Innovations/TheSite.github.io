#ifdef GL_ES
precision mediump float;
#endif

uniform float u_time;
uniform int u_idle;
varying vec2 v_uv;

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

float noise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);
  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));
  vec2 u = f*f*(3.0-2.0*f);
  return mix(a, b, u.x) + (c - a)*u.y*(1.0 - u.x) + (d - b)*u.x*u.y;
}

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
  float speed = u_idle == 1 ? 0.02 : 0.15;
  uv += vec2(u_time * speed, u_time * speed * 0.5);

  float n = fbm(uv);

  // Much tighter threshold for subtle highlights
  float intensity = smoothstep(0.48, 0.52, n);

  // Very subtle green glow
  vec3 neonGreen = vec3(0.0, 1.0, 0.0) * intensity * 0.05;
  neonGreen += vec3(0.0, 0.3, 0.0) * pow(intensity, 2.0) * 0.02;

  // Final color with clamping
  gl_FragColor = vec4(clamp(neonGreen, 0.0, 1.0), 1.0);
}
