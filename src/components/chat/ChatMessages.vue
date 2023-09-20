<template>
  <div class="q-pt-lg q-mx-xs">
    <q-card
      class="br-15 q-pt-sm q-mx-md q-mx-none q-mb-lg"
      :class="[ darkMode ? 'text-white pt-dark-card-2' : 'text-black',]"
      :style="`height: ${minHeight}px;`"
    >
    <div v-if="isloaded">
      <div class="row">
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

      <!-- Convo -->
      <div class="q-mt-sm" style="background-color: #F2F3FC;" :style="`height: ${minHeight - 130}px`">
        Hello
      </div>

      <!-- Message Input -->
      <div class="row q-pt-sm q-px-sm">
        <q-input class="col q-px-sm" rounded outlined dense v-model="message" placeholder="Enter message..."></q-input>
        <q-icon color="grey-7" size="lg" name='sym_o_send' @click="message = ''"/>&nbsp;
      </div>
    </div>
  </q-card>
  </div>
</template>
<script>

export default {
  data () {
    return {
      darkMode: this.$store.getters['darkmode/getStatus'],
      minHeight: this.$q.platform.is.ios ? this.$q.screen.height - (95 + 130) : this.$q.screen.height - (70 + 110),
      chatInfo: null,
      convo: null,
      isloaded: false,
      message: ''
    }
  },
  props: {
    chatData: {
      type: Object,
      default: null
    },
    chatId: Number
  },
  emits: ['back'],
  methods: {
  },
  async mounted () {
    console.log('chat messages')
    this.chatInfo = this.chatData

    this.isloaded = true
    console.log(this.chatInfo)
  }
}
</script>
