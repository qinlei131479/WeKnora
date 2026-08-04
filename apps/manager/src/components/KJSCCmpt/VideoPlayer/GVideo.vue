<template>
  <div class="g-video" :class="fullscreen ? 'g-fullscreen' : ''">
    <div class="g-video-wrapper">
      <div class="video-box">
        <!-- autoplay -->
        <video
          ref="video"
          autoplay
          preload
          x5-playsinline
          playsinline
          webkit-playsinline
          class="my-video"
          :src="url"
          @timeupdate="ontimeupdate"
          @ended="onended"
          @loadedmetadata="onloadedmetadata"
        >
          <source type="video/mp4" :src="url" />
        </video>
      </div>
      <div class="control-box">
        <div class="progress-tracks-container" @click="onTracksContainerClick">
          <div ref="tracks" class="progress-tracks">
            <div class="progress-tracks-play" :style="progressPlayStyle"></div>
            <div
              v-for="(item, i) in subProgress"
              :key="i"
              class="progress-sub"
              :style="getSubProgressStyle(item)"
            ></div>
          </div>
        </div>

        <div class="controllers">
          <div class="play-button" :class="isPlaying ? 'play-pause' : ''" @click="onPlayClick">
            <div class="play-button-triangle"></div>
          </div>
          <div class="play-times">
            <span class="current-time">{{ formatTime(currentTime) }}</span>
            /
            <span class="total-time">{{ formatTime(totalTime) }}</span>
          </div>
          <div class="fullscreen-button-box">
            <div class="fullscreen-button" :class="fullscreen ? 'is-fullscreen' : ''" @click="onFullScreenClick"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { formatSecond } from '@/utils/time.js';

import controlMixin from './mixin/control.js';
import videoMixin from './mixin/video.js';

export default {
  mixins: [videoMixin, controlMixin],
  props: {
    url: {
      type: String
    } // {url: String, partItems: Array}
  },

  data() {
    const fullItem = {
      isSelected: true,
      get isFullVideo() {
        return true;
      }
    };
    return {
      isPlaying: false,
      isUserPickTime: false,

      currentTime: 0, // 单位：毫秒
      totalTime: 0, // 单位：毫秒

      onlyWatchHim: false,

      fullscreen: false,

      partsLeft: 0,
      maxMoveParts: 0,

      cursorLeft: 0,
      maxCursor: 0,

      fullItem,
      innerActiveItem: fullItem,

      // risizeSignal: {},

      bufferedFlag: {}
    };
  },

  computed: {
    formatTime() {
      return function (time) {
        return formatSecond(time);
      };
    }
  },

  watch: {
    url() {
      const video = this.$refs.video;
      this.isPlaying = false;
      this.currentTime = 0;
      this.totalTime = 0;

      this.onlyWatchHim = false;
      this.partsLeft = 0;

      this.cursorLeft = 0;

      this.innerActiveItem = this.fullItem;
      this.innerActiveItem.isSelected = true;

      this.isUserPickTime = false;

      if (video) {
        video.pause();
        video.currentTime = 0;
      }
      // var url = (this.params && this.params.url) || "";
      // if (url && url == this.url) {
      //   this.url = "";
      //   this.$nextTick((_) => {
      //     this.url = url;
      //   });
      // } else {
      //   this.url = url;
      // }
    }
  },

  mounted() {
    window.vg = this;
  },

  methods: {
    time2Position(secondTime) {
      if (!secondTime) return 0;
      return (secondTime / this.totalTime) * this.$refs.tracks.offsetWidth;
    },

    position2Time(left) {
      if (!left) return 0;
      return (left / this.$refs.tracks.offsetWidth) * this.totalTime;
    },

    updateVideoByCursor() {
      this.$refs.video.currentTime = this.currentTime = this.position2Time(this.cursorLeft);
    }
  }
};
</script>
<style>
.g-fullscreen ~ * {
  display: none;
}
</style>
<style scoped>
p {
  margin: 0;
  padding: 0;
}
.g-video {
  /* background: #fbf0e2; */
  position: relative;
  overflow: auto;
}
.g-fullscreen {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  width: auto;
  overflow: hidden;
  z-index: 9999;
  background-color: #ffffff;
}

.g-video-wrapper {
  width: 1334px;
  overflow: hidden;
  background: #222328;
}
.video-box {
  /* height: 754px; */
  height: 751px;
  position: relative;
  overflow: hidden;
}
.g-fullscreen .g-video-wrapper {
  width: 100% !important;
  height: 100% !important;
}
.g-fullscreen .video-box {
  height: calc(100% - 70px) !important;
}
.video-box > video {
  width: 100%;
  height: 100%;
}
.parts-container {
  position: absolute;
  /* height: 130px; */
  bottom: -140px;
  width: 100%;
  overflow: hidden;
  transition: all 0.3s;
  left: 3px;
  user-select: none;
}
.parts-container.is-show {
  bottom: 20px;
}
.parts-container-inner {
  display: flex;
  flex-wrap: nowrap;
  transform: translateX(0);
}
.part-box {
  width: 260px;
  height: 130px;
  /* margin-right: 20px; */
  border-radius: 4px;
  border: 2px solid transparent;
  box-sizing: content-box;
  background: #000000;
  opacity: 0.5;
  flex-shrink: 0;
  cursor: pointer;
  user-select: none;
  box-sizing: border-box;
  transition: all 0.1s;
}
.part-box.is-active {
  border-color: #ffffff;
  /* transform: scale(1.05); */
}
.part-box:hover {
  border-color: #888888;
}
.part-box + .part-box {
  margin-left: 20px;
}
.part-box-full-wrapper {
  display: flex;
  width: 100%;
  height: 100%;
}
.part-box-full-wrapper-inner {
  margin: auto;
  display: flex;
}
.part-box-full-wrapper-inner img {
  width: 20px;
  height: 20px;
}
.part-box-full-wrapper-inner p {
  font-size: 16px;
  font-weight: 500;
  color: #ffffff;
  margin-left: 9px;
  line-height: 20px;
}

.current-part-label {
  position: absolute;
  top: 25px;
  right: 30px;
  background: #00000066;
  color: #fff;
  font-size: 16px;
  line-height: 2;
}
.startName {
  color: #ff0000;
}

.control-box {
  height: 70px;
  /* background: #222328; */
  position: relative;
}
.progress-tracks-container {
  padding: 8px 0;
  cursor: pointer;
}
.progress-tracks {
  height: 3px;
  background: #656565;
  position: relative;
}
.progress-tracks-play {
  height: 100%;
  background: #6987ff;
  width: 0;
}
.progress-sub {
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  background: #d1d1d1;
  pointer-events: none;
}
</style>

<style scoped>
.controllers {
  display: flex;
  margin-top: 10px;
  padding: 0 30px;
}
.play-button {
  cursor: pointer;
}
.play-button-triangle {
  width: 0;
  height: 0;
  border-top: 11px solid transparent;
  border-left: 18px solid #fff;
  border-bottom: 11px solid transparent;
  margin: auto;
}
.play-pause .play-button-triangle {
  border: 0;
  border-left: 5px solid #fff;
  border-right: 5px solid #fff;
  width: 8px;
  height: 22px;
}

.play-times {
  margin: 0 auto 0 30px;
  line-height: 22px;
  font-size: 14px;
  font-weight: bold;
  color: #b9becb;
}
.current-time {
  color: #ffffff;
}

.only-watch-him-button {
  font-size: 14px;
  color: #ffffff;
  font-weight: 500;
  line-height: 1;
  padding: 9px 13px;
  background: #595a5e;
  border-radius: 4px;
  position: relative;
  top: -5px;
  margin-right: 30px;
  cursor: pointer;
}
.only-watch-him-button-active {
  background: #5576fa;
}

.fullscreen-button {
  /* font-size: 22px;
        color: #ffffff;
        font-size: 0; */
  cursor: pointer;
  width: 21px;
  height: 21px;
  display: inline-block;
  vertical-align: top;
  background: url('../../assets/img/player/fullscreen.png') no-repeat center center;
}
.is-fullscreen {
  background-image: url('../../assets/img/player/unfullscreen.png');
}
/* .fullscreen-button i {
        cursor: pointer;
        font-size: 22px;
    } */
</style>

<style scoped>
.axis-cursor {
  height: 35px;
  width: 3px;
  position: absolute;
  bottom: 55px;
  left: 100px;
  background: #ff6161;
  cursor: pointer;
  user-select: none;
  transition: left 0.1s;
}
.axis-cursor::before {
  content: ' ';
  position: absolute;
  display: block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #ff6161;
  left: -4px;
}
</style>
