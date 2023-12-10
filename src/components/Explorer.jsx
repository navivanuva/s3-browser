
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
  IconButton,
  Button,
  useDisclosure,
} from "@chakra-ui/react";
import { GrFolder, GrDocument, GrFormNext } from "react-icons/gr";
import { useContents,uploadFile, createPresignedUrl, URLFormatter} from "../hooks/useContents";
import { sanitizePrefix, formatFileSize } from "../helpers";
import { AddIcon, CloseIcon, EditIcon } from "@chakra-ui/icons";
import DeleteDialog from "./DialogDelete";
import NewFolderDialog from "./DialogNewFolder";
import DialogRenameFileAndFolder from "./DialogRenameFile";


export default function Explorer() {

  const [searchParams] = useSearchParams();
  const prefix = sanitizePrefix(searchParams.get("prefix") || "");
  const [file, setFile] = useState(null);
  const [reload, setReload] = useState(false);


  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFile(file);
  };

  return (
    <Box maxW="5xl" m={3} mt={1}>

      <VStack alignItems="left">
        <Box display={"flex"} alignItems={"center"}>
          <Box flexGrow={1}>
            <input width={"100%"} type="file" onChange={handleFileChange} />
          </Box>
          <Box>
            <Button colorScheme="blue" onClick={(e)=> {e.preventDefault(); uploadFile(file,prefix,setReload)}}>Upload</Button>
          </Box>
        </Box>
        <hr style={{marginBottom : 20}}></hr>
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

  const { isOpen : isDeleteDialogOpen, onOpen : onDeleteDialogOpen, onClose : onDeleteDialogClose } = useDisclosure()
  const { isOpen : isNewFolderDialogOpen, onOpen : onNewFolderDialogOpen, onClose : onNewFolderDialogClose } = useDisclosure()
  const { isOpen : isRenameDialogOpen, onOpen : onRenameDialogOpen, onClose : onRenameDialogClose } = useDisclosure()
  const [isFile, setIsFile] = useState(true);

  const [itemName, setItemName] = useState("");

  

  const onOpenModalDelete = (itemName,isFile) => { 

    setItemName(() => {return itemName});
    setIsFile(() => {return isFile});
    onDeleteDialogOpen();
  }

  const onOpenModalRename = (itemName,isFile) => {
    setItemName(() => {return itemName});
    setIsFile(() => {return isFile});
    onRenameDialogOpen();
  }

  useEffect(()=>{
    if(reload){
      refetch();
      setReload(false);
    }
  })

  const onItemClicked = async(file,prefix) => {

    let url = await createPresignedUrl(file,prefix);
    console.log("url",url);
    if(!url){
      alert("Error");
      return;
    }
    window.open(url);
  }

  return (
    <>

      <Heading as="h3" size="lg" mt={2} mb={2} fontWeight="light">
        {prefix
          ? `${prefix.split("/").slice(-2, -1)}/`
          : process.env.BUCKET_NAME}
      </Heading>
      <Box mb={2}>
        <Button onClick={onNewFolderDialogOpen} mb={1} colorScheme="green" size={"sm"} rightIcon={<AddIcon />}>New Folder </Button>
      </Box>
      <Box borderWidth="1px" shadow="md">
        
        <Table variant="simple" size="sm">
          <Thead background="gray.200">
            <Tr>
              <Th>Name</Th>
              <Th>Rename</Th>
              <Th>Last modified</Th>
              <Th>Size</Th>
              <Th>Delete</Th>
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
                        <Tr key={item.path} >
                          <Td py={4}>
                            <Icon
                              as={GrFolder}
                              mr={1}
                              verticalAlign="text-top"
                            />
                            <Link as={ReactRouterLink} to={URLFormatter(item.url)}>
                              {item.name}
                            </Link>
                          </Td>
                          <Td>
                          <IconButton onClick={() => onOpenModalRename(item.name,false) } icon={<EditIcon />}  colorScheme='gray'  size='sm' />
                          </Td>
                          <Td>–</Td>
                          <Td isNumeric>–</Td>
                          <Td>
                            <IconButton onClick={() => onOpenModalDelete(item.name,false)} icon={<CloseIcon />}  colorScheme='red'  size='sm' />
                          </Td>
                        </Tr>
                      ))}
                      {data?.objects.map((item) => {

                        if(item.name === ""){
                          return;
                        }
                        else{
                          return(
                            <Tr key={item.path}>
                              <Td py={4}>
                                <Box display={"flex"} alignItems={"center"}>
                                  <Icon
                                    as={GrDocument}
                                    mr={1}
                                    verticalAlign="text-top"
                                  />
                                
                                  <Text mb={0} onClick={() => onItemClicked(item.name,prefix)} cursor={"pointer"} >
                                    {item.name}
                                  </Text>
                                </Box>
                              </Td>
                              <Td>
                                <IconButton onClick={() => onOpenModalRename(item.name,true) } icon={<EditIcon />}  colorScheme='gray'  size='sm' />
                              </Td>
                              <Td>{item.lastModified.toLocaleString()}</Td>
                              <Td isNumeric>{formatFileSize(item.size)}</Td>
                              <Td>
                                <IconButton onClick={() => onOpenModalDelete(item.name,true)} icon={<CloseIcon />}  colorScheme='red'  size='sm' />
                              </Td>
                            </Tr>
                          )
                        }
                      })}
                    </>
                  );
              }
            })()}
          </Tbody>
        </Table>
        
      </Box>
      
      <NewFolderDialog
        isOpen={isNewFolderDialogOpen} 
        onOpen={onNewFolderDialogOpen} 
        onClose={onNewFolderDialogClose} 
        prefix={prefix} 
        setReload={setReload}
      />

      <DeleteDialog 
        isOpen={isDeleteDialogOpen} 
        onOpen={onDeleteDialogOpen} 
        onClose={onDeleteDialogClose} 
        itemName={itemName} 
        prefix={prefix} 
        isFile={isFile} 
        setReload={setReload} 
      />

      <DialogRenameFileAndFolder
        isOpen={isRenameDialogOpen} 
        onOpen={onRenameDialogOpen} 
        onClose={onRenameDialogClose} 
        prefix={prefix} 
        filename={itemName}
        isFile={isFile} 
        setReload={setReload}
      />

    </>
  );
}

Listing.propTypes = {
  prefix: PropTypes.string,
  reload: PropTypes.bool,
  setReload: PropTypes.func,
};
