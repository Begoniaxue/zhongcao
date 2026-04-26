import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Project {
  id: number
  name: string
  description: string
  category: string
  logo: string
}

export interface Shop {
  id: number
  name: string
  category: string
  logo: string
  projectId?: number
  projectName?: string
}

export type EntityType = 'project' | 'shop'

export interface SelectedEntity {
  type: EntityType
  id: number
  name: string
}

export const useEntityStore = defineStore('entity', () => {
  const projects = ref<Project[]>([
    {
      id: 1,
      name: '阳光购物广场',
      description: '集购物、餐饮、娱乐于一体的大型商业综合体',
      category: '商业综合体',
      logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20shopping%20mall%20exterior%20sunny%20day&image_size=square'
    },
    {
      id: 2,
      name: '星光天地',
      description: '高端时尚购物中心，汇聚国际知名品牌',
      category: '购物中心',
      logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=luxury%20shopping%20center%20interior%20elegant&image_size=square'
    },
    {
      id: 3,
      name: '邻里生活中心',
      description: '社区型商业中心，满足日常消费需求',
      category: '社区商业',
      logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=community%20shopping%20center%20warm%20friendly&image_size=square'
    }
  ])

  const shops = ref<Shop[]>([
    {
      id: 1,
      name: '优衣库',
      category: '服装',
      logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fashion%20clothing%20store%20logo%20minimalist&image_size=square',
      projectId: 1,
      projectName: '阳光购物广场'
    },
    {
      id: 2,
      name: '星巴克',
      category: '餐饮',
      logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=coffee%20shop%20logo%20green%20branding&image_size=square',
      projectId: 1,
      projectName: '阳光购物广场'
    },
    {
      id: 3,
      name: '海底捞',
      category: '餐饮',
      logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=hotpot%20restaurant%20logo%20red%20warm&image_size=square',
      projectId: 2,
      projectName: '星光天地'
    },
    {
      id: 4,
      name: '苹果专卖店',
      category: '电子',
      logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=apple%20store%20logo%20minimal%20modern&image_size=square',
      projectId: 2,
      projectName: '星光天地'
    },
    {
      id: 5,
      name: '无印良品',
      category: '家居',
      logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=muji%20style%20logo%20minimalist%20japanese&image_size=square',
      projectId: 1,
      projectName: '阳光购物广场'
    },
    {
      id: 6,
      name: '华为体验店',
      category: '电子',
      logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=huawei%20store%20logo%20technology%20red&image_size=square',
      projectId: 3,
      projectName: '邻里生活中心'
    },
    {
      id: 7,
      name: '喜茶',
      category: '餐饮',
      logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=heytea%20logo%20pink%20milk%20tea&image_size=square',
      projectId: 3,
      projectName: '邻里生活中心'
    },
    {
      id: 8,
      name: 'ZARA',
      category: '服装',
      logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=zara%20fashion%20logo%20elegant%20black&image_size=square',
      projectId: 2,
      projectName: '星光天地'
    }
  ])

  const userPermissionEntityIds = ref<{
    projects: number[]
    shops: number[]
  }>({
    projects: [1, 2],
    shops: [1, 2, 3, 4, 5, 8]
  })

  const accessibleProjects = computed(() => {
    return projects.value.filter(p => userPermissionEntityIds.value.projects.includes(p.id))
  })

  const accessibleShops = computed(() => {
    return shops.value.filter(s => userPermissionEntityIds.value.shops.includes(s.id))
  })

  const allAccessibleEntities = computed(() => {
    const projectEntities = accessibleProjects.value.map(p => ({
      ...p,
      entityType: 'project' as EntityType,
      displayName: p.name,
      subtitle: p.category
    }))
    
    const shopEntities = accessibleShops.value.map(s => ({
      ...s,
      entityType: 'shop' as EntityType,
      displayName: s.name,
      subtitle: s.projectName ? `${s.projectName} · ${s.category}` : s.category
    }))

    return [...projectEntities, ...shopEntities]
  })

  function getProjectById(id: number): Project | undefined {
    return projects.value.find(p => p.id === id)
  }

  function getShopById(id: number): Shop | undefined {
    return shops.value.find(s => s.id === id)
  }

  function getShopsByProjectId(projectId: number): Shop[] {
    return accessibleShops.value.filter(s => s.projectId === projectId)
  }

  return {
    projects,
    shops,
    accessibleProjects,
    accessibleShops,
    allAccessibleEntities,
    userPermissionEntityIds,
    getProjectById,
    getShopById,
    getShopsByProjectId
  }
})
