<template></template>
<script setup>
import { useRouter } from 'vue-router';
import usePermissionStore from '@/store/modules/permission';

const router = useRouter();

const joinPath = (path1, path2) => {
  if (!path1) return path2;
  if (!path2) return path1;
  const normalizedPath1 = path1.endsWith('/') ? path1.slice(0, -1) : path1;
  const normalizedPath2 = path2.startsWith('/') ? path2 : '/' + path2;
  return normalizedPath1 + normalizedPath2;
};

const gotoFirstPowerRoute = () => {
  const powerRoutes = usePermissionStore().sidebarRouters || [];
  const firstPowerRoute = powerRoutes.find((item) => !item.hidden);
  if (!firstPowerRoute) {
    router.push('/401');
    return;
  }
  const children = firstPowerRoute.children;
  let path = firstPowerRoute.path;
  let query = firstPowerRoute.query;
  if (children && children.length > 0) {
    const child = children[0];
    path = joinPath(firstPowerRoute.path, child.path);
    query = child.query;
  }
  router.push({ path, query });
};

gotoFirstPowerRoute();
</script>
