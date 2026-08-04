package com.iptv.business.util;

import lombok.SneakyThrows;
import net.sf.sevenzipjbinding.*;
import net.sf.sevenzipjbinding.impl.RandomAccessFileInStream;

import java.io.*;
import java.util.ArrayList;
import java.util.List;

/**
 * rar压缩文件工具类
 * @author GongJie
 * @date 2022/11/12
 */
public class RarUtils {

    /**
     * 获取压缩包解压后的文件路径，不包括文件夹
     * @param rarFile
     * @return
     */
    @SneakyThrows
    public static List<String> getUnFilePaths(File rarFile) {

        RandomAccessFile randomAccessFile = null;
        IInArchive inArchive = null;
        try {

            // 第一个参数是需要解压的压缩包路径，第二个参数参考JdkAPI文档的RandomAccessFile
            randomAccessFile = new RandomAccessFile(rarFile.getPath(), "r");
            inArchive = SevenZip.openInArchive(null, new RandomAccessFileInStream(randomAccessFile));


            int numberOfItems = inArchive.getNumberOfItems();
            List<String> paths = new ArrayList<>(numberOfItems);
            for (int i = 0; i < numberOfItems; i++) {
                String path = (String) inArchive.getProperty(i, PropID.PATH);
                if ((boolean) inArchive.getProperty(i, PropID.IS_FOLDER)) {
                    //是文件夹
                    continue;
                }
                paths.add(path);
            }

            return paths;

        } finally {

            if (inArchive != null) {
                try {
                    inArchive.close();
                } catch (SevenZipException e) {
                    e.printStackTrace();
                }
            }
            if (randomAccessFile != null) {
                try {
                    randomAccessFile.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
    }

    /**
     * 解压所有文件
     * @param rarFile  rar文件
     * @param targetFilePath 解压目标地址，同名称的文件会被覆盖
     * @throws Exception
     */
    @SneakyThrows
    public static void unAllFile(File rarFile, String targetFilePath) {
        RandomAccessFile randomAccessFile = null;
        IInArchive inArchive = null;
        try {
            // 第一个参数是需要解压的压缩包路径，第二个参数参考JdkAPI文档的RandomAccessFile
            randomAccessFile = new RandomAccessFile(rarFile.getPath(), "r");
            inArchive = SevenZip.openInArchive(null, new RandomAccessFileInStream(randomAccessFile));
            int[] in = new int[inArchive.getNumberOfItems()];
            for (int i = 0; i < in.length; i++) {
                in[i] = i;
            }
            //解压文件
            inArchive.extract(in, false, new ExtractCallback(inArchive, targetFilePath));
        } finally {
            if (inArchive != null) {
                try {
                    inArchive.close();
                } catch (SevenZipException e) {
                    e.printStackTrace();
                }
            }
            if (randomAccessFile != null) {
                try {
                    randomAccessFile.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }
    }


    public static class ExtractCallback implements IArchiveExtractCallback {


        private int index;
        private IInArchive inArchive;
        private String ourDir;

        public ExtractCallback(IInArchive inArchive, String ourDir) {
            this.inArchive = inArchive;
            this.ourDir = ourDir;
        }


        @Override
        public void setCompleted(long arg0) throws SevenZipException {
        }

        @Override
        public void setTotal(long arg0) throws SevenZipException {
        }

        @Override
        public ISequentialOutStream getStream(int index, ExtractAskMode extractAskMode) throws SevenZipException {
            this.index = index;
            final String path = (String) inArchive.getProperty(index, PropID.PATH);
            final boolean isFolder = (boolean) inArchive.getProperty(index, PropID.IS_FOLDER);

            File file1 = new File(ourDir + File.separator+ path);
            File parentFile;
            if (!file1.exists() && isFolder) {
                if (!(parentFile = file1.getParentFile()).exists()) {
                    parentFile.mkdirs();
                }
                if (!file1.isFile()) {
                    file1.mkdir();
                }
            }
            return data -> {
                try {
                    if (!isFolder) {
                        File file = new File(ourDir + path);
                        save2File(file1, data);
                    }

                } catch (Exception e) {
                    e.printStackTrace();
                }
                return data.length;
            };
        }

        @Override
        public void prepareOperation(ExtractAskMode arg0) throws SevenZipException {
        }

        @Override
        public void setOperationResult(ExtractOperationResult extractOperationResult) throws SevenZipException {

        }

        public boolean save2File(File file, byte[] msg) throws FileNotFoundException {
            OutputStream fos = null;
            try {
                File parent = file.getParentFile();
                if ((!parent.exists()) && (!parent.mkdirs())) {
                    return false;
                }
                //覆盖文件
                fos = new FileOutputStream(file, false);
                fos.write(msg);
                fos.flush();
                return true;
            } catch (FileNotFoundException e) {
                e.printStackTrace();
                return false;
            } catch (IOException e) {
                e.printStackTrace();
                return false;
            } finally {
                try {
                    fos.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }

    }


}
