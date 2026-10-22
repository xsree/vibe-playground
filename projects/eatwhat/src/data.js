const now = new Date().toISOString()

export const recipes = [
    {
        id: '1',
        name: '番茄炒蛋',
        description: '酸甜下饭，简单又快手。',
        sourceUrl: '',
        ingredients: ['番茄', '鸡蛋', '盐', '糖', '油'],
        steps: [
            '番茄洗净切块，鸡蛋打散备用。',
            '热锅凉油，倒入鸡蛋液炒至半熟，盛出备用。',
            '锅中再加少许油，放入番茄翻炒，加入盐和糖调味。',
            '将炒好的鸡蛋倒回锅中，与番茄混合翻炒均匀即可。'
        ],
        createdAt: now,
        updatedAt: now
    },
    {
        id: '2',
        name: '杏鲍菇炒肉片',
        description: '鲜嫩多汁，营养丰富。',
        sourceUrl: 'https://www.xiachufang.com/recipe/1000002/',
        ingredients: ['杏鲍菇', '猪肉片', '蒜', '盐', '生抽', '油'],
        steps: [
            '杏鲍菇洗净切片，猪肉切片备用。',
            '热锅凉油，放入蒜末爆香，加入猪肉片翻炒至变色。',
            '加入杏鲍菇片继续翻炒，加入盐和生抽调味。',
            '炒至杏鲍菇熟透即可出锅。'
        ],
        createdAt: now,
        updatedAt: now
    },
    {
        id: '3',
        name: '拍黄瓜',
        description: '清爽解腻，夏日必备。',
        sourceUrl: 'https://www.xiachufang.com/recipe/1000003/',
        ingredients: ['黄瓜', '蒜', '盐', '生抽', '香油'],
        steps: [
            '黄瓜切成四条拍碎放入盘中，蒜压成蒜泥。',
            '制作酱汁：将蒜泥放入碗中，加入盐、生抽、糖、香油拌匀。',
            '酱汁倒入盘中，搅拌均匀。'
        ],
        createdAt: now,
        updatedAt: now
    }
]