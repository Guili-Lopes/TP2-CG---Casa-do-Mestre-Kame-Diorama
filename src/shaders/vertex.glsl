#version 300 es

// Localizações fixas para compartilhar VAOs entre os programas
layout(location = 0) in vec3 a_coords;
layout(location = 1) in vec3 a_normal;
layout(location = 2) in vec2 a_texcoord;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;

// Animação do rabo do Goku
uniform float u_tailWave;
uniform vec3 u_tailPivot;
uniform float u_tailLength;
uniform vec3 u_waveAxis;
uniform float u_time;

// Animação da água
uniform bool u_isWater;
uniform vec4 u_waterWave1;
uniform vec4 u_waterWave2;
uniform vec2 u_waterSpeeds;

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

    // Calcula a posição no mundo antes das ondas
    vec4 worldPosition = u_model * vec4(position, 1.0);

    if (u_isWater) {
        vec2 xz = worldPosition.xz;

        // Direções normalizadas das duas ondas
        vec2 direction1 = normalize(u_waterWave1.zw);
        vec2 direction2 = normalize(u_waterWave2.zw);

        // Fases das ondas no espaço do mundo
        float phase1 = u_waterWave1.y * dot(direction1, xz) + u_waterSpeeds.x * u_time;
        float phase2 = u_waterWave2.y * dot(direction2, xz) + u_waterSpeeds.y * u_time;

        // Soma dos deslocamentos verticais
        float height = u_waterWave1.x * sin(phase1) + u_waterWave2.x * sin(phase2);

        worldPosition.y += height;

        // Derivadas parciais da altura em relação a X e Z
        float dhdx = (u_waterWave1.x * u_waterWave1.y * direction1.x * cos(phase1) + u_waterWave2.x * u_waterWave2.y * direction2.x * cos(phase2));

        float dhdz = (u_waterWave1.x * u_waterWave1.y * direction1.y * cos(phase1) + u_waterWave2.x * u_waterWave2.y * direction2.y * cos(phase2));

        // Normal perpendicular à superfície da onda
        v_normal = normalize(vec3(-dhdx, 1.0, -dhdz));

    } else {
        // Normal dos demais objetos
        mat3 normalMatrix = transpose(inverse(mat3(u_model)));

        v_normal = normalMatrix * a_normal;
    }

    v_worldPos = worldPosition.xyz;
    v_texcoord = a_texcoord;

    gl_Position = u_projection * u_view * worldPosition;
}