import { m4, } from "../twgl.full.module.js";

// Controla as transformações hierárquicas dos objetos
class MatrixStack {
  constructor() {
    this.matrices = [m4.identity()];
  }

  current() {
    return this.matrices[this.matrices.length - 1];
  }

  push(localMatrix = m4.identity()) {
    const combinedMatrix = m4.multiply(
      this.current(),
      localMatrix
    );

    this.matrices.push(combinedMatrix);

    return combinedMatrix;
  }

  pop() {
    if (this.matrices.length <= 1) {
      throw new Error("Não é possível remover a matriz inicial da pilha.");
    }

    return this.matrices.pop();
  }

  reset() {
    this.matrices = [m4.identity()];
  }
}

export { MatrixStack, };