import { Copy, Download } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast"


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
    getContentWithTimestamps
}: DownloadOptionsProps) => {
    const { toast } = useToast()
    const handleCopy = async () => {
        await navigator.clipboard.writeText(content);
        toast({
            title: "Copied to clipboard",
            description: "The content has been copied to your clipboard.",
        });
    };

    const downloadFile = (format: string, useTimestamps: boolean = false) => {
        const fileContent = useTimestamps && getContentWithTimestamps ? getContentWithTimestamps() : content;
        let mimeType = 'text/plain';
        let extension = format;

        // TODO: Implement proper conversion for different formats
        // For now, we'll just use plain text for all formats
        const blob = new Blob([fileContent], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.${extension}`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex space-x-2">
            <button
                onClick={handleCopy}
                className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
                <Copy className="w-4 h-4 mr-2" />
                Copy
            </button>

            <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => downloadFile('txt')}>
                        Text file (.txt)
                    </DropdownMenuItem>
                    {allowTimestamps && (
                        <DropdownMenuItem onClick={() => downloadFile('txt', true)}> 
                            Text file with timestamps (.txt)
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => downloadFile('docx')}>
                        Word document (.docx)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => downloadFile('pdf')}>
                        PDF document (.pdf)
                    </DropdownMenuItem>
                    {allowTimestamps && (
                        <DropdownMenuItem onClick={() => downloadFile('srt')}>
                            Subtitle file (.srt)
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};
