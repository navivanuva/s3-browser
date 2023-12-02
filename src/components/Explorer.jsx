import React, { useEffect,useState } from "react";
import PropTypes from "prop-types";
import { Link as ReactRouterLink, useSearchParams } from "react-router-dom";
import {
  Box,
  VStack,
  Heading,
  Text,
  Link,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  Icon,
  Button,
} from "@chakra-ui/react";
import { GrHome, GrFolder, GrDocument, GrFormNext } from "react-icons/gr";
import { useContents,uploadFile, deleteFile} from "../hooks/useContents";
import { sanitizePrefix, formatFileSize } from "../helpers";

export default function Explorer(prefixfromOutside) {
  const [searchParams] = useSearchParams();
  const prefix = sanitizePrefix(searchParams.get("prefix") || "");

  const [file, setFile] = useState(null);

  const [reload, setReload] = useState(false);
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFile(file);
  };

  return (
    <Box maxW="4xl" m={3} mt={1}>

      <VStack alignItems="left">
      <div>
        <input type="file" onChange={handleFileChange} />
        <button onClick={(e)=> {e.preventDefault(); uploadFile(file,prefix,setReload)}}>Upload</button>
      </div>
        <Navigation prefix={prefix} />
        <Listing prefix={prefix} reload={reload} setReload={setReload} />
      </VStack>
    </Box>
  );
}

function Navigation({ prefix }) {
  const folders = prefix
    .split("/")
    .slice(0, -1)
    .map((item, index, items) => ({
      name: `${item}/`,
      url: `?prefix=${items.slice(0, index + 1).join("/")}/`,
      isCurrent: index == items.length - 1,
    }));

  return (
    <Breadcrumb
      borderWidth="1px"
      shadow="md"
      p={3}
      marginBottom={"0px !important"}
      background="gray.100"
      spacing={1}
      separator={<Icon as={GrFormNext} verticalAlign="middle" />}
    >
      <BreadcrumbItem marginBottom={"0px !important"} key="root" isCurrentPage={folders.length == 0}>

      </BreadcrumbItem>
      {folders.map((item) => (
        <BreadcrumbItem  marginBottom={"0px !important"} key={item.url} isCurrentPage={item.isCurrent}>
          {item.isCurrent ? (
            <Text marginBottom={"0px !important"} color="gray.400">{item.name}</Text>
          ) : (
            <BreadcrumbLink marginBottom={"0px !important"} as={ReactRouterLink} to={item.url}>
              {item.name}
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>
      ))}
    </Breadcrumb>
  );
}

Navigation.propTypes = {
  prefix: PropTypes.string,
};

function Listing({ prefix, reload,setReload}) {
  const { status, data, error,refetch } = useContents(prefix);
  console.debug(`Query status: ${status}`);

  useEffect(()=>{
    console.log("reload",reload);
    if(reload){
      refetch();
      setReload(false);
    }
  })


  return (
    <>
      <Heading as="h3" size="lg" mt={2} mb={2} fontWeight="light">
        {prefix
          ? `${prefix.split("/").slice(-2, -1)}/`
          : process.env.BUCKET_NAME}
      </Heading>
      <Box borderWidth="1px" shadow="md">
        <Table variant="simple" size="sm">
          <Thead background="gray.200">
            <Tr>
              <Th>Name</Th>
              <Th>Last modified</Th>
              <Th>Size</Th>
            </Tr>
          </Thead>
          <Tbody>
            {(() => {
              switch (status) {
                case "loading":
                  return (
                    <Tr>
                      <Td colSpan={3} textAlign="center">
                        <Spinner
                          size="sm"
                          emptyColor="gray.200"
                          verticalAlign="middle"
                          mr={1}
                        />
                        Loading...
                      </Td>
                    </Tr>
                  );
                case "error":
                  return (
                    <Tr>
                      <Td colSpan={3} textAlign="center">
                        Failed to fetch data: {error.message}
                      </Td>
                    </Tr>
                  );
                case "success":
                  return (
                    <>
                      {data?.folders.map((item) => (
                        <Tr key={item.path}>
                          <Td>
                            <Icon
                              as={GrFolder}
                              mr={1}
                              verticalAlign="text-top"
                            />
                            <Link as={ReactRouterLink} to={item.url}>
                              {item.name}
                            </Link>
                          </Td>
                          <Td>–</Td>
                          <Td isNumeric>–</Td>
                        </Tr>
                      ))}
                      {data?.objects.map((item) => (
                        <Tr key={item.path}>
                          <Td>
                            <Icon
                              as={GrDocument}
                              mr={1}
                              verticalAlign="text-top"
                            />
                            <Link href={item.url} isExternal>
                              {item.name}
                            </Link>
                          </Td>
                          <Td>{item.lastModified.toLocaleString()}</Td>
                          <Td isNumeric>{formatFileSize(item.size)}</Td>
                          <Td><Button onClick={()=> deleteFile(item.name,prefix,setReload)}></Button></Td>
                        </Tr>
                      ))}
                    </>
                  );
              }
            })()}
          </Tbody>
        </Table>
      </Box>
    </>
  );
}

Listing.propTypes = {
  prefix: PropTypes.string,
};
