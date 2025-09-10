import { Entity } from '../entities/Entity';

export class RenderSystem {
  private context: CanvasRenderingContext2D;

  constructor(context: CanvasRenderingContext2D) {
    this.context = context;
  }

  render(entities: Entity[]): void {
    // Sort entities by render order if needed (e.g., by y-position for depth)
    const sortedEntities = [...entities].sort((_a, _b) => {
      // For now, just render in the order they come
      return 0;
    });

    // Render each entity
    for (const entity of sortedEntities) {
      if (entity.isActive()) {
        this.context.save();
        entity.render(this.context);
        this.context.restore();
      }
    }
  }

  // Utility methods for common rendering operations
  drawRect(x: number, y: number, width: number, height: number, color: string): void {
    this.context.fillStyle = color;
    this.context.fillRect(x, y, width, height);
  }

  drawCircle(x: number, y: number, radius: number, color: string): void {
    this.context.fillStyle = color;
    this.context.beginPath();
    this.context.arc(x, y, radius, 0, Math.PI * 2);
    this.context.fill();
  }

  drawText(text: string, x: number, y: number, color: string = '#ffffff', font: string = '16px Arial'): void {
    this.context.fillStyle = color;
    this.context.font = font;
    this.context.fillText(text, x, y);
  }

  drawLine(x1: number, y1: number, x2: number, y2: number, color: string = '#ffffff', width: number = 1): void {
    this.context.strokeStyle = color;
    this.context.lineWidth = width;
    this.context.beginPath();
    this.context.moveTo(x1, y1);
    this.context.lineTo(x2, y2);
    this.context.stroke();
  }
}