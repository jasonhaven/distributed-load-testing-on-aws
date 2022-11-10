// Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import '@aws-cdk/assert/jest';
import { SynthUtils } from '@aws-cdk/assert';
import { Stack } from 'aws-cdk-lib';
import { TestRunnerLambdasConstruct } from '../lib/back-end/test-task-lambdas';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Effect, Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { LogGroup } from 'aws-cdk-lib/aws-logs';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';

test('DLT Task Lambda Test', () => {
  const stack = new Stack();

  const testDBPolicy = new Policy(stack, 'TestDynamoDBPolicy', {
    statements: [new PolicyStatement({
      effect: Effect.DENY,
      actions: ['dynamodb:*'],
      resources: ['*']
    })]
  });

  const testS3Policy = new Policy(stack, 'TestS3Policy', {
    statements: [new PolicyStatement({
      effect: Effect.DENY,
      actions: ['s3:*'],
      resources: ['*']
    })]
  });

  const testPolicy = new Policy(stack, 'TestPolicy', {
    statements: [
      new PolicyStatement({
        resources: ['*'],
        actions: ['cloudwatch:Get*']
      })
    ]
  });

  const testLogGroup = new LogGroup(stack, 'TestLogsGroup');

  const testBucket = Bucket.fromBucketName(stack, 'SourceCodeBucket', 'testbucket');
  const testTable = new Table(stack, 'TestTable', {
    partitionKey: {
      name: 'id', type: AttributeType.STRING
    }
  });

  const testFunctions = new TestRunnerLambdasConstruct(stack, 'TaskRunnerLambdaFunctions', {
    cloudWatchLogsPolicy: testPolicy,
    scenariosDynamoDbPolicy: testDBPolicy,
    ecsTaskExecutionRoleArn: 'arn:aws:iam:us-east-1:111122223333:roleArn',
    ecsCloudWatchLogGroup: testLogGroup,
    ecsCluster: 'testCluster',
    ecsTaskDefinition: 'testTaskDefinition',
    ecsTaskSecurityGroup: 'testSecurityGroup',
    historyTable: testTable,
    historyDynamoDbPolicy: testDBPolicy,
    scenariosS3Policy: testS3Policy,
    subnetA: 'testSubnetA',
    subnetB: 'testSubnetB',
    metricsUrl: 'test.example.net',
    sendAnonymousUsage: 'No',
    solutionId: 'testId',
    solutionVersion: 'testVersion',
    sourceCodeBucket: testBucket,
    sourceCodePrefix: 'testPrefix',
    scenariosBucket: 'testBucket',
    scenariosTable: testTable,
    uuid: 'testId'
  });

  expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot();

  expect(stack).toHaveResourceLike("AWS::IAM::Policy", {
    PolicyDocument: {
      Statement: [
        {
          Action: "cloudwatch:GetMetricWidgetImage",
          Effect: "Allow",
          Resource: "*",
        },
      ],
      "Version": "2012-10-17",
    },
    Roles: [
      {
        Ref: "TaskRunnerLambdaFunctionsLambdaResultsRole1AF5AB18",
      },
    ]
  });

  expect(stack).toHaveResourceLike("AWS::Lambda::Function", {
    Code: {
      S3Bucket: "testbucket",
      S3Key: "testPrefix/results-parser.zip",
    },
    Environment: {
      Variables: {
        METRIC_URL: "test.example.net",
        SCENARIOS_BUCKET: "testBucket",
        SCENARIOS_TABLE: {
          Ref: "TestTable5769773A",
        },
        SEND_METRIC: "No",
        SOLUTION_ID: "testId",
        UUID: "testId",
        VERSION: "testVersion",
      },
    },
    Handler: "index.handler",
    Role: {
      "Fn::GetAtt": [
        "TaskRunnerLambdaFunctionsLambdaResultsRole1AF5AB18",
        "Arn",
      ],
    },
    Runtime: "nodejs14.x",
    Timeout: 120,
  });

  expect(stack).toHaveResourceLike("AWS::IAM::Policy", {
    PolicyDocument: {
      Statement: [
        {
          Action: "dynamodb:*",
          Effect: "Deny",
          Resource: "*",
        },
      ],
      Version: "2012-10-17",
    },
    PolicyName: "TestDynamoDBPolicy7AA7B6CD",
    Roles: [
      {
        Ref: "TaskRunnerLambdaFunctionsLambdaResultsRole1AF5AB18",
      },
      {
        Ref: "TaskRunnerLambdaFunctionsDLTTestLambdaTaskRoleCB13DE78",
      },
      {
        Ref: "TaskRunnerLambdaFunctionsTaskStatusRole4B498DE5",
      },
    ]
  });

  expect(stack).toHaveResourceLike("AWS::IAM::Policy", {
    PolicyDocument: {
      Statement: [
        {
          Action: "cloudwatch:GetMetricWidgetImage",
          Effect: "Allow",
          Resource: "*",
        },
      ],
      Version: "2012-10-17",
    },
    Roles: [
      {
        "Ref": "TaskRunnerLambdaFunctionsLambdaResultsRole1AF5AB18",
      },
    ]
  });

  expect(stack).toHaveResourceLike("AWS::IAM::Role", {
    Policies: [
      {
        PolicyDocument: {
          Statement: [
            {
              Action: "ecs:ListTasks",
              Effect: "Allow",
              Resource: "*",
            },
            {
              Action: "ecs:StopTask",
              Effect: "Allow",
              Resource: [
                {
                  "Fn::Join": [
                    "",
                    [
                      "arn:",
                      {
                        Ref: "AWS::Partition",
                      },
                      ":ecs:",
                      {
                        Ref: "AWS::Region",
                      },
                      ":",
                      {
                        Ref: "AWS::AccountId",
                      },
                      ":task/*",
                    ],
                  ],
                },
                {
                  "Fn::Join": [
                    "",
                    [
                      "arn:",
                      {
                        Ref: "AWS::Partition",
                      },
                      ":ecs:",
                      {
                        Ref: "AWS::Region",
                      },
                      ":",
                      {
                        Ref: "AWS::AccountId",
                      },
                      ":task-definition/*:*",
                    ],
                  ],
                },
              ],
            },
            {
              Action: "dynamodb:UpdateItem",
              Effect: "Allow",
              Resource: {
                "Fn::GetAtt": [
                  "TestTable5769773A",
                  "Arn",
                ],
              },
            },
          ],
          Version: "2012-10-17",
        },
        PolicyName: "TaskCancelerPolicy",
      },
    ]
  });

  expect(stack).toHaveResourceLike("AWS::IAM::Role", {
    Policies: [
      {
        PolicyDocument: {
          Statement: [
            {
              Action: "ecs:ListTasks",
              Effect: "Allow",
              Resource: "*",
            },
            {
              Action: "ecs:DescribeTasks",
              Effect: "Allow",
              Resource: {
                "Fn::Join": [
                  "",
                  [
                    "arn:",
                    {
                      Ref: "AWS::Partition",
                    },
                    ":ecs:",
                    {
                      Ref: "AWS::Region",
                    },
                    ":",
                    {
                      Ref: "AWS::AccountId",
                    },
                    ":task/*",
                  ],
                ],
              },
            },
          ],
          Version: "2012-10-17",
        },
        PolicyName: "TaskStatusPolicy",
      },
    ]
  });

  expect(testFunctions.resultsParser).toBeDefined();
  expect(testFunctions.taskRunner).toBeDefined();
  expect(testFunctions.taskCanceler).toBeDefined();
  expect(testFunctions.taskCancelerInvokePolicy).toBeDefined();
  expect(testFunctions.taskStatusChecker).toBeDefined();
});