<template>
  <q-form
    class="row q-col-gutter-sm flex-center"
    @submit.prevent="handleLogout"
  >
    <div>
      <q-btn
        type="submit"
        color="white"
        text-color="primary"
        label="Log Out"
      />
    </div>
  </q-form>
</template>

<script setup>
import { useRouter } from 'vue-router'
import hasDltStore from 'src/mixins/hasDltStore'

// Use the dltStore mixin
const { dltStore } = hasDltStore()

const router = useRouter()

const handleLogout = async () => {
  await dltStore.logout()
  await router.push({ name: 'home' })
}
</script>
