<template>
  <div>
    <q-item
      dense
      clickable v-ripple
      :class="darkMode ? '' : 'text-black'"
      @click="() => openLocationSelector = true"
    >
      <q-item-section side class="q-r-ml-md q-pr-xs button button-text-primary" :class="getDarkModeClass(darkMode)">
        <q-icon name="location_on" size="1.5rem"/>
      </q-item-section>
      <q-item-section class="text-bow" :class="getDarkModeClass(darkMode)">
        <q-item-label v-if="sessionLocation?.name" caption>{{ sessionLocation?.name }}</q-item-label>
        <!-- <q-item-label v-else caption><i>Set Location</i></q-item-label> -->
        <q-item-label >
          {{ sessionLocation?.formatted }}
        </q-item-label>
      </q-item-section>
    </q-item>
    <q-dialog v-model="openLocationSelector" position="bottom">
      <q-card class="br-15 pt-card-2 text-bow" :class="getDarkModeClass(darkMode)">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">
            Select Location
          </div>
          <q-space/>
          <q-btn
            flat
            icon="close"
            class="q-r-mx-md close-button"
            v-close-popup
          />
        </q-card-section>
        <q-card-section v-if="sessionLocation?.id" class="q-py-none">
          <div class="br-15" @click="() => showLocationInDialog(sessionLocation)">
            <LMap
              :zoom="17"
              :center="[sessionLocation?.latitude, sessionLocation?.longitude]"
              style="height:6rem;"
            >
              <LTileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                layer-type="base"
                name="OpenStreetMap"
              ></LTileLayer>
              <LMarker
                :lat-lng="{
                  lat: sessionLocation?.latitude,
                  lng: sessionLocation?.longitude,
                }"
              ></LMarker>
            </LMap>
          </div>

          <div class="q-mt-sm">
            <div v-if="sessionLocation?.name" class="text-caption">
              {{ sessionLocation?.name }}
              <template v-if="Number.isFinite(sessionLocation?.id)"> #{{ sessionLocation?.id }}</template>
            </div>
            <div>{{ sessionLocation?.formatted }}</div>
          </div>
        </q-card-section>
        <q-list class="q-my-md" separator>
          <div class="row items-center full-width q-mx-md">
            <q-btn
              flat no-caps no-wrap
              padding="sm"
              size="0.75rem"
              class="q-space button button-text-primary"
              :class="getDarkModeClass(darkMode)"
              @click.stop="() => setCurrentLocation()"
            >
              <q-icon name="location_on"/>
              Use current location
            </q-btn>
            <q-btn
              flat no-caps no-wrap
              padding="sm"
              size="0.75rem"
              class="q-space button button-text-primary"
              :class="getDarkModeClass(darkMode)"
              @click.stop="() => updateDeviceLocation()"
            >
              <q-icon name="location_on"/>
              Select pin location
            </q-btn>
          </div>
          <q-separator inset/>
          <template v-for="location in customerLocations" :key="location?.id">
            <q-item
              clickable v-ripple
              v-close-popup
              @click="() => $store.commit('marketplace/setSelectedSessionLocationId', location?.id)"
            >
              <q-item-section side>
                <q-radio
                  :model-value="sessionLocation?.id" :val="location?.id" dense color="brandblue"
                  @click="() => $store.commit('marketplace/setSelectedSessionLocationId', location?.id)"
                />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-subtitle1">
                  <template v-if="location?.name">
                    {{ location?.name }} <span class="text-grey">#{{ location?.id }}</span>
                  </template>
                  <template v-else>Address #{{ location?.id }}</template>
                </q-item-label>
                <q-item-label class="text-caption ellipsis-2-lines">
                  {{ location?.formatted }}
                </q-item-label>
                <q-item-label v-if="location?.validCoordinates" class="text-body2 text-underline">
                </q-item-label>
              </q-item-section>
              <q-item-section side top style="padding-left:4px;">
                <div class="row no-wrap" style="margin-top:auto;margin-bottom:auto;">
                  <q-btn flat icon="edit" padding="sm" @click.stop="() => editLocation(location)"/>
                  <q-separator vertical/>
                  <q-btn flat icon="delete" padding="sm" color="red" @click.stop="() => deleteLocationConfirm(location?.id)"/>
                </div>
              </q-item-section>
            </q-item>
            <q-separator inset/>
          </template>
          <q-item clickable v-ripple @click="() => addNewAddress()">
            <q-item-section>
              <q-item-label class="text-subtitle1 text-center">
                <q-icon name="add" size="1.5em"/>
                Add new address
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>
    </q-dialog>
  </div>
</template>
<script setup>
import { Location } from "src/marketplace/objects";
import { geolocationManager } from "src/boot/geolocation";
import { useQuasar } from "quasar";
import { useStore } from "vuex";
import { ref, computed } from "vue";
import PinLocationDialog from "src/components/PinLocationDialog.vue";
import { getDarkModeClass } from 'src/utils/theme-darkmode-utils'
import { LMap, LTileLayer, LMarker } from '@vue-leaflet/vue-leaflet'
import CustomerLocationFormDialog from "./CustomerLocationFormDialog.vue";

const $q = useQuasar()
const $store = useStore()
const darkMode = computed(() => $store.getters['darkmode/getStatus'])

const openLocationSelector = ref(false)
const sessionLocation = computed(() => $store.getters['marketplace/sessionLocation'])
const deviceLocation = computed(() => $store.getters['marketplace/deviceLocation'])
const customerLocations = computed(() => $store.getters['marketplace/customerLocations'])


function showLocationInDialog(location=Location.parse()) {
  $q.dialog({
    component: PinLocationDialog,
    componentProps: {
      initLocation: {
        latitude: parseFloat(location?.latitude),
        longitude: parseFloat(location?.longitude)
      },
      static: true,
      headerText: location?.name || undefined,
    }
  }).onOk(() => {
    if (location?.id) {
      $store.commit('marketplace/setSelectedSessionLocationId', location?.id)
      openLocationSelector.value = false
    }
  })
}

async function updateDeviceLocation(opts={ dialogTitle: '', keepSelectorOpen: false }) {
  const data = await dialogPromise({
    component: PinLocationDialog,
    componentProps: {
      initLocation: {
        latitude: parseFloat(deviceLocation?.value?.latitude),
        longitude: parseFloat(deviceLocation?.value?.longitude)
      },
      headerText: 'Pin location',
    }
  })
  return setDeviceLocation(data, opts)
}

function setCurrentLocation(opts={ keepSelectorOpen: false, hideDialogOnError: false }) {
  const dialog = $q.dialog({
    title: 'Set location',
    message: 'Getting device location & address',
    color: 'brandblue',
    progress: true,
    persistent: true,
    class: `br-15 pt-card-2 text-bow ${getDarkModeClass(darkMode.value)}`,
    ok: false,
    cancel: false,
  })

  return $store.dispatch('marketplace/updateLocation')
    .then(() => {
      if (!deviceLocation.value?.validCoordinates) return Promise.reject({ errorMessage: 'Device location invalid' })

      $store.commit('marketplace/setSelectedSessionLocationId')
      dialog.hide()
      if (!opts?.keepSelectorOpen) openLocationSelector.value = false
    })
    .catch(error => {
      console.error(error)
      if (opts?.hideDialogOnError) dialog.hide()
      dialog.update({
        title: 'Device location error',
        message: error?.errorMessage || 'Unable to find device location',
        ok: true,
      })
      return Promise.reject(error)
    })
    .finally(() => {
      dialog.update({ progress: false, persistent: false, ok: true })
    })
}

function setDeviceLocation(data, opts={ dialogTitle: '', keepSelectorOpen: false }) {
  const dialog = $q.dialog({
    title: opts?.dialogTitle || 'Pin location',
    color: 'brandblue',
    class: `br-15 pt-card-2 text-bow ${getDarkModeClass(darkMode.value)}`
  })
  if (Number.isNaN(data?.lat) || Number.isNaN(data?.lng)) {
    dialog.update({ message: 'Invalid pin location' })
    return Promise.reject('Invalid pin location')
  }
  dialog.update({
    message: 'Getting address of pinned location',
    progress: true, ok: false, cancel: false, persistent: true,
  })
  const closestLocation = $store.getters['marketplace/getClosestCustomerLocation']?.({
    latitude: data?.lat, longitude: data?.lng,
  }, 75)

  let reverseGeocodePromise
  if (closestLocation) {
    // dialog doesn't get hidden when there is no delay
    reverseGeocodePromise = new Promise(resolve => {
      const parsedLocation = {
        ...closestLocation,
        latitude: data?.lat,
        longitude: data?.lng,
      }
      setTimeout(() => resolve(parsedLocation), 350)
    })
  } else {
    reverseGeocodePromise = geolocationManager.reverseGeocode({ lat: data?.lat, lon: data?.lng })
  }

  return reverseGeocodePromise
    .then(response => {
      $store.commit('marketplace/updateLocationData', response)
      $store.commit('marketplace/setSelectedSessionLocationId')
      dialog.hide()
      if (!opts?.keepSelectorOpen) openLocationSelector.value = false
    })
    .catch(error => {
      console.error(error)
      dialog.update({ message: 'Unable to get address' })
    })
    .finally(() => {
      dialog.update({ progress: false, persistent: false, ok: true })
    })
}

async function addNewAddress(opts={ keepSelectorOpen: false }) {
  const data = await dialogPromise({
    component: PinLocationDialog,
    componentProps: {
      initLocation: {
        latitude: parseFloat(deviceLocation?.value?.latitude),
        longitude: parseFloat(deviceLocation?.value?.longitude)
      },
      headerText: 'Pin location',
    }
  })
  const dialog = $q.dialog({
    title: 'New address',
    message: 'Getting address details',
    color: 'brandblue',
    progress: true, ok: false, cancel: false, persistent: true,
    class: `br-15 pt-card-2 text-bow ${getDarkModeClass(darkMode.value)}`
  })
  try {
    const response = await geolocationManager.reverseGeocode({ lat: data?.lat, lon: data?.lng })
    const locationObj = Location.parse(response)
    dialog.hide()
    return editLocation(locationObj)
      .then(newLocationObj => {
        $store.commit('marketplace/setSelectedSessionLocationId', newLocationObj?.id)
        if (!opts?.keepSelectorOpen) openLocationSelector.value = false
        return newLocationObj
      })
  } catch (error) {
    console.error(error)
    dialog.update({ message: 'Unable to find location data'})
  } finally {
    dialog.update({ ok: true, progress: false, persistent: false })
  }
}

function deleteLocationConfirm(locationId) {
  $q.dialog({
    title: 'Delete address',
    message: 'Are you sure?',
    color: 'brandblue',
    ok: { color: 'red', noCaps: true, label: 'Delete', outlined: true },
    cancel: { flat: true, color: 'grey', noCaps: true },
    class: `br-15 pt-card-2 text-bow ${getDarkModeClass(darkMode.value)}`
  }).onOk(() => deleteLocation(locationId))
}

function deleteLocation(locationId) {
  const dialog = $q.dialog({
    title: 'Removing address',
    progress: true,
    ok: false,
    cancel: false,
    color: 'brandblue',
    class: `br-15 pt-card-2 text-bow ${getDarkModeClass(darkMode.value)}`
  })

  return $store.dispatch('marketplace/deleteCustomerLocation', locationId)
    .finally(() => dialog.hide())
}


function editLocation(location = Location.parse()) {
  return dialogPromise({
    component: CustomerLocationFormDialog,
    componentProps: {
      location: location,
      hideOnSave: true,
      openPinOnShow: false,
    }
  })
}

async function dialogPromise(qDialogOptions) {
  return new Promise((resolve, reject) => {
    $q.dialog(qDialogOptions).onOk(resolve).onDismiss(reject)
  })
}

defineExpose({
  openLocationSelector,
  setCurrentLocation,
  updateDeviceLocation,
})
</script>
