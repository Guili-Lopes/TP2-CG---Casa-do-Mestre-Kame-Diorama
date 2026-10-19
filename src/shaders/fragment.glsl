#version 300 es

precision mediump float;

in vec3 v_normal;
in vec3 v_worldPos;

out vec4 outColor;

// Propriedades do material
uniform vec3 u_color;
uniform vec3 u_specularColor;
uniform float u_shininess;

// Propriedades da iluminação direcional
uniform vec3 u_lightDirection;
uniform vec3 u_lightColor;
uniform vec3 u_ambientLight;

// Posição do observador no mundo
uniform vec3 u_cameraPosition;

// Controles da iluminação
uniform bool u_lightingEnabled;
uniform bool u_unlit;

// Calcula as componentes ambiente, difusa e especular de Phong
vec3 calculatePhongLighting(vec3 normal) {
    vec3 n = normalize(normal);

    // Direção da superfície até a fonte de luz
    vec3 l = normalize(u_lightDirection);

    // Direção da superfície até a câmera
    vec3 v = normalize(u_cameraPosition - v_worldPos);

    float diffuseFactor = max(dot(n, l), 0.0);

    // Componente ambiente
    vec3 ambient = u_color * u_ambientLight;

    // Componente difusa de Lambert
    vec3 diffuse = u_color * u_lightColor * diffuseFactor;

    vec3 specular = vec3(0.0);

    // Evita brilho especular no lado oposto à luz
    if (diffuseFactor > 0.0) {
        // Reflexão da luz incidente em torno da normal
        vec3 r = reflect(-l, n);

        float specularFactor = pow(
            max(dot(r, v), 0.0),
            u_shininess
        );

        // Componente especular
        specular = u_specularColor * u_lightColor * specularFactor;
    }

    return ambient + diffuse + specular;
}

void main() {
    // Iluminação desligada ou material sem sombreamento
    if (!u_lightingEnabled || u_unlit) {
        outColor = vec4(u_color, 1.0);
        return;
    }

    // Phong calculado por fragmento, usando a normal interpolada
    vec3 color = calculatePhongLighting(
        normalize(v_normal)
    );

    outColor = vec4(color, 1.0);
}