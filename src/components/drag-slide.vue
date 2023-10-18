<template>
  <q-list class="absolute-bottom br-15">
    <div  v-if="!swiped" style="margin-bottom: 20px; margin-left: 10%; margin-right: 10%;">
      <q-slide-item left-color="blue" @left="slide" style="background-color: transparent; border-radius: 40px;">
        <template v-slot:left>
          <div style="font-size: 15px" class="text-body1">
            <q-icon class="material-icons q-mr-md" size="lg">
              task_alt
            </q-icon>
            {{ $t('SecurityCheck') }}
          </div>
        </template>

        <q-item class="bg-grad text-white q-py-md">
          <q-item-section avatar>
            <q-icon name="mdi-chevron-double-right" size="xl" class="bg-blue" style="border-radius: 50%" />
          </q-item-section>
          <q-item-section class="text-right">
            <h5 class="q-my-sm text-grey-4 text-uppercase">{{ sliderText }}</h5>
          </q-item-section>
        </q-item>
      </q-slide-item>
    </div>
    <pinDialog v-model:pin-dialog-action="pinDialogAction" v-on:nextAction="sendResponse" />
  </q-list>
</template>
<script>
import { addressContentsToLockingBytecode } from '@bitauth/libauth'
import { runInThisContext } from 'vm'
import pinDialog from './pin'

import { Plugins } from '@capacitor/core'
const { SecureStoragePlugin } = Plugins

export default {
  name: 'drag-slide',
  data () {
    return {
      swiped: false,
      sliderText: this.$t('SwipeToSend'),
      step: 1,
      pinDialogAction: ''
    }
  },
  props: {
    text: {
      type: String,
      default: ''
    }
  },
  components: {
    pinDialog
  },
  methods: {
    slide ({ reset }) {
      this.step += 1
      setTimeout(() => {
        try {
          reset()
        } catch {}
      }, 2000)
      this.swiped = true
      this.pinDialogAction = 'VERIFY'
    },
    sendResponse (action) {
      if (action === 'proceed') {
        this.$emit('swiped')
      } else if (action === 'cancel') {
        this.pinDialogAction = ''
        this.swiped = false
      }
    }
  },
  async mounted () {
    const vm = this

    if (vm.text) {
      vm.sliderText = vm.text
    }
  }
}
</script>
