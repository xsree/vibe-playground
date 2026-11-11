(function () {
  "use strict";

  async function initWebGPU(canvas) {
    if (!navigator.gpu) {
      return null;
    }
    const adapter = await navigator.gpu.requestAdapter({ powerPreference: "high-performance" });
    if (!adapter) {
      return null;
    }
    const device = await adapter.requestDevice();

    const sceneModule = device.createShaderModule({ code: window.BH_WGSL.scene });
    const compModule = device.createShaderModule({ code: window.BH_WGSL.composite });

    if (sceneModule.getCompilationInfo) {
      const [sInfo, cInfo] = await Promise.all([
        sceneModule.getCompilationInfo(),
        compModule.getCompilationInfo()
      ]);
      const hasError = [...sInfo.messages, ...cInfo.messages].some((m) => m.type === "error");
      if (hasError) {
        return null;
      }
    }

    const context = canvas.getContext("webgpu");
    if (!context) {
      return null;
    }

    const format = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
      device,
      format,
      alphaMode: "opaque"
    });

    const uniformBuffer = device.createBuffer({
      size: 80,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    const scenePipeline = device.createRenderPipeline({
      layout: "auto",
      vertex: { module: sceneModule, entryPoint: "vsMain" },
      fragment: {
        module: sceneModule,
        entryPoint: "fsMain",
        targets: [{ format: "rgba16float" }]
      },
      primitive: { topology: "triangle-list" }
    });

    const compPipeline = device.createRenderPipeline({
      layout: "auto",
      vertex: { module: compModule, entryPoint: "vsMain" },
      fragment: {
        module: compModule,
        entryPoint: "fsMain",
        targets: [{ format }]
      },
      primitive: { topology: "triangle-list" }
    });

    const sampler = device.createSampler({
      magFilter: "linear",
      minFilter: "linear",
      addressModeU: "clamp-to-edge",
      addressModeV: "clamp-to-edge"
    });

    const sceneBindGroup = device.createBindGroup({
      layout: scenePipeline.getBindGroupLayout(0),
      entries: [{ binding: 0, resource: { buffer: uniformBuffer } }]
    });

    let hdrTex = null;
    let hdrView = null;
    let compBindGroup = null;
    let curW = 0;
    let curH = 0;
    let lost = false;

    device.lost.then(() => {
      lost = true;
    });

    function ensureSize(w, h) {
      const tw = Math.max(1, w | 0);
      const th = Math.max(1, h | 0);
      if (tw === curW && th === curH && hdrTex) {
        return;
      }
      curW = tw;
      curH = th;
      if (hdrTex) {
        hdrTex.destroy();
      }
      hdrTex = device.createTexture({
        size: { width: curW, height: curH, depthOrArrayLayers: 1 },
        format: "rgba16float",
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING
      });
      hdrView = hdrTex.createView();
      compBindGroup = device.createBindGroup({
        layout: compPipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: uniformBuffer } },
          { binding: 1, resource: hdrView },
          { binding: 2, resource: sampler }
        ]
      });
    }

    ensureSize(canvas.width || 1, canvas.height || 1);

    return {
      backendName: "WEBGPU · REALTIME GEODESIC",
      resize(w, h) {
        if (!lost) {
          ensureSize(w, h);
        }
      },
      render(uniformData) {
        if (lost || curW < 1 || curH < 1 || !hdrView || !compBindGroup) {
          return;
        }
        device.queue.writeBuffer(uniformBuffer, 0, uniformData.buffer, uniformData.byteOffset, 80);

        let swapView;
        try {
          swapView = context.getCurrentTexture().createView();
        } catch (_e) {
          return;
        }

        const encoder = device.createCommandEncoder();

        const pass1 = encoder.beginRenderPass({
          colorAttachments: [{
            view: hdrView,
            clearValue: { r: 0, g: 0, b: 0, a: 1 },
            loadOp: "clear",
            storeOp: "store"
          }]
        });
        pass1.setPipeline(scenePipeline);
        pass1.setBindGroup(0, sceneBindGroup);
        pass1.draw(3, 1, 0, 0);
        pass1.end();

        const pass2 = encoder.beginRenderPass({
          colorAttachments: [{
            view: swapView,
            clearValue: { r: 0, g: 0, b: 0, a: 1 },
            loadOp: "clear",
            storeOp: "store"
          }]
        });
        pass2.setPipeline(compPipeline);
        pass2.setBindGroup(0, compBindGroup);
        pass2.draw(3, 1, 0, 0);
        pass2.end();

        device.queue.submit([encoder.finish()]);
      }
    };
  }

  function compileGLShader(gl, type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(sh));
      gl.deleteShader(sh);
      return null;
    }
    return sh;
  }

  function createGLProgram(gl, vsSrc, fsSrc) {
    const vs = compileGLShader(gl, gl.VERTEX_SHADER, vsSrc);
    const fs = compileGLShader(gl, gl.FRAGMENT_SHADER, fsSrc);
    if (!vs || !fs) {
      return null;
    }
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(prog));
      gl.deleteProgram(prog);
      return null;
    }
    return prog;
  }

  function initWebGL2(canvas) {
    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "high-performance"
    });
    if (!gl) {
      return null;
    }

    const floatExt = gl.getExtension("EXT_color_buffer_float");
    gl.getExtension("OES_texture_float_linear");

    const sceneProg = createGLProgram(gl, window.BH_GLSL.vertex, window.BH_GLSL.scene);
    const compProg = createGLProgram(gl, window.BH_GLSL.vertex, window.BH_GLSL.composite);
    if (!sceneProg || !compProg) {
      return null;
    }

    const sceneParamsLoc = gl.getUniformLocation(sceneProg, "uParams");
    const compParamsLoc = gl.getUniformLocation(compProg, "uParams");
    const compTexLoc = gl.getUniformLocation(compProg, "uHdrTex");

    const vao = gl.createVertexArray();
    let fbo = null;
    let hdrTex = null;
    let curW = 0;
    let curH = 0;
    let useFloat = Boolean(floatExt);

    function allocateFBO(w, h, floatMode) {
      if (hdrTex) gl.deleteTexture(hdrTex);
      if (fbo) gl.deleteFramebuffer(fbo);

      hdrTex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, hdrTex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      if (floatMode) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
      } else {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      }

      fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, hdrTex, 0);
      const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return ok;
    }

    function ensureSize(w, h) {
      const tw = Math.max(1, w | 0);
      const th = Math.max(1, h | 0);
      if (tw === curW && th === curH && fbo) {
        return;
      }
      curW = tw;
      curH = th;
      if (useFloat && !allocateFBO(curW, curH, true)) {
        useFloat = false;
      }
      if (!useFloat) {
        allocateFBO(curW, curH, false);
      }
    }

    ensureSize(canvas.width || 1, canvas.height || 1);

    return {
      backendName: "WEBGL2 · REALTIME GEODESIC",
      resize(w, h) {
        ensureSize(w, h);
      },
      render(uniformData) {
        if (curW < 1 || curH < 1 || gl.isContextLost()) {
          return;
        }
        gl.bindVertexArray(vao);

        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.viewport(0, 0, curW, curH);
        gl.useProgram(sceneProg);
        gl.uniform4fv(sceneParamsLoc, uniformData);
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, curW, curH);
        gl.useProgram(compProg);
        gl.uniform4fv(compParamsLoc, uniformData);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, hdrTex);
        gl.uniform1i(compTexLoc, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    };
  }

  window.createBlackHoleRenderer = async function (canvas) {
    try {
      const gpuRenderer = await initWebGPU(canvas);
      if (gpuRenderer) {
        return gpuRenderer;
      }
    } catch (err) {
      console.warn("WebGPU unavailable, switching to WebGL2:", err);
    }
    return initWebGL2(canvas);
  };
})();
