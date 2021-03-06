// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import infiniteScroll from 'vue-infinite-scroll'
let VueCookie = require('vue-cookie')
Vue.use(VueCookie)
Vue.use(ElementUI)
Vue.config.productionTip = false

Vue.use(infiniteScroll)
// 设置代理
Vue.prototype.http = '/api'
/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  components: { App },
  template: '<App/>'
})
