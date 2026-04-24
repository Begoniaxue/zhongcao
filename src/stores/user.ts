import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface UserInfo {
  avatar: string
  nickname: string
  introduction: string
}

export const useUserStore = defineStore('user', () => {
  const userInfo = ref<UserInfo>({
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20young%20woman%20portrait%20professional%20headshot&image_size=square',
    nickname: '种草达人',
    introduction: '热爱生活，分享美好，记录每一天的小确幸 ✨'
  })

  function updateAvatar(avatar: string) {
    userInfo.value.avatar = avatar
  }

  function updateNickname(nickname: string) {
    userInfo.value.nickname = nickname
  }

  function updateIntroduction(introduction: string) {
    userInfo.value.introduction = introduction
  }

  function updateUserInfo(info: Partial<UserInfo>) {
    if (info.avatar) userInfo.value.avatar = info.avatar
    if (info.nickname) userInfo.value.nickname = info.nickname
    if (info.introduction) userInfo.value.introduction = info.introduction
  }

  return {
    userInfo,
    updateAvatar,
    updateNickname,
    updateIntroduction,
    updateUserInfo
  }
})
