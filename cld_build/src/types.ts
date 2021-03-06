export type UserConfig = {
  functionsRelativePath: string
  libsRelativePath: string
  functionFileName: string
  functionGroups: string[]
  libs: string[]
  functionGroupLibs: FunctionGroupLibs
  outputRelativePath: string
}

export type Config = UserConfig & {
  projectPath: string
  functionsAbsolutePath: string
  libsAbsolutePath: string
  outputAbsolutePath: string
}

export type FunctionMetadataDetail = {
  hash: string
  zipPath: string
}

export type EntityFunctionMetadata = { [functionName: string]: FunctionMetadataDetail }

export type FunctionMetadata = { [entityName: string]: EntityFunctionMetadata }

export type LibFile = Record<string, { hash: string }>

type LibFiles = {
  files: LibFile
}

export type LibMetadata = Record<string, LibFiles>

export type FunctionGroupLibs = { [functionGroup: string]: string[] }

export type Metadata = {
  functions: FunctionMetadata
  libs: LibMetadata
  functionGroupLibs: FunctionGroupLibs
}

export type MetadataKey = 'functions' | 'libs' | 'functionGroupLibs'
