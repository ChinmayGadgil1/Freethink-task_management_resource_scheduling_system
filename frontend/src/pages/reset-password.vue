<template>
  <q-layout view="hHh lpR fFf">

    <q-page-container>

      <q-page class="relative-position window-height">

        <!-- Background -->
        <q-img
          :src="backgroundImage"
          fit="cover"
          class="absolute-full"
        />

        <!-- Reset Password Card -->
        <div class="absolute-full flex flex-center">

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
                  Reset Password
                </div>

                <div class="text-body2 text-grey-7 q-mt-sm">
                  Enter the reset token and your new password below.
                </div>

              </q-card-section>


              <!-- Reset Password Form -->
              <q-card-section>

                <q-form
                  @submit.prevent="handleResetPassword"
                  class="q-gutter-y-md"
                >

                  <!-- Reset Token -->
                  <q-input
                    v-model="form.token"
                    outlined
                    dense
                    label="Reset Token"
                    :rules="[
                      val =>
                        !!val ||
                        'Reset token is required'
                    ]"
                  >
                    <template #prepend>
                      <q-icon name="key" />
                    </template>
                  </q-input>


                  <!-- New Password -->
                  <q-input
                    v-model="form.password"
                    outlined
                    dense
                    label="New Password"
                    :type="
                      showPassword
                        ? 'text'
                        : 'password'
                    "
                    :rules="passwordRules"
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
                        :label="
                          showPassword
                            ? 'Hide'
                            : 'Show'
                        "
                        @click="
                          showPassword =
                            !showPassword
                        "
                      />

                    </template>

                  </q-input>


                  <!-- Confirm Password -->
                  <q-input
                    v-model="form.confirmPassword"
                    outlined
                    dense
                    label="Confirm New Password"
                    :type="
                      showConfirmPassword
                        ? 'text'
                        : 'password'
                    "
                    :rules="[
                      val =>
                        !!val ||
                        'Please confirm your password',

                      val =>
                        val === form.password ||
                        'Passwords do not match'
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
                        :label="
                          showConfirmPassword
                            ? 'Hide'
                            : 'Show'
                        "
                        @click="
                          showConfirmPassword =
                            !showConfirmPassword
                        "
                      />

                    </template>

                  </q-input>


                  <!-- Update Password -->
                  <q-btn
                    type="submit"
                    elevated
                    no-caps
                    label="Update Password"
                    color="orange-3"
                    text-color="dark"
                    class="full-width rounded-borders"
                    size="md"
                    :loading="loading"
                  />

                </q-form>

              </q-card-section>


              <!-- Back to Login -->
              <q-card-section class="text-center">

                <div class="text-caption text-grey-7">

                  Remembered your password?

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

        </div>

      </q-page>

    </q-page-container>

  </q-layout>
</template>


<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'

import backgroundImage from '../assets/image.png'

const $q = useQuasar()
const router = useRouter()


const form = reactive({
  token: '',
  password: '',
  confirmPassword: ''
})

const showPassword = ref(false)
const showConfirmPassword = ref(false)
const loading = ref(false)

/* Password rules: */
const passwordRules = [
  (val: string) =>
    !!val ||
    'Password is required',

  (val: string) =>
    val.length >= 6 ||
    'Password must be at least 6 characters',

  (val: string) =>
    /^[A-Z]/.test(val) ||
    'First character must be uppercase',

  (val: string) =>
    /[0-9]/.test(val) ||
    'Password must contain at least one number',

  (val: string) =>
    /[^A-Za-z0-9]/.test(val) ||
    'Password must contain at least one special character'
]


const handleResetPassword = async () => {

  loading.value = true

  try {
    /* Backend :
     * POST /api/auth/reset-password
     * Data:
     * {
     *   token: form.token,
     *   newPassword: form.password
     * } */

    console.log('Reset Password:', {
      token: form.token,
      newPassword: form.password
    })

    await new Promise(
      resolve => setTimeout(resolve, 800)
    )

    $q.notify({
      type: 'positive',
      message: 'Password reset successful!'
    })

    void router.push('/')

  } catch (error) {

    console.error(error)

    $q.notify({
      type: 'negative',
      message: 'Password reset failed'
    })

  } finally {
    loading.value = false
  }
}

const goToLogin = () => {
  void router.push('/')
}

</script>
