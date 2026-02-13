import { state } from "./state";

export function renderTool(
	context: CanvasRenderingContext2D,
) {
	const currentToolPos = state.currentToolPos;
	const currentToolVel = state.currentToolVel;
	const targetToolPos = state.targetToolPos;

	if (currentToolPos && targetToolPos !== undefined) {
		context.save();
		context.translate(currentToolPos.x, currentToolPos.y);

		let angle = -Math.PI / 2;
		if (currentToolVel) {
			const speedSq = currentToolVel.x * currentToolVel.x + currentToolVel.y * currentToolVel.y;
			if (speedSq > 0.001) {
				angle = Math.atan2(currentToolVel.y, currentToolVel.x);
			}
		}
		context.rotate(angle);

		context.fillStyle = '#664b30ff';
		context.strokeStyle = '#412106ff';
		context.lineWidth = 1;

		const toolWidth = state.toolWidth;
		const toolLength = state.toolWidth / 3;

		context.fillRect(-toolLength / 2, -toolWidth / 2, toolLength, toolWidth);
		context.strokeRect(-toolLength / 2, -toolWidth / 2, toolLength, toolWidth);

		const handleLength = toolWidth * 2;
		const handleThickness = toolWidth * 0.15;
		context.fillRect(toolLength / 2, -handleThickness / 2, handleLength, handleThickness);
		context.strokeRect(toolLength / 2, -handleThickness / 2, handleLength, handleThickness);

		context.restore();
	}
}

export function renderPebbles(
	context: CanvasRenderingContext2D,
) {
	for (const p of state.pebbles) {
		context.save();
		context.translate(p.position.x, p.position.y);
		context.rotate(p.rotation);

		const shadowStrength = state.shadowStrength;
		context.shadowColor = `rgba(0, 0, 0, ${shadowStrength})`;
		context.shadowBlur = 10;
		context.shadowOffsetX = 5;
		context.shadowOffsetY = 5;

		context.beginPath();
		context.ellipse(0, 0, p.radius * 1.1, p.radius * 0.9, 0, 0, Math.PI * 2);

		const grad = context.createRadialGradient(
			-p.radius * 0.3, -p.radius * 0.3, p.radius * 0.1,
			0, 0, p.radius
		);
		grad.addColorStop(0, '#4d4d53ff');
		grad.addColorStop(1, '#1a1a1a');

		context.fillStyle = grad;
		context.fill();
		context.restore();
	}
}
