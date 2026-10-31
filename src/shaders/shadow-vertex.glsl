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

// Shenlong: corpo deformado ao longo de uma curva em laços
uniform bool u_coilEnabled;
uniform float u_coilTurns;
uniform vec4 u_coilShape;
uniform float u_coilScale;
uniform float u_coilTailZ;
uniform float u_coilLength;

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

    // A sombra do Shenlong acompanha a mesma deformação da passada normal
    if (u_coilEnabled) {
        // Posição ao longo do corpo: 0 no rabo, 1 na cabeça
        float u = clamp((u_coilTailZ - a_coords.z) / u_coilLength, 0.0, 1.0);

        // Ponto da curva, com o rabo começando na origem
        vec3 center = (coilCurve(u) - coilCurve(0.0)) * u_coilScale;

        // Sistema de eixos ao longo da curva
        float e = 0.001;
        vec3 T = normalize(coilCurve(min(u + e, 1.0)) - coilCurve(max(u - e, 0.0)));
        vec3 bodyBack = normalize(cross(T, vec3(0.0, 0.0, 1.0)));
        vec3 headBack = normalize(vec3(0.0, 1.0, 0.0) - T.y * T);
        vec3 B = normalize(mix(bodyBack, headBack, smoothstep(0.80, 0.90, u)));
        vec3 N = cross(T, B);

        // Seção do corpo reaplicada em volta da curva (1,6x mais grossa)
        position = center + (a_coords.x * N + a_coords.y * B) * 1.6;
    }

    // A sombra do rabo acompanha sua deformação
    if (u_tailWave > 0.0) {
        float t = clamp(distance(a_coords, u_tailPivot) / u_tailLength,0.0, 1.0);

        float offset = u_tailWave * t * sin(WAVE_NUMBER * t - WAVE_SPEED * u_time);

        position += u_waveAxis * offset;
    }

    // Posição do vértice vista pela luz direcional
    gl_Position = (
        u_lightViewProjection * u_model * vec4(position, 1.0));
}