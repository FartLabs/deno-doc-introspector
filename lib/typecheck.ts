import * as ts from "typescript";

export function createTypeCheckFn(
  typeChecker: ts.TypeChecker,
  sourceFile: ts.SourceFile,
  expression: string,
): () => void {
  const node = findPropertyAccessExpressionNode(sourceFile, expression);
  if (node === undefined || !ts.isPropertyAccessExpression(node)) {
    throw new Error("Node not found");
  }

  const symbol = typeChecker.getSymbolAtLocation(node.name);
  if (symbol === undefined) {
    throw new Error("Symbol not found");
  }

  return () => {
    typeChecker.getTypeOfSymbolAtLocation(symbol, node);
  };
}

function findPropertyAccessExpressionNode(
  root: ts.SourceFile | ts.Node,
  expression: string,
): ts.Node | undefined {
  return ts.forEachChild(root, (node) => {
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
