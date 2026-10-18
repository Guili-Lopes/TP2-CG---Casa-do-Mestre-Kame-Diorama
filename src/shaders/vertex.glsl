#version 300 es
in vec3 a_coords;
in vec3 a_normal;
in vec2 a_texcoord;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;

// Onda do rabo do Goku (u_tailWave = 0.0 desliga para os outros objetos)
uniform float u_tailWave;     // amplitude da onda, nas coordenadas do arquivo
uniform vec3 u_tailPivot;     // base do rabo, nas coordenadas do arquivo
uniform float u_tailLength;   // comprimento do rabo, nas coordenadas do arquivo
uniform vec3 u_waveAxis;      // direção "para o lado" em que a onda acontece
uniform float u_time;         // tempo em segundos

out vec3 v_normal;
out vec3 v_worldPos;

const float WAVE_NUMBER = 7.54;   // 2π · 1,2: pouco mais de uma onda ao longo do rabo
const float WAVE_SPEED = 5.0;     // velocidade com que a onda corre (rad/s)

void main() {
    vec3 position = a_coords;
    if (u_tailWave > 0.0) {
        // t = 0 na base do rabo e t = 1 na ponta
        float t = clamp(distance(a_coords, u_tailPivot) / u_tailLength, 0.0, 1.0);

        // A base fica parada (t = 0) e a onda corre da base até a ponta
        float offset = u_tailWave * t * sin(WAVE_NUMBER * t - WAVE_SPEED * u_time);

        position += u_waveAxis * offset;
    }

    mat3 normalMatrix = transpose(inverse(mat3(u_model)));

    v_normal = normalMatrix * a_normal;

    v_worldPos = vec3(u_model * vec4(position, 1.0));

    gl_Position = u_projection * u_view * u_model * vec4(position, 1.0);
}