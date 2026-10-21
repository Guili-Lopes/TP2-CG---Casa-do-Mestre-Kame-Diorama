#version 300 es

precision highp float;

in vec3 v_direction;

uniform samplerCube u_skybox;

// Neblina no horizonte
uniform bool u_fogEnabled;
uniform vec3 u_fogColor;

out vec4 outColor;

void main() {
    vec3 direction = normalize(v_direction);
    vec3 skyColor = texture(u_skybox, direction).rgb;

    if (u_fogEnabled) {
        // Mistura o horizonte com a cor da neblina
        float horizonFactor = smoothstep(-0.15, 0.25, direction.y);

        skyColor = mix(u_fogColor, skyColor, horizonFactor);
    }

    outColor = vec4(skyColor, 1.0);
}