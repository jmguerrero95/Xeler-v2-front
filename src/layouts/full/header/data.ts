import MyProfileIcon from '@/assets/icons/header/Profile/MyProfileIcon.vue'
import MyActivityIcon from '@/assets/icons/header/Profile/MyActivityIcon.vue'

const profile: ProfileItem[] = [
  {
    title: "Mi Perfil",
    icon: MyProfileIcon,
    to: 'profile'
  },
  {
    title: "Mi actividad",
    icon: MyActivityIcon,
    to: 'activity'
  },
];

export { profile };

interface ProfileItem {
  title: string;
  icon: any
  to: ToItems
}

export type ToItems = 'profile' | 'activity'