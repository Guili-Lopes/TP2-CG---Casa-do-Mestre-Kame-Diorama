#version 300 es

in vec3 a_coords;
in vec3 a_normal;
in vec2 a_texcoord;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;

out vec3 v_normal;
out vec3 v_worldPos;

void main() {
    mat3 normalMatrix = transpose(inverse(mat3(u_model)));

    v_normal = normalMatrix * a_normal;

    v_worldPos = vec3(u_model * vec4(a_coords, 1.0));

    gl_Position =
        u_projection *
        u_view *
        u_model *
        vec4(a_coords, 1.0);
}