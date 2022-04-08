import * as aws from 'aws-sdk'
import { PROD_BUCKET } from '../constants'
import { ChangesSummary, LayerVersions, Metadata, FunctionMetadata } from '../types'

export async function publishLayerVersions(
  lambda: aws.Lambda,
  changesSummary: ChangesSummary,
  metadata: Metadata,
): Promise<LayerVersions> {
  const layerVersions: LayerVersions = {}
  const libsMetadata = metadata.libs
  for await (const libName of changesSummary) {
    const s3Version = libsMetadata[libName].s3Version
    const params = {
      LayerName: `api_${libName}`,
      Content: {
        S3Bucket: PROD_BUCKET,
        S3Key: `libs/${libName}/nodejs.zip`,
        S3ObjectVersion: s3Version,
      },
      CompatibleRuntimes: ['nodejs14.x'],
    }
    console.log('publish layer version params: ', params)
    const { Version } = await lambda.publishLayerVersion(params).promise()
    if (!Version) {
      throw new Error('Missing layer version for layer: api_' + libName)
    }
    layerVersions[libName] = Version
  }
  return layerVersions
}

export async function updateFunctionsLayers(
  lambda: aws.Lambda,
  changesSummary: ChangesSummary,
  metadata: Metadata,
) {
  const libsMetadata = metadata.libs
  const functionsMetadata = metadata.functions
  const functionGroupLibs = metadata.functionGroupLibs

  for await (const functionGroup of Object.keys(functionGroupLibs || {})) {
    const functionNames = functionsMetadata[functionGroup]
    for await (const partialFunctionName of Object.keys(functionNames)) {
      const functionName = `api_${functionGroup}_${partialFunctionName}`
      const libNames = functionGroupLibs[functionGroup].filter((libName) =>
        changesSummary.includes(libName),
      )
      for await (const libName of libNames) {
        const layerVersion = libsMetadata[libName].layerVersion
        const layerVersionArn = buildLayerVersionArn(libName, layerVersion)
        const updateLayerVersionParams = { FunctionName: functionName, Layers: [layerVersionArn] }
        console.log('updateLayerVersionParams: ', JSON.stringify(updateLayerVersionParams, null, 2))
        await lambda.updateFunctionConfiguration(updateLayerVersionParams).promise()
      }
    }
  }
}

function buildLayerVersionArn(libName: string, layerVersion: number) {
  const account = process.env.CDK_DEFAULT_ACCOUNT
  return `arn:aws:lambda:us-west-1:${account}:layer:api_${libName}:${layerVersion}`
}
