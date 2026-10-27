#version 300 es

layout(location = 0) in vec3 a_position;
layout(location = 1) in float a_size;
layout(location = 2) in float a_alpha;

uniform mat4 u_view;
uniform mat4 u_projection;
uniform float u_pointScale;

out float v_alpha;

void main() {
    gl_Position = u_projection * u_view * vec4(a_position, 1.0);

    // Tamanho em pixels proporcional à distância da câmera
    gl_PointSize = a_size * u_pointScale / gl_Position.w;

    v_alpha = a_alpha;
}