/* eslint-disable react/prop-types */
import { 
	AlertDialog,
	AlertDialogOverlay ,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogBody,
	AlertDialogFooter,
	Button,
	Text,
	Input
} from "@chakra-ui/react";
import React from "react";
import { createFolderIfNotExist } from "../hooks/useContents";


export default function NewFolderDialog({isOpen,onClose,prefix,setReload}){
	
	const cancelRef = React.useRef();
	const [folderName,setFolderName] = React.useState("");
	
	const onNewFolderModalConfirm = () => {
		console.log("New Folder")
		createFolderIfNotExist(folderName,prefix,setReload);
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
              Create New Folder
            </AlertDialogHeader>
            <AlertDialogBody>
				<Text mb={2}>
					Enter the name of the new folder:
				</Text>
				<Input value={folderName} onChange={(e)=>setFolderName(e.target.value)}></Input>
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="green" onClick={()=> onNewFolderModalConfirm()} ml={3}>
                Create
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
	)
}