<template>
  <div class="col-12 col-sm-9 col-md-6 col-lg-5 q-px-md" style="width: 100%; max-width: 540px">
    <q-card
      elavted
      class="bg-white q-pa-xl"
      style="border-radius: 20px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08)"
    >
      <!-- Card Header -->
      <q-card-section class="text-center q-pb-md">
        <div class="text-h5 text-weight-bold">Create Account</div>
        <div class="text-body2 text-grey-7 q-mt-sm">Create your account to get started</div>
      </q-card-section>

      <!-- Signup Form -->
      <q-card-section>
        <q-form
          @submit.prevent="handleSignup"
          style="display: flex; flex-direction: column; gap: 18px"
        >
          <!-- Full Name -->
          <q-input
            v-model="form.name"
            outlined
            dense
            hide-bottom-space
            label="Full Name"
            :rules="[(val) => !!val || 'Name is required']"
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

          <!-- Role -->
          <q-select
            v-model="form.role"
            outlined
            dense
            hide-bottom-space
            label="Select Role"
            :options="roleOptions"
            emit-value
            map-options
            :rules="[(val) => !!val || 'Role is required']"
          >
            <template #prepend>
              <q-icon name="badge" />
            </template>
          </q-select>

          <!-- Password -->
          <q-input
            v-model="form.password"
            outlined
            dense
            hide-bottom-space
            label="Password"
            :type="showPassword ? 'text' : 'password'"
            :rules="[
              (val) => !!val || 'Password is required',
              (val) => val.length >= 6 || 'Password must be at least 6 characters',
              (val) => /^[A-Z]/.test(val) || 'First character must be uppercase',
              (val) => /[0-9]/.test(val) || 'Password must contain at least one number',
              (val) =>
                /[^A-Za-z0-9]/.test(val) || 'Password must contain at least one special character',
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
            hide-bottom-space
            label="Confirm Password"
            :type="showConfirmPassword ? 'text' : 'password'"
            :rules="[
              (val) => !!val || 'Please confirm your password',
              (val) => val === form.password || 'Passwords do not match',
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
            unelevated
            no-caps
            label="Create Account"
            color="deep-purple"
            text-color="white"
            class="full-width rounded-borders q-mt-sm"
            size="md"
            :loading="loading"
          />
        </q-form>
      </q-card-section>

      <!-- Login Link -->
      <q-card-section class="text-center q-pt-sm">
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
import { reactive, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { signupApi } from '@/services/api';

const $q = useQuasar();
const router = useRouter();

type SignupForm = {
  name: string;
  email: string;
  role: 'RESOURCE' | 'PROJECT_MANAGER';
  password: string;
  confirmPassword: string;
};

const form = reactive<SignupForm>({
  name: '',
  email: '',
  role: 'RESOURCE',
  password: '',
  confirmPassword: '',
});

const roleOptions = [
  { label: 'Resource', value: 'RESOURCE' },
  { label: 'Project Manager', value: 'PROJECT_MANAGER' },
];

const showPassword = ref(false);
const showConfirmPassword = ref(false);
const loading = ref(false);

const handleSignup = async () => {
  if (form.password !== form.confirmPassword) {
    $q.notify({
      type: 'negative',
      message: 'Passwords do not match',
    });
    return;
  }

  loading.value = true;
  try {
    const data = await signupApi({
      name: form.name,
      email: form.email,
      password: form.password,
      role: form.role,
    });

    $q.notify({
      type: 'positive',
      message: data.message || 'Account created successfully!',
    });

    void router.push('/login');
  } catch (error: unknown) {
    console.error('Signup error:', error);
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Signup failed',
    });
  } finally {
    loading.value = false;
  }
};

const goToLogin = () => {
  void router.push('/login');
};
</script>
