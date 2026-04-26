import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { EntityType } from './entity'

export interface LinkedEntity {
  type: EntityType
  id: number
  name: string
  logo?: string
}

export interface Article {
  id: number
  title: string
  content: string
  images: string[]
  createdAt: Date
  isTop: boolean
  topAt?: Date
  originalIndex?: number
  linkedEntity?: LinkedEntity
}

export const useArticleStore = defineStore('article', () => {
  const articles = ref<Article[]>([
    {
      id: 1,
      title: '探索城市中的隐藏美食',
      content: '今天发现了一家超棒的小店，藏在巷子里，但是味道真的惊艳到我了...',
      images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=delicious%20food%20in%20a%20cozy%20restaurant%20interior&image_size=square'],
      createdAt: new Date(),
      isTop: false
    },
    {
      id: 2,
      title: '周末户外徒步分享',
      content: '周末去爬山了，风景真的太美了，推荐给大家这条徒步路线...',
      images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20mountain%20hiking%20trail%20with%20green%20trees&image_size=square'],
      createdAt: new Date(),
      isTop: false
    },
    {
      id: 3,
      title: '新买的咖啡机分享',
      content: '入手了一台新的意式咖啡机，每天早上都能喝到新鲜的咖啡...',
      images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20espresso%20coffee%20machine%20on%20kitchen%20counter&image_size=square'],
      createdAt: new Date(),
      isTop: false
    },
    {
      id: 4,
      title: '学习摄影的日常',
      content: '最近在学习摄影，分享一下我拍的一些照片，大家给点建议...',
      images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=camera%20and%20photography%20equipment%20on%20wooden%20table&image_size=square'],
      createdAt: new Date(),
      isTop: false
    },
    {
      id: 5,
      title: '健身打卡Day30',
      content: '坚持健身30天了，分享一下我的健身计划和饮食安排...',
      images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fitness%20gym%20workout%20with%20dumbbells&image_size=square'],
      createdAt: new Date(),
      isTop: false
    },
    {
      id: 6,
      title: '读书分享：人生的智慧',
      content: '最近读了叔本华的《人生的智慧》，有很多感悟，分享给大家...',
      images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=open%20book%20on%20wooden%20table%20with%20warm%20light&image_size=square'],
      createdAt: new Date(),
      isTop: false
    }
  ])

  function addArticle(title: string, content: string, images: string[], linkedEntity?: LinkedEntity) {
    const newArticle: Article = {
      id: Date.now(),
      title,
      content,
      images,
      createdAt: new Date(),
      isTop: false,
      linkedEntity
    }
    
    const topCount = articles.value.filter(a => a.isTop).length
    articles.value.splice(topCount, 0, newArticle)
  }

  function deleteArticle(id: number) {
    const index = articles.value.findIndex(article => article.id === id)
    if (index === -1) return

    const article = articles.value[index]
    
    if (!article.isTop) {
      const nonTopArticles = articles.value.filter(a => !a.isTop)
      const deletedNonTopIndex = nonTopArticles.findIndex(a => a.id === id)
      
      articles.value.forEach(a => {
        if (a.isTop && a.originalIndex !== undefined && a.originalIndex > deletedNonTopIndex) {
          a.originalIndex--
        }
      })
    }
    
    articles.value.splice(index, 1)
  }

  function togglePin(id: number) {
    const currentIndex = articles.value.findIndex(a => a.id === id)
    if (currentIndex === -1) return

    const article = articles.value[currentIndex]

    if (article.isTop) {
      article.isTop = false
      article.topAt = undefined
      
      articles.value.splice(currentIndex, 1)
      
      const topCount = articles.value.filter(a => a.isTop).length
      
      let targetIndex: number
      if (article.originalIndex !== undefined) {
        targetIndex = Math.min(topCount + article.originalIndex, articles.value.length)
        targetIndex = Math.max(targetIndex, topCount)
      } else {
        targetIndex = topCount
      }
      
      articles.value.splice(targetIndex, 0, article)
      article.originalIndex = undefined
    } else {
      const nonTopArticles = articles.value.filter(a => !a.isTop)
      const originalNonTopIndex = nonTopArticles.findIndex(a => a.id === id)
      article.originalIndex = originalNonTopIndex >= 0 ? originalNonTopIndex : 0
      
      article.isTop = true
      article.topAt = new Date()
      
      articles.value.splice(currentIndex, 1)
      articles.value.splice(0, 0, article)
    }
  }

  return { articles, addArticle, deleteArticle, togglePin }
})
