/* eslint-disable no-unused-vars */
import { useToast } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { S3Client, ListObjectsV2Command, PutObjectCommand,DeleteObjectCommand,HeadObjectCommand,GetObjectCommand } from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";


const defaultPrefix = "media/project_files/";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const excludeRegex = new RegExp(process.env.EXCLUDE_PATTERN || /(?!)/);


export const URLFormatter = (value ) => {

  //remove the prefix from the url
  let url = value.replace(defaultPrefix,"")

  return url;
}
const listContents = async (prefixPart) => {

  const prefix = `${defaultPrefix}${prefixPart}`

  console.log(prefix)
  console.debug("Retrieving data from AWS SDK");
  const data = await s3Client.send(
    new ListObjectsV2Command({
      Bucket: process.env.BUCKET_NAME,
      Prefix: prefix,
      Delimiter: "/",
    })
  );
  console.debug(`Received data: ${JSON.stringify(data, null, 2)}`);
  return {
    folders:
      data.CommonPrefixes?.filter(
        ({ Prefix }) => !excludeRegex.test(Prefix)
      ).map(({ Prefix }) => ({
        name: Prefix.slice(prefix.length),
        path: Prefix,
        url: `?prefix=${Prefix}`,
      })) || [],
    objects:
      data.Contents?.filter(({ Key }) => !excludeRegex.test(Key)).map(
        ({ Key, LastModified, Size }) => ({
          name: Key.slice(prefix.length),
          lastModified: LastModified,
          size: Size,
          path: Key,
          url: `http://${process.env.BUCKET_NAME}.s3.amazonaws.com/${Key}`,
        })
      ) || [],
  };
};

export const createPresignedUrl = async (filename, prefixPart) => {
  const prefix = `${defaultPrefix}${prefixPart}`
  try {

    const getObjectParams = {
      Bucket: process.env.BUCKET_NAME,
      Key: `${prefix}${filename}`,
    };
    const command = new GetObjectCommand(getObjectParams);

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return url;
  } catch (err) {
    alert("Error", err);
    return null;
  }
}

export const useContents = (prefix) => {
  return useQuery(["contents", prefix], () => listContents(prefix));
};

export const uploadFile = (file, prefixPart,setReload) => {
  const prefix = `${defaultPrefix}${prefixPart}`
  try {
    const data = s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: `${prefix}${file.name}`,
        Body: file,
    })
    )
    .then((data) => {
      setReload(true);
      
    })
    .catch((err) => {
      alert("Error", err);

    });
  } catch (err) {
    alert("Error", err);
  }
}

export const deleteFile = (filename,prefixPart,setReload) => {
  const prefix = `${defaultPrefix}${prefixPart}`
  try {
    const data = s3Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: `${prefix}${filename}`,
    })
    )
    .then((data) => {
      setReload(true);
      
    })
    .catch((err) => {
      alert("Error", err);

    });
  } catch (err) {
    alert("Error", err);
  }
}


export const existsFolder = (foldername, prefixPart) => {
  const prefix = `${defaultPrefix}${prefixPart}`
  try {
    const data = s3Client.send(
      new HeadObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: `${prefix}`,
    })
    )
    .then((data) => {
      return true;
    })
    .catch((err) => {
      return false;
    });
  } catch (err) {
    alert("Error", err);
  }
}

export const createFolder = (foldername,prefixPart,setReload) => {
  const prefix = `${defaultPrefix}${prefixPart}`
  try{
    const data = s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: `${prefix}${foldername}/`,
    })
    )
    .then((data) => {
      setReload(true);
      
    })
  }
  catch(err){
    alert("Error", err);
  }
}

export const createFolderIfNotExist = (foldername,prefix,setReload) => {
  if(!existsFolder(foldername,prefix)){
    createFolder(foldername,prefix,setReload);
  }
}

export const emptyBucket = async(foldername,prefixPart,setReload) => {
  const prefix = `${defaultPrefix}${prefixPart}`
  let list =  await s3Client.send(
    new ListObjectsV2Command({
      Bucket: process.env.BUCKET_NAME,
      Prefix: `${prefix}${foldername}`,
      Delimiter: "/",
    })
  )
  if(list.KeyCount){

    for(let i=0;i<list.KeyCount;i++){

      const deleteCommand = new DeleteObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key : list.Contents[i].Key
 
      });
      let deleted = await s3Client.send(deleteCommand);

      if(deleted.Errors){
        alert(`Error deleting ${list.Contents[i].Key}`);
      }
    }
    setReload(true);
  }
}