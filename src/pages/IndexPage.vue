<template>
  <q-page class="flex flex-center">

    <q-card>
      <q-card-section>
        <register-form />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import RegisterForm from 'components/RegisterForm.vue'

defineOptions({
  name: 'IndexPage',
  data () {
    return {
    }
  }
})
</script>
