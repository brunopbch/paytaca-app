<template>
  <div id="app-container" :class="{'pt-dark': darkMode}">
    <HeaderNav
      :title="$t('Chats')"
      backnavpath="/apps"
    />

    <ChatIndex
      v-if="!openMessage"
      :state="state"
      @open-message="openChat"
    />
    <ChatMessages
      v-if="openMessage"
      :chat-data="chatData"
      :type="type"
      @back="openMessage = false"
    />

    <FooterMenu
      @clicked="selectMenu"
    />
  </div>
</template>
<script>
import HeaderNav from 'src/components/header-nav.vue'
import FooterMenu from 'src/components/chat/footerMenu.vue'
import ChatIndex from 'src/components/chat/index.vue'
import ChatMessages from 'src/components/chat/ChatMessages.vue'

export default {
  data () {
    return {
      darkMode: this.$store.getters['darkmode/getStatus'],
      state: 'chats',
      openMessage: false,
      chatData: null,
      type: 'open-message'
    }
  },
  components: {
    HeaderNav,
    FooterMenu,
    ChatIndex,
    ChatMessages
  },
  methods: {
    selectMenu (item) {
      console.log(item)
      this.openMessage = false
      this.state = item
    },
    openChat (item) {
      console.log('opening message')
      console.log('data: ', item)
      this.chatData = item.info
      this.openMessage = true
      this.type = item.type
    }
  }
}
</script>
