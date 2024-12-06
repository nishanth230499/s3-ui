import { Upload } from '@aws-sdk/lib-storage'
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
} from '@aws-sdk/client-s3'
import fs, { createWriteStream } from 'fs'
import fsp from 'fs/promises'
import { pipeline } from 'stream/promises'
import archiver from 'archiver'

const clearFiles = async () => {
  if (fs.existsSync('/tmp/zip-files')) {
    try {
      await fsp.rm('/tmp/zip-files', { recursive: true, force: true })
    } catch (err) {
      console.error('Error while clearing tmp files: ', err)
      throw new Error('Error while clearing tmp files')
    }
  }
}

const checkAndCreateDir = async (dir) => {
  if (!fs.existsSync(dir)) {
    try {
      await fsp.mkdir(dir, { recursive: true })
    } catch (err) {
      console.error('Error while creating directories: ', err)
      throw new Error('Error while creating directories')
    }
  }
}

const listFiles = async (client, { bucket, prefixes, folder }) => {
  const parentFoldersLen = folder.split('/').length - 1
  const files = {}
  try {
    for (const prefix of prefixes) {
      const command = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
      })
      const response = await client.send(command)
      response.Contents.forEach((file) => {
        const { Key } = file
        if (file.Size !== 0 && Key.split('.').slice(-1)[0] !== 'zip') {
          files[Key] = file
          files[Key]['zipKey'] = Key.split('/')
            .slice(parentFoldersLen)
            .join('/')
        }
      })
    }
    return files
  } catch (err) {
    console.error('Error while listing files: ', err)
    throw new Error('Error while listing files')
  }
}

const downloadFiles = async (client, bucket, filesToZip) => {
  for (const key in filesToZip) {
    await checkAndCreateDir(tempFileName.split('/').slice(0, -1).join('/'))
    try {
      const params = {
        Bucket: bucket,
        Key: key,
      }
      const command = new GetObjectCommand(params)
      const response = await client.send(command)
      const tempFileName = '/tmp/zip-files/' + filesToZip[key]['zipKey']
      await pipeline(response.Body, createWriteStream(tempFileName))
    } catch (err) {
      console.error(
        'Error while downloading objects: ',
        filesToZip[key]['zipKey'],
        err
      )
      throw new Error(
        'Error while downloading objects: ',
        filesToZip[key]['zipKey']
      )
    }
  }
}

const zipFiles = async (zipFileName) => {
  try {
    const filesToZip = (await fsp.readdir('/tmp/zip-files')).filter(
      (file) => file.split('.').slice(-1)[0] !== 'zip'
    )

    const output = fs.createWriteStream('/tmp/zip-files/' + zipFileName)
    const archive = archiver('zip', {
      zlib: { level: 9 },
    })

    archive.on('error', (err) => {
      throw err
    })

    archive.pipe(output)

    for (const file of filesToZip) {
      const pathToFile = '/tmp/zip-files/' + file
      const stat = await fs.promises.stat(pathToFile)
      if (stat.isFile()) {
        archive.file(pathToFile, { name: file })
      } else if (stat.isDirectory()) {
        archive.directory(pathToFile, file)
      }
    }

    await archive.finalize()
  } catch (err) {
    console.error('Error while zipping files: ', err)
    throw new Error('Error while zipping files')
  }
}

const downloadAndZipFiles = async (
  client,
  filesToZip,
  { zipFileName, bucket }
) => {
  await checkAndCreateDir('/tmp/zip-files')
  try {
    const output = fs.createWriteStream('/tmp/zip-files/' + zipFileName)
    const archive = archiver('zip', { zlib: { level: 9 } })
    archive.on('error', (err) => {
      throw err
    })

    archive.pipe(output)

    const getPromises = []
    for (const key in filesToZip) {
      try {
        const params = {
          Bucket: bucket,
          Key: key,
        }
        getPromises.push(
          new Promise(async (resolve, reject) => {
            try {
              const command = new GetObjectCommand(params)
              const response = await client.send(command)
              archive.append(response.Body, { name: filesToZip[key].zipKey })
              resolve()
            } catch (error) {
              reject(error)
            }
          })
        )
      } catch (error) {
        console.error(`Error streaming file ${key}: ${JSON.stringify(error)}`)
        throw error
      }
    }
    await Promise.all(getPromises)

    await archive.finalize()
  } catch (err) {
    console.error('Error while downloading or zipping files: ', err)
    throw new Error('Error while downloading or zipping files')
  }
}

const uploadZipFile = async (client, { zipFileName, bucket, folder }) => {
  try {
    const fileStream = fs.createReadStream('/tmp/zip-files/' + zipFileName)
    const uploadToS3 = new Upload({
      client,
      queueSize: 4,
      partSize: 1024 * 1024 * 5,
      leavePartsOnError: false,
      params: {
        Bucket: bucket,
        Key: folder + zipFileName,
        Body: fileStream,
        StorageClass: 'GLACIER_IR',
        Tagging: 'zipBy=s3-ui',
      },
    })

    await uploadToS3.done()
  } catch (err) {
    console.error('Error while uploading zip file: ', err)
    throw new Error('Error while uploading zip file')
  }
}

export const handler = async (event) => {
  try {
    const { region } = event
    const s3_client_params = {
      endpoint: 'https://s3.amazonaws.com',
      region,
      signatureVersion: 'v4',
    }
    const client = new S3Client(s3_client_params)

    await clearFiles()
    const filesToZip = await listFiles(client, event)
    // await downloadFiles(client, bucket, filesToZip)
    // await zipFiles(zipFileName)
    await downloadAndZipFiles(client, filesToZip, event)
    await uploadZipFile(client, event)
    await clearFiles()

    const response = {
      statusCode: 200,
      body: JSON.stringify('Files zipped!'),
    }
    return response
  } catch (err) {
    console.error(err)
    const response = {
      statusCode: 500,
      body: JSON.stringify({ message: 'Zip Failed!', error: err }),
    }
    return response
  }
}
