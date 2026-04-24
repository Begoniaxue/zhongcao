import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Article {
  id: number
  title: string
  content: string
  images: string[]
  createdAt: Date
}

export const useArticleStore = defineStore('article', () => {
  const articles = ref<Article[]>([
    {
      id: 1,
      title: '探索城市中的隐藏美食',
      content: '今天发现了一家超棒的小店，藏在巷子里，但是味道真的惊艳到我了...',
      images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=delicious%20food%20in%20a%20cozy%20restaurant%20interior&image_size=square'],
      createdAt: new Date()
    },
    {
      id: 2,
      title: '周末户外徒步分享',
      content: '周末去爬山了，风景真的太美了，推荐给大家这条徒步路线...',
      images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20mountain%20hiking%20trail%20with%20green%20trees&image_size=square'],
      createdAt: new Date()
    },
    {
      id: 3,
      title: '新买的咖啡机分享',
      content: '入手了一台新的意式咖啡机，每天早上都能喝到新鲜的咖啡...',
      images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20espresso%20coffee%20machine%20on%20kitchen%20counter&image_size=square'],
      createdAt: new Date()
    },
    {
      id: 4,
      title: '学习摄影的日常',
      content: '最近在学习摄影，分享一下我拍的一些照片，大家给点建议...',
      images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=camera%20and%20photography%20equipment%20on%20wooden%20table&image_size=square'],
      createdAt: new Date()
    },
    {
      id: 5,
      title: '健身打卡Day30',
      content: '坚持健身30天了，分享一下我的健身计划和饮食安排...',
      images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fitness%20gym%20workout%20with%20dumbbells&image_size=square'],
      createdAt: new Date()
    },
    {
      id: 6,
      title: '读书分享：人生的智慧',
      content: '最近读了叔本华的《人生的智慧》，有很多感悟，分享给大家...',
      images: ['https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=open%20book%20on%20wooden%20table%20with%20warm%20light&image_size=square'],
      createdAt: new Date()
    }
  ])

  function addArticle(title: string, content: string, images: string[]) {
    const newArticle: Article = {
      id: Date.now(),
      title,
      content,
      images,
      createdAt: new Date()
    }
    articles.value.unshift(newArticle)
  }

  return { articles, addArticle }
})
