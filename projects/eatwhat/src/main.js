import './style.css'
import { recipes as initialRecipes } from './data.js'
import { renderRecipeList } from './views/recipeList.js'
import { renderHome } from './views/home.js'
import { renderRecipeDetail } from './views/recipeDetail.js'
import { renderRecipeForm } from './views/recipeForm.js'
import { loadRecipes } from './storage.js'

const recipes = loadRecipes(initialRecipes)

function renderRouter() {
  const hash = window.location.hash
  const segments = hash.split('/')
  if (hash === '#/recipes/new') {
    renderRecipeForm(recipes)
    return
  }

  if (
    segments.length === 4 &&
    segments[1] === 'recipes' &&
    segments[3] === 'edit'
  ) {
    const recipeId = segments[2]
    const recipe = recipes.find(r => r.id === recipeId)
    if (recipeId && recipe) {
      renderRecipeForm(recipes, recipe)
    } else {
      document.querySelector('#app').innerHTML = `
          <header class="detail-header">
            <a href="#/recipes" class="back-button">‹ 返回</a>
            <h1 class="brand">未找到菜谱</h1>
          </header>`
    }
    return
  }

  if (segments.length === 3 && segments[1] === 'recipes') {
    const recipeId = segments[2]
    const recipe = recipes.find(r => r.id === recipeId)
    if (recipeId && recipe) {
      renderRecipeDetail(recipe, recipes)
    } else {
      document.querySelector('#app').innerHTML = `
          <header class="detail-header">
            <a href="#/recipes" class="back-button">‹ 返回</a>
            <h1 class="brand">未找到菜谱</h1>
          </header>`
    }
    return
  }

  if (hash === '#/recipes') {
    renderRecipeList(recipes)
    return
  }

  renderHome(recipes)
}

window.addEventListener('hashchange', renderRouter)

renderRouter()

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => console.log('Service Worker 注册成功:', reg))
      .catch((err) => console.error('Service Worker 注册失败:', err))
  })
}

// 存储 PWA 安装事件
let deferredPrompt = null
window.addEventListener('beforeinstallprompt', (e) => {
  // 阻止浏览器默认的小提示（以便我们自定义提醒）
  e.preventDefault()
  deferredPrompt = e
  // 在页面顶部自动展示安装 App 提醒条（如果还未存在）
  if (!document.querySelector('#pwa-install-banner')) {
    const banner = document.createElement('div')
    banner.id = 'pwa-install-banner'
    banner.style.cssText = `
      position: fixed;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 100%;
      max-width: 480px;
      padding: 12px 16px;
      background-color: var(--color-primary);
      color: #fff;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 1000;
      font-size: 14px;
    `
    banner.innerHTML = `
      <span>点击将 eatwhat 添加到手机主屏幕</span>
      <button id="pwa-install-btn" style="
        background: #fff;
        color: var(--color-primary);
        border: none;
        padding: 6px 12px;
        border-radius: 6px;
        font-weight: bold;
        cursor: pointer;
      ">安装应用</button>
    `
    document.body.appendChild(banner)
    document.querySelector('#pwa-install-btn').addEventListener('click', async () => {
      if (deferredPrompt) {
        // 主动调起系统的原生 PWA 安装弹窗
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        console.log(`安装结果: ${outcome}`)
        deferredPrompt = null
        banner.remove()
      }
    })
  }
})