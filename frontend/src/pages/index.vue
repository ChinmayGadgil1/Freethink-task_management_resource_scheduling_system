<template>
  <q-layout view="hHh lpR fFf">

    <q-page-container>

      <q-page class="relative-position window-height">

        <q-img
          :src="backgroundImage"
          fit="cover"
          class="absolute-full"
        />

        <!-- ================= LOGIN CARD ================= -->

        <div
          class="absolute-full flex flex-center"
        >

          <div
            class="col-12 col-sm-9 col-md-6 col-lg-5 q-px-md"
            style="width: 100%; max-width: 480px;"
          >

            <q-card
              flat
              class="bg-white q-pa-lg"
              style="border-radius: 20px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);"
            >

              <!-- Card Header -->

              <q-card-section class="text-center">

                <div class="text-h5 text-weight-bold">
                  Login
                </div>

                <div
                  class="text-body2 text-grey-7 q-mt-sm"
                >
                  Hey, Enter your details to get sign in
                  <br>
                  to your account
                </div>

              </q-card-section>


              
              <q-card-section>

                <q-form
                  @submit.prevent="handleLogin"
                  class="q-gutter-md"
                >

                  
                  <q-input
                    v-model="form.email"
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
                      <q-icon name="person_outline" />
                    </template>
                  </q-input>


                  
                  <q-input
                    v-model="form.password"
                    outlined
                    dense
                    label="Password"
                    :type="
                      showPassword
                        ? 'text'
                        : 'password'
                    "
                    :rules="[
                      val =>
                        !!val ||
                        'Password is required'
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


                  
                  <q-btn
                    type="submit"
                    unelevated
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


              
              <q-card-section
                class="text-center"
              >

                <div class="text-caption text-grey-7">

                  Don't have an account?

                  <q-btn
                    flat
                    dense
                    no-caps
                    label="Request Now"
                    color="dark"
                    class="q-pa-none text-weight-bold"
                    @click="goToRegister"
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

import { reactive, ref } from 'vue'
import { useQuasar } from 'quasar'

import backgroundImage from '../assets/image.png'


const $q = useQuasar()


const form = reactive({
  email: '',
  password: ''
})


const showPassword = ref(false)
const loading = ref(false)


const handleLogin = async () => {

  loading.value = true

  try {

    /*
     * BACKEND WILL BE CONNECTED HERE
     *
     * Later:
     *
     * const response = await api.post('/login', {
     *   email: form.email,
     *   password: form.password
     * })
     */

    console.log('Login:', form)

    await new Promise(
      resolve => setTimeout(resolve, 800)
    )

    $q.notify({
      type: 'positive',
      message: 'Login successful'
    })

  } catch (error) {

    console.error(error)

    $q.notify({
      type: 'negative',
      message: 'Login failed'
    })

  } finally {

    loading.value = false

  }

}


const goToRegister = () => {

  console.log('Request account')

}

</script>$