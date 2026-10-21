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

// Até oito fontes de luz pontuais
const int MAX_POINT_LIGHTS = 8;

uniform int u_pointLightCount;
uniform vec3 u_pointLightPositions[MAX_POINT_LIGHTS];
uniform vec3 u_pointLightColors[MAX_POINT_LIGHTS];
uniform vec3 u_pointLightAttenuation;

// Posição da câmera
uniform vec3 u_cameraPosition;

// Controles de iluminação
uniform bool u_lightingEnabled;
uniform bool u_unlit;

// Shadow mapping
uniform sampler2D u_shadowMap;
uniform mat4 u_lightViewProjection;

// Neblina exponencial ao quadrado
uniform bool u_fogEnabled;
uniform vec3 u_fogColor;
uniform float u_fogDensity;

// Calcula a proporção de sombra usando PCF 3x3
float calculateShadow(vec3 normal, vec3 lightDirection) {
    vec4 lightPosition = u_lightViewProjection * vec4(v_worldPos, 1.0);
    vec3 coords = (lightPosition.xyz / lightPosition.w) * 0.5 + 0.5;

    if (coords.x < 0.0 || coords.x > 1.0 || coords.y < 0.0 || coords.y > 1.0 || coords.z < 0.0 || coords.z > 1.0) {
        return 0.0;
    }

    vec3 n = normalize(normal);
    vec3 l = normalize(lightDirection);

    float bias = max(0.004 * (1.0 - max(dot(n, l), 0.0)), 0.0008);
    vec2 texelSize = 1.0 / vec2(textureSize(u_shadowMap, 0));

    float shadow = 0.0;

    for (int x = -1; x <= 1; x++) {
        for (int y = -1; y <= 1; y++) {
            vec2 uv = coords.xy + vec2(float(x), float(y)) * texelSize;

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

// Calcula Phong com luz direcional, sombras e luzes pontuais
vec3 calculatePhongLighting(vec3 normal, vec3 albedo) {
    vec3 n = normalize(normal);
    vec3 l = normalize(u_lightDirection);
    vec3 v = normalize(u_cameraPosition - v_worldPos);

    float diffuseFactor = max(dot(n, l), 0.0);

    // Componente ambiente global
    vec3 ambient = albedo * u_ambientLight;

    // Componente difusa da luz direcional
    vec3 diffuse = albedo * u_lightColor * diffuseFactor;
    vec3 specular = vec3(0.0);

    if (diffuseFactor > 0.0) {
        vec3 r = reflect(-l, n);
        float specularFactor = pow(max(dot(r, v), 0.0), u_shininess);

        specular = u_specularColor * u_lightColor * specularFactor;
    }

    // O shadow map afeta somente a luz direcional
    float shadow = calculateShadow(n, l);

    vec3 result = ambient + (diffuse + specular) * (1.0 - shadow);

    // Soma a contribuição de cada luz pontual ativa
    for (int i = 0; i < MAX_POINT_LIGHTS; i++) {
        if (i >= u_pointLightCount) {
            break;
        }

        // Direção e distância do fragmento até a fonte
        vec3 toLight = u_pointLightPositions[i] - v_worldPos;
        float d = length(toLight);
        vec3 pointDirection = toLight / max(d, 0.0001);

        vec3 lightColor = u_pointLightColors[i];

        // Componente difusa da luz pontual
        float pointDiffuseFactor = max(dot(n, pointDirection), 0.0);
        vec3 pointDiffuse = albedo * lightColor * pointDiffuseFactor;

        // Componente especular da luz pontual
        vec3 pointSpecular = vec3(0.0);

        if (pointDiffuseFactor > 0.0) {
            vec3 r = reflect(-pointDirection, n);
            float pointSpecularFactor = pow(max(dot(r, v), 0.0), u_shininess);

            pointSpecular = u_specularColor * lightColor * pointSpecularFactor;
        }

        // Atenuação: 1 / (a + b*d + c*d²)
        float a = u_pointLightAttenuation.x;
        float b = u_pointLightAttenuation.y;
        float c = u_pointLightAttenuation.z;

        float attenuation = 1.0 / max(a + b * d + c * d * d, 0.0001);

        // Somente as componentes difusa e especular são atenuadas
        result += attenuation * (pointDiffuse + pointSpecular);
    }

    return result;
}

// Aplica a neblina conforme a distância até a câmera
vec3 applyFog(vec3 color) {
    if (!u_fogEnabled) {
        return color;
    }

    float distanceToCamera = distance(u_cameraPosition, v_worldPos);

    // Neblina exponencial ao quadrado
    float fogFactor = exp(-pow(u_fogDensity * distanceToCamera, 2.0));
    fogFactor = clamp(fogFactor, 0.0, 1.0);

    return mix(u_fogColor, color, fogFactor);
}

void main() {
    vec3 albedo = u_color;

    if (u_useTexture) {
        albedo *= texture(u_texture, v_texcoord).rgb;
    }

    // A neblina continua funcionando com a iluminação desligada
    if (!u_lightingEnabled || u_unlit) {
        outColor = vec4(applyFog(albedo), 1.0);
        return;
    }

    // Phong com sombras
    vec3 color = calculatePhongLighting(v_normal, albedo);

    // Emissão própria do material
    color += albedo * u_emissive;

    // Aplica a neblina à cor final
    color = applyFog(color);

    outColor = vec4(color, 1.0);
}