#version 300 es

in vec3 a_coords;
in vec3 a_normal;
in vec2 a_texcoord;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;

// Controles da ondulação do rabo do Goku
uniform float u_tailWave;
uniform vec3 u_tailPivot;
uniform float u_tailLength;
uniform vec3 u_waveAxis;
uniform float u_time;

out vec3 v_normal;
out vec3 v_worldPos;
out vec2 v_texcoord;

const float WAVE_NUMBER = 7.54;
const float WAVE_SPEED = 5.0;

void main() {
    vec3 position = a_coords;

    // Mantém a deformação animada do rabo
    if (u_tailWave > 0.0) {
        float t = clamp(
            distance(a_coords, u_tailPivot) / u_tailLength,
            0.0,
            1.0
        );

        float offset = u_tailWave * t * sin(WAVE_NUMBER * t - WAVE_SPEED * u_time);

        position += u_waveAxis * offset;
    }

    mat3 normalMatrix = transpose(
        inverse(mat3(u_model))
    );

    v_normal = normalMatrix * a_normal;

    v_worldPos = vec3(u_model * vec4(position, 1.0));

    // Envia as coordenadas UV para o fragment shader
    v_texcoord = a_texcoord;

    gl_Position = (u_projection * u_view * u_model * vec4(position, 1.0));
}