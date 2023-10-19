<template>
  <QrScanner
    v-if="showQrScanner"
    v-model="showQrScanner"
    @decode="onScannerDecode"/>
  <div class="q-pt-lg q-mx-xs">
    <q-card
      class="br-15 q-pt-sm q-mx-md q-mx-none q-mb-lg"
      :class="[ darkMode ? 'text-white pt-dark-card-2' : 'text-black',]"
      :style="`height: ${minHeight}px;`"
    >
    <div v-if="isloaded">
      <div v-if="type === 'compose'">
        <div class="row q-py-xs q-px-md">
          <q-icon class="q-pt-sm" color="grey-7" size="sm" name='arrow_back' @click="$emit('back')"/>&nbsp;
          <q-input
            ref="addrRef"
            class="col q-px-sm"
            :dark="darkMode"
            rounded
            dense
            v-model="receiver"
            placeholder="Enter address..."

            borderless
            hide-bottom-space
            @update:model-value="function() {
              isValidAddress = true
              reset()
            }"
            >
            <template v-slot:append>
              <q-icon name="error" color="red-10" v-if="!isValidAddress && receiver !== ''"/>
              <q-icon name="close" @click="receiver = ''"/>&nbsp;
              <q-icon name="mdi-qrcode-scan" @click.prevent="showQrScanner = true"/>&nbsp;
              <q-icon name="send" size="md" color="indigo-6" @click.prevent="addSearched()"/>
            </template>
          </q-input>
        </div>
      </div>
      <div class="row" v-if="type === 'open-message'">
        <div>
          <q-btn
            flat
            padding="md"
            icon="arrow_back"
            @click="$emit('back')"
          />
        </div>
        <!-- <div> -->
        <q-avatar size="md" style="padding-top: 13px;">
          <q-img style="filter: grayscale(30%);"  loading="lazy" spinner-color="white"  :src="`https://ui-avatars.com/api/?background=random&name=${chatInfo.sentFrom.name}&color=fffff`" />
        </q-avatar>&nbsp; &nbsp;
        <!-- </div> -->
        <div class="text-capitalize" style="font-size: 15px; font-weight: 500; padding-top: 18px;">{{ chatInfo.sentFrom.name }}</div>
      </div>

      <q-separator :dark="darkMode"/>

      <!-- Convo -->
      <q-pull-to-refresh @refresh="refreshData">
        <q-list ref="scrollTargetRef" :style="`height: ${minHeight - 130}px`" style="overflow: auto;" >
          <div class="text-center text-red-10 q-pt-sm" v-if="!isValidAddress && receiver !== ''">
            Invalid Address! Try Again
          </div>
          <div class="q-pb-xs q-pt-sm q-px-sm"  v-if="searchItem.length !== 0">
            <div class="q-gutter-xs row truncate-chip-labels">
              <q-chip v-for="(item, index) in searchItem" :key="index" removable color="blue-6" text-color="white" icon="account_circle" @remove="removeSearched(index)">
                <span class="customEllipsis">{{ item }}</span>
              </q-chip>
            </div>
          </div>
          <q-infinite-scroll
            ref="infiniteScroll"
            :items="convo"
            :offset="0"
            :scroll-target="scrollTargetRef"
            reverse
          >
          <template v-slot:loading>
            <div class="row justify-center q-my-md" v-if="!isloaded">
              <q-spinner-dots color="primary" size="40px" />
            </div>
          </template>
          <div v-if="chatInfo.length !== 0">
            <div v-for="(message, index) in convo.messages" :key="index" class="q-pt-xs">
              <q-item>
                <q-item-section>
                  <div class="q-px-md row justify-center">
                    <div style="width: 100%;">
                      <q-chat-message
                        :name="message.owner ? 'me' :  chatInfo.sentFrom.name"
                        :avatar="`https://ui-avatars.com/api/?background=random&name=${message.owner ? owner.name : chatInfo.sentFrom.name }&color=fffff`"
                        :stamp="message.stamp"
                        :sent="message.owner"
                        :bg-color="message.owner ? 'blue-5' : 'blue-grey-3'"
                        :text-color="message.owner ? 'white' : 'black'"
                      >
                        <div style="font-size: 13px; font-weight: 400;">
                          {{ message.text }}
                        </div>
                      </q-chat-message>
                    </div>
                  </div>
                </q-item-section>
              </q-item>
            </div>
          </div>
          <div v-else class="text-center" >
            <div v-if="!message" style="margin-top: 40%;">
              <q-icon name="sym_o_comments_disabled" size="lg"/>
              <div class="text-grey-5">
                No Existing Conversation
              </div>
            </div>
          </div>
          <div v-if="message" class="q-px-sm q-mx-lg">
            <div style="width: 100%;">
              <q-chat-message
                name="me"
                sent
                :avatar="`https://ui-avatars.com/api/?background=random&name=${owner.name}&color=fffff`"
                bg-color="blue-5"
              >
                <q-spinner-dots color="white" size="2rem" />
              </q-chat-message>
            </div>
          </div>
          </q-infinite-scroll>
        </q-list>
      </q-pull-to-refresh>

      <q-separator :dark="darkMode"  class="q-mb-sm"/>
      <!-- Message Input -->
      <div class="row q-pt-xs q-px-sm">
        <q-input
          class="col q-px-sm"
          :dark="darkMode"
          rounded
          outlined
          dense
          v-model="message"
          placeholder="Enter message..."
          @update:modelValue="function(){
              typingMessage()
            }"
          ></q-input>
        <q-icon color="grey-7" size="lg" name='sym_o_send' @click="sendMessage"/>&nbsp;
      </div>
    </div>
  </q-card>
  </div>
</template>
<script>
import { ref } from 'vue'
import { debounce } from 'quasar'
import { thirdparty } from 'ethereumjs-wallet'
import { Address } from '../../wallet'
import { isValidTokenAddress } from 'src/wallet/chipnet'
import QrScanner from '../qr-scanner.vue'

export default {
  setup () {
    const scrollTargetRef = ref(null)
    const addrRef = ref(null)
    return {
      scrollTargetRef,
      addrRef,

      reset () {
        addrRef.value.resetValidation()
      },
      blur () {
        addrRef.value.blur()
      }
    }
  },
  data () {
    return {
      darkMode: this.$store.getters['darkmode/getStatus'],
      minHeight: this.$q.platform.is.ios ? this.$q.screen.height - (95 + 130) : this.$q.screen.height - (70 + 110),
      owner: { id: 1, name: 'Nikki' },
      receiver: '',
      searchItem: [],
      chatDetails: {},
      chatInfo: [],
      showQrScanner: false,
      convo: {
        chat_id: 1,
        messages: [
          {
            id: 1,
            sender: { id: 1, name: 'Nikki' },
            text: 'Hey there!',
            stamp: '3 hours ago',
            owner: true
          },
          {
            id: 2,
            sender: { id: 2, name: 'Ellie' },
            text: 'Hey Whats up',
            stamp: '3 hours ago',
            owner: false
          },
          {
            id: 3,
            sender: { id: 1, name: 'Nikki' },
            text: 'Great!',
            stamp: '2 hours ago',
            owner: true
          },
          {
            id: 4,
            sender: { id: 1, name: 'Nikki' },
            text: 'You?',
            stamp: '2 hours ago',
            owner: true
          },
          {
            id: 5,
            sender: { id: 2, name: 'Ellie' },
            text: 'Good',
            stamp: '50 minutes ago',
            owner: false
          }
        ]
      },
      isloaded: false,
      isTyping: false,
      message: '',
      isValidAddress: false
    }
  },
  props: {
    chatData: {
      type: Object,
      default: null
    },
    type: {
      type: String,
      default: 'existing'
    },
    chatId: Number
  },
  emits: ['back'],
  components: {
    QrScanner
  },
  methods: {
    typingMessage: debounce(async function () {
      this.isTyping = true

      await this.$refs.infiniteScroll.reset()

      const scrollElement = this.$refs.scrollTargetRef.$el
      const test = this.$refs.infiniteScroll.$el
      scrollElement.scrollTop = test.clientHeight
    }, 500),
    sendMessage () {
      console.log('sending message')
      this.message = ''
    },
    refreshData (done) {
      console.log('refreshing data')
      setTimeout(() => {
        done()
      }, 1000)
    },
    async addSearched () {
      await this.validateAddress()

      if (this.isValidAddress) {
        this.searchItem.push(this.receiver)
        this.receiver = ''
      }
      this.blur()
    },
    removeSearched (index) {
      this.searchItem.splice(index, 1)
    },
    validateAddress () {
      const vm = this
      // vm.reset()
      const address = vm.receiver
      const addressObj = new Address(address)
      let addressIsValid = false
      let formattedAddress

      try {
        if (isValidTokenAddress(address)) {
          addressIsValid = true
          formattedAddress = address
        } else if (addressObj.isLegacyAddress() || addressObj.isCashAddress()) {
          if (addressObj.isValidBCHAddress(true)) { //isChipnet
            addressIsValid = true
            formattedAddress = addressObj.toCashAddress(address)
          }
        }
      } catch (err) {
        addressIsValid = false
        console.log(err)
      }

      this.isValidAddress = addressIsValid
    },
    onScannerDecode (content) {
      const vm = this
      vm.showQrScanner = false

      this.receiver = content
    },
    // validateAddress: debounce(async function () {
    //   console.log('validating')

    //   const vm = this
    //   // vm.reset()
    //   const address = this.receiver
    //   const addressObj = new Address(address)
    //   let addressIsValid = false
    //   let formattedAddress

    //   try {
    //     if (isValidTokenAddress(address)) {
    //       addressIsValid = true
    //       formattedAddress = address
    //     } else if (addressObj.isLegacyAddress() || addressObj.isCashAddress()) {
    //       console.log('hello')
    //       if (addressObj.isValidBCHAddress(true)) { //isChipnet
    //         addressIsValid = true
    //         formattedAddress = addressObj.toCashAddress(address)
    //       }
    //     }
    //   } catch (err) {
    //     addressIsValid = false
    //     console.log(err)
    //   }

    //   this.isValidAddress = addressIsValid
      // return {
      //   valid: addressIsValid,
      //   address: formattedAddress
      // }
    // }, 500),
  },
  async mounted () {
    if (this.chatData) {
      this.chatInfo = this.chatData
    }

    this.isloaded = true
    console.log(this.chatInfo)
  }
}
</script>
<style lang="scss" scoped>
.my-emoticon {
  vertical-align: middle;
  height: 2em;
  width: 2em;
}
.btn-scan {
    background-image: linear-gradient(to right bottom, #3b7bf6, #a866db, #da53b2, #ef4f84, #ed5f59);
    color: white;
  }
  .stack-top{
    position: relative;
    z-index: auto;
  }
.q-chip {
    max-width: 150px
  }
  .customEllipsis {
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
  overflow: hidden !important;
}
</style>
