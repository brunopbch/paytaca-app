<template>
  <div class="text-center q-px-md">
    <!-- Search -->
    <div class="q-pt-lg q-px-lg">
      <q-input bottom-slots v-model="search" placeholder="Search..." dense rounded outlined>
        <template v-slot:append>
          <q-icon name="search" />
        </template>
      </q-input>
    </div>
    <div>
      <q-card
        class="br-15 q-pt-sm q-mx-none q-mb-lg q-mx-xs"
        :class="[ darkMode ? 'text-white pt-dark-card-2' : 'text-black',]"
        :style="`height: ${ minHeight }px;`"
      >
        <!-- Top Icons -->
        <div class="row no-wrap items-center q-pa-sm q-pt-md">
          <div class="col-2">
            <q-icon size="sm" name='sym_o_filter_list'/>
          </div>

          <div class="col-8 text-uppercase bold-text" style="font-size: 18px; font-weight: 500">
            {{ state }}
          </div>

          <div class="col-2">
            <q-icon size="sm" name='sym_o_create'/>
          </div>
        </div>

        <!-- Message List -->
        <div>
          <div style="margin-top: 50px" v-if="chats.length === 0">
            <div class="q-pt-lg">
              <q-icon color="blue-grey-5" size="3em" name="sym_o_comments_disabled"/>
            </div>
            <div class="q-pt-sm" style="opacity: .5;">
              No existing conversations
            </div>
          </div>
          <div v-else>
            <div>

            </div>
          </div>
        </div>
      </q-card>
    </div>
  </div>
</template>
<script>

export default {
  data () {
    return {
      darkMode: this.$store.getters['darkmode/getStatus'],
      search: '',
      minHeight: this.$q.platform.is.ios ? this.$q.screen.height - (95 + 190) : this.$q.screen.height - (70 + 170),
      chats: [],
      isloaded: false,
      chat: {
        id: 1,
        text: 'Hello',
        sentFrom: { id: 1, name: 'Ben' },
        sentTo: { id: 2, name: 'Anne' }
      }
    }
  },
  props: {
    state: String
  },
  async mounted () {
    console.log('chat body')
  }
}
</script>
