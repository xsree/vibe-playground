import { escapeHtml } from '../utils/escapeHtml.js'
import { exportRecipesToFile, importRecipesFromFile } from '../storage.js'

function getRecipeListItemsMarkup(recipeList) {
  return recipeList.map(recipe => `
    <li class="recipe-item">
      <a href="#/recipes/${escapeHtml(recipe.id)}" class="recipe-link">
        <h2 class="recipe-item-name">${escapeHtml(recipe.name)}</h2>
        <p class="recipe-item-description">${escapeHtml(recipe.description) || '暂无描述'}</p>
      </a>
    </li>
    `).join('')
}

export function renderRecipeList(recipeList) {
  const recipeCount = recipeList.length ? `${escapeHtml(recipeList.length)} 道菜` : '暂无菜谱'

  document.querySelector('#app').innerHTML = `
<header>
  <p class="brand">eatwhat</p>
</header>

<main>
  <section class="recipes-page">
    <div class="recipes-page-header">
      <h1>我的菜谱</h1>
      <a href="#/recipes/new" class="add-recipe-link">＋ 添加</a>
    </div>

    <!-- 数据备份操作栏 -->
    <div class="backup-actions">
      <button type="button" id="export-button" class="button-link">导出备份</button>
      <label for="import-file-input" class="button-link">导入备份</label>
      <input type="file" id="import-file-input" accept=".json" style="display: none;" />
    </div>

    <p class="recipe-count">${recipeCount}</p>
    ${recipeList.length === 0 ? '<h2>还没有菜谱</h2> <a href="#/recipes/new" class="add-recipe-link">添加第一道菜</a>' : `<ul class="recipe-list">
      ${getRecipeListItemsMarkup(recipeList)}
    </ul>`}
  </section>
</main>

<nav class="navigation">
  <a href="#/">首页</a>
  <a href="#/recipes" class="active">菜谱</a>
</nav>
`

  const exportBtn = document.querySelector('#export-button')
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      exportRecipesToFile(recipeList)
    })
  }

  const importInput = document.querySelector('#import-file-input')
  if (importInput) {
    importInput.addEventListener('change', async (event) => {
      const file = event.target.files[0]
      if (!file) return
      const updatedRecipes = await importRecipesFromFile(file, recipeList.length)
      if (updatedRecipes) {
        recipeList.splice(0, recipeList.length, ...updatedRecipes)
        renderRecipeList(recipeList)
      }
      event.target.value = ''
    })
  }
}