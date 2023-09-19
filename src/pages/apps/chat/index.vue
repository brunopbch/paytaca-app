<template>
  <div id="app-container" :class="{'pt-dark': darkMode}">
    <HeaderNav
      :title="$t('Chats')"
      backnavpath="/apps"
    />

    <ChatIndex
      :state="state"
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

export default {
  data () {
    return {
      darkMode: this.$store.getters['darkmode/getStatus'],
      state: 'chats'
    }
  },
  components: {
    HeaderNav,
    FooterMenu,
    ChatIndex
  },
  methods: {
    selectMenu (item) {
      console.log(item)
      this.state = item
    }
  }
}
</script>
