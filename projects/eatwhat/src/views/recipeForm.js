import { saveRecipes } from "../storage.js"
import { normalizeHttpUrl } from '../utils/url.js'

export function renderRecipeForm(recipeList, recipe = null) {
    const isEditing = recipe !== null
    const formTitle = isEditing ? '编辑菜谱' : '添加菜谱'
    document.querySelector('#app').innerHTML = `
        <header class="form-header">
            <button type="button" class="back-button">‹ 返回</button>
        </header>
        <main class="form-page">
        <h1 class="form-title">${formTitle}</h1>
        <form id="recipe-form" class="recipe-form">
            <div class="form-field">
                <label for="name">菜谱名称</label>
                <input type="text" id="name" name="name" required>
            </div>

            <div class="form-field">
            <label for="description">菜谱描述</label>
            <textarea id="description" name="description" placeholder="菜谱描述"></textarea>
            </div>

            <div class="form-field">
                <label for="sourceUrl">原始做法链接</label>
                <input type="url" id="sourceUrl" name="sourceUrl" placeholder="原始做法链接">
            </div>

            <div class="form-field">
                <label for="ingredients">食材</label>
                <textarea id="ingredients" name="ingredients" placeholder="食材，每行一种食材" required></textarea>
            </div>

            <div class="form-field">
                <label for="steps">制作步骤</label>
                <textarea id="steps" name="steps" placeholder="制作步骤，每行一个步骤" required></textarea>
            </div>
            <div class="form-actions">
            <button type="submit" class="save-button">保存</button>
            </div>
        </form>
        </main>`
    const recipeForm = document.querySelector('#recipe-form')

    if (isEditing) {
        recipeForm.elements.name.value = recipe.name ?? ''
        recipeForm.elements.description.value = recipe.description ?? ''
        recipeForm.elements.sourceUrl.value = recipe.sourceUrl ?? ''
        recipeForm.elements.ingredients.value = recipe.ingredients.join('\n')
        recipeForm.elements.steps.value = recipe.steps.join('\n')
    }

    const backButton = document.querySelector('.back-button')
    backButton.addEventListener('click', () => {
        window.history.back()
    })

    recipeForm.addEventListener('submit', event => {
        event.preventDefault()
        const formData = new FormData(recipeForm)
        const name = formData.get('name').trim()
        const description = formData.get('description').trim()
        const sourceUrl = formData.get('sourceUrl').trim()
        const ingredients = formData.get('ingredients').trim()
        const steps = formData.get('steps').trim()

        const recipeInput = {
            name,
            description,
            sourceUrl,
            ingredients: ingredients.split('\n').map(ingredient => ingredient.trim()).filter(ingredient => ingredient !== ''),
            steps: steps.split('\n').map(step => step.trim()).filter(step => step !== '')
        }

        function showFieldError(fieldId, message) {
            window.alert(message)
            const field = document.querySelector(`#${fieldId}`)
            field.focus({ preventScroll: true })
            field.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }

        if (recipeInput.name === '') {
            showFieldError('name', '请输入菜谱名称')
            return
        }
        const normalizedSourceUrl = normalizeHttpUrl(recipeInput.sourceUrl)

        if (recipeInput.sourceUrl && !normalizedSourceUrl) {
            showFieldError('sourceUrl', '请输入以 http:// 或 https:// 开头的有效链接')
            return
        }
        recipeInput.sourceUrl = normalizedSourceUrl ?? ''

        if (!recipeInput.ingredients.length) {
            showFieldError('ingredients', '请输入食材')
            return
        }
        if (!recipeInput.steps.length) {
            showFieldError('steps', '请输入制作步骤')
            return
        }

        const timestamp = new Date().toISOString()

        if (isEditing) {
            const updatedRecipe = {
                id: recipe.id,
                ...recipeInput,
                createdAt: recipe.createdAt,
                updatedAt: timestamp
            }
            const recipeIndex = recipeList.findIndex(r => r.id === recipe.id)
            recipeList[recipeIndex] = updatedRecipe
            saveRecipes(recipeList)
            window.alert('菜谱已更新')
            window.location.hash = `#/recipes/${updatedRecipe.id}`
        } else {
            function createRecipeId() {
                if (typeof crypto.randomUUID === 'function') {
                    return crypto.randomUUID()
                }

                return `${Date.now()}-${Math.random().toString(16).slice(2)}`
            }
            const newRecipe = {
                id: createRecipeId(),
                ...recipeInput,
                createdAt: timestamp,
                updatedAt: timestamp
            }
            recipeList.unshift(newRecipe)
            saveRecipes(recipeList)
            window.alert('菜谱已保存')
            window.location.hash = `#/recipes/${newRecipe.id}`
        }
    })
}
