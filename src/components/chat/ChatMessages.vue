<template>
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
            class="col q-px-sm"
            :dark="darkMode"
            rounded
            dense
            v-model="receiver"
            placeholder="Enter address..."
            borderless
            >
            <template v-slot:append>
              <q-icon name="close" @click="receiver = ''"/>&nbsp;
              <q-icon name="mdi-qrcode-scan"/>
            </template>
          </q-input>
        </div>
        <!-- <div class="row">
          <q-btn
            flat
            padding="md"
            icon="arrow_back"
            @click="$emit('back')"
          />
          <div style="padding-top: 18px;">
          </div>&nbsp;&nbsp;
          <q-input class="q-pt-sm" v-model="receiver" borderless dense placeholder="Enter address">
            <template v-slot:append>
              <q-icon name="close" @click="receiver = ''"/>&nbsp;
              <q-icon name="mdi-qrcode-scan"/>
            </template>
          </q-input>
        </div> -->
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
                        size="6"
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
          <div v-else>
            <div v-if="type === 'compose'" class="col-12 q-mt-lg text-center" style="padding-top: 40%;">
              <div>
                <div class="q-pb-sm text-grey-5" style="font-size: 18px;">
                  Scan Address
                </div>
                <q-btn round size="lg" class="btn-scan text-white" icon="mdi-qrcode" @click.once="showQrScanner = true" />
              </div>
              <!-- <div class="stack-top">
                Helllo
              </div> -->
            </div>
            <div v-else class="text-center">
              <q-icon name="sym_o_comments_disabled"/>
              No Existing Conversation
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

      <!-- <div class="q-mt-sm" :style="`height: ${minHeight - 130}px`">
        <div class="q-pa-md row justify-center">
          <div style="width: 100%; max-width: 400px">
            <q-chat-message
              name="me"
              avatar="https://cdn.quasar.dev/img/avatar3.jpg"
              stamp="7 minutes ago"
              sent
              text-color="white"
              bg-color="primary"
            >
              <div>
                Hey there!
              </div>

              <div>
                Have you seen Quasar?
                <img src="https://cdn.quasar.dev/img/discord-omq.png" class="my-emoticon">
              </div>
            </q-chat-message>

            <q-chat-message
              name="Jane"
              avatar="https://cdn.quasar.dev/img/avatar5.jpg"
              bg-color="amber"
            >
              <q-spinner-dots size="2rem" />
            </q-chat-message>
          </div>
        </div>
      </div> -->


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

export default {
  setup () {
    const scrollTargetRef = ref(null)
    return {
      scrollTargetRef
    }
  },
  data () {
    return {
      darkMode: this.$store.getters['darkmode/getStatus'],
      minHeight: this.$q.platform.is.ios ? this.$q.screen.height - (95 + 130) : this.$q.screen.height - (70 + 110),
      owner: { id: 1, name: 'Nikki' },
      receiver: '',
      chatDetails: {},
      chatInfo: [],
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
      message: ''
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
  methods: {
    typingMessage: debounce(async function () {
      console.log('typing typing...')
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
    }
  },
  async mounted () {
    console.log('chat messages')
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
</style>
