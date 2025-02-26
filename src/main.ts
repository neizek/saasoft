import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Quasar } from 'quasar'

import App from './App.vue'
import router from './router'

import '@quasar/extras/roboto-font-latin-ext/roboto-font-latin-ext.css'
import '@quasar/extras/fontawesome-v6/fontawesome-v6.css'
import 'quasar/src/css/index.sass'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(Quasar, {
  plugins: {},
})
app.mount('#app')
