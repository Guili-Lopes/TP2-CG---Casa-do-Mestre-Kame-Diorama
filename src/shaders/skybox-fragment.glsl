#version 300 es

precision highp float;

in vec3 v_direction;

uniform samplerCube u_skybox;
uniform samplerCube u_nightSkybox;
uniform float u_nightFactor;

// Neblina no horizonte
uniform bool u_fogEnabled;
uniform vec3 u_fogColor;

out vec4 outColor;

void main() {
    vec3 direction = normalize(v_direction);

    // Mistura o céu diurno com o noturno
    vec3 dayColor = texture(u_skybox, direction).rgb;
    vec3 nightColor = texture(u_nightSkybox, direction).rgb;

    vec3 skyColor = mix(dayColor, nightColor, u_nightFactor);

    if (u_fogEnabled) {
        // Mistura o horizonte com a cor da neblina
        float fogAmount = 1.0 - smoothstep(0.0, 0.3, abs(direction.y));

        skyColor = mix(skyColor, u_fogColor, fogAmount * 0.85);
    }

    outColor = vec4(skyColor, 1.0);
}