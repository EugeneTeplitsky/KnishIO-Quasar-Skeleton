<template>
  <q-form
    class="register-form"
    @submit.prevent="handleRegister"
  >
    <div class="public-username-field q-mb-md">
      <q-input
        v-model="publicName"
        label="Public Username"
        outlined
        dense
        :disable="true"
      />
      <q-btn
        icon="refresh"
        @click="generatePublicName"
      />
    </div>

    <q-input
      v-model="email"
      type="email"
      label="Email"
      :rules="emailRules"
      lazy-rules
      outlined
      dense
      :disable="loading"
    />

    <q-input
      v-model="password"
      type="password"
      label="Password"
      :rules="passwordRules"
      lazy-rules
      outlined
      dense
      :disable="loading"
    />

    <q-list
      class="password-criteria"
      dense
    >
      <q-item
        v-for="(criterion, index) in passwordCriteria"
        :key="index"
      >
        <q-item-section
          avatar
        >
          <q-icon :name="criterion.met ? 'check' : 'close'" />
        </q-item-section>
        <q-item-section>
          <q-item-label
            caption
          >
            {{ criterion.text }}
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-list>

    <q-linear-progress :value="passwordStrength" />

    <div
      v-if="registerError"
      class="text-negative q-mb-md"
    >
      Registration failed. Please try again.
    </div>

    <div
      class="text-center q-mt-md"
    >
      <q-btn
        type="submit"
        color="primary"
        :label="loading ? null : 'Register'"
        :disabled="!isFormValid || loading"
      >
        <q-spinner
          v-if="loading"
          color="white"
          size="xs"
        />
      </q-btn>
    </div>
  </q-form>
</template>

<script setup>
import {
  ref,
  computed
} from 'vue'
import { useRouter } from 'vue-router'
import hasDltStore from 'src/mixins/hasDltStore'
import { randomName } from 'src/libraries/strings'

const { dltStore } = hasDltStore()

const email = ref('')
const password = ref('')
const publicName = ref(randomName())
const registerError = ref(false)
const loading = ref(false)

const router = useRouter()

const isValidEmail = val => {
  const emailPattern = /^(?=[a-zA-Z0-9@._%+-]{6,254}$)[a-zA-Z0-9._%+-]{1,64}@(?:[a-zA-Z0-9-]{1,63}\.){1,8}[a-zA-Z]{2,63}$/
  return emailPattern.test(val) || 'Invalid email format'
}

const emailRules = computed(() => [
  val => !!val || 'Email is required',
  isValidEmail,
  async val => {
    if (val) {
      const isUnique = await dltStore.isUsernameUnique(val)
      return isUnique || 'Email is already registered'
    }
    return true
  }
])

const passwordCriteria = computed(() => [
  {
    text: 'Uppercase letter',
    met: /[A-Z]/.test(password.value)
  },
  {
    text: 'Lowercase letter',
    met: /[a-z]/.test(password.value)
  },
  {
    text: 'Number',
    met: /[0-9]/.test(password.value)
  },
  {
    text: 'Special character',
    met: /[^A-Za-z0-9]/.test(password.value)
  }
])

const passwordRules = computed(() => {
  const metCriteria = passwordCriteria.value.filter(criterion => criterion.met).length
  const requireAllCriteria = metCriteria < 3

  return [
    val => !!val || 'Password is required',
    val => (val.length >= 6 && val.length <= 64) || 'Password must be between 6 and 64 characters',
    val => !requireAllCriteria || /[A-Z]/.test(val) || 'Password must include an uppercase letter',
    val => !requireAllCriteria || /[a-z]/.test(val) || 'Password must include a lowercase letter',
    val => !requireAllCriteria || /[0-9]/.test(val) || 'Password must include a number',
    val => !requireAllCriteria || /[^A-Za-z0-9]/.test(val) || 'Password must include a special character'
  ]
})

const passwordStrength = computed(() => {
  const metCriteria = passwordCriteria.value.filter(criterion => criterion.met).length
  return metCriteria / passwordCriteria.value.length
})

const isFormValid = computed(() => {
  const metCriteria = passwordCriteria.value.filter(criterion => criterion.met).length
  return isValidEmail(email.value) === true && metCriteria >= 3
})

const generatePublicName = () => {
  publicName.value = randomName()
}

const handleRegister = async () => {
  registerError.value = false
  loading.value = true

  try {
    const registerResult = await dltStore.register({
      username: email.value,
      password: password.value,
      publicName: publicName.value
    })

    if (registerResult === true) {
      // Registration successful, navigate to dashboard or desired page
      await router.push({ name: 'dashboard' })
    } else {
      // Handle registration failure
      registerError.value = true
    }
  } catch (error) {
    console.error('Registration error:', error)
    registerError.value = true
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.public-username-field {
  display: flex;
  align-items: center;
}

.public-username-field > .q-btn {
  margin-left: 8px;
}

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
