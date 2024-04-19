const BlockShader = {
  uniforms: {},

  vertexShader: /* glsl */ `
    uniform float time;
    varying vec2 vUv;

    void main(){
      vUv = position.zy;
      vec3 p = position;
      float r = time * 0.1;
      p.y += sin(p.y * 100.0 + r * 0.5) * .15;
      vUv.x += cos(p.x * 5.0 + r * 0.5) * 0.25;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    }`,

  fragmentShader: /* glsl */ `
    uniform vec3 color;
    uniform vec3 mulCol;
    uniform float alpha;

    varying vec2 vUv;

    void main(void) {
      vec4 dest = vec4(color, 1.0);

      dest.br += (0.75 * vUv.x) * 2.0;
      dest.bg -= (0.65 * vUv.y) * 2.0;

      dest.rgb = mix(dest.rgb, 1.0 - dest.rgb, alpha);
      dest.r *= (0.5 * vUv.y) * 10.0;

      gl_FragColor = dest;
    }`,
}

export { BlockShader }
