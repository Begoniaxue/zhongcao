import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import CreateView from '../views/CreateView.vue'
import ProfileEditView from '../views/ProfileEditView.vue'
import CouponListView from '../views/coupon/CouponListView.vue'
import CouponDetailView from '../views/coupon/CouponDetailView.vue'
import CartView from '../views/coupon/CartView.vue'
import CheckoutView from '../views/coupon/CheckoutView.vue'
import OrderView from '../views/coupon/OrderView.vue'
import MallDashboardView from '../views/copkit/MallDashboardView.vue'
import RealtimeDashboardView from '../views/RealtimeDashboardView.vue'
import UploadDemoView from '../views/UploadDemoView.vue'
import GalleryView from '../views/GalleryView.vue'

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
    },
    {
      path: '/order',
      name: 'order',
      component: OrderView
    },
    {
      path: '/mall-dashboard',
      name: 'mallDashboard',
      component: MallDashboardView
    },
    {
      path: '/realtime-dashboard',
      name: 'realtimeDashboard',
      component: RealtimeDashboardView
    },
    {
      path: '/upload-demo',
      name: 'uploadDemo',
      component: UploadDemoView
    },
    {
      path: '/gallery',
      name: 'gallery',
      component: GalleryView
    }
  ]
})

export default router
