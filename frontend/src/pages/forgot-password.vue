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

        <!-- Forgot Password Card -->
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
                  Forgot Password?
                </div>

                <div class="text-body2 text-grey-7 q-mt-sm">
                  Enter your email address and we'll send you
                  instructions to reset your password.
                </div>

              </q-card-section>


              <!-- Form -->
              <q-card-section>

                <q-form
                  @submit.prevent="handleForgotPassword"
                  class="q-gutter-md"
                >

                  <!-- Email -->
                  <q-input
                    v-model="email"
                    outlined
                    dense
                    label="Enter Email-id"
                    type="email"
                    :rules="[
                      val =>
                        !!val ||
                        'Email is required',

                      val =>
                        /.+@.+\..+/.test(val) ||
                        'Enter a valid email'
                    ]"
                  >
                    <template #prepend>
                      <q-icon name="mail_outline" />
                    </template>
                  </q-input>


                  <!-- Send Reset Link -->
                  <q-btn
                    type="submit"
                    unelevated
                    no-caps
                    label="Send Reset Link"
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


<script setup>

import { ref } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'

import backgroundImage from '../assets/image.png'

const $q = useQuasar()
const router = useRouter()

const email = ref('')
const loading = ref(false)


const handleForgotPassword = async () => {

  loading.value = true

  try {

    // Backend API will be connected later.
    console.log('Forgot Password:', email.value)

    await new Promise(
      resolve => setTimeout(resolve, 800)
    )

    $q.notify({
      type: 'positive',
      message: 'Reset instructions will be sent to your email.'
    })

  } catch (error) {

    console.error(error)

    $q.notify({
      type: 'negative',
      message: 'Something went wrong. Please try again.'
    })

  } finally {

    loading.value = false

  }

}


const goToLogin = () => {
  router.push('/')
}

</script>
