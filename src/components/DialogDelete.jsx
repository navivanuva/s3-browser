/* eslint-disable react/prop-types */
import { 
	AlertDialog,
	AlertDialogOverlay ,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogBody,
	AlertDialogFooter,
	Button,
  useDisclosure
} from "@chakra-ui/react";
import React from "react";
import { deleteFile,emptyBucket } from "../hooks/useContents";
import DialogLoading from "./DialogLoading";

export default function DeleteDialog({isOpen,onClose,itemName,prefix,isFile,setReload}){
  
	const cancelRef = React.useRef();
	
  const {isOpen : isOpenLoading, onOpen : onOpenLoading, onClose : onCloseLoading} = useDisclosure();


	const onDeleteModalConfirm = async() => {

    onOpenLoading();
		if(isFile){
			await deleteFile(itemName,prefix,setReload);
		}else{
			await emptyBucket(itemName,prefix,setReload);
		}
    onCloseLoading();
		onClose();

	}

	return(
    <>
      <AlertDialog
            isOpen={isOpen}
            leastDestructiveRef={cancelRef}
            onClose={onClose}
          >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Delete {isFile ? "File" : "Folder"}
              </AlertDialogHeader>
              <AlertDialogBody>
                Are you sure? You cannot undo this action afterwards.
              </AlertDialogBody>
              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onClose}>
                  Cancel
                </Button>
                <Button colorScheme="red" onClick={()=> onDeleteModalConfirm()} ml={3}>
                  Delete
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
        <DialogLoading
          isOpen={isOpenLoading}
          onClose={onCloseLoading}
        />
    </>
	)
}