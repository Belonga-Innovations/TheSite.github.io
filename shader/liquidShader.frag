#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D u_feedback;
uniform sampler2D u_trail;
uniform float u_time;
uniform int u_idle;
uniform vec2 u_mouse;
uniform float u_velocity;
uniform vec2 u_resolution;
varying vec2 v_uv;

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453);
}

float noise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);
  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));
  vec2 u = f*f*(3.0-2.0*f);
  return mix(a, b, u.x) + (c - a)*u.y*(1.0-u.x) + (d - b)*u.x*u.y;
}

float fbm(vec2 st) {
  float value = 0.0;
  float amplitude = 0.5;
  for(int i=0;i<5;i++) {
    value += amplitude * noise(st);
    st *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  vec2 uv = v_uv;
  float dist = distance(uv, u_mouse);
  float attract = smoothstep(0.4, 0.0, dist) * (u_velocity + 0.3);

  vec2 warpUV = uv + attract * normalize(uv - u_mouse) * 0.08;
  float baseNoise = fbm(warpUV * 6.0 + u_time * 0.04);
  baseNoise = pow(baseNoise, 1.3);

  vec4 prev = texture2D(u_feedback, uv);
  vec4 trail = texture2D(u_trail, uv);

  float fade = u_idle == 1 ? 0.95 : 0.88;

  vec3 layer1 = vec3(0.0, 0.5, 0.3) * baseNoise;
  vec3 layer2 = vec3(0.0, 0.3, 0.5) * pow(baseNoise, 1.5);
  vec3 layer3 = vec3(0.05, 0.15, 0.35) * pow(baseNoise, 2.0);

  vec3 color = mix(prev.rgb * fade, layer1 + layer2 + layer3, 0.55);
  color += trail.rgb * 0.7;

  gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
