<template>
  <div
    class="col-12 col-sm-9 col-md-6 col-lg-5 q-px-md"
    style="width: 100%; max-width: 540px;"
  >
    <q-card
      flat
      class="bg-white q-pa-xl"
      style="border-radius: 20px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);"
    >
      <!-- Card Header -->
      <q-card-section class="text-center q-pb-md">
        <div class="text-h5 text-weight-bold">
          Login
        </div>
        <div class="text-body2 text-grey-7 q-mt-sm">
          Hey, Enter your details to get sign in
          <br>
          to your account
        </div>
      </q-card-section>

      <!-- Login Form -->
      <q-card-section>
        <q-form
          @submit.prevent="handleLogin"
          style="display: flex; flex-direction: column; gap: 18px;"
        >
          <!-- Email -->
          <q-input
            v-model="form.email"
            outlined
            dense
            hide-bottom-space
            label="Enter Email-id"
            type="email"
            :rules="[
              val => !!val || 'Email is required',
              val => /.+@.+\..+/.test(val) || 'Enter a valid email'
            ]"
          >
            <template #prepend>
              <q-icon name="person_outline" />
            </template>
          </q-input>

          <!-- Password -->
          <q-input
            v-model="form.password"
            outlined
            dense
            hide-bottom-space
            label="Password"
            :type="showPassword ? 'text' : 'password'"
            :rules="[
              val => !!val || 'Password is required'
            ]"
          >
            <template #prepend>
              <q-icon name="lock_outline" />
            </template>

            <template #append>
              <q-btn
                flat
                dense
                no-caps
                size="sm"
                :label="showPassword ? 'Hide' : 'Show'"
                @click="showPassword = !showPassword"
              />
            </template>
          </q-input>

          <!-- Forgot Password -->
          <div class="row justify-end" style="margin-top: -8px;">
            <q-btn
              flat
              dense
              no-caps
              size="sm"
              label="Forgot password?"
              color="grey-7"
              class="text-weight-medium"
              @click="goToForgotPassword"
            />
          </div>

          <!-- Sign In Button -->
          <q-btn
            type="submit"
            elevated
            no-caps
            label="Sign in"
            color="orange-3"
            text-color="dark"
            class="full-width rounded-borders"
            size="md"
            :loading="loading"
          />
        </q-form>
      </q-card-section>

      <!-- Register Link -->
      <q-card-section class="text-center q-pt-sm">
        <div class="text-caption text-grey-7">
          Don't have an account?
          <q-btn
            flat
            dense
            no-caps
            label="Sign up"
            color="dark"
            class="q-pa-none text-weight-bold"
            @click="goToRegister"
          />
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import { signinApi } from '@/services/api'

const $q = useQuasar()
const router = useRouter()

const form = reactive({
  email: '',
  password: ''
})

const showPassword = ref(false)
const loading = ref(false)

const handleLogin = async () => {
  loading.value = true
  try {
    const data = await signinApi({
      email: form.email,
      password: form.password
    })

    console.log('Sign in response:', data)

    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user))
    }

    const messageText = data.user?.name
      ? `Signed in successfully! Welcome ${data.user.name}`
      : (data.message || 'Sign in successful!')

    sessionStorage.setItem('flashMessage', messageText)

    $q.notify({
      type: 'positive',
      message: messageText,
      position: 'top',
      timeout: 3000
    })

    await new Promise(resolve => setTimeout(resolve, 300))

    // Redirect based on user role
    const role = data.user?.role
    if (role === 'PROJECT_MANAGER') {
      void router.push('/app/pm-dashboard')
    } else if (role === 'RESOURCE') {
      void router.push('/app/resource-dashboard')
    } else {
      void router.push('/app')
    }
  } catch (error: any) {
    console.error('Login error:', error)
    $q.notify({
      type: 'negative',
      message: error.message || 'Login failed',
      position: 'top',
      timeout: 3000
    })
  } finally {
    loading.value = false
  }
}

const goToRegister = () => {
  void router.push('/signup')
}

const goToForgotPassword = () => {
  void router.push('/forgot-password')
}
</script>
