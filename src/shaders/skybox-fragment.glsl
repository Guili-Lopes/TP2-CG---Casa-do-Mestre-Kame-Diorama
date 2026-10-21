#version 300 es

precision highp float;

in vec3 v_direction;

uniform samplerCube u_skybox;

out vec4 outColor;

void main() {
    // Consulta o cubemap pela direção do fragmento
    outColor = texture(u_skybox, normalize(v_direction));
}