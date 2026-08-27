<script setup lang="ts">
import { API } from '@/api';
import type { SkillVO } from '@/types/api/data/skill';

const loading = ref(false);
const keyword = ref('');
const skillsAvailable = ref<boolean | null>(null);
const skills = ref<SkillVO[]>([]);

const filteredSkills = computed(() => {
  const q = keyword.value.trim().toLowerCase();
  if (!q) return skills.value;

  return skills.value.filter((item: SkillVO) => {
    const name = (item.name ?? '').toLowerCase();
    const description = (item.description ?? '').toLowerCase();
    return name.includes(q) || description.includes(q);
  });
});

const getSkills = () => {
  loading.value = true;
  API.Skills.list()
    .then((res) => {
      skills.value = res.data?.data ?? [];
      skillsAvailable.value = res.data?.skills_available ?? false;
    })
    .catch((error) => {
      console.error('[Skill] load failed:', error);
      skills.value = [];
      skillsAvailable.value = null;
    })
    .finally(() => {
      loading.value = false;
    });
};

onMounted(() => {
  getSkills();
});
</script>

<template>
  <section>
    <page-name :title="$t('page.data.skill.title', 'Skill管理')">
      <!-- <el-tag v-if="skillsAvailable === true" type="success">
        {{ $t('page.data.skill.status.available', '技能可用') }}
      </el-tag>
      <el-tag v-else-if="skillsAvailable === false" type="info">
        {{ $t('page.data.skill.status.unavailable', '技能未启用') }}
      </el-tag> -->
    </page-name>

    <page-content>
      <template #header>
        <div class="search-bar">
          <el-input
            v-model="keyword"
            class="search-bar__input"
            clearable
            :placeholder="$t('page.data.skill.search.placeholder', '输入技能名称或描述搜索')"
          />
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="filteredSkills"
        show-overflow-tooltip
        height="100%"
        style="width: 100%"
      >
        <template #empty>
          <kjsc-empty
            :description="
              skillsAvailable === false
                ? $t('page.data.skill.empty.unavailable', '当前系统未配置预装技能目录')
                : undefined
            "
          />
        </template>
        <el-table-column
          prop="name"
          :label="$t('page.data.skill.table.name', '技能名称')"
          :min-width="$dim('page.data.skill.table.name', 220)"
        />
        <el-table-column
          prop="description"
          :label="$t('page.data.skill.table.description', '技能描述')"
          :min-width="$dim('page.data.skill.table.description', 360)"
        />
      </el-table>
    </page-content>
  </section>
</template>

<style lang="scss" scoped></style>
