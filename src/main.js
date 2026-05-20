import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'

console.log('App starting...')
createApp(App).use(router).mount('#app')
console.log('App mounted')
