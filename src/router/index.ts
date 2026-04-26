import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import CreateView from '../views/CreateView.vue'
import ProfileEditView from '../views/ProfileEditView.vue'
import DashboardView from '../views/DashboardView.vue'
import EntitySelectView from '../views/EntitySelectView.vue'
import CouponListView from '../views/CouponListView.vue'
import CouponDetailView from '../views/CouponDetailView.vue'
import CartView from '../views/CartView.vue'
import CheckoutView from '../views/CheckoutView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/create',
      name: 'create',
      component: CreateView
    },
    {
      path: '/profile-edit',
      name: 'profileEdit',
      component: ProfileEditView
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView
    },
    {
      path: '/entity-select',
      name: 'entitySelect',
      component: EntitySelectView
    },
    {
      path: '/coupon-list',
      name: 'couponList',
      component: CouponListView
    },
    {
      path: '/coupon-detail/:id',
      name: 'couponDetail',
      component: CouponDetailView
    },
    {
      path: '/cart',
      name: 'cart',
      component: CartView
    },
    {
      path: '/checkout',
      name: 'checkout',
      component: CheckoutView
    }
  ]
})

export default router
