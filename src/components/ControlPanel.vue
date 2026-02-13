<script setup lang="ts">
import { ref } from 'vue';
import { state, toolPresets, type ToolPreset } from '../state';

const reset = () => {
	state.heightMap.fill(0.5);
};

function applyPreset(preset: ToolPreset) {
	Object.assign(state, preset);
	lastSelectedPreset.value = preset.name;
}

const lastSelectedPreset = ref<string>();

applyPreset(toolPresets[0]);

</script>

<template>
	<aside>
		<div class="preset-list">
			<button v-for="preset in toolPresets" @click="applyPreset(preset)"
				:class="{ active: lastSelectedPreset === preset.name }">{{ preset.name }}</button>
		</div>

		<div class="control-group">
			<label>Tool height: {{ state.toolZ }}</label>
			<input type="range" min="0" max="1" step="0.01" v-model.number="state.toolZ">
		</div>

		<div class="control-group">
			<button @click="reset" class="btn-reset">Reset Sand</button>
		</div>

		<details>
			<summary>Tool settings</summary>

			<div class="control-group">
				<label>Tool Size: {{ state.toolWidth }}</label>
				<input type="range" min="1" max="100" v-model.number="state.toolWidth">
			</div>

			<div class="control-group">
				<label>Tool Strength: {{ state.toolStrength }}</label>
				<input type="range" min="0" max="1" step="0.01" v-model.number="state.toolStrength">
			</div>

			<div class="control-group">
				<label>Rake Tine Count: {{ state.rakeTineCount }}</label>
				<input type="range" min="0" max="20" step="1" v-model.number="state.rakeTineCount">
			</div>

			<div class="control-group">
				<label>Height Cap: {{ state.heightCap }}</label>
				<input type="range" min="0" max="2" step="0.01" v-model.number="state.heightCap">
			</div>

			<div class="control-group">
				<label>Rim Transfer Rate: {{ state.rimTransferRate }}</label>
				<input type="range" min="0" max="1" step="0.01" v-model.number="state.rimTransferRate">
			</div>

			<div class="control-group">
				<label>Rim Size: {{ state.rimSize }}</label>
				<input type="range" min="0" max="50" step="1" v-model.number="state.rimSize">
			</div>

			<div class="control-group">
				<label>Tool Linear Speed: {{ state.toolLinearSpeed }}</label>
				<input type="range" min="0" max="100" step="1" v-model.number="state.toolLinearSpeed">
			</div>

			<div class="control-group">
				<label>Tool Angular Speed: {{ state.toolAngularSpeed }}</label>
				<input type="range" min="0" max="1" step="0.01" v-model.number="state.toolAngularSpeed">
			</div>

			<div class="control-group">
				<label>Profile</label>
				<div class="radio-group">
					<label>
						<input type="radio" value="wavy" v-model="state.profile"> Wavy
					</label>
					<label>
						<input type="radio" value="flat" v-model="state.profile"> Flat
					</label>
					<label>
						<input type="radio" value="triangleRake" v-model="state.profile"> Triangle
					</label>
				</div>
			</div>
		</details>

		<details>
			<summary>Simulation settings</summary>
			<div class="control-group">
				<label>Sim Iterations: {{ state.iterations }}</label>
				<input type="range" min="0" max="10" step="1" v-model.number="state.iterations">
			</div>

			<div class="control-group">
				<label>Sim Threshold: {{ state.threshold }}</label>
				<input type="range" min="0.0" max="0.2" step="0.001" v-model.number="state.threshold">
			</div>

			<div class="control-group">
				<label>Flow Rate: {{ state.transferRate }}</label>
				<input type="range" min="0.0" max="1.0" step="0.01" v-model.number="state.transferRate">
			</div>

			<div class="control-group">
				<label>Avalanche Interval: {{ state.avalancheInterval }}</label>
				<input type="range" min="1" max="60" step="1" v-model.number="state.avalancheInterval">
			</div>
		</details>

		<details>
			<summary>Display settings</summary>

			<div class="control-group">
				<label>Sun X: {{ state.lightDirX }}</label>
				<input type="range" min="-1.0" max="1.0" step="0.1" v-model.number="state.lightDirX">

			</div>

			<div class="control-group">
				<label>Sun Y: {{ state.lightDirY }}</label>
				<input type="range" min="-1.0" max="1.0" step="0.1" v-model.number="state.lightDirY">
			</div>

			<div class="control-group">
				<label>Sun Z: {{ state.lightDirZ }}</label>
				<input type="range" min="0.0" max="1.0" step="0.01" v-model.number="state.lightDirZ">
			</div>

			<div class="control-group">
				<label>Noise Strength: {{ state.noiseStrength }}</label>
				<input type="range" min="0.0" max="1.0" step="0.01" v-model.number="state.noiseStrength">
			</div>

			<div class="control-group">
				<label>Shadow Strength: {{ state.shadowStrength }}</label>
				<input type="range" min="0.0" max="1.0" step="0.01" v-model.number="state.shadowStrength">
			</div>

			<div class="control-group">
				<label>Sand Color</label>
				<input type="color" v-model="state.baseColor">
			</div>
		</details>
	</aside>
</template>

<style scoped>
aside {
	background: rgba(0, 0, 0, 0.7);
	color: white;
	padding: 20px;
	border-radius: 8px;
	max-height: 90vh;
	overflow-y: auto;
	width: 300px;
	user-select: none;
	color-scheme: dark;
}

.preset-list {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 10px;
}

h2,
h3 {
	margin-top: 0;
}

.control-group {
	margin: 10px 0;
}

label {
	display: block;
	margin-bottom: 5px;
	font-size: 0.9em;
}

input[type="range"] {
	width: 100%;
	accent-color: #fff6e5;
}

input[type="color"] {
	width: 100%;
	height: 40px;
}

input[type="radio"] {
	accent-color: #fff6e5;
}

.radio-group {
	display: flex;
	gap: 15px;
}

button {
	width: 100%;
	padding: 10px;
	background: rgba(255, 255, 255, 0.2);
	border: none;
	color: white;
	border-radius: 4px;
	font-family: inherit;
	transition: background 0.2s ease, color 0.2s ease;

}

button:hover {
	background: rgba(255, 255, 255, 0.3);
}

button.active {
	background: rgba(255, 183, 161, 0.3);
	color: #ffd2b6;
}
</style>
