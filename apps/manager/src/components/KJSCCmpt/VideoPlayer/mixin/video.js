
export default {
    computed: {
        // url(){
        //     return this.params && this.params.url || ''
        // },
        bufferedProgress() {
            if (!this.showBuffer) return []
            var bufferedFlag = this.bufferedFlag
            var video = this.$refs.video
            if (!video) return []
            var buffered = video.buffered
            var length = buffered.length
            var items = []
            for (var i = 0; i < length; i++) {
                items.push({ start: buffered.start(i), end: buffered.end(i) })
            }
            return items
        },
    },
    methods: {

        ontimeupdate() {
            var video = this.$refs.video
            if (!video) return
            var timeSecond = video.currentTime
            // console.log('ontimeupdate, timeSecond='+timeSecond)
            // timeSecond = ~~timeSecond
            // this.currentTime = formatSecond(timeSecond)
            this.currentTime = timeSecond
            this.cursorLeft = this.time2Position(timeSecond)
            // this.updateCursorPosition(this.getPositionByMillisecond(timeSecond*1000))
            this.isPlaying = !video.paused
            if (video.paused) return
            var activeItem = this.innerActiveItem
            if (activeItem.isFullVideo) return

            // if(this.isUserPickTime){
            //     var times = activeItem.item.times || [];
            //     times.some(item=>{
            //         if(timeSecond >= item.start && timeSecond <= item.end){
            //             return true
            //         }
            //     })
            // }

            var times = activeItem.skipTimes
            if (!times || !times.length) return
            var inSkip = times.some(item => {
                if (timeSecond > item.start && timeSecond < item.end) {
                    if (!this.isUserPickTime) {
                        this.$nextTick(function () {
                            this.$refs.video.currentTime = item.end
                        })
                    }

                    return true
                }
            })
            if (!inSkip) {
                this.isUserPickTime = false
            }
        },
        onended() {
            this.isPlaying = false
            this.isUserPickTime = false
        },
        onloadedmetadata() {
            var video = this.$refs.video
            if (!video) return
            var duration = video.duration
            // duration = ~~duration
            // console.log('onloadedmetadata duration=' + duration)
            // this.totalTime = formatSecond(duration)
            this.totalTime = duration
            this.updateItemSkipTimes()
        },
        onprogress() {
            console.log('onprogress')
            if (!this.showBuffer) return
            this.bufferedFlag = {}
        },

        updateItemSkipTimes() {
            var totalTime = this.totalTime
            var items = this.innerPartItems
            if (items) {
                items.forEach(item => {
                    var times = item.item.times || []
                    var skips = []
                    var from = 0
                    times.forEach(time => {
                        var start = time.start
                        var end = time.end
                        if (start > from) {
                            skips.push({
                                start: from,
                                end: start
                            })
                        }
                        from = end
                    })
                    if (from < totalTime) {
                        skips.push({
                            start: from,
                            end: totalTime
                        })
                    }
                    item.skipTimes = skips
                })
            }

        },



    },
}