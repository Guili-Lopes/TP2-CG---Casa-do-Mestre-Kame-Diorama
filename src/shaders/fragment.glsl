#version 300 es

precision highp float;

in vec3 v_normal;
in vec3 v_worldPos;
in vec2 v_texcoord;

out vec4 outColor;

// Cor e textura do material
uniform vec3 u_color;
uniform sampler2D u_texture;
uniform bool u_useTexture;

// Propriedades do material
uniform vec3 u_specularColor;
uniform float u_shininess;
uniform float u_emissive;

// Iluminação direcional
uniform vec3 u_lightDirection;
uniform vec3 u_lightColor;
uniform vec3 u_ambientLight;

// Posição da câmera
uniform vec3 u_cameraPosition;

// Controles de iluminação
uniform bool u_lightingEnabled;
uniform bool u_unlit;

// Shadow mapping
uniform sampler2D u_shadowMap;
uniform mat4 u_lightViewProjection;

// Calcula a proporção de sombra usando PCF 3x3
float calculateShadow(vec3 normal, vec3 lightDirection) {
    // Converte a posição do fragmento para o espaço da luz
    vec4 lightPosition = (u_lightViewProjection * vec4(v_worldPos, 1.0));

    vec3 coords = (lightPosition.xyz / lightPosition.w) * 0.5 + 0.5;

    // Fora da área do shadow map, não aplica sombra
    if (coords.x < 0.0 || coords.x > 1.0 || coords.y < 0.0 || coords.y > 1.0 || coords.z < 0.0 || coords.z > 1.0) {
        return 0.0;
    }

    vec3 n = normalize(normal);
    vec3 l = normalize(lightDirection);

    // Bias dependente do ângulo da superfície
    float bias = max(0.004 * (1.0 - max(dot(n, l), 0.0)), 0.0008);

    // Tamanho de um texel no mapa de profundidade
    vec2 texelSize = (1.0 / vec2(textureSize(u_shadowMap, 0)));

    float shadow = 0.0;

    // Percentage-Closer Filtering: nove amostras
    for (int x = -1; x <= 1; x++) {
        for (int y = -1; y <= 1; y++) {
            vec2 uv = coords.xy + (
                vec2(float(x), float(y)) * texelSize
            );

            // Evita amostras fora da textura
            if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
                continue;
            }

            float nearestDepth = texture(u_shadowMap, uv).r;

            if (coords.z - bias > nearestDepth) {
                shadow += 1.0;
            }
        }
    }

    return shadow / 9.0;
}

// Calcula o modelo de iluminação de Phong com sombras
vec3 calculatePhongLighting(vec3 normal, vec3 albedo) {
    vec3 n = normalize(normal);
    vec3 l = normalize(u_lightDirection);

    vec3 v = normalize(u_cameraPosition - v_worldPos);

    float diffuseFactor = max(dot(n, l), 0.0);

    // A iluminação ambiente não é afetada pela sombra
    vec3 ambient = (albedo * u_ambientLight);

    // Componente difusa de Lambert
    vec3 diffuse = (albedo * u_lightColor * diffuseFactor);

    vec3 specular = vec3(0.0);

    // Especular somente no lado iluminado
    if (diffuseFactor > 0.0) {
        vec3 r = reflect(-l, n);

        float specularFactor = pow(
            max(dot(r, v), 0.0),
            u_shininess
        );

        specular = (u_specularColor * u_lightColor * specularFactor);
    }

    float shadow = calculateShadow(n, l);

    // A sombra bloqueia a luz direta, mas não a ambiente
    return (ambient + (diffuse + specular) * (1.0 - shadow));
}

void main() {
    // Cor-base com textura e tonalidade
    vec3 albedo = u_color;

    if (u_useTexture) {
        albedo *= texture(u_texture, v_texcoord).rgb;
    }

    // Iluminação desativada ou material sem iluminação
    if (!u_lightingEnabled || u_unlit) {
        outColor = vec4(albedo, 1.0);
        return;
    }

    // Phong com sombras
    vec3 color = calculatePhongLighting(v_normal, albedo);

    // A emissão não é bloqueada pelas sombras
    color += albedo * u_emissive;

    outColor = vec4(color, 1.0);
}