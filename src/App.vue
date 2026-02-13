<script setup lang="ts">
import { computed, useTemplateRef, watch } from 'vue';
import ControlPanel from './components/ControlPanel.vue';
import { renderPebbles, renderTool } from './overlay';
import { initPebbles } from './pebbles';
import { Renderer } from './renderer';
import { state, type Vector2 } from './state';
import { interact, simulateAvalanche } from './simulation';

const sandCanvas = useTemplateRef<HTMLCanvasElement>('sandCanvas');
const overlayCanvas = useTemplateRef<HTMLCanvasElement>('overlayCanvas');

const overlayCtx = computed(() => overlayCanvas.value?.getContext('2d'));

const renderer = new Renderer(window.innerWidth, window.innerHeight);

watch(() => state.baseColor, (newColor) => {
	const r = parseInt(newColor.substring(1, 3), 16);
	const g = parseInt(newColor.substring(3, 5), 16);
	const b = parseInt(newColor.substring(5, 7), 16);
	renderer.baseColorR = r;
	renderer.baseColorG = g;
	renderer.baseColorB = b;
}, { immediate: true });

function lerpVector(
	target: Vector2,
	current: Vector2 | undefined,
	rotationSpeed: number,
	linearSpeed: number,
): Vector2 {
	const targetAngle = Math.atan2(target.y, target.x);
	const currentAngle = current === undefined
		? targetAngle
		: Math.atan2(current.y, current.x);

	let delta = targetAngle - currentAngle;

	while (delta > Math.PI) delta -= 2 * Math.PI;
	while (delta < -Math.PI) delta += 2 * Math.PI;

	const rotationStep = Math.max(-rotationSpeed, Math.min(rotationSpeed, delta));

	const finalAngle = currentAngle + rotationStep;

	return {
		x: Math.cos(finalAngle) * linearSpeed,
		y: Math.sin(finalAngle) * linearSpeed
	};
}

let avalancheFrame = 0;

function animate() {
	renderer.lightDirX = state.lightDirX;
	renderer.lightDirY = state.lightDirY;
	renderer.lightDirZ = state.lightDirZ;
	renderer.shadowStrength = state.shadowStrength;
	renderer.noiseStrength = state.noiseStrength;

	if (state.targetToolPos !== undefined) {
		state.currentToolPos ??= state.targetToolPos;

		const delta = {
			x: state.targetToolPos.x - state.currentToolPos.x,
			y: state.targetToolPos.y - state.currentToolPos.y,
		};
		const distance = Math.sqrt(delta.x * delta.x + delta.y * delta.y);

		if (distance > 0.1) {
			const speed = Math.min(state.toolLinearSpeed * distance / 100, state.toolLinearSpeed);
			const vel = lerpVector(delta, state.currentToolVel, state.toolAngularSpeed, speed);

			state.currentToolVel = vel;

			state.currentToolPos.x += vel.x;
			state.currentToolPos.y += vel.y;

			interact(
				state.currentToolPos,
				vel,
				state.toolZ,
				state.toolStrength,
				state.toolWidth,
				state.toolWidth / 3,
				state.profile,
				window.innerWidth,
				window.innerHeight,
			);
		}
	} else {
		state.currentToolPos = undefined;
		state.currentToolVel = undefined;
	}

	avalancheFrame++;

	if (avalancheFrame > state.avalancheInterval) {
		avalancheFrame = 0;
		state.heightMap = simulateAvalanche(
			window.innerWidth,
			window.innerHeight,
			state.heightMap,
			state.threshold,
			state.transferRate,
		);
	}

	renderer.render(state.heightMap);

	if (overlayCtx.value) {
		overlayCtx.value.clearRect(0, 0, window.innerWidth, window.innerHeight);
		renderPebbles(overlayCtx.value);
		renderTool(overlayCtx.value);
	}

	requestAnimationFrame(animate);
}

function handleInteraction(clientX: number, clientY: number) {
	state.targetToolPos = { x: clientX, y: clientY };
}

watch(overlayCanvas, (canvas) => {
	if (!canvas) return;
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
});

watch(sandCanvas, (canvas) => {
	if (!canvas) return;
	renderer.init(canvas);
});

const onpointerdown = (e: PointerEvent) => {
	if (e.button === 0) {
		handleInteraction(e.clientX, e.clientY);
	}
};
const onpointerup = () => {
	state.targetToolPos = undefined;
};
const onpointerleave = () => {
	state.targetToolPos = undefined;
};
const onpointermove = (e: PointerEvent) => {
	if (e.buttons === 1) {
		if (e.pressure !== 0.5) {
			state.toolZ = e.pressure;
		}
		handleInteraction(e.clientX, e.clientY);
	}
};
const onwheel = (e: WheelEvent) => {
	const delta = Math.sign(e.deltaY) * 0.005;
	state.toolZ = Math.round(Math.max(0, Math.min(1, state.toolZ + delta)) * 1000) / 1000;
};

state.heightMap = new Float32Array(window.innerWidth * window.innerHeight);
state.heightMap.fill(0.5);

initPebbles(window.innerWidth, window.innerHeight, 6);

animate();

</script>

<template>
	<canvas id="sand-canvas" ref="sandCanvas" @pointerdown="onpointerdown" @pointerup="onpointerup"
		@pointerleave="onpointerleave" @pointermove="onpointermove" @wheel="onwheel"></canvas>
	<canvas id="overlay-canvas" ref="overlayCanvas"></canvas>
	<div class="ui-container">
		<ControlPanel />
	</div>
</template>

<style scoped>
#sand-canvas {
	width: 100%;
	height: 100%;
	display: block;
}

#sand-canvas:active {
	cursor: grabbing;
}

#overlay-canvas {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	pointer-events: none;
	z-index: 50;
}

.ui-container {
	position: absolute;
	top: 20px;
	right: 20px;
	z-index: 100;
}
</style>
