const ImgEffectShader2 = {
  uniforms: {},

  vertexShader: /* glsl */ `
    precision highp float;

    uniform mat4 modelMatrix;
    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;
    uniform vec3 cameraPosition;

    uniform float size;
    uniform float time;
    uniform float ang;

    attribute vec3 position;
    attribute vec3 info;

    varying float vVisible;
    varying vec2 vUv;

    float map(float value, float beforeMin, float beforeMax, float afterMin, float afterMax) {
      return afterMin + (afterMax - afterMin) * ((value - beforeMin) / (beforeMax - beforeMin));
    }

    vec3 rotate(vec3 p, float angle, vec3 axis){
        vec3 a = normalize(axis);
        float s = sin(angle);
        float c = cos(angle);
        float r = 1.0 - c;
        mat3 m = mat3(
            a.x * a.x * r + c,
            a.y * a.x * r + a.z * s,
            a.z * a.x * r - a.y * s,
            a.x * a.y * r - a.z * s,
            a.y * a.y * r + c,
            a.z * a.y * r + a.x * s,
            a.x * a.z * r + a.y * s,
            a.y * a.z * r - a.x * s,
            a.z * a.z * r + c
        );
        return m * p;
    }

    void main(){

      vec3 p = position;

      vVisible = info.y;

      vUv = vec2(map(p.x, -0.5, 0.5, 0.0, 1.0), map(p.y, -0.5, 0.5, 0.0, 1.0));

      // p = rotate(p, ang * info.x * 0.1, vec3(0.0, 0.0, 1.0));

      p.x += sin(p.y * info.x * 10.0 + time * 0.05) * 0.1;
      p.y += sin(p.x * info.x * 10.0 + time * -0.065) * 0.1;
      p.z += sin(p.x * info.x * 10.0 + time * -0.085) * 100.0;

      vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);

      gl_Position = projectionMatrix * mvPosition;
      gl_PointSize = mix(0.0, size, info.y);
    }`,

  fragmentShader: /* glsl */ `
    precision highp float;

    uniform sampler2D tex;

    varying float vVisible;
    varying vec2 vUv;

    void main(void) {
      if(vVisible <= 0.0) {
        discard;
      }

      vec4 dest = texture2D(tex, vec2(1.0 - vUv.x, vUv.y));
      // dest.rgb += 0.5;
      gl_FragColor = dest;
    }`,
}

export { ImgEffectShader2 }
