import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb'

class ZipProgress {
  constructor(tableName, folder, zipFileName) {
    this.client = new DynamoDBClient({})
    this.docClient = DynamoDBDocumentClient.from(this.client)
    this.tableName = tableName
    this.folder = folder
    this.zipFileName = zipFileName
  }

  isActive(item) {
    return (
      item.progress !== 'Finalized' &&
      item.progress !== 'Failed' &&
      new Date() - new Date(item.createdAt) < 16 * 60 * 1000
    )
  }

  async checkAndProgress() {
    try {
      const getCommand = new GetCommand({
        TableName: this.tableName,
        Key: {
          folder: '/' + this.folder,
          zipFileName: this.zipFileName,
        },
      })

      const { Item } = await this.docClient.send(getCommand)
      if (Item) {
        if (this.isActive(Item)) {
          return false
        } else {
          const updateCommand = new UpdateCommand({
            TableName: this.tableName,
            Key: {
              folder: '/' + this.folder,
              zipFileName: this.zipFileName,
            },
            UpdateExpression:
              'set createdAt = :currentTime, updatedAt = :currentTime, progress = :progress',
            ExpressionAttributeValues: {
              ':currentTime': new Date().toISOString(),
              ':progress': 'Initialized',
            },
          })
          await this.docClient.send(updateCommand)
          return true
        }
      } else {
        const currentTime = new Date().toISOString()
        const putCommand = new PutCommand({
          TableName: this.tableName,
          Item: {
            folder: '/' + this.folder,
            zipFileName: this.zipFileName,
            createdAt: currentTime,
            updatedAt: currentTime,
            progress: 'Initialized',
          },
        })
        await this.docClient.send(putCommand)
        return true
      }
    } catch (err) {
      console.error('Error while checking dynamo db item: ', err)
      throw new Error('Error while checking dynamo db item')
    }
  }

  async log(progress) {
    const updateCommand = new UpdateCommand({
      TableName: this.tableName,
      Key: {
        folder: '/' + this.folder,
        zipFileName: this.zipFileName,
      },
      UpdateExpression: 'set progress = :progress, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':progress': progress,
        ':updatedAt': new Date().toISOString(),
      },
    })
    await this.docClient.send(updateCommand)
  }
}

export default ZipProgress
