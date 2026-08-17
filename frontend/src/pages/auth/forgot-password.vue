<template>
  <div class="col-12 col-sm-9 col-md-6 col-lg-5 q-px-md" style="width: 100%; max-width: 540px">
    <q-card
      elevated
      class="bg-white q-pa-xl"
      style="border-radius: 20px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08)"
    >
      <!-- Card Header -->
      <q-card-section class="text-center q-pb-md">
        <div class="text-h5 text-weight-bold">Forgot Password?</div>
        <div class="text-body2 text-grey-7 q-mt-sm">
          Enter your email address and we'll send you instructions to reset your password.
        </div>
      </q-card-section>

      <!-- Form -->
      <q-card-section>
        <q-form
          @submit.prevent="handleForgotPassword"
          style="display: flex; flex-direction: column; gap: 18px"
        >
          <!-- Email -->
          <q-input
            v-model="email"
            outlined
            dense
            hide-bottom-space
            label="Enter Email-id"
            type="email"
            :rules="[
              (val) => !!val || 'Email is required',
              (val) => /.+@.+\..+/.test(val) || 'Enter a valid email',
            ]"
          >
            <template #prepend>
              <q-icon name="mail_outline" />
            </template>
          </q-input>

          <!-- Send Reset Link Button -->
          <q-btn
            type="submit"
            elevated
            no-caps
            label="Send Reset Link"
            color="orange-3"
            text-color="dark"
            class="full-width rounded-borders q-mt-sm"
            size="md"
            :loading="loading"
          />
        </q-form>
      </q-card-section>

      <!-- Back to Login -->
      <q-card-section class="text-center q-pt-sm">
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
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';

const $q = useQuasar();
const router = useRouter();

const email = ref('');
const loading = ref(false);

const handleForgotPassword = async () => {
  loading.value = true;
  try {
    console.log('Forgot Password:', email.value);
    await new Promise((resolve) => setTimeout(resolve, 800));
    $q.notify({
      type: 'positive',
      message: 'Reset instructions will be sent to your email.',
    });
  } catch (error) {
    console.error(error);
    $q.notify({
      type: 'negative',
      message: 'Something went wrong. Please try again.',
    });
  } finally {
    loading.value = false;
  }
};

const goToLogin = () => {
  void router.push('/');
};
</script>
