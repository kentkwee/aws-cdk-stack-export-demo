import { CloudFormationStackArtifact } from "aws-cdk-lib/cx-api";
import {
  CloudFormationClient,
  DescribeStacksCommand,
  ListImportsCommand,
} from "@aws-sdk/client-cloudformation";

const client = new CloudFormationClient();

export interface Output {
  OutputKey: string;
  OutputValue: string;
  Description?: string;
  ExportName: string;
}

export interface RemovedStackExport {
  stackId: string;
  neededExports: {
    output: Output;
    imports: string[];
  }[];
  dirty: boolean;
}

async function getImports(exportName: string) {
  try {
    const result = await client.send(
      new ListImportsCommand({
        ExportName: exportName,
      }),
    );
    return result.Imports ?? [];
  } catch (e: unknown) {
    if (!(e as Error)?.message?.includes("is not imported")) {
      console.warn("List Imports", e);
    }
    return [];
  }
}

export async function getNeededExports(stack: CloudFormationStackArtifact) {
  try {
    const result = await client.send(
      new DescribeStacksCommand({ StackName: stack.stackName }),
    );
    const newExports: string[] = Object.values<{ Export?: { Name?: string } }>(
      stack.template.Outputs ?? {},
    )
      .map((output) => output?.Export?.Name ?? "")
      .filter((v) => !!v);

    const dirty = !!result.Stacks?.[0]?.Outputs?.some(
      (output) => output.Description?.startsWith("Still needed by "),
    );
    const removedExports =
      result.Stacks?.[0]?.Outputs?.filter(
        (output: Partial<Output>): output is Output =>
          !!output.OutputKey?.startsWith("ExportsOutput") &&
          !!output.ExportName && !!output.OutputValue &&
          !newExports.includes(output.ExportName),
      ) ?? [];

    const neededExports = await Promise.all(
      removedExports.map(async (output) => {
        const result = await getImports(output.ExportName);
        return {
          output,
          imports: result ?? [],
        };
      }),
    );
    return { stackId: stack.id, neededExports, dirty };
  } catch (e: unknown) {
    if (!(e as Error)?.message?.includes("does not exist")) {
      console.warn("Describe Stack", e);
    }
    return {
      stackId: stack.id,
      neededExports: [],
      dirty: false,
    };
  }
}
