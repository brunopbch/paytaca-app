<template>
  <div class="q-px-md">
    <div class="q-pt-lg">
      <q-card
        class="br-15 q-pt-sm q-mx-none q-mb-lg q-mx-xs"
        :class="[ darkMode ? 'text-white pt-dark-card-2' : 'text-black',]"
        :style="`height: ${ minHeight }px;`"
      >
        <!-- Top Icons -->
        <div class="text-center row no-wrap items-center q-pa-sm q-pt-md">
          <div class="col-2">
            <q-icon size="sm" name='sym_o_menu' @click="menu = true"/>
          </div>

          <div class="col-8 text-uppercase bold-text" style="font-size: 18px; font-weight: 500">
            {{ state }}
          </div>

          <div class="col-2">
            <q-icon v-show="hasCompose" size="sm" name='sym_o_create' @click="$emit('openMessage', { info: null, type: 'compose' })" />
          </div>
        </div>

        <!-- <q-separator :dark="darkMode"  class="q-mb-sm" /> -->

        <!-- Message List -->
        <div>
          <div class="text-center" style="margin-top: 50px" v-if="chats.length === 0">
            <div class="q-pt-lg">
              <q-icon color="blue-grey-5" size="3em" name="sym_o_comments_disabled"/>
            </div>
            <div class="q-pt-sm" style="opacity: .5;">
              No existing conversations
            </div>
          </div>
          <div v-else>
            <!-- APPEAL -->
            <q-pull-to-refresh @refresh="refreshData">
              <q-list ref="scrollTargetRef" :style="`height: ${minHeight - 100}px`" style="overflow: auto;">
                <q-infinite-scroll
                  ref="infiniteScroll"
                  :offset="0"
                  :scroll-target="scrollTargetRef"
                >
                  <template v-slot:loading>
                    <div class="row justify-center q-my-md" v-if="!isloaded">
                      <q-spinner-dots color="primary" size="40px" />
                    </div>
                  </template>

                  <!-- CHATS -->
                  <q-list :style="`max-height: ${minHeight - 50}px`" style="overflow:auto;" v-if="state === 'chats'">
                    <div v-for="(chat, index) in chats" :key="index">
                      <q-slide-item @left="onLeft" @right="onRight" right-color="red-6" left-color="grey-5" class=" q-mx-lg">
                        <q-item clickable @click="$emit('openMessage', { info: chat, type: 'open-message'})" :class="darkMode ? 'pt-dark-card-2 text-white' : ''">
                          <q-item-section>
                            <div class="row" >
                              <div>
                                <q-avatar size="md" style="padding-top: 13px;">
                                  <q-img style="filter: grayscale(30%);" loading="lazy" spinner-color="white"  :src="`https://ui-avatars.com/api/?background=random&name=${chat.sentFrom.name}&color=fffff`" />
                                </q-avatar>
                              </div>
                              <div  class="q-pt-sm q-mr-md q-pl-xs">
                                <div class="q-mx-sm" style="font-size: 15px; font-weight: 500;">
                                  {{ chat.sentFrom.name }}
                                </div>
                                <div style="font-size: 12px;" class="q-px-sm" :class="darkMode ? 'text-grey-5' : 'text-grey-7'">
                                  <span style="font-size: 13px;">
                                    You: {{ chat.text }}
                                  </span>
                                  &nbsp;<q-icon size=".5em" name='circle'/>&nbsp;
                                  <span>
                                    {{ chat.date }}
                                  </span>
                                </div>

                              </div>
                            </div>
                            <!---- <q-separator :dark="darkMode" class="q-mt-sm"/> -->
                          </q-item-section>
                        </q-item>

                        <template v-slot:right>
                          <span class="text-white">Delete</span>&nbsp;
                          <q-icon name="delete" />
                        </template>
                        <template v-slot:left>
                          <span class="text-white">Archive</span>&nbsp;
                          <q-icon name="archive" />
                        </template>
                      </q-slide-item>
                    </div>
                  </q-list>

                  <!-- TRADES -->
                  <q-list :style="`max-height: ${minHeight - 50}px`" style="overflow:auto;" v-if="state === 'trades'">
                    <div v-for="i in 7" :key="i">
                      <!-- <q-item clickable @click="''" :class="darkMode ? 'pt-dark-card-2 text-white' : ''"> -->
                        <div class="q-px-lg" @click="$emit('openMessage', { info: chats[0], type: 'open-message'})">
                          <div class="q-pt-md q-px-md">
                            <!-- <q-badge rounded dense :color="i%2 === 0 ? 'red-6' : 'blue-6'" :label="i%2 === 0 ? 'Release' : 'Refund'" /> -->
                            <div class="q-pt-xs" style="font-weight: 500;">
                              Order #001{{ i }}
                            </div>
                            <div style="font-size: 12px;" :class="darkMode ? 'text-grey-5' : 'text-grey-7'">
                              <span style="font-size: 13px;">
                                Hi there!
                              </span>
                              &nbsp;<q-icon size=".5em" name='circle'/>&nbsp;
                              <span>
                                {{ i*5 }} min ago
                              </span>
                            </div>
                            <!-- <q-badge outline rounded dense :color="darkMode ? 'blue-grey-3' : 'blue-grey-5'" label="Fiat Ramp" /> -->
                          </div>
                          <q-separator :dark="darkMode" class="q-mt-sm q-mx-sm"/>
                        </div>
                      <!-- </q-item> -->
                    </div>
                  </q-list>

                  <!-- APPEALS -->
                  <q-list :style="`max-height: ${minHeight - 50}px`" style="overflow:auto;" v-if="state === 'appeals'">
                    <div v-for="i in 7" :key="i">
                      <!-- <q-item clickable @click="''" :class="darkMode ? 'pt-dark-card-2 text-white' : ''"> -->
                        <div class="q-px-lg" @click="$emit('openMessage', { info: chats[0], type: 'open-message'})">
                          <div class="q-pt-md q-px-md">
                            <q-badge rounded dense :color="i%2 === 0 ? 'red-6' : 'blue-6'" :label="i%2 === 0 ? 'Release' : 'Refund'" />
                            <div class="q-pt-xs" style="font-weight: 500;">
                              Order #001{{ i }}
                            </div>
                            <div style="font-size: 12px;" :class="darkMode ? 'text-grey-5' : 'text-grey-7'">
                              <span style="font-size: 13px;">
                                Hi there!
                              </span>
                              &nbsp;<q-icon size=".5em" name='circle'/>&nbsp;
                              <span>
                                {{ i*5 }} min ago
                              </span>
                            </div>
                            <q-badge outline rounded dense :color="darkMode ? 'blue-grey-3' : 'blue-grey-5'" label="Fiat Ramp" />
                          </div>
                          <q-separator :dark="darkMode" class="q-mt-sm q-mx-sm"/>
                        </div>
                      <!-- </q-item> -->
                    </div>
                  </q-list>
                </q-infinite-scroll>
              </q-list>
            </q-pull-to-refresh>
          </div>
        </div>
      </q-card>
    </div>
  </div>
  <q-dialog v-model="menu" persistent>
    <q-card style="width: 100%;" class="br-15">
        <div class="row q-py-md q-px-sm">
          <q-icon size="sm" name="close" v-close-popup/>
        </div>
        <div class="text-center q-px-lg">
          <q-input bottom-slots v-model="search" placeholder="Search..." dense rounded outlined :dark="darkMode">
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>
    </q-card>
  </q-dialog>
</template>
<script>
import { ref } from 'vue'

export default {
  setup () {
    const scrollTargetRef = ref(null)
    return {
      scrollTargetRef
    }
  },
  computed: {
    hasCompose () {
      return this.state === 'chats'
    }
  },
  data () {
    return {
      darkMode: this.$store.getters['darkmode/getStatus'],
      minHeight: this.$q.platform.is.ios ? this.$q.screen.height - (95 + 130) : this.$q.screen.height - (70 + 110),
      search: '',
      menu: false,
      chats: [
        {
          id: 1,
          text: 'Hello',
          sentFrom: { id: 1, name: 'Ben' },
          sentTo: { id: 2, name: 'Anne' },
          date: '1m'
        },
        {
          id: 2,
          text: 'Hello World',
          sentFrom: { id: 1, name: 'Leia' },
          sentTo: { id: 2, name: 'Anne' },
          date: '3h'
        },
        {
          id: 3,
          text: 'What',
          sentFrom: { id: 1, name: 'Sandy' },
          sentTo: { id: 2, name: 'Anne' },
          date: '2w'
        }
      ],
      isloaded: false
      // chat: {
      //   id: 1,
      //   text: 'Hello',
      //   sentFrom: { id: 1, name: 'Ben' },
      //   sentTo: { id: 2, name: 'Anne' },
      //   date: '1m'
      // }
    }
  },
  props: {
    state: String
  },
  emits: ['openMessage'],
  async mounted () {
    console.log('chat body')
    this.isloaded = true
  },
  methods: {
    refreshData (done) {
      console.log('refreshing data')
      setTimeout(() => {
        done()
      }, 1000)
    },
    onRight ({reset}) {
      setTimeout(() => {
        reset()
      }, 500)
    },
    onLeft ({reset}) {
      setTimeout(() => {
        reset()
      }, 500)
    }
  }
}
</script>
