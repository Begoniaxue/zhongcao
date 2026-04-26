import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Coupon {
  id: number
  title: string
  subtitle: string
  mainImage: string
  price: number
  originalPrice: number
  discount: string
  validFrom: string
  validTo: string
  stock: number
  soldCount: number
  description: string
  details: string[]
}

export interface CartItem {
  coupon: Coupon
  quantity: number
}

export const useCouponStore = defineStore('coupon', () => {
  const coupons = ref<Coupon[]>([
    {
      id: 1,
      title: '星巴克中杯饮品兑换券',
      subtitle: '全场饮品通用，周末节假日可用',
      mainImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=starbucks%20coffee%20cup%20with%20logo%20on%20wooden%20table&image_size=square',
      price: 0.1,
      originalPrice: 38,
      discount: '7.4折',
      validFrom: '2026-01-01',
      validTo: '2026-12-31',
      stock: 100,
      soldCount: 2568,
      description: '此券可兑换星巴克任意中杯饮品，包括美式、拿铁、卡布奇诺等。全国大部分门店通用，特殊门店除外。',
      details: [
        '兑换方式：到店出示券码即可兑换',
        '适用门店：全国指定门店（机场、火车站等特殊门店除外）',
        '有效期：自购买之日起365天内有效',
        '退款政策：未使用可随时退款，过期自动退款',
        '使用限制：每次限用一张，不与其他优惠同享'
      ]
    },
    {
      id: 2,
      title: '海底捞200元代金券',
      subtitle: '全场通用，可叠加使用',
      mainImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=hotpot%20restaurant%20with%20various%20dishes%20and%20soup%20base&image_size=square',
      price: 0.2,
      originalPrice: 200,
      discount: '9.2折',
      validFrom: '2026-01-01',
      validTo: '2026-06-30',
      stock: 50,
      soldCount: 1245,
      description: '海底捞200元代金券，全场通用，可叠加多张使用。适用于全国所有海底捞门店。',
      details: [
        '兑换方式：到店出示券码即可抵扣',
        '适用门店：全国所有海底捞门店',
        '有效期：自购买之日起180天内有效',
        '退款政策：未使用可随时退款',
        '使用限制：可叠加使用，不设找零'
      ]
    },
    {
      id: 3,
      title: '优衣库50元无门槛券',
      subtitle: '全场商品通用，可与会员折扣叠加',
      mainImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=clothing%20store%20interior%20with%20modern%20fashion%20display&image_size=square',
      price: 45,
      originalPrice: 50,
      discount: '9折',
      validFrom: '2026-04-01',
      validTo: '2026-05-31',
      stock: 200,
      soldCount: 3567,
      description: '优衣库50元无门槛代金券，全场商品通用，可与会员折扣叠加使用。',
      details: [
        '兑换方式：线下门店出示券码或线上APP绑定使用',
        '适用门店：全国优衣库门店及官方APP',
        '有效期：2026年4月1日至2026年5月31日',
        '退款政策：未使用可随时退款',
        '使用限制：单笔订单限用一张，可与会员折扣叠加'
      ]
    },
    {
      id: 4,
      title: '喜茶买一送一券',
      subtitle: '指定饮品买一送一，不限时段',
      mainImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=milk%20tea%20and%20fruit%20tea%20with%20ice%20and%20toppings&image_size=square',
      price: 15,
      originalPrice: 25,
      discount: '6折',
      validFrom: '2026-01-01',
      validTo: '2026-12-31',
      stock: 500,
      soldCount: 8923,
      description: '喜茶指定饮品买一送一券，购买一份指定饮品可获赠同款一份。适用于全国喜茶门店。',
      details: [
        '兑换方式：到店或小程序点单时使用',
        '适用门店：全国喜茶门店',
        '有效期：自购买之日起365天内有效',
        '退款政策：未使用可随时退款',
        '使用限制：每次限用一张，指定饮品包括：多肉葡萄、芝芝莓莓、烤黑糖波波牛乳'
      ]
    },
    {
      id: 5,
      title: '万达影城电影票兑换券',
      subtitle: '2D/3D通兑，IMAX需补差价',
      mainImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cinema%20theater%20with%20seats%20and%20big%20screen&image_size=square',
      price: 35,
      originalPrice: 60,
      discount: '5.8折',
      validFrom: '2026-01-01',
      validTo: '2026-09-30',
      stock: 300,
      soldCount: 5678,
      description: '万达影城2D/3D电影通兑券，可兑换任意场次电影票。IMAX、杜比等特殊影厅需补差价。',
      details: [
        '兑换方式：线上选座或现场兑换',
        '适用门店：全国万达影城',
        '有效期：自购买之日起270天内有效',
        '退款政策：未使用可随时退款',
        '使用限制：2D/3D通兑，IMAX、杜比等需补差价20-50元不等'
      ]
    },
    {
      id: 6,
      title: '肯德基全家桶套餐券',
      subtitle: '超值全家桶，包含5块炸鸡+4份小食',
      mainImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fried%20chicken%20bucket%20with%20fries%20and%20drinks&image_size=square',
      price: 89,
      originalPrice: 129,
      discount: '6.9折',
      validFrom: '2026-04-01',
      validTo: '2026-07-31',
      stock: 150,
      soldCount: 2345,
      description: '肯德基超值全家桶套餐券，包含5块炸鸡、4份小食和4杯饮品。适合3-4人分享。',
      details: [
        '兑换方式：到店出示券码或APP点单',
        '适用门店：全国肯德基门店（交通枢纽店除外）',
        '有效期：2026年4月1日至2026年7月31日',
        '退款政策：未使用可随时退款',
        '套餐内容：5块炸鸡（原味/香辣可选）、2份薯条、2份上校鸡块、4杯可乐'
      ]
    },
    {
      id: 7,
      title: '耐克100元满减券',
      subtitle: '满500减100，可与店铺活动叠加',
      mainImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=sports%20shoes%20and%20sportswear%20in%20modern%20store&image_size=square',
      price: 50,
      originalPrice: 100,
      discount: '5折',
      validFrom: '2026-04-15',
      validTo: '2026-05-15',
      stock: 100,
      soldCount: 6789,
      description: '耐克官方旗舰店满500减100优惠券，可与店铺活动叠加使用。适用于线上旗舰店。',
      details: [
        '兑换方式：线上旗舰店绑定使用',
        '适用渠道：耐克官方旗舰店（天猫/京东/官网）',
        '有效期：2026年4月15日至2026年5月15日',
        '退款政策：未使用可随时退款',
        '使用限制：满500元可用，可与店铺活动叠加，但不可与其他优惠券叠加'
      ]
    },
    {
      id: 8,
      title: '必胜客双人套餐券',
      subtitle: '经典双人套餐，含披萨+意面+饮品',
      mainImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=pizza%20pasta%20and%20drinks%20on%20restaurant%20table&image_size=square',
      price: 128,
      originalPrice: 188,
      discount: '6.8折',
      validFrom: '2026-01-01',
      validTo: '2026-12-31',
      stock: 200,
      soldCount: 4567,
      description: '必胜客经典双人套餐券，包含一份9寸披萨、一份意面和两杯饮品。适合情侣或朋友小聚。',
      details: [
        '兑换方式：到店出示券码或APP点单',
        '适用门店：全国必胜客门店',
        '有效期：自购买之日起365天内有效',
        '退款政策：未使用可随时退款',
        '套餐内容：9寸超级至尊披萨（或其他同等价位披萨）、经典意式肉酱面、两杯柠檬红茶'
      ]
    }
  ])

  const cart = ref<CartItem[]>([])
  const checkoutItems = ref<CartItem[]>([])

  const cartTotal = computed(() => {
    return cart.value.reduce((sum, item) => sum + item.coupon.price * item.quantity, 0)
  })

  const cartCount = computed(() => {
    return cart.value.reduce((sum, item) => sum + item.quantity, 0)
  })

  const checkoutTotal = computed(() => {
    return checkoutItems.value.reduce((sum, item) => sum + item.coupon.price * item.quantity, 0)
  })

  const checkoutCount = computed(() => {
    return checkoutItems.value.reduce((sum, item) => sum + item.quantity, 0)
  })

  function getCouponById(id: number): Coupon | undefined {
    return coupons.value.find(c => c.id === id)
  }

  function addToCart(coupon: Coupon, quantity: number = 1) {
    const existingItem = cart.value.find(item => item.coupon.id === coupon.id)
    
    if (existingItem) {
      existingItem.quantity += quantity
    } else {
      cart.value.push({ coupon, quantity })
    }
    
    return { success: true, message: '已加入购物车' }
  }

  function removeFromCart(couponId: number) {
    const index = cart.value.findIndex(item => item.coupon.id === couponId)
    if (index > -1) {
      cart.value.splice(index, 1)
    }
  }

  function updateCartItemQuantity(couponId: number, quantity: number) {
    const item = cart.value.find(i => i.coupon.id === couponId)
    if (item) {
      if (quantity <= 0) {
        removeFromCart(couponId)
      } else {
        item.quantity = quantity
      }
    }
  }

  function clearCart() {
    cart.value = []
  }

  function setCheckoutItems(items: CartItem[]) {
    checkoutItems.value = items
  }

  function clearCheckout() {
    checkoutItems.value = []
  }

  function purchaseCoupon(coupon: Coupon, quantity: number = 1) {
    if (coupon.stock < quantity) {
      return { success: false, message: '库存不足' }
    }
    
    coupon.stock -= quantity
    coupon.soldCount += quantity
    
    return { success: true, message: `购买成功！共 ${quantity} 张卡券` }
  }

  function purchaseCart() {
    if (cart.value.length === 0) {
      return { success: false, message: '购物车为空' }
    }
    
    for (const item of cart.value) {
      if (item.coupon.stock < item.quantity) {
        return { success: false, message: `${item.coupon.title} 库存不足` }
      }
    }
    
    for (const item of cart.value) {
      item.coupon.stock -= item.quantity
      item.coupon.soldCount += item.quantity
    }
    
    const total = cartTotal.value
    clearCart()
    
    return { success: true, message: `购买成功！共 ¥${total.toFixed(2)}` }
  }

  return {
    coupons,
    cart,
    cartTotal,
    cartCount,
    checkoutItems,
    checkoutTotal,
    checkoutCount,
    getCouponById,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    clearCart,
    setCheckoutItems,
    clearCheckout,
    purchaseCoupon,
    purchaseCart
  }
})
