function getStylePosition(node){
    return getComputedStyle(node)['position']
}

export default {
    computed: {
        
        progressPlayStyle(){
            var width = 0
            var currentTime = this.currentTime
            var totalTime = this.totalTime
            if(currentTime){
                var totalWidth = this.$refs.tracks.offsetWidth
                width = currentTime / totalTime * totalWidth
                width = `${width}px`
            }
            return {
                width
            }
        },
        
        cursorStyle(){
            var cursor = this.$refs.cursor
            var cursorLeft = this.cursorLeft
            var cursorWidth = cursor && cursor.offsetWidth || 0
            cursorLeft -= cursorWidth / 2
            return {
                left: cursorLeft ? `${cursorLeft}px`:0,
            }
        },
        
        subProgress(){
            var activeItem = this.innerActiveItem
            if(activeItem == this.fullItem){
                return []
            }
            var totalTime = this.totalTime
            var times = activeItem.item.times || []
            var pgs = []
            times.forEach(item=>{
                var start = item.start
                if(start < totalTime){
                    var end = item.end
                    if(end > totalTime){
                        end = totalTime
                    }
                    pgs.push({ start, end })
                }
            })
            return pgs
        },
    },
    
    methods: {
        
        getSubProgressStyle(item){
            // var item = partItem.item
            // var risizeSignal = this.risizeSignal
            var totalWidth = this.$refs.tracks.offsetWidth
            var totalTime = this.totalTime
            var start = item.start
            var end = item.end
            
            var per = totalWidth / totalTime
            var from = per * start
            var to = per * end
            
            return {
                width: `${to-from}px`,
                left: `${from}px`
            }
        },
        
        preStartMoveCursor(e){
            // console.log(e)
            this._cursor_x = e.clientX
            document.addEventListener('mousemove', this.cursorMoving, false)
            document.addEventListener('mouseup', this.stopMoving, false)
            this.maxCursor = this.$refs.tracks.offsetWidth
        },
        
        cursorMoving(e){
            var dx = e.clientX - this._cursor_x
            this._cursor_x = e.clientX
            var cursorLeft = this.cursorLeft + dx
            if(cursorLeft < 0){
                cursorLeft = 0
                this.stopMoving()
            }else if(cursorLeft > this.maxCursor){
                cursorLeft = this.maxCursor
                this.stopMoving()
            }
            this.updateCursorPosition(cursorLeft)
            this.updateVideoByCursor()
        },
        
        stopMoving(){
            document.removeEventListener('mousemove', this.cursorMoving, false)
            document.removeEventListener('mouseup', this.stopMoving, false)
        },
        
        updateCursorPosition(cursorLeft){
            this.cursorLeft = cursorLeft
        },
        
        onFullScreenClick(){
            // this.$refs.video.requestFullscreen()
            this.fullscreen = !this.fullscreen
            if(this.fullscreen){
                this.updateParentNodesPosition2Static()
                // document.addEventListener('keydown', this.escPressHandler, true)
            }else{
                this.resetParentNodesPosition()
                // document.removeEventListener('keydown', this.escPressHandler, true)
            }
            if(!this.isPlaying){
                var currentTime = this.currentTime
                this.currentTime = 0
                this.$nextTick(function(){
                    if(this.cursorLeft){
                        this.cursorLeft = this.time2Position(currentTime)
                    }
                    this.currentTime = currentTime
                })
            }
        },
        
        escPressHandler(e){
            var keyCode = e.keyCode || e.which || e.charCode
            if(keyCode == 27){
                this.fullscreen = false
                document.removeEventListener('keydown', this.escPressHandler, true)
            }
        },
        
        onPlayClick(){
            var video = this.$refs.video
            if(video.paused){
                if(this.innerActiveItem.isFullVideo){
                    video.play()
                    this.isPlaying = true
                }else{
                    this.setNearestPartTime()
                    this.$nextTick(function(){
                        video.play()
                        this.isPlaying = true
                    })
                }
            }else{
                video.pause()
                this.isPlaying = false
            }
        },
        
        setNearestPartTime(){
            var currentTime = this.currentTime
            var subProgress = this.subProgress
            if(!subProgress.some(item=>{
                if(currentTime < item.start){
                    currentTime = item.start
                    return true
                }else if(currentTime < item.end){
                    return true
                }
            })){
                currentTime = subProgress[0].start
            }
            this.currentTime = currentTime
            this.updateCursorPosition(this.time2Position(currentTime))
            this.$refs.video.currentTime = currentTime
        },
        
        updateParentNodesPosition2Static(){
            var parentNode = this.$el
            
            while(parentNode = parentNode.offsetParent){
                if(parentNode.nodeType != 1) return
                var position = getStylePosition(parentNode)
                if(position == 'absolute' || position == 'relative') {
                    parentNode._position_g_bak = position
                    var stylePosition = parentNode.style.position
                    if(stylePosition == 'absolute' || stylePosition == 'relative') {
                        parentNode._style_position_g_bak = position
                    }
                    parentNode.style.position = 'static'
                }
            }
        },
        
        resetParentNodesPosition(){
            var parentNode = this.$el
            
            while(parentNode = parentNode.parentNode){
                
                if(parentNode._style_position_g_bak){
                    parentNode.style.position = parentNode._style_position_g_bak
                    delete parentNode._style_position_g_bak
                    delete parentNode._position_g_bak
                }else if(parentNode._position_g_bak){
                    parentNode.style.position = ''
                    delete parentNode._position_g_bak
                }
            }
        },
        
        onTracksContainerClick(e){
            console.log(e)
            var x = e.layerX || e.offsetX
            this.updateCursorPosition(x)
            this.updateVideoByCursor()
            this.isUserPickTime = true
        },
        
    },
    
}