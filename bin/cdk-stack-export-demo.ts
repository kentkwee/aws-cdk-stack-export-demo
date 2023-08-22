#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { CdkTableStack } from "../lib/CdkTableStack";
import { CdkMonitoringStack } from "../lib/CdkMonitoringStack";
import { KeepUsedStackExports } from "../lib/aspects/KeepUsedStackExports";

const app = new cdk.App();
const { table, otherTable } = new CdkTableStack(app, "CdkTableStack");
new CdkMonitoringStack(app, "CdkMonitoringStack", table, otherTable);

// keep at the end of this file
KeepUsedStackExports.of(app);
