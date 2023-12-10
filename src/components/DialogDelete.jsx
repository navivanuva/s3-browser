/* eslint-disable react/prop-types */
import { 
	AlertDialog,
	AlertDialogOverlay ,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogBody,
	AlertDialogFooter,
	Button,
} from "@chakra-ui/react";
import React from "react";
import { deleteFile,emptyBucket } from "../hooks/useContents";


export default function DeleteDialog({isOpen,onClose,itemName,prefix,isFile,setReload}){
	
	const cancelRef = React.useRef();
	
	const onDeleteModalConfirm = () => {
		if(isFile){
			deleteFile(itemName,prefix,setReload);
		}else{
			emptyBucket(itemName,prefix,setReload);
		}
		onClose();
	}

	return(
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
	)
}