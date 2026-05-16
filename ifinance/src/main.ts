import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { queryClient } from '@/plugins/query'
import i18n from '@/plugins/i18n'
import router from '@/router'
import { useAuthStore } from '@/stores/auth'
import App from './App.vue'
import '@/styles/main.css'

const pinia = createPinia()
const app = createApp(App)

// Pinia deve ser instalado ANTES de usar qualquer store
app.use(pinia)

// Inicia a verificação de auth imediatamente — antes do router guard rodar.
// Quando o guard chamar auth.init(), a promise já estará em voo
// e será retornada como cache, evitando tela em branco.
useAuthStore().init()

app.use(router)
app.use(i18n)
app.use(VueQueryPlugin, { queryClient })

app.mount('#app')
