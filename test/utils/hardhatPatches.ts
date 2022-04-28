import { waffle } from 'hardhat'

const init = (waffle.provider as any)._hardhatNetwork.provider._wrapped._wrapped._wrapped._init

function patchSkipGasCostCheck() {
  const originalProcess = (waffle.provider as any)._hardhatNetwork.provider._wrapped._wrapped._wrapped._ethModule.processRequest.bind(
    (waffle.provider as any)._hardhatNetwork.provider._wrapped._wrapped._wrapped._ethModule,
  )
  ;(waffle.provider as any)._hardhatNetwork.provider._wrapped._wrapped._wrapped._ethModule.processRequest = (
    method: string,
    params: any[],
  ) => {
    if (method === 'eth_estimateGas') {
      return '0xB71B00'
    } else {
      return originalProcess(method, params)
    }
  }
}

(waffle.provider as any)._hardhatNetwork.provider._wrapped._wrapped._wrapped._init = async function () {
  await init.apply(this)
  if ((waffle.provider as any)._hardhatNetwork.provider._wrapped._wrapped._wrapped._node._vmTracer._vm.listenerCount('beforeMessage') < 2) {
    patchSkipGasCostCheck()
  }
}
