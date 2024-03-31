<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title>
          Knish.IO App Skeleton
        </q-toolbar-title>

        <div
          v-if="dltStore.isInitialized"
        >
          <logout-form
            v-if="dltStore.isLoggedIn"
          />
          <login-form
            v-else
          />
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
    >
      <q-list>
        <q-item-label
          header
        >
          Essential Links
        </q-item-label>

        <EssentialLink
          v-for="link in linksList"
          :key="link.title"
          v-bind="link"
        />
      </q-list>
    </q-drawer>

    <q-page-container>
      <div
        v-if="dltStore.isInitialized"
      >
        <router-view />
      </div>
      <div
        v-else
        class="row fit flex-center"
      >
        <q-spinner
          size="50vh"
          color="primary"
        />
      </div>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import {
  onMounted,
  ref,
  watch
} from 'vue'
import { useRouter } from 'vue-router'
import EssentialLink from 'components/EssentialLink.vue'
import hasDltStore from 'src/mixins/hasDltStore'
import { KNISHIO_SETTINGS } from 'src/libraries/constants/knishio.js'
import LoginForm from 'components/LoginForm.vue'
import LogoutForm from 'components/LogoutForm.vue'

defineOptions({
  name: 'MainLayout'
})

// Use the dltStore mixin
const { dltStore } = hasDltStore()
const router = useRouter()
const linksList = [
  {
    title: 'Knish.IO Technical Whitepaper',
    caption: 'Version 6.1',
    icon: 'news',
    link: 'https://github.com/WishKnish/KnishIO-Technical-Whitepaper#readme'
  }
]

// Watch for changes in the user's login status
watch(
  () => dltStore.isLoggedIn,
  (isLoggedIn) => {
    if (isLoggedIn) {
      // User is logged in, redirect to the Dashboard
      router.push({ name: 'dashboard' })
    } else {
      router.push({ name: 'home' })
    }
  }
)

// Session restoration logic
onMounted(async () => {
  try {
    // Connect to the Knish.IO servers
    await dltStore.connect(KNISHIO_SETTINGS.serverUriConfig)

    // Initialize the user session
    await dltStore.init()

    // Check if the user is logged in
    if (dltStore.isLoggedIn) {
      // User is logged in, perform any necessary actions
      console.log(`Welcome, ${dltStore.profile.publicName}`)
      // Example: Redirect to a dashboard page
      // this.$router.push('/dashboard')
    } else {
      // User is not logged in, perform any necessary actions
      console.log('User is not logged in')
      // Example: Redirect to a login page
      // this.$router.push('/login')
    }
  } catch (error) {
    // Handle any errors that occur during session restoration
    console.error('Error restoring session:', error)
    // Example: Show an error message to the user
    // this.$q.notify({
    //   message: 'Failed to restore session. Please try again.',
    //   color: 'negative'
    // })
  }
})

const leftDrawerOpen = ref(false)

function toggleLeftDrawer () {
  leftDrawerOpen.value = !leftDrawerOpen.value
}
</script>
