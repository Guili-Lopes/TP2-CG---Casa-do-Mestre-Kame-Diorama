#version 300 es

// Mesmas localizações de atributos do programa principal
layout(location = 0) in vec3 a_coords;
layout(location = 1) in vec3 a_normal;
layout(location = 2) in vec2 a_texcoord;

uniform mat4 u_model;
uniform mat4 u_lightViewProjection;

// Mesma animação do rabo utilizada no vertex shader principal
uniform float u_tailWave;
uniform vec3 u_tailPivot;
uniform float u_tailLength;
uniform vec3 u_waveAxis;
uniform float u_time;

const float WAVE_NUMBER = 7.54;
const float WAVE_SPEED = 5.0;

void main() {
    vec3 position = a_coords;

    // A sombra do rabo acompanha sua deformação
    if (u_tailWave > 0.0) {
        float t = clamp(
            distance(a_coords, u_tailPivot) / u_tailLength,
            0.0,
            1.0
        );

        float offset = u_tailWave * t * sin(WAVE_NUMBER * t - WAVE_SPEED * u_time);

        position += u_waveAxis * offset;
    }

    // Posição do vértice vista pela luz direcional
    gl_Position = (u_lightViewProjection * u_model * vec4(position, 1.0));
}