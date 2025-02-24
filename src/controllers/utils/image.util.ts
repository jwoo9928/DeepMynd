import imageCompression from 'browser-image-compression';

export const dataURLtoFile = (dataUrl: string, filename: string): File | null => {
    const [header, base64] = dataUrl.split(',');

    if (base64) {
        const mimeMatch = header.match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : '';
        const binary = atob(base64);
        const array = Uint8Array.from(binary, char => char.charCodeAt(0));

        return new File([array], filename, { type: mime });
    }
    return null;
}

export const imageResize = async (file: File | string): Promise<File | null> => {
    const options = {
        maxSizeMB: 0.256, // 256KB
        maxWidthOrHeight: 800, // 이미지의 최대 크기
        useWebWorker: true, // 웹 워커 사용 여부
    };

    if (typeof file === 'string') {
        const convertedFile = dataURLtoFile(file, 'avatar');
        if (!convertedFile) return null;
        file = convertedFile;
    }

    try {
        return await imageCompression(file, options);
    } catch (error) {
        console.error('Image compression failed:', error);
        return null;
    }
}
