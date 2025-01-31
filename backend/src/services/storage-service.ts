import path from 'path';
import { Readable } from 'stream';
import { ReadableStream as WebReadableStream } from 'stream/web';

export class StorageService {
    private bucketId: string;
    private bucketName: string;
    private endpoint: string;
    private credentials: {
        accessKeyId: string;
        secretAccessKey: string;
    };

    constructor() {
        this.bucketId = process.env.S3_BUCKET_ID || '';
        this.bucketName = process.env.S3_BUCKET_NAME || '';
        this.endpoint = process.env.S3_BUCKET_ENDPOINT || '';
        this.credentials = {
            accessKeyId: process.env.S3_APPLICATION_KEY_ID || '',
            secretAccessKey: process.env.S3_APPLICATION_KEY || ''
        };
    }

    private async getAuthToken(): Promise<{
        authorizationToken: string;
        apiUrl: string;
        downloadUrl: string;
    }> {
        const authUrl = 'https://api.backblazeb2.com/b2api/v2/b2_authorize_account';
        const credentials = Buffer.from(`${this.credentials.accessKeyId}:${this.credentials.secretAccessKey}`).toString('base64');

        try {
            const response = await fetch(authUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${credentials}`
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Failed to obtain authorization token: ${JSON.stringify(error)}`);
            }

            const data = await response.json();
            return {
                authorizationToken: data.authorizationToken,
                apiUrl: data.apiUrl,
                downloadUrl: data.downloadUrl
            };
        } catch (error) {
            console.error('Error getting authorization token:', error);
            throw new Error('Failed to get authorization token');
        }
    }

    private async getUploadUrl(authToken: string, apiUrl: string): Promise<{
        uploadUrl: string;
        uploadAuthToken: string;
    }> {
        const response = await fetch(`${apiUrl}/b2api/v2/b2_get_upload_url`, {
            method: 'POST',
            headers: {
                'Authorization': authToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                bucketId: this.bucketId
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Failed to get upload URL: ${JSON.stringify(error)}`);
        }

        const data = await response.json();
        return {
            uploadUrl: data.uploadUrl,
            uploadAuthToken: data.authorizationToken
        };
    }

    async uploadFile(fileBuffer: Buffer, fileName: string, userId: string): Promise<string> {
        try {
            const { authorizationToken, apiUrl } = await this.getAuthToken();
            const { uploadUrl, uploadAuthToken } = await this.getUploadUrl(authorizationToken, apiUrl);
            const key = `uploads/${userId}-${Date.now()}-${fileName}`;

            // For larger files, you might want to use streams or chunks
            const uploadResponse = await fetch(uploadUrl, {
                method: 'POST',
                headers: {
                    'Authorization': uploadAuthToken,
                    'X-Bz-File-Name': encodeURIComponent(key),
                    'Content-Type': this.getContentType(fileName),
                    'Content-Length': fileBuffer.length.toString(),
                    'X-Bz-Content-Sha1': 'do_not_verify'
                },
                body: fileBuffer
            });

            if (!uploadResponse.ok) {
                const error = await uploadResponse.text();
                throw new Error(`Upload failed: ${error}`);
            }

            const uploadResult = await uploadResponse.json();
            return uploadResult.fileName;
        } catch (error) {
            console.error('Error uploading file:', error);
            throw error;
        }
    }

    async getDirectUploadUrl(key: string): Promise<{ uploadUrl: string; authorizationToken: string }> {
        const { authorizationToken, apiUrl } = await this.getAuthToken();
        const { uploadUrl, uploadAuthToken } = await this.getUploadUrl(authorizationToken, apiUrl);
        return {
            uploadUrl,
            authorizationToken: uploadAuthToken
        };
    }

    async deleteFile(key: string): Promise<void> {
        try {
            const { authorizationToken, apiUrl } = await this.getAuthToken();

            const response = await fetch(`${apiUrl}/b2api/v2/b2_delete_file_version`, {
                method: 'POST',
                headers: {
                    'Authorization': authorizationToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fileName: key,
                    fileId: await this.getFileId(key, authorizationToken, apiUrl)
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Delete failed: ${JSON.stringify(error)}`);
            }
        } catch (error) {
            console.error('Error deleting file:', error);
            throw new Error('Failed to delete file from storage');
        }
    }

    private async getFileId(fileName: string, authToken: string, apiUrl: string): Promise<string> {
        const response = await fetch(`${apiUrl}/b2api/v2/b2_list_file_versions`, {
            method: 'POST',
            headers: {
                'Authorization': authToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                bucketId: this.bucketId,
                startFileName: fileName,
                maxFileCount: 1
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Failed to get file ID: ${JSON.stringify(error)}`);
        }

        const data = await response.json();
        const file = data.files[0];
        if (!file || file.fileName !== fileName) {
            throw new Error('File not found');
        }

        return file.fileId;
    }

    async getFileStream(key: string): Promise<Readable> {
        try {
            const { authorizationToken, downloadUrl } = await this.getAuthToken();

            const response = await fetch(`${downloadUrl}/file/${this.bucketName}/${encodeURIComponent(key)}`, {
                method: 'GET',
                headers: {
                    'Authorization': authorizationToken
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to get file: ${await response.text()}`);
            }
            if (!response.body) {
                throw new Error('No response body received');
            }

            // Convert the fetch response to a Node.js Readable stream
            return Readable.fromWeb(response.body as WebReadableStream);
        } catch (error) {
            console.error('Error getting file stream:', error);
            throw new Error('Failed to get file from storage');
        }
    }

    async getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
        try {
            const { authorizationToken, apiUrl, downloadUrl } = await this.getAuthToken();

            // Get file info to ensure it exists and get fileId
            const fileId = await this.getFileId(key, authorizationToken, apiUrl);

            const response = await fetch(`${apiUrl}/b2api/v2/b2_get_download_authorization`, {
                method: 'POST',
                headers: {
                    'Authorization': authorizationToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    bucketId: this.bucketId,
                    fileNamePrefix: key,
                    validDurationInSeconds: expiresIn
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Failed to get download authorization: ${JSON.stringify(error)}`);
            }

            const data = await response.json();

            // Construct the download URL with authorization
            const downloadUrlWithAuth = `${downloadUrl}/file/${this.bucketName}/${encodeURIComponent(key)}?Authorization=${data.authorizationToken}`;
            return downloadUrlWithAuth;
        } catch (error) {
            console.error('Error generating presigned URL:', error);
            throw new Error('Failed to generate presigned URL');
        }
    }

    private getContentType(fileName: string): string {
        const ext = path.extname(fileName).toLowerCase();
        const contentTypes: { [key: string]: string } = {
            '.mp3': 'audio/mpeg',
            '.wav': 'audio/wav',
            '.mp4': 'video/mp4',
            '.avi': 'video/x-msvideo',
            '.mov': 'video/quicktime',
            '.mkv': 'video/x-matroska'
        };
        return contentTypes[ext] || 'application/octet-stream';
    }

    async startMultipartUpload(key: string): Promise<{ fileId: string; uploadUrl: string; authorizationToken: string }> {
        const { authorizationToken, apiUrl } = await this.getAuthToken();

        // Start large file upload
        const fileId = await this.startLargeFile(key, authorizationToken, apiUrl);

        // Get single upload URL for all parts
        const response = await fetch(`${apiUrl}/b2api/v2/b2_get_upload_part_url`, {
            method: 'POST',
            headers: {
                'Authorization': authorizationToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fileId })
        });

        if (!response.ok) {
            throw new Error('Failed to get upload URL');
        }

        const data = await response.json();
        return {
            fileId,
            uploadUrl: data.uploadUrl,
            authorizationToken: data.authorizationToken
        };
    }

    async completeMultipartUpload(fileId: string, partSha1s: Array<{ partNumber: number; contentSha1: string }>, authToken?: string): Promise<void> {
        const { authorizationToken, apiUrl } = await this.getAuthToken();
        try {
            const response = await fetch(`${apiUrl}/b2api/v2/b2_finish_large_file`, {
                method: 'POST',
                headers: {
                    'Authorization': authorizationToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fileId,
                    partSha1Array: partSha1s.map(p => p.contentSha1)
                })
            });

            if (!response.ok) {
                throw new Error('Failed to complete multipart upload: ' + await response.text());
            }
        } catch (error) {
            console.error('Error completing multipart upload:', error);
            throw new Error('Failed to complete multipart upload');
        }
    }

    async startLargeFile(key: string, authToken: string, apiUrl: string): Promise<string> {
        const response = await fetch(`${apiUrl}/b2api/v2/b2_start_large_file`, {
            method: 'POST',
            headers: {
                'Authorization': authToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                bucketId: this.bucketId,
                fileName: key,
                contentType: 'application/octet-stream'
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Failed to start large file: ${JSON.stringify(error)}`);
        }

        const data = await response.json();
        return data.fileId;
    }
}

export const storageService = new StorageService();