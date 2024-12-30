// import { ts } from "ts-morph";
import * as ts from "typescript";

export function createTypeCheckFn(
  typeChecker: ts.TypeChecker,
  sourceFile: ts.SourceFile,
  expression: string,
): () => string {
  const node = findPropertyAccessExpressionNode(sourceFile, expression);
  if (node === undefined || !ts.isPropertyAccessExpression(node)) {
    throw new Error("Node not found");
  }

  const symbol = typeChecker.getSymbolAtLocation(node.name);
  if (symbol === undefined) {
    throw new Error("Symbol not found");
  }

  return () => {
    const type = typeChecker.getTypeOfSymbolAtLocation(symbol, node);
    return `${type}`;
  };
}

function findPropertyAccessExpressionNode(
  root: ts.SourceFile | ts.Node,
  expression: string,
): ts.Node | undefined {
  return ts.forEachChild(root, (node) => {
    // console.log(node.getText());
    if (
      ts.isPropertyAccessExpression(node) &&
      node.getText() === expression
    ) {
      return node;
    }

    return ts.forEachChild(
      node,
      (childNode) => findPropertyAccessExpressionNode(childNode, expression),
    );
  });
}
