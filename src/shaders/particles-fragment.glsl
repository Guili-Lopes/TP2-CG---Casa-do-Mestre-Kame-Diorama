#version 300 es

precision highp float;

in float v_alpha;

uniform sampler2D u_particleTexture;
uniform vec3 u_particleColor;

out vec4 outColor;

void main() {
    // Textura da partícula utilizando coordenadas do próprio ponto
    vec4 sprite = texture(u_particleTexture, gl_PointCoord);

    // Suaviza as bordas da partícula
    float distanceToCenter = length(gl_PointCoord - vec2(0.5));
    float edge = 1.0 - smoothstep(0.25, 0.5, distanceToCenter);

    float alpha = sprite.a * v_alpha * edge;

    outColor = vec4(sprite.rgb * u_particleColor, alpha);
}