import dotenv from 'dotenv'
import { deploy } from 'ethereum-mars'
import { deployRagnarok } from './deployRagnarok'

dotenv.config({
  path: `${__dirname}/.env`,
})

deploy({ verify: true }, deployRagnarok)
