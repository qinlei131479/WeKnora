<script setup lang="ts">
import { computed } from 'vue'
import { Folder, Plus, ChevronRight, Settings, Trash, UploadCloud } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import type { KnowledgeBase, KBFolder } from '@/lib/kb-store'

interface Props {
  kb: KnowledgeBase
  selectedNav: string
  isAddingFolder: boolean
  newFolderName: string
  addingToParentId: string | undefined
  expandedFolders: Record<string, boolean>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:selectedNav', value: string): void
  (e: 'update:isAddingFolder', value: boolean): void
  (e: 'update:newFolderName', value: string): void
  (e: 'update:addingToParentId', value: string | undefined): void
  (e: 'toggleExpand', folderId: string): void
  (e: 'handleCreateFolder'): void
  (e: 'handleZipUpload'): void
  (e: 'navigate', path: string): void
}>()

const rootFolders = computed(() => (props.kb.folders || []).filter(f => !f.parentId))

const getChildren = (parentId: string) => {
  return (props.kb.folders || []).filter(f => f.parentId === parentId)
}

const isExpanded = (folderId: string) => props.expandedFolders[folderId]
const isSelected = (folderId: string) => props.selectedNav === `folder-${folderId}`

const handleAddSubfolder = (folderId: string | undefined) => {
  emit('update:addingToParentId', folderId)
  emit('update:isAddingFolder', true)
  if (folderId && !isExpanded(folderId)) {
    emit('toggleExpand', folderId)
  }
}
</script>

<template>
  <div class="w-64 flex flex-col border-r h-full bg-white shrink-0">
    <div class="p-4 border-b">
      <Button variant="outline" class="w-full justify-start gap-2 text-slate-600 bg-white" @click="emit('navigate', '/kb')">
        <ChevronRight class="w-4 h-4 rotate-180" />
        <span>返回知识库列表</span>
      </Button>
    </div>

    <div class="p-3 text-xs font-bold text-slate-500">文件夹目录</div>
    <div class="flex-1 overflow-y-auto px-2 space-y-0.5">
      <div
        :class="[
          'flex items-center justify-between group px-2 py-1.5 rounded-md cursor-pointer text-sm',
          selectedNav === 'folder-root' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
        ]"
        @click="emit('update:selectedNav', 'folder-root')"
      >
        <div class="flex items-center gap-1.5">
          <span class="w-3.5 h-3.5 shrink-0" />
          <Folder :class="[
            'w-4 h-4 shrink-0',
            selectedNav === 'folder-root' ? 'text-blue-600 fill-blue-100' : 'text-slate-400'
          ]" />
          <span>根目录</span>
        </div>
        <div class="hidden group-hover:flex items-center gap-1 shrink-0">
          <Plus
            class="w-3.5 h-3.5 text-slate-400 hover:text-blue-600"
            @click.stop="handleAddSubfolder(undefined)"
            title="新建子文件夹"
          />
        </div>
      </div>

      <div v-if="isAddingFolder && addingToParentId === undefined" class="flex items-center gap-1 mt-1 mb-1 pl-6 pr-2">
        <Input
          autoFocus
          :value="newFolderName"
          @change="(e:any) => emit('update:newFolderName', (e.target as HTMLInputElement).value)"
          class="h-7 text-xs flex-1"
          placeholder="子文件夹名..."
          @keydown.enter="emit('handleCreateFolder')"
        />
        <Button size="sm" class="h-7 px-2 text-[10px] bg-blue-600 font-bold" @click="emit('handleCreateFolder')">确定</Button>
        <button class="text-[10px] text-slate-400" @click="emit('update:isAddingFolder', false)">取消</button>
      </div>

      <template v-for="folder in rootFolders" :key="folder.id">
        <div class="folder-node">
          <div
            :class="[
              'group flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer text-sm',
              isSelected(folder.id) ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
            ]"
            :style="{ paddingLeft: '24px' }"
            @click="emit('update:selectedNav', `folder-${folder.id}`)"
          >
            <div class="flex items-center gap-1.5 truncate">
              <ChevronRight
                v-if="getChildren(folder.id).length > 0"
                :class="[
                  'w-3.5 h-3.5 shrink-0 transition-transform',
                  isExpanded(folder.id) ? 'rotate-90 text-blue-600' : 'text-slate-400'
                ]"
                @click.stop="emit('toggleExpand', folder.id)"
              />
              <span v-else class="w-3.5 h-3.5 shrink-0" />
              <Folder :class="[
                'w-4 h-4 shrink-0',
                isSelected(folder.id) ? 'text-blue-600' : 'text-slate-400'
              ]" />
              <span class="truncate">{{ folder.name }}</span>
            </div>
            <div class="hidden group-hover:flex items-center gap-1 shrink-0">
              <Plus
                class="w-3.5 h-3.5 text-slate-400 hover:text-blue-600"
                @click.stop="handleAddSubfolder(folder.id)"
                title="新建子文件夹"
              />
            </div>
          </div>

          <div v-if="isAddingFolder && addingToParentId === folder.id" class="flex items-center gap-1 mt-1 mb-1" :style="{ paddingLeft: '40px' }">
            <Input
              autoFocus
              :value="newFolderName"
              @change="(e:any) => emit('update:newFolderName', (e.target as HTMLInputElement).value)"
              class="h-7 text-xs flex-1"
              placeholder="子文件夹名..."
              @keydown.enter="emit('handleCreateFolder')"
            />
            <Button size="sm" class="h-7 px-2 text-[10px] bg-blue-600 font-bold" @click="emit('handleCreateFolder')">确定</Button>
            <button class="text-[10px] text-slate-400" @click="emit('update:isAddingFolder', false)">取消</button>
          </div>

          <div v-if="isExpanded(folder.id)" class="sub-folders">
            <template v-for="child in getChildren(folder.id)" :key="child.id">
              <div class="folder-node">
                <div
                  :class="[
                    'group flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer text-sm',
                    isSelected(child.id) ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                  ]"
                  :style="{ paddingLeft: '40px' }"
                  @click="emit('update:selectedNav', `folder-${child.id}`)"
                >
                  <div class="flex items-center gap-1.5 truncate">
                    <ChevronRight
                      v-if="getChildren(child.id).length > 0"
                      :class="[
                        'w-3.5 h-3.5 shrink-0 transition-transform',
                        isExpanded(child.id) ? 'rotate-90 text-blue-600' : 'text-slate-400'
                      ]"
                      @click.stop="emit('toggleExpand', child.id)"
                    />
                    <span v-else class="w-3.5 h-3.5 shrink-0" />
                    <Folder :class="[
                      'w-4 h-4 shrink-0',
                      isSelected(child.id) ? 'text-blue-600' : 'text-slate-400'
                    ]" />
                    <span class="truncate">{{ child.name }}</span>
                  </div>
                  <div class="hidden group-hover:flex items-center gap-1 shrink-0">
                    <Plus
                      class="w-3.5 h-3.5 text-slate-400 hover:text-blue-600"
                      @click.stop="handleAddSubfolder(child.id)"
                      title="新建子文件夹"
                    />
                  </div>
                </div>

                <div v-if="isAddingFolder && addingToParentId === child.id" class="flex items-center gap-1 mt-1 mb-1" :style="{ paddingLeft: '56px' }">
                  <Input
                    autoFocus
                    :value="newFolderName"
                    @change="(e:any) => emit('update:newFolderName', (e.target as HTMLInputElement).value)"
                    class="h-7 text-xs flex-1"
                    placeholder="子文件夹名..."
                    @keydown.enter="emit('handleCreateFolder')"
                  />
                  <Button size="sm" class="h-7 px-2 text-[10px] bg-blue-600 font-bold" @click="emit('handleCreateFolder')">确定</Button>
                  <button class="text-[10px] text-slate-400" @click="emit('update:isAddingFolder', false)">取消</button>
                </div>

                <div v-if="isExpanded(child.id)" class="sub-folders">
                  <template v-for="grandchild in getChildren(child.id)" :key="grandchild.id">
                    <div class="folder-node">
                      <div
                        :class="[
                          'group flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer text-sm',
                          isSelected(grandchild.id) ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                        ]"
                        :style="{ paddingLeft: '56px' }"
                        @click="emit('update:selectedNav', `folder-${grandchild.id}`)"
                      >
                        <div class="flex items-center gap-1.5 truncate">
                          <span class="w-3.5 h-3.5 shrink-0" />
                          <Folder :class="[
                            'w-4 h-4 shrink-0',
                            isSelected(grandchild.id) ? 'text-blue-600' : 'text-slate-400'
                          ]" />
                          <span class="truncate">{{ grandchild.name }}</span>
                        </div>
                        <div class="hidden group-hover:flex items-center gap-1 shrink-0">
                          <Plus
                            class="w-3.5 h-3.5 text-slate-400 hover:text-blue-600"
                            @click.stop="handleAddSubfolder(grandchild.id)"
                            title="新建子文件夹"
                          />
                        </div>
                      </div>

                      <div v-if="isAddingFolder && addingToParentId === grandchild.id" class="flex items-center gap-1 mt-1 mb-1" :style="{ paddingLeft: '72px' }">
                        <Input
                          autoFocus
                          :value="newFolderName"
                          @change="(e:any) => emit('update:newFolderName', (e.target as HTMLInputElement).value)"
                          class="h-7 text-xs flex-1"
                          placeholder="子文件夹名..."
                          @keydown.enter="emit('handleCreateFolder')"
                        />
                        <Button size="sm" class="h-7 px-2 text-[10px] bg-blue-600 font-bold" @click="emit('handleCreateFolder')">确定</Button>
                        <button class="text-[10px] text-slate-400" @click="emit('update:isAddingFolder', false)">取消</button>
                      </div>
                    </div>
                  </template>
                </div>
              </div>
            </template>
          </div>
        </div>
      </template>

      <div class="pt-2 px-2 mt-2">
        <Button variant="ghost" size="sm" class="w-full justify-start text-xs text-blue-600 hover:text-blue-700 h-7 px-2" @click="handleAddSubfolder(undefined)">
          <Plus class="w-3.5 h-3.5 mr-1" />
          添加文件夹
        </Button>
        <Button variant="ghost" size="sm" class="w-full justify-start text-xs text-emerald-600 hover:text-emerald-700 h-7 px-2" @click="emit('handleZipUpload')">
          <UploadCloud class="w-3.5 h-3.5 mr-1" />
          导入ZIP自动建文件夹
        </Button>
      </div>
    </div>

    <div class="p-2 border-t space-y-0.5">
      <div
        :class="[
          'flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer text-sm',
          selectedNav === 'settings' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
        ]"
        @click="emit('update:selectedNav', 'settings')"
      >
        <Settings :class="[
          'w-4 h-4',
          selectedNav === 'settings' ? 'text-blue-600' : 'text-slate-400'
        ]" />
        <span>知识库设置</span>
      </div>
      <div
        :class="[
          'flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer text-sm',
          selectedNav === 'trash' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
        ]"
        @click="emit('update:selectedNav', 'trash')"
      >
        <Trash :class="[
          'w-4 h-4',
          selectedNav === 'trash' ? 'text-blue-600' : 'text-slate-400'
        ]" />
        <span>回收站</span>
      </div>
    </div>
  </div>
</template>