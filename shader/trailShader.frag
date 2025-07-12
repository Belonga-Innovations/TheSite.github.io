#ifdef GL_ES
precision mediump float;
#endif

uniform float u_time;
uniform int u_idle;
uniform vec2 u_mouse;
uniform float u_velocity;
uniform vec2 u_resolution;
uniform sampler2D u_trail;
varying vec2 v_uv;

void main() {
  vec2 uv = v_uv;

  // Sample previous trail buffer
  vec4 prev = texture2D(u_trail, uv);

  // Faster fade for cleaner decay
  float fade = u_idle == 1 ? 0.97 : 0.94;

  // Distance from mouse
  float dist = distance(uv, u_mouse);

  // Much softer emission profile
  float emission = smoothstep(0.07, 0.0, dist) * (u_velocity * 0.4 + 0.1);

  // Clamp overall trail brightness to avoid blowout
  vec3 newTrail = clamp(prev.rgb * fade + vec3(emission), 0.0, 0.6);

  gl_FragColor = vec4(newTrail, 1.0);
}
