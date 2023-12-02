import { useQuery } from "@tanstack/react-query";
import { S3Client, ListObjectsV2Command, PutObjectCommand,DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const excludeRegex = new RegExp(process.env.EXCLUDE_PATTERN || /(?!)/);

const listContents = async (prefix) => {
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

export const useContents = (prefix) => {
  return useQuery(["contents", prefix], () => listContents(prefix));
};

export const uploadFile = (file, prefix,setReload) => {

  try {
    const data = s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: `${prefix}${file.name}`,
        Body: file,
    })
    )
    .then((data) => {
      alert(`${file.name} uploaded successfully.`);
      setReload(true);
      
    })
    .catch((err) => {
      alert("Error", err);

    });
  } catch (err) {
    alert("Error", err);
  }
}

export const deleteFile = (filename,prefix,setReload) => {
  console.log(prefix);
  console.log(filename);
  try {
    const data = s3Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: `${prefix}${filename}`,
    })
    )
    .then((data) => {
      alert(`${filename} deleted successfully.`);
      setReload(true);
      
    })
    .catch((err) => {
      console.log("Error", err);
      alert("Error", err);

    });
  } catch (err) {
    console.log("Error", err);
  }
}
