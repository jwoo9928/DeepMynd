import { google } from 'googleapis';

export class GoogleDriveController {
    private authClient: any;

    constructor(accessToken: string) {
        this.authClient = new google.auth.OAuth2();
        this.authClient.setCredentials({ access_token: accessToken });
    }

    // Google Drive API 호출을 위한 인증된 클라이언트
    public getDriveService() {
        return google.drive({ version: 'v3', auth: this.authClient });
    }

    // 'unimynd' 폴더가 존재하는지 확인하고, 없으면 생성
    public async ensureFolderExists(folderName: string): Promise<string> {
        const driveService = this.getDriveService();

        // Drive에서 폴더 리스트 조회
        const res = await driveService.files.list({
            q: `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder'`,
            fields: 'files(id, name)',
        });

        const folder = res.data.files?.[0];

        // 폴더가 없다면 생성
        if (!folder) {
            const folderMetadata = {
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder',
            };
            const createRes = await driveService.files.create({
                requestBody: folderMetadata,
                fields: 'id',
            });

            return createRes.data.id!;
        }

        // 폴더가 있다면 기존 폴더 ID 반환
        return folder.id!;
    }

    // JSON 파일 업로드
    public async uploadJsonToDrive(jsonData: any) {
        const driveService = this.getDriveService();

        const folderId = await this.ensureFolderExists('unimynd');
        if (!folderId) return;

        const fileMetadata = {
            name: 'data.json',
            parents: [folderId],
        };

        const media = {
            mimeType: 'application/json',
            body: JSON.stringify(jsonData),
        };

        const res = await driveService.files.create({
            requestBody: fileMetadata,
            media,
            fields: 'id',
        });

        console.log('업로드된 파일 ID:', res.data.id);
    }
}
