import { reactive } from "vue";

export type Vector2 = { x: number, y: number; };
export type Profile = "wavy" | "flat" | "triangleRake";

export type Pebble = { position: Vector2; radius: number; rotation: number; };

export type ToolPreset = {
	name: string,
	toolWidth?: number,
	toolStrength?: number,
	toolZ?: number,
	profile?: Profile,
	toolLinearSpeed?: number,
	toolAngularSpeed?: number,
	rakeTineCount?: number,
	heightCap?: number,
	rimTransferRate?: number,
	rimSize?: number,
};

export const state = reactive({
	currentToolPos: undefined as Vector2 | undefined,
	currentToolVel: undefined as Vector2 | undefined,
	targetToolPos: undefined as Vector2 | undefined,

	// Tool
	toolWidth: 60,
	toolStrength: 0.15,
	toolZ: 0.54,
	profile: "triangleRake" as Profile,
	toolLinearSpeed: 2.3,
	toolAngularSpeed: 0.05,
	rakeTineCount: 6,
	heightCap: 1.2,
	rimTransferRate: 0.8,
	rimSize: 10,

	// Simulation
	heightMap: new Float32Array(),
	iterations: 1,
	threshold: 0.045,
	transferRate: 0.3,
	avalancheInterval: 8,

	// Rendering
	lightDirX: -0.5,
	lightDirY: -0.5,
	lightDirZ: 0.707,
	baseColor: "#fff6e5",
	noiseStrength: 0.15,
	shadowStrength: 0.3,

	// Entities
	pebbles: [] as Pebble[],
});

export const toolPresets: ToolPreset[] = [
	{
		name: "Default rake",
		toolWidth: 60,
		toolStrength: 0.15,
		toolZ: 0.54,
		profile: "triangleRake",
		toolLinearSpeed: 2.3,
		toolAngularSpeed: 0.05,
		rakeTineCount: 6,
		rimTransferRate: 0.8,
		rimSize: 10,
	},
	{
		name: "Back of the rake",
		toolWidth: 60,
		toolZ: 0.5,
		profile: "flat",
		rimTransferRate: 0.7,
		rimSize: 15,
	},
	{
		name: "Wide rake",
		toolWidth: 80,
		toolStrength: 0.15,
		toolZ: 0.54,
		profile: "triangleRake",
		rakeTineCount: 8,
	},
	{
		name: "Wavy rake",
		profile: "wavy",
		rakeTineCount: 6,
	}
];
