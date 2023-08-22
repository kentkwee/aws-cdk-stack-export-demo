import { Stack } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";

export class CdkMonitoringStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    table: dynamodb.ITable,
    otherTable: dynamodb.ITable,
  ) {
    super(scope, id);

    new cloudwatch.Alarm(this, "Alarm", {
      metric: table.metricThrottledRequestsForOperations({
        operations: [dynamodb.Operation.PUT_ITEM],
      }),
      evaluationPeriods: 1,
      threshold: 1,
    });

    new cloudwatch.Alarm(this, 'OtherAlarm', {
      metric: otherTable.metricThrottledRequestsForOperations({
        operations: [dynamodb.Operation.PUT_ITEM],
      }),
      evaluationPeriods: 1,
      threshold: 1,
    });
  }
}
