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

  // Sample the previous trail buffer
  vec4 prev = texture2D(u_trail, uv);

  // Fade factor: slightly stronger decay for ~3" trail
  float fade = u_idle == 1 ? 0.95 : 0.92;

  // Distance from cursor
  float dist = distance(uv, u_mouse);

  // Tighter, sharper emission radius
  float emission = smoothstep(0.035, 0.0, dist) * (u_velocity * 0.3 + 0.08);

  // Subtle neon green color with mild cap to avoid blowout
  vec3 green = vec3(0.0, 1.0, 0.5) * emission * 0.5;

  // Composite with faded previous trail
  vec3 newTrail = clamp(prev.rgb * fade + green, 0.0, 0.4);

  gl_FragColor = vec4(newTrail, 1.0);
}
