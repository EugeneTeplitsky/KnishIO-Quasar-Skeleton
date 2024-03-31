<template>
  <q-form
    class="row q-col-gutter-sm flex-center"
    @submit.prevent="handleLogin"
    :class="{ 'shake-animation': loginError }"
  >
    <div class="col">
      <q-input
        v-model="email"
        type="email"
        label="Email"
        :rules="[val => !!val || '', isValidEmail]"
        hide-bottom-space
        lazy-rules
        outlined
        dense
        dark
        :disable="loading"
      />
    </div>
    <div class="col">
      <q-input
        v-model="password"
        type="password"
        label="Password"
        :rules="[val => !!val || '']"
        hide-bottom-space
        lazy-rules
        outlined
        dense
        dark
        :disable="loading"
      />
    </div>
    <div class="col-shink">
      <q-btn
        type="submit"
        color="white"
        text-color="primary"
        :label="loading ? null : 'Login'"
        :disabled="!isFormValid || loading"
      >
        <q-spinner
          v-if="loading"
          color="primary"
          size="xs"
        />
      </q-btn>
    </div>
  </q-form>
</template>

<script setup>
import {
  computed,
  ref
} from 'vue'
import { useRouter } from 'vue-router'
import hasDltStore from 'src/mixins/hasDltStore'
import { useQuasar } from 'quasar'

const $q = useQuasar()

// Use the dltStore mixin
const { dltStore } = hasDltStore()

const email = ref('')
const password = ref('')
const loginError = ref(false)
const loading = ref(false)

const router = useRouter()

const isValidEmail = val => {
  const emailPattern = /^(?=[a-zA-Z0-9@._%+-]{6,254}$)[a-zA-Z0-9._%+-]{1,64}@(?:[a-zA-Z0-9-]{1,63}\.){1,8}[a-zA-Z]{2,63}$/
  return emailPattern.test(val) || 'Invalid email format'
}

const isFormValid = computed(() => {
  return isValidEmail(email.value) === true && password.value
})

const handleLogin = async () => {
  loginError.value = false
  loading.value = true

  try {
    const loginResult = await dltStore.login({
      username: email.value,
      password: password.value
    })

    if (loginResult) {
      // User is logged in successfully
      await router.push({ name: 'dashboard' })
    } else {
      // Handle bad login
      loginError.value = true
      showErrorNotification('Invalid email or password. Please try again.')
    }
  } catch (error) {
    console.error('Login error:', error)
    loginError.value = true
    showErrorNotification('An error occurred during login. Please try again.')
  } finally {
    loading.value = false
  }
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
