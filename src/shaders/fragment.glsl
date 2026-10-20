#version 300 es

precision mediump float;

in vec3 v_normal;
in vec3 v_worldPos;
in vec2 v_texcoord;

out vec4 outColor;

// Cor usada diretamente ou como tonalidade da textura
uniform vec3 u_color;

// Textura difusa
uniform sampler2D u_texture;
uniform bool u_useTexture;

// Propriedades especulares
uniform vec3 u_specularColor;
uniform float u_shininess;

// Luz direcional e luz ambiente
uniform vec3 u_lightDirection;
uniform vec3 u_lightColor;
uniform vec3 u_ambientLight;

// Posição da câmera no espaço do mundo
uniform vec3 u_cameraPosition;

// Controles do modelo de iluminação
uniform bool u_lightingEnabled;
uniform bool u_unlit;

uniform float u_emissive;

// Calcula o modelo de iluminação de Phong
vec3 calculatePhongLighting(vec3 normal, vec3 albedo) {
    vec3 n = normalize(normal);

    vec3 l = normalize(u_lightDirection);

    vec3 v = normalize(u_cameraPosition - v_worldPos);

    float diffuseFactor = max(dot(n, l), 0.0);

    // Componente ambiente
    vec3 ambient = albedo * u_ambientLight;

    // Componente difusa
    vec3 diffuse = (albedo * u_lightColor * diffuseFactor);

    vec3 specular = vec3(0.0);

    // Reflexo especular somente na face iluminada
    if (diffuseFactor > 0.0) {
        vec3 r = reflect(-l, n);

        float specularFactor = pow(max(dot(r, v), 0.0), u_shininess);

        specular = (u_specularColor * u_lightColor * specularFactor);
    }

    return ambient + diffuse + specular;
}

void main() {
    // Cor-base do fragmento: textura multiplicada pela tonalidade
    vec3 albedo = u_color;

    if (u_useTexture) {
        albedo *= texture(u_texture, v_texcoord).rgb;
    }

    // Sem iluminação, mostra somente a cor-base
    if (!u_lightingEnabled || u_unlit) {
        outColor = vec4(albedo, 1.0);
        return;
    }

    // Iluminação de Phong calculada em cada fragmento
    vec3 color = calculatePhongLighting(v_normal, albedo);

    color += albedo * u_emissive;

    outColor = vec4(color, 1.0);
}