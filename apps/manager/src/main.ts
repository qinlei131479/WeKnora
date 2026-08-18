// import { createApp } from 'vue'

import Cookies from 'js-cookie';

import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import 'element-plus/theme-chalk/dark/css-vars.css';
import locale from 'element-plus/es/locale/lang/zh-cn';

import '@/assets/styles/index.scss'; // global css
import './index.css';
import '@/assets/styles/newStyle.scss';
import '@/assets/styles/newStyle2.scss';

import App from './App.vue';
import store from './store';
import router from './router';
import directive from './directive'; // directive

import "./assets/fonts.css";
import TDesign from "tdesign-vue-next";
import "tdesign-vue-next/dist/tdesign.css";

// 注册指令
import plugins from './plugins'; // plugins
import { download, getDownload, postDownload, postDownload2, uploadFile } from '@/utils/request';

// svg图标
import 'virtual:svg-icons-register';
import SvgIcon from '@/components/SvgIcon/index.vue';
import elementIcons from '@/components/SvgIcon/svgicon';

import './permission'; // permission control

import { useDict } from '@/utils/dict';
import { getConfigKey } from '@/api/system/config';
import { parseTime, resetForm, addDateRange, handleTree, selectDictLabel, selectDictLabels } from '@/utils/ruoyi';

// 分页组件
import Pagination from '@/components/Pagination/index.vue';
// 自定义表格工具组件
import RightToolbar from '@/components/RightToolbar/index.vue';
// 富文本组件
import Editor from '@/components/Editor/index.vue';
// 文件上传组件
import FileUpload from '@/components/FileUpload/index.vue';
// 图片上传组件
import ImageUpload from '@/components/ImageUpload/index.vue';
// 图片预览组件
import ImagePreview from '@/components/ImagePreview/index.vue';
// 字典标签组件
import DictTag from '@/components/DictTag/index.vue';

import KJSCDialogV2 from '@/components/KJSCCmpt/KJSCDialogV2.vue';
import KJSCToolBar from '@/components/KJSCCmpt/KJSCToolBar.vue';

import KjscUi from '@/components/KjscUi';
import MyPage from '@/components/my-page.vue';
import PageName from '@/components/page/PageName.vue';
import PageLayout from '@/components/page/PageLayout.vue';
import PageSearchForm from '@/components/page/PageSearchForm.vue';
import OverflowTooltip from '@/components/common/OverflowTooltip.vue';

import Btn from '@/components/controls/Btn.vue';
import EmptyCell from '@/components/controls/EmptyCell.vue';
import InputNumberRadius from '@/components/controls/InputNumberRadius.vue';
import InputRadius from '@/components/controls/InputRadius.vue';
import InputRound from '@/components/controls/InputRound.vue';
import RadioGroup from '@/components/controls/RadioGroup.vue';

import { installTDesignIconOfflineGuard } from "@/utils2/tdesign-icon-offline";
import { installAutofillGuard } from "@/utils2/disable-autofill";
import { ensureFeatureFlags } from "@/utils2/weknoraFeatures";

// 必须在 Vue 组件挂载之前执行，避免 tdesign-icons 运行时请求 tdesign.gtimg.com
installTDesignIconOfflineGuard();

// 功能开关：无缓存则写入默认值，已有则不动
ensureFeatureFlags();

const app = createApp(App);

// 全局方法挂载
app.config.globalProperties.useDict = useDict;
app.config.globalProperties.download = download;
app.config.globalProperties.getDownload = getDownload;
app.config.globalProperties.postDownload = postDownload;
app.config.globalProperties.postDownload2 = postDownload2;
app.config.globalProperties.uploadFile = uploadFile;
app.config.globalProperties.parseTime = parseTime;
app.config.globalProperties.resetForm = resetForm;
app.config.globalProperties.handleTree = handleTree;
app.config.globalProperties.addDateRange = addDateRange;
app.config.globalProperties.getConfigKey = getConfigKey;
app.config.globalProperties.selectDictLabel = selectDictLabel;
app.config.globalProperties.selectDictLabels = selectDictLabels;

// 全局组件挂载
app.component('DictTag', DictTag);
app.component('Pagination', Pagination);
app.component('FileUpload', FileUpload);
app.component('ImageUpload', ImageUpload);
app.component('ImagePreview', ImagePreview);
app.component('RightToolbar', RightToolbar);
app.component('Editor', Editor);
app.component('KJSCDialogV2', KJSCDialogV2);
app.component(KJSCToolBar.name, KJSCToolBar);
app.component('my-page', MyPage);
app.component('page-name', PageName);
app.component('page-layout', PageLayout);
app.component('page-search-form', PageSearchForm);

app.component('btn', Btn);
app.component('empty-cell', EmptyCell);
app.component('input-number-radius', InputNumberRadius);
app.component('input-radius', InputRadius);
app.component('input-round', InputRound);
app.component('radio-group', RadioGroup);
app.component('g-text', OverflowTooltip);

app.use(TDesign);
app.use(router);
app.use(store);
app.use(plugins);
app.use(elementIcons);
app.use(KjscUi);
app.component('svg-icon', SvgIcon);

directive(app);

// 使用element-plus 并且设置全局的大小
// @ts-ignore
app.use(ElementPlus, {
  locale: locale,
  // 支持 large、default、small
  size: Cookies.get('size') || 'default'
});

// 等首屏路由（含导航守卫、Lite 自动登录）完成后再挂载，避免先闪默认页再跳转
router.isReady().finally(() => {
  app.mount("#app");
  installAutofillGuard();
});
