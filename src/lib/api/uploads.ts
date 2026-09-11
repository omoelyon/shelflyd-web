import apiClient from './client';

interface PresignedUpload {
  uploadUrl: string;
  publicUrl: string;
}

export const uploadsApi = {
  getPresignedUrl: async (contentType: string): Promise<PresignedUpload> => {
    const res = await apiClient.post('/uploads/presign', { contentType });
    return res.data;
  },

  /**
   * Uploads a file directly to R2 via a presigned URL and returns its public URL.
   * Uses a plain fetch, not `apiClient` — this request goes to R2's origin, not ours,
   * and must not carry our Authorization header.
   */
  uploadFile: async (file: File): Promise<string> => {
    const { uploadUrl, publicUrl } = await uploadsApi.getPresignedUrl(file.type);
    const res = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    });
    if (!res.ok) {
      throw new Error('Failed to upload file');
    }
    return publicUrl;
  },
};
