export interface ArchNode {
  type: string
  id?: ArchNode
  name?: string
  value?: string
  kind?: string
  source?: ArchNode
  declaration?: ArchNode
  declarations?: ArchNode[]
  init?: ArchNode
  params?: ArchNode[]
  typeAnnotation?: ArchNode
  returnType?: ArchNode
  callee?: ArchNode
  object?: ArchNode
  property?: ArchNode
  key?: ArchNode
  body?: ArchNode[]
  computed?: boolean
}

export interface ArchFileInfo {
  absolutePath: string
  relativePath: string
  source: string
  program: ArchNode
}

export interface ArchDeclaration {
  file: ArchFileInfo
  node: ArchNode
  name: string
  params?: ArchNode[]
  returnType?: ArchNode
}

export type ArchFunctionDeclaration = ArchDeclaration & {
  params: ArchNode[]
  returnType?: ArchNode
}

export interface ArchMatchFileNameOptions {
  file: string
  function: string
  type: string
  value?: string | string[]
}
