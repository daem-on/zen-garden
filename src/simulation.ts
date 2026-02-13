import { state, type Profile, type Vector2 } from "./state";

export function simulateAvalanche(
	width: number,
	height: number,
	heightMap: Float32Array,
	threshold: number,
	transferRate: number,
): Float32Array<ArrayBuffer> {
	const sourceMap = heightMap;
	const targetMap = new Float32Array(sourceMap);

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const i = y * width + x;
			const h = sourceMap[i];

			let maxDiff = 0;
			let targetIndex = -1;

			for (let k = -1; k <= 1; k++) {
				for (let l = -1; l <= 1; l++) {
					if (k === 0 && l === 0) continue;
					const nx = x + k;
					const ny = y + l;

					if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
						const ni = ny * width + nx;
						const dist = (k !== 0 && l !== 0) ? Math.SQRT2 : 1.0;
						const diff = (h - sourceMap[ni]) / dist;
						if (diff > maxDiff) {
							maxDiff = diff;
							targetIndex = ni;
						}
					}
				}
			}

			if (maxDiff > threshold && targetIndex !== -1) {
				const amount = (maxDiff - threshold) * transferRate;
				targetMap[i] -= amount;
				targetMap[targetIndex] += amount;
			}
		}
	}

	return targetMap;
}


function getRakeDepth(lx: number, ly: number, width: number): number {
	const nx = lx / width;
	const ny = ly / width;
	const distSq = nx * nx + ny * ny;

	if (distSq > 1) return 0;

	const freq = state.rakeTineCount;
	const tineShape = Math.cos(nx * Math.PI * freq);
	return tineShape;
}

function getTriangleRakeDepth(lx: number, ly: number, width: number): number {
	const nx = lx / width;
	const ny = ly / width;
	const distSq = nx * nx + ny * ny;

	if (distSq > 1) return 0;

	const freq = state.rakeTineCount;
	const tineShape = Math.asin(Math.sin(2 * nx * Math.PI * freq));
	return tineShape;
}

function getToolDepth(profile: Profile, lx: number, ly: number, width: number): number {
	if (profile === 'flat') return 0;
	if (profile === 'triangleRake') return getTriangleRakeDepth(lx, ly, width);
	return getRakeDepth(lx, ly, width);
}

export function interact(
	pos: Vector2,
	vel: Vector2,
	z: number,
	strength: number,
	toolWidth: number,
	toolLength: number,
	profile: Profile,
	width: number,
	height: number,
) {
	const { x, y } = pos;
	const { x: dx, y: dy } = vel;

	const { heightMap: map, rimSize, heightCap, rimTransferRate } = state;
	const radius = Math.sqrt(toolWidth * toolWidth + toolLength * toolLength) / 2;

	let dirLen = Math.sqrt(dx * dx + dy * dy);
	let dirX = 0;
	let dirY = -1;
	if (dirLen > 0.001) {
		dirX = dx / dirLen;
		dirY = dy / dirLen;
	}

	let perpX = -dirY;
	let perpY = dirX;

	const effectRadius = radius + rimSize + 5;
	const startX = Math.max(0, Math.floor(x - effectRadius));
	const endX = Math.min(width, Math.ceil(x + effectRadius));
	const startY = Math.max(0, Math.floor(y - effectRadius));
	const endY = Math.min(height, Math.ceil(y + effectRadius));

	function globalToLocal(globalX: number, globalY: number): { localX: number, localY: number; } {
		const ox = globalX - x;
		const oy = globalY - y;
		const localY = ox * dirX + oy * dirY;
		const localX = ox * perpX + oy * perpY;
		return { localX, localY };
	}

	function localToGlobal(localX: number, localY: number): { globalX: number, globalY: number; } {
		const ox = localX * perpX + localY * dirX;
		const oy = localX * perpY + localY * dirY;
		const globalX = Math.round(x + ox);
		const globalY = Math.round(y + oy);
		return { globalX, globalY };
	}

	function findNearestUnfilledRimPixel(localX: number, _localY: number): number | null {
		const startLocalY = Math.floor(toolLength / 2);
		const startLocalX = localX;
		const xDirection = Math.sign(localX);
		let lx = startLocalX;
		while (Math.abs(lx) < toolWidth / 2 + rimSize) {
			let ly = startLocalY;
			while (ly < startLocalY + rimSize) {
				const { globalX, globalY } = localToGlobal(lx, ly);
				const index = globalY * width + globalX;
				if (map[index] < heightCap) {
					return index;
				}
				ly++;
			}
			lx += xDirection;
		}

		return null;
	}

	function distributeSand(remainingSand: number, localX: number, localY: number) {
		while (remainingSand > 0.0001) {
			const bestRim = findNearestUnfilledRimPixel(localX, localY);

			if (!bestRim) break;

			const availableSpace = heightCap - map[bestRim];
			const amountToAdd = Math.min(remainingSand * rimTransferRate, availableSpace);
			map[bestRim] += amountToAdd;
			remainingSand -= amountToAdd;
		}
	}

	for (let py = startY; py < endY; py++) {
		for (let px = startX; px < endX; px++) {
			const index = py * width + px;

			const { localX, localY } = globalToLocal(px, py);
			const absLocalX = Math.abs(localX);
			const absLocalY = Math.abs(localY);

			if (absLocalX < toolWidth / 2 && absLocalY < toolLength / 2) {
				const toolDepth = getToolDepth(profile, localX, localY, toolWidth);

				const targetHeight = Math.max(0, z - toolDepth * strength);
				const currentHeight = map[index];

				if (currentHeight > targetHeight) {
					const amountToRemove = Math.min(currentHeight, currentHeight - targetHeight);

					if (amountToRemove > 0) {
						map[index] -= amountToRemove;

						distributeSand(amountToRemove, localX, localY);
					}
				}
			}
		}
	}
}
