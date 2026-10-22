const STORAGE_KEY = 'eatwhat.data'

export function saveRecipes(recipesList) {
    const data = {
        schemaVersion: 1,
        recipes: recipesList
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function loadRecipes(initialRecipes) {
    const dataString = localStorage.getItem(STORAGE_KEY)
    if (dataString === null) {
        saveRecipes(initialRecipes)
        return initialRecipes
    }
    const data = JSON.parse(dataString)
    return data.recipes
}

export function exportRecipesToFile(recipesList) {
    const data = {
        app: 'eatwhat',
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
        recipes: recipesList
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const DownloadLink = document.createElement('a')
    DownloadLink.href = url
    DownloadLink.download = `recipes-backup-${new Date().toISOString().split('T')[0]}.json`
    DownloadLink.click()
    URL.revokeObjectURL(url)
}

export async function importRecipesFromFile(file, currentRecipesCount) {
    try {
        // 1. 读取文件文本内容
        const content = await file.text()
        // 2. 解析 JSON
        const data = JSON.parse(content)
        // 3. 格式校验
        const isValidApp = data.app === 'eatwhat'
        const hasRecipesArray = Array.isArray(data.recipes)
        if (!isValidApp || !hasRecipesArray) {
            alert('导入失败：不是有效的 eatwhat 备份文件！')
            return null
        }
        const importedCount = data.recipes.length
        // 4. 覆盖确认
        const confirmMessage = `备份文件中包含 ${importedCount} 道菜谱，当前有 ${currentRecipesCount} 道菜谱。\n\n导入后将完整覆盖当前数据（无法撤销）！\n建议导入前先导出备份当前数据。\n\n确定要覆盖导入吗？`
        if (!window.confirm(confirmMessage)) {
            return null
        }
        // 5. 校验通过且用户确认，保存数据
        saveRecipes(data.recipes)
        return data.recipes
    } catch (error) {
        alert('导入失败：文件损坏或 JSON 格式错误！')
        console.error(error)
        return null
    }
}