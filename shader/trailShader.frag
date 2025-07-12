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

  vec4 prev = texture2D(u_trail, uv);
  float fade = u_idle == 1 ? 0.96 : 0.92;

  // Emit around mouse
  float dist = distance(uv, u_mouse);
  float emission = smoothstep(0.05, 0.0, dist) * (u_velocity + 0.2);

  gl_FragColor = vec4(prev.rgb * fade + vec3(emission), 1.0);
}
