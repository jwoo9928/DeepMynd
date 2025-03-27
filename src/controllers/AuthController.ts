import { createClient, SupabaseClient, User, Session } from "@supabase/supabase-js";
import { EVENT_TYPES, eventEmitter } from "./utils/events";
import { GoogleDriveController } from "./GoogleDriveController";

// 더 명확하고 안전한 인터페이스 정의
interface UserProfile {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
    provider?: string;
    google_drive_tokens?: {
        access_token?: string;
        refresh_token?: string;
        expires_at?: number;
    };
    last_sign_in?: string;
}

export class AuthController {
    private static instance: AuthController;
    private supabase: SupabaseClient;
    private googleDriveController: GoogleDriveController | null = null;

    // 더 안전한 상태 관리
    private _currentUser: User | null = null;
    private _currentSession: Session | null = null;
    private _userProfile: UserProfile | null = null;
    private _isInitialized: boolean = false;
    private _isRedirecting: boolean = false;  // 리다이렉트 상태 추적

    private constructor() {
        // 환경 변수 검증 강화
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
        }

        this.supabase = createClient(supabaseUrl, supabaseAnonKey, {
            auth: {
                persistSession: true, // 세션을 로컬 스토리지에 지속적으로 저장
                autoRefreshToken: true, // 토큰 자동 갱신
                detectSessionInUrl: true, // URL에 세션 정보가 있다면 자동으로 감지
            }
        });

        this.initializeAuthListeners();
        this.setupInitialSession();
    }

    // 싱글톤 인스턴스 메서드
    public static getInstance(): AuthController {
        if (!AuthController.instance) {
            AuthController.instance = new AuthController();
        }
        return AuthController.instance;
    }

    // 인증 상태 리스너 초기화
    private initializeAuthListeners(): void {
        this.supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth 상태 변경:', event, session);

            // 리다이렉트 중인 경우 일부 이벤트 무시
            if (this._isRedirecting && event === 'INITIAL_SESSION') {
                console.log('리다이렉트 중이므로 INITIAL_SESSION 이벤트 무시');
                return;
            }

            switch (event) {
                case 'SIGNED_IN':
                    await this.handleSignedIn(session);
                    break;
                case 'TOKEN_REFRESHED':
                    if (session) {
                        this._currentSession = session;
                        this._currentUser = session.user;
                        this.emitEvent(EVENT_TYPES.TOKEN_REFRESHED, this._currentUser);
                    }
                    break;
                case 'SIGNED_OUT':
                    this.handleSignedOut();
                    break;
                case 'USER_UPDATED':
                    if (session) {
                        this._currentSession = session;
                        this._currentUser = session.user;
                        await this.fetchOrCreateUserProfile();
                    }
                    break;
                case 'INITIAL_SESSION':
                    // INITIAL_SESSION에서 세션이 null이면 무시하고 기존 세션 유지
                    console.log("session: ", session)
                    if (!session && this._currentSession) {
                        console.log('INITIAL_SESSION에서 세션이 null이지만 기존 세션 유지');
                        return;
                    }

                    if (session) {
                        await this.handleSignedIn(session);
                    }
                    break;
            }
        });
    }

    // 초기 세션 설정
    private async setupInitialSession(): Promise<void> {
        try {
            const { data, error } = await this.supabase.auth.getSession();

            if (error) {
                throw error;
            }

            console.log("data: ", data)

            if (data.session) {
                await this.handleSignedIn(data.session);
            } else {
                this._isInitialized = true;
                this.emitEvent(EVENT_TYPES.SESSION_RESTORED, null);
                this.emitEvent(EVENT_TYPES.AUTH_READY, false);
            }
        } catch (error) {
            console.error('초기 세션 설정 중 오류:', error);
            this._isInitialized = true;
            this.emitEvent(EVENT_TYPES.SESSION_RESTORED, null);
            this.emitEvent(EVENT_TYPES.AUTH_READY, false);
        }
    }

    // 로그인 처리
    private async handleSignedIn(session: Session | null): Promise<void> {
        if (!session || !session.user) return;

        this._currentSession = session;
        this._currentUser = session.user;

        try {
            // await this.fetchOrCreateUserProfile();

            const isInitialSetup = !this._isInitialized;
            this._isInitialized = true;

            if (isInitialSetup) {
                this.emitEvent(EVENT_TYPES.SESSION_RESTORED, this._currentUser);
                this.emitEvent(EVENT_TYPES.AUTH_READY, true);
            } else {
                this.emitEvent(EVENT_TYPES.SESSION_CHANGED, this._currentUser);
            }

            // Google 로그인 시 추가 처리
            if (this.isGoogleLogin()) {
                await this.handleGoogleDriveAccess();
            }
        } catch (error) {
            console.error('로그인 처리 중 오류:', error);
            if (!this._isInitialized) {
                this._isInitialized = true;
                this.emitEvent(EVENT_TYPES.SESSION_RESTORED, null);
                this.emitEvent(EVENT_TYPES.AUTH_READY, false);
            }
        }
    }

    // 로그아웃 처리
    private handleSignedOut(): void {
        this._currentUser = null;
        this._currentSession = null;
        this._userProfile = null;
        this.emitEvent(EVENT_TYPES.SESSION_EXPIRED, null);
    }

    // 사용자 프로필 조회 또는 생성
    private async fetchOrCreateUserProfile(): Promise<void> {
        if (!this._currentUser) return;

        try {
            const { data, error } = await this.supabase
                .from('profiles')
                .select('*')
                .eq('id', this._currentUser.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            this._userProfile = data || await this.createUserProfile();

            // 마지막 로그인 시간 업데이트
            await this.updateUserProfile({
                last_sign_in: new Date().toISOString()
            });
        } catch (error) {
            console.error('프로필 처리 중 오류:', error);
        }
    }

    // 새 사용자 프로필 생성
    private async createUserProfile(): Promise<UserProfile> {
        if (!this._currentUser) throw new Error('사용자 없음');

        const newProfile: UserProfile = {
            id: this._currentUser.id,
            email: this._currentUser.email || '',
            full_name: this._currentUser.user_metadata?.full_name || '',
            avatar_url: this._currentUser.user_metadata?.avatar_url || '',
            provider: this._currentUser.app_metadata?.provider || 'email',
            last_sign_in: new Date().toISOString()
        };

        const { error } = await this.supabase.from('profiles').insert(newProfile);

        if (error) throw error;

        return newProfile;
    }

    // 소셜 로그인 처리
    public async socialLogin(provider: 'google' | 'apple'): Promise<boolean> {
        try {
            // 리다이렉트 상태 설정
            this._isRedirecting = true;
            this.emitEvent(EVENT_TYPES.LOGIN_REDIRECT, provider);

            const { error } = await this.supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: 'https://pfunquxromkwaadhnhci.supabase.co/auth/v1/callback',
                    // scopes: provider === 'google'
                    //     ? 'https://www.googleapis.com/auth/drive.file'
                    //     : ''
                }
            });

            if (error) {
                this._isRedirecting = false;
                throw error;
            }

            return true;
        } catch (error) {
            console.error('소셜 로그인 오류:', error);
            this._isRedirecting = false;
            return false;
        }
    }

    // Google Drive 접근 처리
    private async handleGoogleDriveAccess(): Promise<void> {
        if (!this.isGoogleLogin()) return;

        // try {
        //     const tokens = this._userProfile?.google_drive_tokens;
        //     this.googleDriveController ??= new GoogleDriveController(tokens?.access_token || '');
        // } catch (e) {
        //     console.log("error: ", e)
        // }

        // const needsTokenRefresh = this.needsGoogleDriveTokenRefresh();
        // if (needsTokenRefresh) {
        //     await this.refreshGoogleDriveTokens();
        // }
    }

    // 세션 갱신
    public async refreshSession(): Promise<boolean> {
        try {
            const { data, error } = await this.supabase.auth.refreshSession();

            if (error) throw error;

            if (data.session) {
                this._currentSession = data.session;
                this._currentUser = data.user;
                this.emitEvent(EVENT_TYPES.TOKEN_REFRESHED, this._currentUser);
                return true;
            }

            return false;
        } catch (error) {
            console.error('세션 갱신 오류:', error);
            return false;
        }
    }

    // 보조 메서드들
    private isTokenExpired(): boolean {
        if (!this._currentSession || !this._currentSession.expires_at) {
            return true;
        }
        return Date.now() >= ((this._currentSession.expires_at * 1000) - (5 * 60 * 1000));
    }

    private isGoogleLogin(): boolean {
        return this._currentUser?.app_metadata?.provider === 'google';
    }

    // private needsGoogleDriveTokenRefresh(): boolean {
    //     const tokens = this._userProfile?.google_drive_tokens;
    //     return !tokens?.access_token ||
    //         !tokens.expires_at ||
    //         Date.now() >= tokens.expires_at;
    // }

    // 공개 메서드들
    public on(event: string, callback: (...args: any[]) => void): void {
        eventEmitter.on(event, callback);

        // 이미 초기화가 완료된 경우 AUTH_READY 이벤트를 즉시 발생시킴
        if (event === EVENT_TYPES.AUTH_READY && this._isInitialized) {
            callback(!!this._currentUser);
        }
    }

    public off(event: string, callback: (...args: any[]) => void): void {
        eventEmitter.off(event, callback);
    }

    private emitEvent(event: string, data: any): void {
        eventEmitter.emit(event, data);
    }

    public getCurrentUser(): User | null {
        return this._currentUser;
    }

    public getUserProfile(): UserProfile | null {
        return this._userProfile;
    }

    public isAuthenticated(): boolean {
        return !!this._currentUser && !this.isTokenExpired();
    }

    public async updateUserProfile(updates: Partial<UserProfile>): Promise<boolean> {
        if (!this._currentUser) return false;

        try {
            const { error } = await this.supabase
                .from('profiles')
                .update(updates)
                .eq('id', this._currentUser.id);

            if (error) throw error;

            this._userProfile = { ...this._userProfile, ...updates } as UserProfile;
            return true;
        } catch (error) {
            console.error('프로필 업데이트 오류:', error);
            return false;
        }
    }

    public async signOut(): Promise<boolean> {
        try {
            const { error } = await this.supabase.auth.signOut();

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('로그아웃 오류:', error);
            return false;
        }
    }

    public getSupabase() {
        return this.supabase
    }

    public getGoogleDriveController() {
        return this.googleDriveController
    }
}