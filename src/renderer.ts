export class Renderer {
	canvas?: HTMLCanvasElement;
	gl?: WebGL2RenderingContext;
	width: number;
	height: number;

	program: WebGLProgram | null = null;
	vao: WebGLVertexArrayObject | null = null;
	heightMapTexture: WebGLTexture | null = null;
	noiseMapTexture: WebGLTexture | null = null;

	uHeightMapLoc: WebGLUniformLocation | null = null;
	uNoiseMapLoc: WebGLUniformLocation | null = null;
	uResolutionLoc: WebGLUniformLocation | null = null;
	uLightDirLoc: WebGLUniformLocation | null = null;
	uBaseColorLoc: WebGLUniformLocation | null = null;
	uNoiseStrengthLoc: WebGLUniformLocation | null = null;
	uShadowStrengthLoc: WebGLUniformLocation | null = null;

	lightDirX = -0.5;
	lightDirY = -0.5;
	lightDirZ = 0.707;
	baseColorR = 230;
	baseColorG = 215;
	baseColorB = 180;
	shadowStrength = 0.3;
	noiseStrength = 0.15;

	constructor(width: number, height: number) {
		this.width = width;
		this.height = height;
	}

	init(canvas: HTMLCanvasElement) {
		this.canvas = canvas;

		const gl = canvas.getContext('webgl2', { alpha: false, preserveDrawingBuffer: false });
		if (!gl) {
			throw new Error('WebGL2 not supported');
		}
		this.gl = gl;

		this.canvas.width = this.width;
		this.canvas.height = this.height;

		this.initGL(gl);
		this.resize(canvas, gl, this.width, this.height);
	}

	initGL(gl: WebGL2RenderingContext) {

		const vsSource = `#version 300 es
		in vec2 aPos;
		out vec2 vUv;
		void main() {
			vUv = aPos * 0.5 + 0.5;
			vUv.y = 1.0 - vUv.y; 
			gl_Position = vec4(aPos, 0.0, 1.0);
		}`;

		const fsSource = `#version 300 es
		precision highp float;

		uniform sampler2D uHeightMap;
		uniform sampler2D uNoiseMap;
		uniform vec2 uResolution;
		uniform vec3 uLightDir;
		uniform vec3 uBaseColor;
		uniform float uNoiseStrength;
		uniform float uShadowStrength;

		in vec2 vUv;
		out vec4 outColor;

		void main() {
			vec2 uv = vUv;
			
			float h = texture(uHeightMap, uv).r;

			float onePixelX = 1.0 / uResolution.x;
			float onePixelY = 1.0 / uResolution.y;

			float hLeft = texture(uHeightMap, uv - vec2(onePixelX, 0.0)).r;
			float hRight = texture(uHeightMap, uv + vec2(onePixelX, 0.0)).r;
			float hTop = texture(uHeightMap, uv - vec2(0.0, onePixelY)).r;
			float hBottom = texture(uHeightMap, uv + vec2(0.0, onePixelY)).r;
			
			float dx = (hRight - hLeft) * 80.0;
			float dy = (hBottom - hTop) * 80.0;
			float dz = 1.0;

			vec3 normal = normalize(vec3(-dx, -dy, dz));

			float diff = dot(normal, normalize(uLightDir));

			float noise = texture(uNoiseMap, uv).r;

			float light = (1.0 - uShadowStrength) + (uShadowStrength * diff) + noise * uNoiseStrength;
			float brightness = max(0.0, min(1.0, light));

			outColor = vec4(uBaseColor * brightness / 255.0, 1.0);
		}`;

		this.program = this.createProgram(gl, vsSource, fsSource);
		if (!this.program) return;

		const positionAttributeLocation = gl.getAttribLocation(this.program, "aPos");
		this.uHeightMapLoc = gl.getUniformLocation(this.program, "uHeightMap");
		this.uNoiseMapLoc = gl.getUniformLocation(this.program, "uNoiseMap");
		this.uResolutionLoc = gl.getUniformLocation(this.program, "uResolution");
		this.uLightDirLoc = gl.getUniformLocation(this.program, "uLightDir");
		this.uBaseColorLoc = gl.getUniformLocation(this.program, "uBaseColor");
		this.uNoiseStrengthLoc = gl.getUniformLocation(this.program, "uNoiseStrength");
		this.uShadowStrengthLoc = gl.getUniformLocation(this.program, "uShadowStrength");

		const positionBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		const positions = [
			-1, -1,
			1, -1,
			-1, 1,
			-1, 1,
			1, -1,
			1, 1,
		];
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

		this.vao = gl.createVertexArray();
		gl.bindVertexArray(this.vao);
		gl.enableVertexAttribArray(positionAttributeLocation);
		gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

		this.heightMapTexture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, this.heightMapTexture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

		this.noiseMapTexture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, this.noiseMapTexture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
	}

	createProgram(gl: WebGL2RenderingContext, vsSource: string, fsSource: string): WebGLProgram | null {
		const vertexShader = this.createShader(gl, gl.VERTEX_SHADER, vsSource);
		const fragmentShader = this.createShader(gl, gl.FRAGMENT_SHADER, fsSource);
		if (!vertexShader || !fragmentShader) return null;

		const program = gl.createProgram();
		if (!program) return null;

		gl.attachShader(program, vertexShader);
		gl.attachShader(program, fragmentShader);
		gl.linkProgram(program);

		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			console.error(gl.getProgramInfoLog(program));
			gl.deleteProgram(program);
			return null;
		}
		return program;
	}

	createShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
		const shader = gl.createShader(type);
		if (!shader) return null;

		gl.shaderSource(shader, source);
		gl.compileShader(shader);

		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			console.error(gl.getShaderInfoLog(shader));
			gl.deleteShader(shader);
			return null;
		}
		return shader;
	}

	render(heightMap: Float32Array) {
		const gl = this.gl;
		if (!this.program || !gl) return;

		gl.viewport(0, 0, this.width, this.height);
		gl.useProgram(this.program);
		gl.bindVertexArray(this.vao);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.heightMapTexture);
		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.R32F,
			this.width,
			this.height,
			0,
			gl.RED,
			gl.FLOAT,
			heightMap
		);

		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, this.noiseMapTexture);

		gl.uniform1i(this.uHeightMapLoc, 0);
		gl.uniform1i(this.uNoiseMapLoc, 1);
		gl.uniform2f(this.uResolutionLoc, this.width, this.height);
		gl.uniform3f(this.uLightDirLoc, this.lightDirX, this.lightDirY, this.lightDirZ);
		gl.uniform3f(this.uBaseColorLoc, this.baseColorR, this.baseColorG, this.baseColorB);
		gl.uniform1f(this.uNoiseStrengthLoc, this.noiseStrength);
		gl.uniform1f(this.uShadowStrengthLoc, this.shadowStrength);

		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}

	resize(canvas: HTMLCanvasElement, gl: WebGL2RenderingContext, width: number, height: number) {
		this.width = width;
		this.height = height;
		canvas.width = width;
		canvas.height = height;

		const noise = new Float32Array(width * height);
		for (let i = 0; i < width * height; i++) {
			noise[i] = (Math.random() - 0.5);
		}

		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, this.noiseMapTexture);
		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.R32F,
			width,
			height,
			0,
			gl.RED,
			gl.FLOAT,
			noise
		);
	}
}
