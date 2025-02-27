<script setup lang="ts">
import { RouterView } from 'vue-router'
import HeaderBar from './components/Layout/HeaderBar.vue'
import MainLayout from './components/Layout/MainLayout.vue'
import FooterBar from './components/Layout/FooterBar.vue'
</script>

<template>
  <MainLayout>
    <HeaderBar />
    <q-page-container>
      <q-page class="q-pa-xl">
        <RouterView />
      </q-page>
    </q-page-container>
    <FooterBar />
  </MainLayout>
</template>
