/* eslint-disable no-unused-vars */
import { useToast } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { S3Client, ListObjectsV2Command, PutObjectCommand,DeleteObjectCommand,HeadObjectCommand,GetObjectCommand,CopyObjectCommand } from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";


const defaultPrefix = "media/project_files/";
//const defaultPrefix = "";
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
const listContents = async (prefixPart, dp=true) => {

  let prefix = `${defaultPrefix}${prefixPart}`

  if(dp){
    prefix = `${defaultPrefix}${prefixPart}`
  }
  else{
    prefix = `${prefixPart}`
  }

  console.debug("Retrieving data from AWS SDK");
  const data = await s3Client.send(
    new ListObjectsV2Command({
      Bucket: process.env.BUCKET_NAME,
      Prefix: prefix,
      Delimiter: "/",
    })
  );
  //console.debug(`Received data: ${JSON.stringify(data, null, 2)}`);
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

    //get filename extension
    let fileExtension = filename.split('.').pop();
    let contentType = "image/png";
    if(fileExtension === "pdf"){
      contentType = "application/pdf";
    }

    const getObjectParams = {
      Bucket: process.env.BUCKET_NAME,
      Key: `${prefix}${filename}`,
      ResponseContentType: contentType,
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


export const renameFile = async (filename,newFilename,prefixPart,setReload) => {

  const prefix = `${defaultPrefix}${prefixPart}`

  const extension = filename.split('.').pop();

  const newFilenameWithExtension = `${newFilename}.${extension}`;


  try {
    const data =  await s3Client.send(
      new CopyObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        CopySource: `${process.env.BUCKET_NAME}/${prefix}${filename}`,
        Key: `${prefix}${newFilenameWithExtension}`,
    }))

    if(data.CopyObjectResult){
      const data = await s3Client.send(
        new DeleteObjectCommand({
          Bucket: process.env.BUCKET_NAME,
          Key: `${prefix}${filename}`,
      }))
      setReload(true);
    }

  } catch (err) {
    alert("Error", err);
  }
  

}

export const renameFolder = async (foldername,newFoldername,prefixPart,setReload) => {

  const prefix = `${defaultPrefix}${prefixPart}`
  const newFolderPath = `${prefix}${newFoldername}/`;

  let list = await listContents(`${prefix}${foldername}`, false);

  let folders = list.folders;
  let files = list.objects;

  try{

    const datanewFolder = await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: `${newFolderPath}`,
        Delimiter: "/",
    }))

    for(let i=0;i<files.length;i++){
      const data = await s3Client.send(
        new CopyObjectCommand({
          Bucket: process.env.BUCKET_NAME,
          CopySource: `${process.env.BUCKET_NAME}/${files[i].path}`,
          Key: `${newFolderPath}${files[i].name}`,
      }))
      console.log("data",data);

      if(data.$metadata.httpStatusCode == 200){
        const data = await s3Client.send(
          new DeleteObjectCommand({
            Bucket: process.env.BUCKET_NAME,
            Key: `${files[i].path}`,
        }))
      }
      
    }
    for(let i=0;i<folders.length;i++){
      let newKey = `${newFolderPath}${folders[i].name}`
      let cif = await createNewFolder( currentPath,newKey);
      let currentPath = folders[i].path;
      await loopInternalFolder(currentPath,folders[i],newFolderPath);
    }
    
    //  emptyBucket(foldername,prefixPart,setReload);
    setReload(true);

  }catch(err){
    console.log("Error", err);
  }

  
}



const loopInternalFolder = async (currentPath,folder,newFolderPath) => {

  try{
    let folderEmpty = false
    let newKey = `${newFolderPath}${folder.name}`
    let newPath = newKey;

    while(!folderEmpty){
      let list = await listContents(currentPath, false);
      let folders = list.folders;
      let files = list.objects;
      
      if(folders.length == 0 ){
        folderEmpty = true;
      }

      console.log("files",files);

      for(let i=0;i<files.length;i++){
        const data = await s3Client.send(
          new CopyObjectCommand({
            Bucket: process.env.BUCKET_NAME,
            CopySource: `${process.env.BUCKET_NAME}/${files[i].path}`,
            Key: `${newPath}${files[i].name}`,
        }))

        if(data.$metadata.httpStatusCode == 200){
          const data = await s3Client.send(
            new DeleteObjectCommand({
              Bucket: process.env.BUCKET_NAME,
              Key: `${files[i].path}`,
          }))
        }
      }

      for(let j=0;j<folders.length;j++){
        if(folders[j] == undefined){
          break;
        }
        currentPath = folders[j].path;

        newKey = `${newPath}${folders[j].name}`
        newPath = newKey;

        console.log("newKey",newKey);
        let cif = await createNewFolder( currentPath,newKey);
      }
    }
  }catch(err){
    console.log("Error", err);
  }

}



const createNewFolder = async (currentPath,newFoldername) => {

  const datanewFolder = await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: newFoldername,
      Delimiter: "/",
  }))

}


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

export const deleteFile = async(filename,prefixPart,setReload) => {
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
        Delimiter: "/",
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

export const emptyBucket = async(foldername,prefixPart,setReload, internal=false) => {
  
  let prefix = ''
  if(!internal){
    prefix = `${defaultPrefix}${prefixPart}`
  }else{
    prefix = `${prefixPart}`
  }
  let list = await listContents(`${prefix}${foldername}`,false);

  console.log("list",`${prefix}${foldername}`);
  
  let folders = list.folders;
  let files = list.objects;

  if(folders.length != 0){
    for(let i=0;i<folders.length;i++){
      await emptyBucket('',`${folders[i].path}`,setReload,true);
    }
  }

  if(files.length != 0){

    for(let i=0;i<files.length;i++){

      const deleteCommand = new DeleteObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key : files[i].path
 
      });
      let deleted = await s3Client.send(deleteCommand);

      if(deleted.Errors){
        alert(`Error deleting ${files[i].path}`);
      }
    }
    
  }
  setReload(true);
}

