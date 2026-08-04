import request from "@/utils/request";
// import qs from 'qs';

export const folderMove = (data) => {
  return request({
    url: `/business/agiKnowledgeFile/floder/move`,
    method: "post",
    data: data,
  });
};
