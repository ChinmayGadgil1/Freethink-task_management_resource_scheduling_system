<template>
  <div
    class="col-12 col-sm-9 col-md-6 col-lg-5 q-px-md"
    style="width: 100%; max-width: 480px;"
  >
    <q-card
      flat
      class="bg-white q-pa-lg"
      style="
        border-radius: 20px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
      "
    >
      <!-- Card Header -->
      <q-card-section class="text-center">
        <div class="text-h5 text-weight-bold">
          Create Account
        </div>
        <div class="text-body2 text-grey-7 q-mt-sm">
          Create your account to get started
        </div>
      </q-card-section>

      <!-- Signup Form -->
      <q-card-section>
        <q-form
          @submit.prevent="handleSignup"
          class="q-gutter-y-sm"
        >
          <!-- Full Name -->
          <q-input
            v-model="form.name"
            outlined
            dense
            label="Full Name"
            :rules="[
              val => !!val || 'Name is required'
            ]"
          >
            <template #prepend>
              <q-icon name="person_outline" />
            </template>
          </q-input>

          <!-- Email -->
          <q-input
            v-model="form.email"
            outlined
            dense
            label="Enter Email-id"
            type="email"
            :rules="[
              val => !!val || 'Email is required',
              val => /.+@.+\..+/.test(val) || 'Enter a valid email'
            ]"
          >
            <template #prepend>
              <q-icon name="mail_outline" />
            </template>
          </q-input>

          <!-- Password -->
          <q-input
            v-model="form.password"
            outlined
            dense
            label="Password"
            :type="showPassword ? 'text' : 'password'"
            :rules="[
              val => !!val || 'Password is required',
              val => val.length >= 6 || 'Password must be at least 6 characters',
              val => /^[A-Z]/.test(val) || 'First character must be uppercase',
              val => /[0-9]/.test(val) || 'Password must contain at least one number',
              val => /[^A-Za-z0-9]/.test(val) || 'Password must contain at least one special character'
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

          <!-- Confirm Password -->
          <q-input
            v-model="form.confirmPassword"
            outlined
            dense
            label="Confirm Password"
            :type="showConfirmPassword ? 'text' : 'password'"
            :rules="[
              val => !!val || 'Please confirm your password',
              val => val === form.password || 'Passwords do not match'
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
                :label="showConfirmPassword ? 'Hide' : 'Show'"
                @click="showConfirmPassword = !showConfirmPassword"
              />
            </template>
          </q-input>

          <!-- Create Account Button -->
          <q-btn
            type="submit"
            elevated
            no-caps
            label="Create Account"
            color="orange-3"
            text-color="dark"
            class="full-width rounded-borders"
            size="md"
            :loading="loading"
          />
        </q-form>
      </q-card-section>

      <!-- Login Link -->
      <q-card-section class="text-center">
        <div class="text-caption text-grey-7">
          Already have an account?
          <q-btn
            flat
            dense
            no-caps
            label="Sign in"
            color="dark"
            class="q-pa-none text-weight-bold"
            @click="goToLogin"
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

const $q = useQuasar()
const router = useRouter()

const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const showPassword = ref(false)
const showConfirmPassword = ref(false)
const loading = ref(false)

const handleSignup = async () => {
  loading.value = true
  try {
    console.log('Signup:', form)
    await new Promise(resolve => setTimeout(resolve, 800))
    $q.notify({
      type: 'positive',
      message: 'Account created successfully'
    })
  } catch (error) {
    console.error(error)
    $q.notify({
      type: 'negative',
      message: 'Signup failed'
    })
  } finally {
    loading.value = false
  }
}

const goToLogin = () => {
  void router.push('/')
}
</script>
