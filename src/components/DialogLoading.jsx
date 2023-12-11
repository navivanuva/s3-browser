import { 
	Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    CircularProgress,
    CircularProgressLabel,
    Box,
    Text
} from "@chakra-ui/react";
import React from "react";

export default function DialogLoading({isOpen,onClose}){

    return(
        <Modal isCentered closeOnOverlayClick={false} isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
                    <Box p="20px" width="100%" display={"flex"} flexDirection={"column"} justifyContent={"center"} alignItems={"center"}>
                        <CircularProgress isIndeterminate size='80px' />
                        <Text fontSize={"4xl"}>Loading</Text>
                    </Box>
            </ModalContent>
        </Modal>
    )

}
	