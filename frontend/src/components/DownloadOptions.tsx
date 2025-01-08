import { Download } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast"
import { convertToDocx, convertToPdf, convertToSrt } from '@/utils/fileConversion';
import { Button } from "./ui/button";

interface DownloadOptionsProps {
    content: string;
    filename: string;
    allowTimestamps?: boolean;
    getContentWithTimestamps?: () => string;
}

export const DownloadOptions = ({
    content,
    filename,
    allowTimestamps = false,
    getContentWithTimestamps,
}: DownloadOptionsProps) => {
    const { toast } = useToast()

    const handleCopy = (e: React.MouseEvent) => {
        // Try synchronous copy first
        const button = e.currentTarget as HTMLButtonElement;
        const textArea = document.createElement('textarea');
        textArea.value = content;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        button.appendChild(textArea);

        try {
            textArea.select();
            const success = document.execCommand('copy');
            if (success) {
                toast({
                    title: "Copied to clipboard",
                    description: "The content has been copied to your clipboard.",
                });
                return;
            }
        } catch (err) {
            // If execCommand fails, try clipboard API
        } finally {
            button.removeChild(textArea);
        }

        // Fall back to clipboard API
        navigator.clipboard.writeText(content)
            .then(() => {
                toast({
                    title: "Copied to clipboard",
                    description: "The content has been copied to your clipboard.",
                });
            })
            .catch((error) => {
                console.error("Failed to copy:", error);
                toast({
                    title: "Failed to copy",
                    description: "Please try selecting and copying the text manually.",
                    variant: "destructive",
                });
            });
    };

    const downloadFile = async (
        format: string,
        useTimestamps: boolean = false
    ) => {
        const fileContent =
            useTimestamps && getContentWithTimestamps
                ? getContentWithTimestamps()
                : content;
        let mimeType = "text/plain";
        let blob: Blob;

        try {
            switch (format) {
                case "txt":
                    blob = new Blob([fileContent], { type: "text/plain" });
                    break;
                case "docx":
                    mimeType =
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
                    blob = await convertToDocx(fileContent);
                    break;
                case "pdf":
                    mimeType = "application/pdf";
                    blob = convertToPdf(fileContent);
                    break;
                case "srt":
                    mimeType = "application/x-subrip";
                    const timestamps =
                        fileContent.match(/\d{2}:\d{2}:\d{2}\.\d{3}/g) || [];
                    blob = new Blob([convertToSrt(fileContent, timestamps)], {
                        type: mimeType,
                    });
                    break;
                default:
                    blob = new Blob([fileContent], { type: "text/plain" });
            }

            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${filename}.${format}`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            toast({
                title: "Download failed",
                description: `Failed to download file as ${format.toUpperCase()}. Please try another format.`,
                variant: "destructive",
            });
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleCopy}>
                    Copy to clipboard
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => downloadFile("txt")}>
                    Text file (.txt)
                </DropdownMenuItem>
                {allowTimestamps && (
                    <DropdownMenuItem onClick={() => downloadFile("txt", true)}>
                        Text file with timestamps (.txt)
                    </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => downloadFile("docx")}>
                    Word document (.docx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => downloadFile("pdf")}>
                    PDF document (.pdf)
                </DropdownMenuItem>
                {allowTimestamps && (
                    <DropdownMenuItem onClick={() => downloadFile("srt")}>
                        Subtitle file (.srt)
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
