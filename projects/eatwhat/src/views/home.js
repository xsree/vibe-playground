let currentRecipe = null
import { escapeHtml } from '../utils/escapeHtml.js'

function getRandomRecipe(recipeList, current) {
  let randomIndex
  if (recipeList.length <= 1) {
    return recipeList[0]
  }
  do {
    randomIndex = Math.floor(Math.random() * recipeList.length)
  } while (current && recipeList[randomIndex].id === current.id)
  return recipeList[randomIndex]
}

function getRecommendationMarkup(current, recipeList) {
  if (recipeList.length === 0) {
    return `
      <div class="actions">
        <p>还没有菜谱</p>
        <a href="#/recipes/new" class="button button-primary">添加第一道菜</a>
      </div>
    `
  }

  if (!current) {
    return `
      <div class="actions">
        <button type="button" class="button button-primary" id="change-recipe-button">帮我选一道</button>
      </div>
    `
  }

  return `
  <div class="card card-animate">
    <h2 class="recipe-name">${escapeHtml(current.name)}</h2>
    <p class="description">${escapeHtml(current.description || '暂无描述')}</p>
  </div>
  <div class="actions">
    <a href="#/recipes/${escapeHtml(current.id)}" class="button button-primary">查看菜谱</a>
    <button type="button" class="button button-secondary" id="change-recipe-button">换一道</button>
  </div>
`
}

export function renderHome(recipeList) {
  currentRecipe = recipeList.find(r => r.id === currentRecipe?.id) ?? null
  document.querySelector('#app').innerHTML = `
<header>
  <p class="brand">eatwhat</p>
</header>

<main>
  <section class="recommendation">
    <h1>今天吃什么？</h1>
    ${getRecommendationMarkup(currentRecipe, recipeList)}
  </section>
</main>

<nav class="navigation">
  <a href="#/" class="active">首页</a>
  <a href="#/recipes">菜谱</a>
</nav>
`

  const changeRecipeButton = document.querySelector('#change-recipe-button')
  if (changeRecipeButton) {
    changeRecipeButton.addEventListener('click', () => {
      if (recipeList.length === 0) return

      // 1. 禁用按钮，显示抽中提示
      changeRecipeButton.disabled = true
      const originalText = changeRecipeButton.textContent
      changeRecipeButton.textContent = '抽选中...'

      // 2. 如果菜谱数量大于1，开启摇号滚动效果
      let rollCount = 0
      const maxRolls = 6 // 摇号滚动的次数
      const intervalId = setInterval(() => {
        rollCount++
        // 随机临时显示一个菜名
        const tempRecipe = recipeList[Math.floor(Math.random() * recipeList.length)]
        const nameEl = document.querySelector('.recipe-name')
        const descEl = document.querySelector('.description')
        if (nameEl) nameEl.textContent = tempRecipe.name
        if (descEl) descEl.textContent = tempRecipe.description || '暂无描述'

        // 摇号结束，得出最终随机结果并重置
        if (rollCount >= maxRolls) {
          clearInterval(intervalId)
          currentRecipe = getRandomRecipe(recipeList, currentRecipe)
          renderHome(recipeList)
        }
      }, 70) // 每 70ms 滚动一次
    })
  }
}
