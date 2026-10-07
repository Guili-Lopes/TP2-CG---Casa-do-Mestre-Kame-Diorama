#version 300 es

precision mediump float;

in vec3 v_normal;
in vec3 v_worldPos;

out vec4 outColor;

uniform vec3 u_color;
uniform vec3 u_lightDirection;

vec3 calculateLighting(vec3 normal, vec3 color) {
    vec3 lightDir = normalize(u_lightDirection);

    vec3 diffuse =
        max(dot(normal, lightDir), 0.0) * color;

    vec3 ambient = 0.3 * color;

    return ambient + diffuse;
}

void main() {
    vec3 normal = normalize(v_normal);

    outColor = vec4(
        calculateLighting(normal, u_color),
        1.0
    );
}