#ifdef GL_ES
precision mediump float;
#endif

uniform sampler2D u_feedback;
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
  vec2 mouseWarp = uv - u_mouse;
  float dist = length(mouseWarp);
  float attract = smoothstep(0.3, 0.0, dist) * u_velocity;

  vec2 warpUV = uv + attract * normalize(mouseWarp) * 0.05;

  float baseNoise = fbm(warpUV * 4.0 + u_time * 0.02);
  vec4 prev = texture2D(u_feedback, uv);
  float fade = u_idle == 1 ? 0.96 : 0.9;
  vec3 color = mix(prev.rgb * fade, vec3(0.0, 0.4, 0.2) * baseNoise, 0.4);

  color += vec3(0.0, 0.2, 0.4) * baseNoise * 0.2;
  color += vec3(0.05, 0.1, 0.3) * baseNoise * 0.1;

  gl_FragColor = vec4(clamp(color,0.0,1.0),1.0);
}
