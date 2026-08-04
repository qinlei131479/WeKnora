import { App } from 'vue'
import KjscButton from './KjscButton.vue'
import KjscDialog from './KjscDialog.vue'
import KjscEmpty from './KjscEmpty.vue'
import KjscPagination from './KjscPagination.vue'
import KjscTextButton from './KjscTextButton.vue'

export default function installPlugins(app: App){
  // app.component('kjsc-button', KjscButton)
  // app.component('kjsc-dialog', KjscDialog)
  // app.component('kjsc-empty', KjscEmpty)
  // app.component('kjsc-pagination', KjscPagination)
  // app.component('kjsc-text-button', KjscTextButton)
  app.component(KjscButton.name, KjscButton)
  app.component(KjscDialog.name, KjscDialog)
  app.component(KjscEmpty.name, KjscEmpty)
  app.component(KjscPagination.name, KjscPagination)
  app.component(KjscTextButton.name, KjscTextButton)
}