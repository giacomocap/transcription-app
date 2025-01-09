
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
interface DeleteJobAlertProps {
    children: React.ReactNode;
    cancelAction?: () => void;
    confirmAction: () => void;
}

const DeleteJobAlert: React.FC<DeleteJobAlertProps> = ({ children, cancelAction, confirmAction }) => {
    return (
        <AlertDialog>
            <AlertDialogTrigger>
                {children}
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Transcription</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete this transcription? This action
                        cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={cancelAction}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmAction}>Delete the transcription</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export default DeleteJobAlert;