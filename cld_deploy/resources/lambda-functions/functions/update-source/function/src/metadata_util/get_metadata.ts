import * as aws from 'aws-sdk'
import { Metadata } from '../types'
import { METADATA_FILE_NAME, PROD_BUCKET, STAGE_BUCKET } from "../constants";

export async function getFunctionsMetadata(s3: aws.S3): Promise<{
  stageMetadata: Metadata
  prodMetadata: Metadata
}> {
  const stageMetadata = await getMetadata(s3, STAGE_BUCKET)
  if (!stageMetadata) {
    throw new Error('The stage metadata was not found!')
  }
  const prodMetadata = (await getMetadata(s3, PROD_BUCKET)) || { functions: {} }
  console.log('stageMetadata: ', JSON.stringify(stageMetadata, null, 2))
  console.log('prodMetadata: ', JSON.stringify(prodMetadata, null, 2))
  return { stageMetadata, prodMetadata }
}

async function getMetadata(s3: aws.S3, bucket: string): Promise<Metadata | null> {
  try {
    const metadataFile = await s3
      .getObject({ Bucket: bucket, Key: METADATA_FILE_NAME })
      .promise()
    return JSON.parse(metadataFile.Body?.toString() ?? '{}')
  } catch (err: any) {
    if (err.code === 'NoSuchKey') {
      return null
    }
    throw err
  }
}
