import {
  StageOperatorFn,
  AccumulatorFn,
  ExpressionFn,
  RegisteredOperator,
} from "../../config/Interfaces/Operation/aggregation.interface";

export class OperatorRegistry {
  private static operators: Map<string, RegisteredOperator> = new Map();

  static registerStageOperator(name: string, fn: StageOperatorFn): void {
    if (!name.startsWith("$")) throw new Error(`Operator name must start with "$", got: "${name}"`);
    OperatorRegistry.operators.set(name, { type: "stage", name, fn });
  }

  static registerAccumulator(name: string, fn: AccumulatorFn): void {
    if (!name.startsWith("$")) throw new Error(`Operator name must start with "$", got: "${name}"`);
    OperatorRegistry.operators.set(name, { type: "accumulator", name, fn });
  }

  static registerExpressionOperator(name: string, fn: ExpressionFn): void {
    if (!name.startsWith("$")) throw new Error(`Operator name must start with "$", got: "${name}"`);
    OperatorRegistry.operators.set(name, { type: "expression", name, fn });
  }

  static getOperator(name: string): RegisteredOperator | undefined {
    return OperatorRegistry.operators.get(name);
  }

  static getAllByType(type: "stage" | "accumulator" | "expression"): RegisteredOperator[] {
    return [...OperatorRegistry.operators.values()].filter(op => op.type === type);
  }

  static getRegisteredNames(): string[] {
    return [...OperatorRegistry.operators.keys()];
  }

  static clearAll(): void {
    OperatorRegistry.operators.clear();
  }
}
