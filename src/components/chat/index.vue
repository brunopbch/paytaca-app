<template>
  <div class="q-px-md">
    <!-- Search -->
    <div class="text-center q-pt-lg q-px-lg">
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
        <div class="text-center row no-wrap items-center q-pa-sm q-pt-md">
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
          <div class="text-center" style="margin-top: 50px" v-if="chats.length === 0">
            <div class="q-pt-lg">
              <q-icon color="blue-grey-5" size="3em" name="sym_o_comments_disabled"/>
            </div>
            <div class="q-pt-sm" style="opacity: .5;">
              No existing conversations
            </div>
          </div>
          <div v-else>
            <q-list :style="`max-height: ${minHeight - 50}px`" style="overflow:auto;">
              <div v-for="(chat, index) in chats" :key="index">
                  <q-item clickable @click="$emit('openMessage', chat)">
                    <q-item-section>
                      <div class="row q-px-lg">
                        <div>
                          <q-avatar size="md" style="padding-top: 13px;">
                            <q-img style="filter: grayscale(30%);" loading="lazy" spinner-color="white"  :src="`https://ui-avatars.com/api/?background=random&name=${chat.sentFrom.name}&color=fffff`" />
                          </q-avatar>
                        </div>
                        <div  class="q-pt-sm q-mr-md q-pl-xs">
                          <div class="q-mx-sm" style="font-size: 15px; font-weight: 500;">
                            {{ chat.sentFrom.name }}
                          </div>
                          <div style="font-size: 12px;" class="text-grey-7 q-px-sm">
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
                      <q-separator :dark="darkMode" class="q-mt-sm q-mx-md"/>
                    </q-item-section>
                  </q-item>
                </div>
                </q-list>
            <!-- <q-list> -->
              <!-- <div  class="q-pt-md q-mx-lg q-px-md">
                <div class="q-mx-sm" style="font-size: 15px; font-weight: 500;">
                  {{ chat.sentFrom.name }}
                </div>
                <div style="font-size: 12px;" class="text-grey-7 q-px-sm">
                  <span style="font-size: 13px;">
                    {{ chat.text }}
                  </span>
                  &nbsp;<q-icon size=".5em" name='circle'/>&nbsp;
                  <span>
                    {{ chat.date }}
                  </span>
                </div>

                <q-separator :dark="darkMode" class="q-mt-sm"/>
              </div> -->
            <!-- </q-list> -->
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
      minHeight: this.$q.platform.is.ios ? this.$q.screen.height - (95 + 190) : this.$q.screen.height - (70 + 170),
      search: '',
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
  }
}
</script>
