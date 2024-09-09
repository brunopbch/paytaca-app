import { Geolocation } from '@capacitor/geolocation'
import BCHJS from '@psf/bch-js'
import { geolocationManager } from 'src/boot/geolocation'
import { backend, setSignerData } from 'src/marketplace/backend'
import { Cart } from 'src/marketplace/objects'
import { loadWallet } from 'src/wallet'

const bchjs = new BCHJS()

/**
 * @param {Object} context
 * @param {Object} opts
 * @param {Number} opts.maxAge
 * @param {Boolean} opts.excludeGeocode
 */
export async function updateLocation(context, opts={ maxAge: 86400 * 1000, excludeGeocode: false }) {
  if (opts?.maxAge) {
    const age = Date.now() - context?.state?.location?.timestamp
    const expired = Number.isNaN(age) || age > opts?.maxAge
    if (!expired) return Promise.resolve('Device location has not reached max age')
  }

  await geolocationManager.openLocationSettingsIfGpsDisabled().catch(console.error)
  await geolocationManager.updateGeolocationPermission({ request: true, geolocateOnGrant: false})
  if (geolocationManager.permissionState.value.denied) return Promise.reject('Permission denied')

  if (geolocationManager.isGpsStatusEnabled.value == false) return Promise.reject('GPS status is not enabled')

  const granted = geolocationManager.permission.value.location || geolocationManager.permission.value.coarseLocation
  if (!granted) return Promise.reject('No permission')

  return geolocationManager.geolocate()
    .then(response => {
      const locationData = {
        timestamp: response?.timestamp,
        latitude: response?.position?.latitude,
        longitude: response?.position?.longitude,
      }
      return locationData
    })
    .catch(error => {
      console.error('Update location error', error)
      return null
    })
    .then(async (locationData) => {
      if (opts?.excludeGeocode) return locationData
      const closestLocation = context.getters?.getClosestCustomerLocation?.(locationData, 100)
      if (closestLocation) return {
        ...closestLocation.raw,
        ...locationData,
      }
      
      const reverseGeocodeData = await geolocationManager.reverseGeocode({
        lat: locationData?.latitude,
        lon: locationData?.longitude,
      }).catch(console.error)

      return {
        address1: reverseGeocodeData?.address1,
        address2: reverseGeocodeData?.address2,
        street: reverseGeocodeData?.street,
        city: reverseGeocodeData?.city,
        state: reverseGeocodeData?.state,
        country: reverseGeocodeData?.country,
        zip_code: reverseGeocodeData?.zip_code,
        ...locationData,
      }
    })
    .then(locationData => {
      context.commit('updateLocationData', locationData)
      return locationData
    })
}

export function getCartRef(context) {
  const walletHash = context.rootGetters['global/getWallet']('bch')?.walletHash
  if (walletHash) return `wallet:${walletHash}`
  return ''
}

export async function updatePrivkey(context) {
  const customer = context.getters['customer']
  const index = customer?.paytacaWallet?.verifyingPubkeyIndex
  const pubkeyBuffer = Buffer.from(customer?.paytacaWallet?.verifyingPubkey, 'hex')
  const walletHash = customer?.paytacaWallet?.walletHash
  if (!isFinite(index)) return Promise.reject(`invalid index: ${index}`)

  const walletIndex = context.rootGetters['global/getWalletIndex']
  const wallet = await loadWallet('BCH', walletIndex)
  const privkey = await wallet.BCH.getPrivateKey(`0/${index}`)

  const message = `${Date.now()}`
  const signature = await wallet.BCH.signMessage(message, index)

  const ecPair = bchjs.ECPair.fromPublicKey(pubkeyBuffer)
  const address = bchjs.ECPair.toLegacyAddress(ecPair)

  const valid = await wallet.BCH.verifyMessage(address, signature, message)
  if (!valid) return Promise.reject('invalid signature')
  setSignerData(`${walletHash}:${privkey}`)
}

/**
 * @param {Object} context 
 * @param {Object} opts
 * @param {Number} opts.index
 */
export async function updateCustomerVerifyingPubkey(context, opts={ index: 0 }) {
  const customer = context.getters['customer']
  let index = opts?.index
  if (isNaN(index) || index < 0) index = customer?.paytacaWallet?.verifyingPubkeyIndex
  if (isNaN(index) || index < 0) return Promise.reject('invalid index')

  const walletIndex = context.rootGetters['global/getWalletIndex']
  const wallet = await loadWallet('BCH', walletIndex)
  const walletHash = wallet.BCH.walletHash 
  const pubkey = await wallet.BCH.getPublicKey(`0/${index}`)
  const privkey = await wallet.BCH.getPrivateKey(`0/${index}`)

  const data = {
    paytaca_wallet: {
      wallet_hash: walletHash,
      verifying_pubkey: pubkey,
      verifying_pubkey_index: index,
    }
  }

  let request = null
  if (customer?.id) {
    request = backend.patch(`connecta/customers/${customer?.id}/`, data)
  } else {
    data.ref = await context.dispatch('getCartRef')
    request = backend.post(`connecta/customers/`, data, { skipSigning: true })
  }
  return request.then(response => {
    if (!response?.data?.id) return Promise.reject({ response })
    context.commit('setCustomerData', response?.data)
    setSignerData(`${walletHash}:${privkey}`)
    return response
  })
}

export async function refetchCustomerData(context) {
  const params = {
    ref: await context.dispatch('getCartRef')
  }

  return backend.get(`connecta/customers`, { params })
    .then(response => {
      const customerData = response?.data?.results?.[0]
      context.commit('setCustomerData', customerData)
      return customerData
    })
}

export async function refetchCustomerLocations(context) {
  const customer = context.getters['customer']
  return backend.get(`connecta/customers/${customer?.id}/locations/`)
    .then(response => {
      if (!Array.isArray(response?.data?.results)) return Promise.reject({ response })
      context.commit('clearCustomerLocations')
      response?.data?.results?.forEach(locationData => {
        context.commit('addCustomerLocation', locationData)
      })
      return response
    })
}

/**
 * @param {Object} context 
 * @param {Number} locationId 
 */
export async function deleteCustomerLocation(context, locationId) {
  const customer = context.getters['customer']
  return backend.delete(`connecta/customers/${customer?.id}/locations/${locationId}/`)
    .catch(error => {
      if (error?.response?.data?.detail?.includes?.('Not found')) return Promise.resolve()
      return Promise.reject(error)
    })
    .then(response => {
      context.commit('removeCustomerLocation', locationId)
      return response
    })
}

export async function refreshActiveStorefrontCarts(context) {
  const storefront = context.getters['activeStorefront']
  if (!storefront?.id) return Promise.reject('No active storefront')
  return context.dispatch('refreshStorefrontCarts', { storefrontId: storefront?.id })
}

export async function refreshStorefrontCarts(context, opts={ storefrontId: 0 }) {
  const params = {
    storefront_id: opts?.storefrontId || '',
    is_open: true,
    ref: await context.dispatch('getCartRef'),
    limit: 5,
  }

  return backend.get(`connecta/carts/`, { params })
    .then(response => {
      if (!Array.isArray(response?.data?.results)) return Promise.reject({ response })
      context.commit('removeStorefrontCarts', opts?.storefrontId)
      response?.data?.results.map(cartData => context.commit('cacheCart', cartData))
      return response
    })
}

/**
 * @param {Object} context 
 * @param {Cart} cart 
 */
export function saveCart(context, cart) {
  return cart.save().then(() => {
    context.commit('cacheCart', cart.raw)
  })
}

/**
 * 
 * @param {Object} context 
 * @param {Object} opts 
 * @param {Number} opts.cartId id of the cart to fetch
 * @param {Boolean} opts.existsInCache if true, the cart must be list of cached carts already
 * 
 */
export function refreshCart(context, opts={ cartId: 0, existsInCache: false }) {
  if (!opts?.cartId) return Promise.reject('No cart id')
  const cart = context.getters.carts.find(cart => cart?.id == opts?.cartId)

  if (cart) {
    return cart.refetch().then(response => {
      context.commit('cacheCart', cart.raw)
      return response
    })
  } else if (!opts?.existsInCache) {
    return backend.get(`connecta/carts/${cartId}/`).then(response => {
      if (!response?.data?.id) return Promise.reject({ response })
      context.commit('cacheCart', response?.data)
      return response
    })
  }

  return Promise.reject('Skipped')
}

export async function removeCart(context, opts={ cartId: 0, excludeApi: false }) {
  if (!opts?.excludeApi) {
    await backend.delete(`connecta/carts/${opts?.cartId}/`)
      .catch(error => {
        if (error?.response?.status === 404) return error?.response
        return Promise.reject(error)
      })
  }

  context.commit('removeCart', opts?.cartId)
}

/**
 * @param {Object} context 
 * @param {Cart} cart 
 */
export async function clearCart(context, cart) {
  cart.items = []
  return context.dispatch('saveCart', cart)
}
