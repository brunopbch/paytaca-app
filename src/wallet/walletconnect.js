import WalletConnect from '@walletconnect/client'
// import { ethers } from 'ethers'

// TODO: refactor
export function getPreviousConnector () {
  const wcInfoString = localStorage.getItem('walletconnect')
  if (!wcInfoString) return
  const wcInfo = JSON.parse(wcInfoString)
  return new WalletConnect(wcInfo)
}

export function createConnector (uri) {
  // Create connector
  const connector = new WalletConnect(
    {
      // Required
      uri: uri,
      // Required
      clientMeta: {
        description: 'Paytaca App',
        url: 'https://paytaca.com',
        icons: ['https://walletconnect.org/walletconnect-logo.png'],
        name: 'Paytaca'
      }
    }
  )

  return connector
}

/**
 * @param {WalletConnect} connector 
 * @returns {Promise<{ error?: Error, payload: any}>}
 */
export function waitSessionRequest(connector) {
  const promise = new Promise((resolve, reject) => {
    connector.on('session_request', (error, payload) => {
      connector.off('session_request')
      const response = {error, payload}
      resolve(response)
    })
    setTimeout(() => reject(new Error('Timeout')), 60 * 1000)
  })
}

/**
  * @param {object}         payload a JSON-RPC request
  * @param {ethers.Wallet}  wallet  a Wallet instance
*/
export async function callRequestHandler (connector, payload, wallet) {
  let result = null
  let error = null
  try {
    switch (payload.method) {
      case ('personal_sign'):
      case ('eth_sign'):
        // eslint-disable-next-line no-case-declarations
        const signedMessage = await wallet.signMessage(payload.params[0])
        result = signedMessage
        break
      case ('eth_signTypedData'):
        // eslint-disable-next-line no-case-declarations
        const parsedSignTypedDataParams = JSON.parse(payload.params[1])
        if (parsedSignTypedDataParams.types.EIP712Domain) delete parsedSignTypedDataParams.types.EIP712Domain
        // eslint-disable-next-line no-case-declarations
        const signedTypedData = await wallet._signTypedData(
          parsedSignTypedDataParams.domain,
          parsedSignTypedDataParams.types,
          parsedSignTypedDataParams.message
        )
        result = signedTypedData
        break
      case ('eth_sendTransaction'):
        // eslint-disable-next-line no-case-declarations
        const tx = await wallet.sendTransaction(serializeTransactionRequest(payload.params[0]))
        result = tx.hash
        break
      case ('eth_signTransaction'):
        // eslint-disable-next-line no-case-declarations
        const signedTx = await wallet.signTransaction(serializeTransactionRequest(payload.params[0]))
        result = signedTx
        break
      default:
        error = { message: 'Unknown method' }
    }
  } catch (err) {
    error = err
  }

  const response = {
    success: false,
    requestPayload: payload
  }

  if (result !== null) {
    response.success = true
    response.result = result
    connector.approveRequest({ id: payload.id, jsonrpc: payload.jsonrpc, result: result })
  } else {
    response.success = false
    response.error = error
    connector.rejectRequest({ id: payload.id, jsonrpc: payload.jsonrpc, error: error })
  }

  return response
}

function serializeTransactionRequest (payload) {
  if (!payload) return payload
  const data = {
    from: payload.from,
    to: payload.to,
    value: payload.value,
    data: payload.data,
    gasLimit: payload.gas,
    gasPrice: payload.gasPrice,
    nonce: payload.nonce
  }

  return data
}

export function isValidWalletConnectUri (uri) {
  if (!uri) return false

  return /wc:[0-9a-f-]*@\d*\?(bridge=.*|key=[0-9a-f]*)/i.test(uri)
}

export function parseWalletConnectUri (uri) {
  if (!uri) return

  const data = {
    uri: uri,
    handshakeTopic: '',
    version: '',
    bridge: '',
    key: '',

    // WalletConnect v2 related
    relayProtocol: '',
    symKey: '',
  }

  const matchV1 = String(uri).match(/^wc:([0-9a-f-]{36})@(\d*)(\?(bridge=.*)|(key=[0-9a-f]*))?$/i)
  const matchV2 = String(uri).match(/^wc:([0-9a-fA-F]{64})@(\d+)\?([a-zA-Z0-9\-._~%!$&'()*+,;=:@/?=&]*)$/i)
  const match = matchV1 || matchV2

  if (!match) return

  const url = new URL(uri)
  data.handshakeTopic = match[1]
  data.version = match[2]
  data.relayProtocol = url.searchParams.get('relay-protocol')
  data.symKey = url.searchParams.get('symKey')
  data.bridge = url.searchParams.get('bridge')
  data.key = url.searchParams.get('key')

  return data
}
window.test = parseWalletConnectUri

export class WalletConnectManager {
  // store is the vuex instance of the app
  constructor (store, connector) {
    this.store = store
    this._listeners = {}
    this._subscribedListeners = []

    if (connector) this.connector
    else this.connector = getPreviousConnector()
  }

  get connector () {
    return this._connector
  }

  /**
   * @param {WalletConnect} value
  */
  set connector (value) {
    // remove previous connector's event emmiters before updating
    if (this._connector) this._disconnectConnectorEvents()
    this._connector = value
    if (this._connector) this._attachEventsToConnector()
  }

  _attachEventsToConnector () {
    if (!this.connector) return
    this._attachEventToConnector('session_request')
    this._attachEventToConnector('call_request')
    this._attachEventToConnector('disconnect')
  }

  _attachEventToConnector (eventName) {
    if (!this.connector) return
    const _eventName = String(eventName)
    if (this._isSubscribedTo(_eventName)) return

    const callback = (error, payload) => {
      this._connectorEventHandler(_eventName, error, payload)
    }
    this.connector.on(_eventName, callback)
    this._listeners[_eventName] = callback
  }

  _isSubscribedTo (eventName = '') {
    if (!this.connector) return false

    const listener = this._listeners[eventName]
    if (!listener) return false

    if (!Array.isArray(this.connector?._eventManager?._eventEmmiters)) return false
    return this.connector._eventManager._eventEmmiters.some(eventEmmiter => eventEmmiter?.callback === listener)
  }

  _connectorEventHandler (eventName, error, payload) {
    if (eventName === 'call_request' && payload) {
      this.store.commit('walletconnect/addCallRequest', {
        timestamp: Date.now(),
        payload: payload
      })
    } else if (eventName === 'disconnect' && !error) {
      this.store.commit('walletconnect/clearCallRequests')
      this.connector = null
    }

    this._subscribedListeners.forEach(listener => {
      if (listener?.event !== eventName) return
      if (listener?.callback?.call) listener.callback(error, payload)
    })
  }

  _disconnectConnectorEvents () {
    if (!this.connector) return
    ['session_request', 'call_request', 'disconnect'].forEach(eventName => {
      if (this._isSubscribedTo(eventName)) {
        this.connector._eventManager._eventEmmiters = this.connector._eventManager._eventEmmiters
          .filter(eventEmmiter => eventEmmiter.event !== eventName && eventEmmiter.callback !== this._listeners[eventName])

        delete this._listeners[eventName]
      }
    })
  }

  disconnectConnector () {
    if (!this.connector) return
    this.connector.killSession()
    this.connector = null
  }

  /**
   * Add a listener to an event
   * @param {String} eventName
   * @param {Function} callback
   */
  addEventListener (eventName, callback) {
    const _eventName = String(eventName)
    const exists = this._subscribedListeners.some(listener => listener.event === _eventName && listener.callback === callback)
    if (!exists) {
      this._subscribedListeners.push({
        event: _eventName,
        callback: callback
      })
    }
  }

  /**
   * Removes a listener to an event. If callback is not specified, all listeners are removed
   * @param {String} eventName
   * @param {Function} callback
   */
  removeEventListener (eventName, callback) {
    const _eventName = String(eventName)
    if (callback === undefined) {
      this._subscribedListeners = this._subscribedListeners.filter(listener => listener.event !== _eventName)
    } else {
      const listener = this._subscribedListeners.find(
        listener => listener.event === _eventName && listener.callback === callback
      )
      this._subscribedListeners = this._subscribedListeners.filter(_listener => _listener !== listener)
    }
  }
}
