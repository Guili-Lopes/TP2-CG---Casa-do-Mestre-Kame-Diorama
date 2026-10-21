#version 300 es

// Mesma localização utilizada pelos outros programas
layout(location = 0) in vec3 a_coords;

uniform mat4 u_view;
uniform mat4 u_projection;

out vec3 v_direction;

void main() {
    // A posição do vértice define a direção de leitura do cubemap
    v_direction = a_coords;

    // Remove a translação para manter o céu centrado na câmera
    mat4 viewWithoutTranslation = mat4(mat3(u_view));

    vec4 position = (u_projection * viewWithoutTranslation * vec4(a_coords, 1.0));

    // Coloca o skybox na profundidade máxima
    gl_Position = position.xyww;
}