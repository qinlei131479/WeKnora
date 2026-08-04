package com.iptv.business.util;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public class VideoUtil {
	
	// 抽取音频
	public static void extractAudio(String videoFilePath, String audioFilePath) {
		String command = "ffmpeg -i " + videoFilePath + " -vn -acodec libmp3lame -b:a 192k " + audioFilePath;
		try {
			Process process = Runtime.getRuntime().exec(command);
			process.waitFor();
			log.info("音频提取成功, videoFilePath={},audioFilePath={}", videoFilePath, audioFilePath);
		} catch (Exception e) {
			log.error("音频提取失败, videoFilePath={},audioFilePath={}", videoFilePath, audioFilePath, e);
		}
	}
}
