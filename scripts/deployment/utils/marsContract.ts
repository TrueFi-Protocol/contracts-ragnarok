import { ArtifactFrom } from 'ethereum-mars'
import { Contract } from 'ethereum-mars/build/src/syntax/contract'

export type MarsContract<T = any> = T extends ArtifactFrom<infer R> ? Contract<R> : never;
