<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-toolbar-title class="text-weight-bold">
          Task & Resource Manager
        </q-toolbar-title>

        <div v-if="user" class="row items-center q-gutter-x-sm">
          <span class="text-subtitle2 q-mr-xs">{{ user.name }}</span>
          <q-chip color="orange-3" text-color="dark" dense size="sm" class="text-weight-bold">
            {{ user.role }}
          </q-chip>
          <q-btn flat round icon="logout" size="sm" @click="handleLogout" title="Logout" />
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list>
        <q-item-label header class="text-weight-bold text-uppercase">
          Navigation Menu
        </q-item-label>

        <q-item v-if="user?.role === 'PROJECT_MANAGER'" clickable v-ripple to="/app/pm-dashboard">
          <q-item-section avatar>
            <q-icon name="dashboard" color="primary" />
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-weight-bold">PM Dashboard</q-item-label>
            <q-item-label caption>Projects & Allocations</q-item-label>
          </q-item-section>
        </q-item>

        <q-item v-if="user?.role === 'RESOURCE'" clickable v-ripple to="/app/resource-dashboard">
          <q-item-section avatar>
            <q-icon name="assignment" color="teal" />
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-weight-bold">Resource Dashboard</q-item-label>
            <q-item-label caption>My Tasks & Schedule</q-item-label>
          </q-item-section>
        </q-item>

        <q-separator class="q-my-sm" />

        <q-item clickable v-ripple @click="handleLogout">
          <q-item-section avatar>
            <q-icon name="logout" color="negative" />
          </q-item-section>
          <q-item-section class="text-negative text-weight-bold">
            Logout
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const router = useRouter()

interface User {
  user_id: number
  name: string
  email: string
  role: string
}

const user = ref<User | null>(null)
const leftDrawerOpen = ref(false)

onMounted(() => {
  const storedUser = localStorage.getItem('user')
  if (storedUser) {
    try {
      user.value = JSON.parse(storedUser)
    } catch (e) {
      console.error(e)
    }
  }
})

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

function handleLogout() {
  localStorage.removeItem('user')
  $q.notify({
    type: 'info',
    message: 'You have been logged out'
  })
  void router.push('/')
}
</script>
