#ifdef GL_ES
precision mediump float;
#endif

uniform float u_time;
uniform int u_idle;
varying vec2 v_uv;

float noise(vec2 p) {
  return fract(sin(dot(p ,vec2(127.1, 311.7))) * 43758.5453);
}

float smoothNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = noise(i);
  float b = noise(i + vec2(1.0, 0.0));
  float c = noise(i + vec2(0.0, 1.0));
  float d = noise(i + vec2(1.0, 1.0));
  vec2 u = f*f*(3.0-2.0*f);
  return mix(a, b, u.x) + (c - a)*u.y*(1.0 - u.x) + (d - b)*u.x*u.y;
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for(int i = 0; i < 5; i++) {
    v += a * smoothNoise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = v_uv * 4.0;
  float t = u_time * (u_idle == 1 ? 0.05 : 0.2);
  uv += vec2(t, t * 0.5);

  float n = fbm(uv);

  vec3 color = mix(
    vec3(0.0, 0.0, 0.0),
    vec3(0.0, 1.0, 0.0),
    smoothstep(0.3, 0.7, n)
  );

  gl_FragColor = vec4(color, 1.0);
}
