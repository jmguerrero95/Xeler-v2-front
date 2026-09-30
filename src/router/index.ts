import { isAutenticated } from "@/helper";
import { createRouter, createWebHistory } from "vue-router";
import admin from './admin'
import user from './user'
import { UserStore } from "@/stores/UserStore";

const router = createRouter({
  //history: createWebHistory(import.meta.env.BASE_URL),
  history: createWebHistory("/"),
  routes: [
    {
      name: "Home",
      path: "/home",
      component: () =>
        import("@/views/HomeView.vue"),
    },
    {
      path: "/auth",
      redirect: "/login",
      component: () => import("@/layouts/auth/authLayout.vue"),
      children: [
        {
          name: "Login",
          path: "/login",
          component: () =>
            import("@/views/auth/Login.vue"),
        },
        {
          name: "Register",
          path: "/register",
          component: () =>
            import("@/views/auth/Register.vue"),
        },
        {
          name: "recover-password",
          path: "/recover-password",
          component: () =>
            import("@/views/auth/RecoverPassword.vue"),
        },
        {
          name: "Unauthorized",
          path: "/unauthorized",
          component: () =>
            import("@/views/auth/Unauthorized.vue"),
        },
        {
          name: "Forbidden",
          path: "/forbidden",
          component: () =>
            import("@/views/errors/ForbiddenView.vue"),
        },
        { name: "InitialSetup", path: "/configuracion-inicial", component: () => import("@/views/auth/InitialSetup.vue") },
        { name: "AcceptAdminInvitation", path: "/aceptar-invitacion/:token", component: () => import("@/views/auth/AcceptAdminInvitation.vue") },
      ],
    },
    {
      path: "/",
      redirect: "/home",
      component: () => import("@/layouts/full/FullLayout.vue"),
      children: [
        ...admin,
        ...user,
        {
          name: "Notifications",
          path: "notifications/2",
          component: () =>
            import("@/views/generals/NotificationsView2.vue"),
        },
      ],
    },
    {
      name: "NotFound",
      path: "/404",
      component: () => import("@/views/auth/404.vue"),
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: { name: "NotFound" },
    },
  ],
});

const routesGuests = [
  'Login',
  'Register',
  'Home',
  'recover-password',
  'Forbidden',
  'Unauthorized',
  'NotFound',
  'InitialSetup',
  'AcceptAdminInvitation',
]
router.beforeEach(async (to, from, next) => {

  if (!isAutenticated()) {
    // if(to.name != 'Login' && to.name != 'register' && to.name != 'auth-forgot-password'){
    if (!routesGuests.includes(to.name as string)) {
      return next({ name: 'Login' });
    }
  } else if (to.name == 'Login') {
    const userStore = UserStore();
    return next({ name: userStore.defaultAuthenticatedRoute() });
  }

  return next();
})


export default router;
