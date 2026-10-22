import { escapeHtml } from '../utils/escapeHtml.js'
import { normalizeHttpUrl } from '../utils/url.js'
import { saveRecipes } from '../storage.js'

export function renderRecipeDetail(recipe, recipesList) {
    document.querySelector('#app').innerHTML = `
        <header class="detail-header">
            <button type="button" class="back-button">‹ 返回</button>
            <a href="#/recipes/${escapeHtml(recipe.id)}/edit" class="edit-button">编辑</a>
        </header>
        <main>
        <article class="recipe-detail">
            <h1>${escapeHtml(recipe.name)}</h1>
            <p>${escapeHtml(recipe.description) || '暂无描述'}</p>
            ${getSourceLinkMarkup(recipe.sourceUrl)}
            <section>
            <h2>食材</h2>
            <ul>
                ${recipe.ingredients.map(ingredient => `<li>${escapeHtml(ingredient)}</li>`).join('')}
            </ul>
            </section>
            <section>
            <h2>制作方法</h2>
            <ol>
                ${recipe.steps.map(step => `<li>${escapeHtml(step)}</li>`).join('')}
            </ol>
            </section>
            <div class="delete-actions">
            <button class="deleteRecipeButton">删除此菜谱</button>
            </div>
        </article>
    </main>
    `
    const backButton = document.querySelector('.back-button')
    backButton.addEventListener('click', () => {
        window.history.back()
    })
    const deleteRecipeButton = document.querySelector('.deleteRecipeButton')
    deleteRecipeButton.addEventListener('click', () => {
        if (window.confirm('确定要删除此菜谱吗？')) {
            const index = recipesList.findIndex(r => r.id === recipe.id)
            if (index !== -1) {
                recipesList.splice(index, 1)
                saveRecipes(recipesList)
                window.location.hash = '#/recipes'
            }
        }
    })
}

function getSourceLinkMarkup(sourceUrl) {
    const safeUrl = normalizeHttpUrl(sourceUrl)
    if (!safeUrl) return ''
    return `
<a
  href="${escapeHtml(safeUrl)}"
  class="source-link"
  target="_blank"
  rel="noopener noreferrer"
>
  查看原始做法 ↗
</a>
`
}