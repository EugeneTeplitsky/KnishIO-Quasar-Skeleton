<template>
  <q-form
    class="row q-col-gutter-sm flex-center"
    @submit.prevent="handleLogin"
  >
    <div>
      <q-input
        v-model="email"
        type="email"
        label="Email"
        :rules="[val => !!val || 'Email is required', isValidEmail]"
        lazy-rules
        outlined
        dense
        dark
        hide-bottom-space
        :disable="loading"
      />
    </div>
    <div>
      <q-input
        v-model="password"
        type="password"
        label="Password"
        :rules="[val => !!val || 'Password is required']"
        lazy-rules
        outlined
        dense
        dark
        hide-bottom-space
        :disable="loading"
      />
    </div>
    <div
      v-if="loginError"
      class="text-negative q-mb-md"
    >
      Invalid email or password. Please try again.
    </div>
    <div>
      <q-btn
        type="submit"
        color="white"
        text-color="primary"
        :label="loading ? null : 'Login'"
        :disabled="loading"
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import hasDltStore from 'src/mixins/hasDltStore'

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
    }
  } catch (error) {
    console.error('Login error:', error)
    loginError.value = true
  } finally {
    loading.value = false
  }
}
</script>
