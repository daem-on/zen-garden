import { state, type Pebble } from "./state";

const MIN_RADIUS = 15;
const MAX_RADIUS = 35;
const MIN_DISTANCE = 20;

function tryCreatePebble(width: number, height: number): Pebble | undefined {
	for (let attempts = 0; attempts < 100; attempts++) {
		const radius = MIN_RADIUS + Math.random() * (MAX_RADIUS - MIN_RADIUS);
		const x = radius + Math.random() * (width - 2 * radius);
		const y = radius + Math.random() * (height - 2 * radius);

		const isValid = state.pebbles.every(p => {
			const dx = p.position.x - x;
			const dy = p.position.y - y;
			const distSq = dx * dx + dy * dy;
			const radii = p.radius + radius;
			return distSq >= radii * radii + MIN_DISTANCE * MIN_DISTANCE;
		});

		if (isValid) {
			const rotation = Math.random() * Math.PI * 2;
			return { position: { x, y }, radius, rotation };
		}
	}
	return;
}

export function initPebbles(width: number, height: number, count: number) {
	for (let i = 0; i < count; i++) {
		const pebble = tryCreatePebble(width, height);
		if (pebble) state.pebbles.push(pebble);
	}
}
