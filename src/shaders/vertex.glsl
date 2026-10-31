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

// Deformação do Shenlong em espiral
uniform bool u_coilEnabled;
uniform float u_coilTurns;
uniform vec4 u_coilShape;
uniform float u_coilScale;
uniform float u_coilTailZ;
uniform float u_coilLength;

out vec3 v_normal;
out vec3 v_worldPos;
out vec2 v_texcoord;

const float WAVE_NUMBER = 7.54;
const float WAVE_SPEED = 5.0;

// Espiral em laços (o corpo)
vec3 coilSpiral(float u) {
    float angle = 6.2831853 * u_coilTurns * u + 0.18 * sin(6.2831853 * u - u_time);
    float grow = 0.4 + 0.6 * smoothstep(0.0, 0.25, u);

    float x = u_coilShape.x * sin(angle) * grow;
    float y = u_coilShape.y * u - u_coilShape.z * cos(angle) * grow + 0.06 * sin(12.566 * u - u_time);
    float z = u_coilShape.w * cos(angle);

    return vec3(x, y, z);
}

// Curva completa: a espiral e, no final, o pescoço saindo para a frente
vec3 coilCurve(float u) {
    const float NECK_START = 0.82;

    // Onde o pescoço começa, e com que "velocidade" a espiral anda ali
    vec3 neckBase = coilSpiral(NECK_START);
    float speed = length(coilSpiral(NECK_START + 0.001) - coilSpiral(NECK_START - 0.001)) / 0.002;

    // O pescoço: uma reta para a frente (+Z) e um pouco para cima
    vec3 neckDirection = normalize(vec3(0.0, 0.35, 1.0));
    vec3 neck = neckBase + neckDirection * (u - NECK_START) * speed;

    // Troca suave da espiral para o pescoço
    return mix(coilSpiral(u), neck, smoothstep(0.80, 0.90, u));
}

void main() {
    vec3 position = a_coords;
    vec3 normal = a_normal;

    if(u_coilEnabled){
        float u = clamp((u_coilTailZ - a_coords.z) / u_coilLength, 0.0, 1.0);

        vec3 center = (coilCurve(u) - coilCurve(0.0)) * u_coilScale;

        float e = 0.001;

        vec3 T = normalize(coilCurve(min(u + e, 1.0)) - coilCurve(max(u - e, 0.0)));
        vec3 reference = normalize(mix(vec3(0.0, 0.0, -1.0), vec3(0.0, 1.0, 0.0), smoothstep(0.80, 0.92, u)));
        vec3 B = normalize(reference - dot(reference, T) * T);
        vec3 N = normalize(cross(T, B));

        position = center + (a_coords.x * N + a_coords.y * B) * 1.6;
        normal = a_normal.x * N + a_normal.y * B - a_normal.z * T;
    }

    // Mantém a deformação animada do rabo
    if (u_tailWave > 0.0) {
        float t = clamp(distance(a_coords, u_tailPivot) / u_tailLength, 0.0, 1.0);

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