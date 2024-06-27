<template>
  <q-page class="q-pa-lg">
    <div class="row">
      <div class="col-12 col-md-6 q-pr-md q-pb-md">
        <q-form class="row col-12 col-md-6 q-pb-md" @submit.prevent="search">
          <div class="col-6 col-md q-mr-md">
            <q-input v-model="searchText" type="text" label="Search meta types" :rules="[val => !!val || '']"
              hide-bottom-space lazy-rules outlined dense :disable="loading" />
          </div>
          <div class="col-shink">
            <q-btn type="submit" color="white" text-color="primary" :label="loading ? null : 'Search'"
              :disabled="!searchText || loading">
              <q-spinner v-if="loading" color="primary" size="xs" />
            </q-btn>
          </div>
        </q-form>
        <div v-for="instance in dltStore.wallets.instances" :key="instance.metaId">
          <q-table :title="instance.metaType" :rows="instance.metas" :columns="columns" row-key="key" />
        </div>
      </div>

      <q-form class="row col-12 col-md-6" @submit.prevent="handleSubmit" :class="{ 'shake-animation': formError }">
        <div class="col-3 col-md q-mr-md">
          <q-input v-model="metaKey" type="text" label="Meta Key" :rules="[val => !!val || '']" hide-bottom-space
            lazy-rules outlined dense :disable="loading" />
        </div>
        <div class="col-3 col-md q-mr-md">
          <q-input v-model="metaValue" type="text" label="Meta Value" :rules="[val => !!val || '']" hide-bottom-space
            lazy-rules outlined dense :disable="loading" />
        </div>
        <div class="col-3 col-md q-mr-md">
          <q-input v-model="metaType" type="text" label="Meta Type" :rules="[val => !!val || '']" hide-bottom-space
            lazy-rules outlined dense :disable="loading" />
        </div>
        <div class="col-shink">
          <q-btn type="submit" color="white" text-color="primary" :label="loading ? null : 'Create'"
            :disabled="!isFormValid || loading">
            <q-spinner v-if="loading" color="primary" size="xs" />
          </q-btn>
        </div>
      </q-form>
    </div>
  </q-page>
</template>

<script setup>
import {
  computed,
  ref
} from 'vue'
import hasDltStore from 'src/mixins/hasDltStore'
import { useQuasar } from 'quasar'

const $q = useQuasar()

// Use the dltStore mixin
const { dltStore } = hasDltStore()

const columns = ref([
  { name: 'key', align: 'left', label: 'Meta key', field: 'key' },
  { name: 'value', align: 'left', label: 'Meta value', field: 'value' }
])

const metaKey = ref('')
const metaValue = ref('')
const metaType = ref('')
const formError = ref(false)
const loading = ref(false)

const searchText = ref('')
const isSearched = ref(false)

const isFormValid = computed(() => {
  return metaKey.value && metaValue.value && metaType.value
})

const handleSubmit = async () => {
  formError.value = false
  loading.value = true

  try {
    const result = await dltStore.writeMeta(metaKey.value, metaValue.value, metaType.value)
    if (result) {
      await queryMeta()
    } else {
      formError.value = true
      showErrorNotification('Something went wrong!')
    }
  } catch (error) {
    formError.value = true
    showErrorNotification('An error occurred during form submission. Please try again.')
  } finally {
    loading.value = false
    metaKey.value = ''
    metaValue.value = ''
    metaType.value = ''
  }
}

const queryMeta = async () => {
  if (isSearched.value) {
    await dltStore.queryMeta(searchText.value)
  } else {
    await dltStore.queryMeta()
  }
}

const search = async () => {
  isSearched.value = true
  await queryMeta()
}

const showErrorNotification = (message) => {
  $q.notify({
    message,
    color: 'negative',
    position: 'top',
    timeout: 3000
  })
}
</script>
<style scoped>
.shake-animation {
  animation: shake 0.5s;
}

@keyframes shake {
  10%, 90% {
    transform: translate3d(-1px, 0, 0);
  }

  20%, 80% {
    transform: translate3d(2px, 0, 0);
  }

  30%, 50%, 70% {
    transform: translate3d(-4px, 0, 0);
  }

  40%, 60% {
    transform: translate3d(4px, 0, 0);
  }
}
</style>
