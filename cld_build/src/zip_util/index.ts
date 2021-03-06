import * as fs from 'fs'
import * as path from 'path'
import * as Bluebird from 'bluebird'
import * as archiver from 'archiver'
import { getFilePaths } from 'cld_build/util'
import { makeDirRecursive } from 'cld_build/util'
import * as rimraf from 'rimraf'
import { Config } from 'cld_build/types'

export async function zipFunctions(config: Config) {
  const { functionsAbsolutePath, functionFileName } = config
  const functionPaths = await getFilePaths(functionsAbsolutePath, /\.js$/)
  const zippedFunctions: string[] = []
  await Bluebird.each(functionPaths, async (functionPath) => {
    const archive = archiver('zip')
    const dirPath = buildDirPath(config, functionPath)
    await makeDirRecursive(dirPath)
    const output = fs.createWriteStream(path.join(dirPath, '/function.zip'))
    archive.pipe(output)
    archive.append(fs.createReadStream(functionPath), { name: functionFileName })
    await archive.finalize()
    zippedFunctions.push(functionPath)
  })
  return zippedFunctions
}

function buildDirPath(config: Config, functionPath: string) {
  const { projectPath, functionsRelativePath, functionFileName, outputRelativePath } = config
  const relativeDirPath = functionPath
    .replace(functionsRelativePath, '')
    .replace(projectPath, path.join(outputRelativePath, 'functions'))
    .replace(functionFileName, '')
  return path.join(projectPath, relativeDirPath)
}

export async function zipLibs(config: Config) {
  const { libs } = config
  await Bluebird.each(libs, async (lib) => {
    await zipLib(config, lib)
  })
}

async function zipLib(config: Config, lib: string) {
  const { outputAbsolutePath } = config
  const archive = archiver('zip')
  const dirPath = path.join(outputAbsolutePath, 'libs', lib)
  const output = fs.createWriteStream(path.join(dirPath, 'nodejs.zip'))
  archive.pipe(output)
  archive.directory(path.join(outputAbsolutePath, 'libs', lib, 'nodejs'), 'nodejs')
  await archive.finalize()
  await new Promise((resolve) =>
    rimraf(path.join(outputAbsolutePath, 'libs', lib, 'nodejs'), resolve),
  )
}
