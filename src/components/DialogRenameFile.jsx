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
	Input,
	useDisclosure,
} from "@chakra-ui/react";
import React, {  } from "react";
import { renameFile, renameFolder } from "../hooks/useContents";
import DialogLoading from "./DialogLoading";

export default function DialogRenameFileAndFolder({isOpen,onClose,prefix,filename,isFile, setReload}){

	const cancelRef = React.useRef();
	const [newName,setNewName] = React.useState(filename);

	const {isOpen : isOpenLoading, onOpen : onOpenLoading, onClose : onCloseLoading} = useDisclosure();

	const onRenameModalConfirm = async() => {
		onOpenLoading()
		if(isFile){
			await renameFile(filename,newName,prefix,setReload);
		}
		else{
			await renameFolder(filename,newName,prefix,setReload);
		}
		onCloseLoading();
		onClose();
		setNewName("");
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
							Rename File
						</AlertDialogHeader>
						<AlertDialogBody>
							<Text mb={4}>
								{filename}
							</Text>
							<Text fontWeight={"bold"} mb={2}>
								{isFile ? "New File Name" : "New Folder Name"}
							</Text>
							<Input value={newName} onChange={(e)=>setNewName(e.target.value)}></Input>
						</AlertDialogBody>
						<AlertDialogFooter>
							<Button ref={cancelRef} onClick={onClose}>
								Cancel
							</Button>
							<Button colorScheme="green" onClick={()=> onRenameModalConfirm()} ml={3}>
								Rename
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