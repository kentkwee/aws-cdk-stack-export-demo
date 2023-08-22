import { RemovalPolicy, Stack, StackProps, } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';

export class CdkTableStack extends Stack {
  // queue;
  table;
  otherTable;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const table = new Table(this, 'MyTable', {
      partitionKey: {name: 'id', type: AttributeType.STRING},
      removalPolicy: RemovalPolicy.DESTROY,
    });
    const otherTable = new Table(this, 'MyOtherTable', {
      partitionKey: {name: 'id', type: AttributeType.STRING},
      removalPolicy: RemovalPolicy.DESTROY,
    });
    this.table = table;
    this.otherTable = otherTable;
    // this.exportValue(otherTable.tableName);
  }
}
