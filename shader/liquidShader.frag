#ifdef GL_ES
precision mediump float;
#endif

uniform float u_time;
uniform int u_idle;
uniform vec2 u_mouse;
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

  // Base FBM noise for texture
  float n = fbm(uv + u_time * 0.05);

  // Threshold the noise for pattern
  float intensity = smoothstep(0.48, 0.52, n);

  // Distance from cursor controls local glow
  float dist = distance(v_uv, u_mouse);
  float cursorEffect = smoothstep(0.4, 0.0, dist);

  // Idle fades out everything
  float idleFade = (u_idle == 1) ? 0.0 : 1.0;

  // Final fade: cursor local + idle
  float finalFade = cursorEffect * idleFade;

  // Subtle layered color
  vec3 layer1 = vec3(0.0, 0.4, 0.2);
  vec3 layer2 = vec3(0.0, 0.2, 0.4);
  vec3 layer3 = vec3(0.05, 0.1, 0.3);

  vec3 color = mix(layer1, layer2, n);
  color = mix(color, layer3, n * 0.5);

  // Base dark tint so black areas aren't pure black
  vec3 base = vec3(0.02, 0.03, 0.04);
  vec3 finalColor = mix(base, color, intensity * finalFade);

  gl_FragColor = vec4(clamp(finalColor, 0.0, 1.0), 1.0);
}
