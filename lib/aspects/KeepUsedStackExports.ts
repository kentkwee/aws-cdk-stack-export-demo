import { App, Aspects, CfnOutput, IAspect, Stack } from "aws-cdk-lib";
import { IConstruct } from "constructs";
import {
  getNeededExports,
  type RemovedStackExport,
} from "./cloudformationHelper";

export class KeepUsedStackExports implements IAspect {
  constructor(private removedStackExports: RemovedStackExport[]) {}
  visit(node: IConstruct): void {
    if (node instanceof Stack) {
      const exportsToAdd = this.removedStackExports.find(
        (v) => v.stackId === node.stackName,
      )?.neededExports;
      if (exportsToAdd?.length) {
        exportsToAdd.forEach((neededExport) => {
          if (neededExport.imports.length) {
            new CfnOutput(node, neededExport.output.OutputKey, {
              exportName: neededExport.output.ExportName,
              value: neededExport.output.OutputValue,
              description: `Still needed by ${neededExport.imports.join(", ")}`,
            });
            console.log(
              `Adding export ${
                neededExport.output.ExportName
              } because of ${neededExport.imports.join(", ")}`,
            );
          }
        });
      }
    }
  }

  static async addNecessaryExports(app: App) {
    console.log("Looking for exports still being in use");
    const assembly = app.synth();
    const removedStackExports: RemovedStackExport[] = await Promise.all(
      assembly.stacksRecursively.map((stack) => getNeededExports(stack)),
    );
    const changeNeeded = removedStackExports.some((v) =>
      v.neededExports.some((output) => output.imports.length > 0),
    );
    const dirty = removedStackExports.some((v) => v.dirty);
    if (changeNeeded) {
      console.log("Still used exports found. Adding them.");
      Aspects.of(app).add(new KeepUsedStackExports(removedStackExports));
      app.synth({ force: true });
    } else if (dirty) {
      console.log(
        "There are still automatically added exports from a previous deployment.",
      );
    }
  }

  static of(app: App): void {
    KeepUsedStackExports.addNecessaryExports(app).then(() =>
      console.log("Done"),
    );
  }
}
