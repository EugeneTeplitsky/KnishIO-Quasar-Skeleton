<template>
  <q-page class="flex flex-center">
    Welcome, {{ dltStore.profile.publicName }}
  </q-page>
</template>

<script setup>
import hasDltStore from 'src/mixins/hasDltStore'

const { dltStore } = hasDltStore()
</script>
