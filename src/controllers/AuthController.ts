import { createClient, SupabaseClient, User, Session } from "@supabase/supabase-js";
import { EVENT_TYPES, eventEmitter } from "./events";

// User profile interface for type safety
interface UserProfile {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
    provider?: string;
    provider_id?: string;
    last_sign_in?: string;
    google_drive_access_token?: string;
    google_drive_refresh_token?: string;
    google_drive_token_expiry?: number;
}

export class AuthController {
    private static instance: AuthController;
    private supabase: SupabaseClient;
    private currentUser: User | null = null;
    private currentSession: Session | null = null;
    private userProfile: UserProfile | null = null;
    private tokenRefreshTimer: number | null = null;

    private constructor() {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error('Missing Supabase environment variables');
        }

        this.supabase = createClient(supabaseUrl, supabaseAnonKey);

        // Initialize auth listener and restore session immediately
        this.initAuthListener();
        this.restoreSession();
    }

    public static getInstance(): AuthController {
        if (!AuthController.instance) {
            AuthController.instance = new AuthController();
        }
        return AuthController.instance;
    }

    public getSupabase() {
        return this.supabase;
    }

    // Initialize auth state listener
    private initAuthListener(): void {
        this.supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event, session);

            this.currentSession = session;
            this.currentUser = session?.user || null;

            if (this.currentUser) {
                await this.fetchUserProfile();
                eventEmitter.emit(EVENT_TYPES.SESSION_CHANGED, this.currentUser);

                // Start token refresh timer when user is logged in
                this.startTokenRefreshTimer();

                // If this is a new sign-in with Google, request Google Drive scope
                if (event === 'SIGNED_IN' &&
                    this.currentUser.app_metadata?.provider === 'google') {
                    // Only request Google Drive access if we don't already have valid tokens
                    if (!this.userProfile?.google_drive_access_token ||
                        !this.userProfile?.google_drive_token_expiry ||
                        this.userProfile.google_drive_token_expiry < Date.now()) {
                        await this.requestGoogleDriveAccess();
                    }
                }
            } else {
                this.userProfile = null;
                eventEmitter.emit(EVENT_TYPES.SESSION_CHANGED, null);

                // Clear token refresh timer when user is logged out
                this.stopTokenRefreshTimer();
            }
        });
    }

    // Restore session on page reload
    private async restoreSession(): Promise<void> {
        try {
            const { data, error } = await this.supabase.auth.getSession();

            if (error) throw error;

            this.currentSession = data.session;
            this.currentUser = data.session?.user || null;

            if (this.currentUser) {
                await this.fetchUserProfile();
                eventEmitter.emit(EVENT_TYPES.SESSION_RESTORED, this.currentUser);

                // Start token refresh timer when session is restored
                this.startTokenRefreshTimer();
            } else {
                eventEmitter.emit(EVENT_TYPES.SESSION_RESTORED, null);
            }
        } catch (error) {
            console.error('Error restoring session:', error);
            eventEmitter.emit(EVENT_TYPES.SESSION_RESTORED, null);
        }
    }

    // Request Google Drive access if not already granted
    public async requestGoogleDriveAccess(): Promise<void> {
        console.log("Requesting Google Drive access");

        if (!this.currentUser ||
            this.currentUser.app_metadata?.provider !== 'google') {
            console.log("User not logged in with Google, cannot request Drive access");
            return;
        }

        // Check if we already have valid tokens
        if (this.userProfile?.google_drive_access_token &&
            this.userProfile?.google_drive_token_expiry &&
            this.userProfile.google_drive_token_expiry > Date.now()) {
            console.log("Already have valid Google Drive access token");
            return;
        }

        try {
            // Re-authenticate with additional scopes
            const { data, error } = await this.supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                    scopes: 'https://www.googleapis.com/auth/drive.file',
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent'
                    }
                }
            });

            if (error) throw error;
            console.log('Requested Google Drive access:', data);
        } catch (error) {
            console.error('Error requesting Google Drive access:', error);
        }
    }

    // Fetch user profile data from profiles table
    private async fetchUserProfile(): Promise<void> {
        if (!this.currentUser) return;

        try {
            // First check if profile exists
            const { data, error } = await this.supabase
                .from('profiles')
                .select('*')
                .eq('id', this.currentUser.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                // PGRST116 is for "no rows returned" which is normal for new users
                throw error;
            }

            if (data) {
                this.userProfile = data as UserProfile;
                console.log('Fetched user profile:', this.userProfile);

                // Update last_sign_in field
                await this.updateUserProfile({
                    last_sign_in: new Date().toISOString()
                });
            } else {
                // Create new profile if not exists
                await this.createUserProfile();
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
        }
    }

    // Create new user profile in profiles table
    private async createUserProfile(): Promise<void> {
        if (!this.currentUser) return;

        const newProfile: Partial<UserProfile> = {
            id: this.currentUser.id,
            email: this.currentUser.email || '',
            full_name: this.currentUser.user_metadata?.full_name || '',
            avatar_url: this.currentUser.user_metadata?.avatar_url || '',
            provider: this.currentUser.app_metadata?.provider || 'email',
            provider_id: this.currentUser.app_metadata?.provider_id,
            last_sign_in: new Date().toISOString()
        };

        try {
            const { error } = await this.supabase
                .from('profiles')
                .insert(newProfile);

            if (error) throw error;

            this.userProfile = newProfile as UserProfile;
            console.log('Created new user profile:', this.userProfile);
        } catch (error) {
            console.error('Error creating user profile:', error);
        }
    }

    // Handle social login (Google, Apple)
    public async handleSocialLogin(provider: 'google' | 'apple'): Promise<boolean> {
        try {
            const scopes = provider === 'google'
                ? 'https://www.googleapis.com/auth/drive.file'
                : '';

            const { error } = await this.supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                    scopes,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent'
                    }
                }
            });

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error signing in:', error);
            alert('Error signing in. Please try again.');
            return false;
        }
    }

    // Store Google Drive tokens after OAuth callback
    public async storeGoogleDriveTokens(accessToken: string, refreshToken: string, expiresIn: number): Promise<boolean> {
        if (!this.currentUser) return false;

        try {
            const tokenExpiry = Date.now() + (expiresIn * 1000);

            const updates: Partial<UserProfile> = {
                google_drive_access_token: accessToken,
                google_drive_refresh_token: refreshToken,
                google_drive_token_expiry: tokenExpiry
            };

            const { error } = await this.supabase
                .from('profiles')
                .update(updates)
                .eq('id', this.currentUser.id);

            if (error) throw error;

            // Update local profile data
            this.userProfile = { ...this.userProfile, ...updates } as UserProfile;
            console.log('Stored Google Drive tokens, expiry:', new Date(tokenExpiry).toISOString());
            return true;
        } catch (error) {
            console.error('Error storing Google Drive tokens:', error);
            return false;
        }
    }

    // Get Google Drive access token (refreshing if needed)
    public async getGoogleDriveAccessToken(): Promise<string | null> {
        if (!this.userProfile?.google_drive_access_token) {
            console.log('No Google Drive access token available');
            return null;
        }

        // Check if token is expired
        if (this.userProfile.google_drive_token_expiry &&
            this.userProfile.google_drive_token_expiry < Date.now() &&
            this.userProfile.google_drive_refresh_token) {

            console.log('Google Drive token expired, refreshing...');

            // Token is expired, refresh it
            try {
                // This would need a server-side function to refresh the token
                const { data, error } = await this.supabase.functions.invoke('refresh-google-token', {
                    body: { refresh_token: this.userProfile.google_drive_refresh_token }
                });

                if (error) throw error;

                // Update tokens in profile
                await this.storeGoogleDriveTokens(
                    data.access_token,
                    data.refresh_token || this.userProfile.google_drive_refresh_token,
                    data.expires_in
                );

                return data.access_token;
            } catch (error) {
                console.error('Error refreshing Google Drive token:', error);
                return null;
            }
        }

        // Token is still valid
        return this.userProfile.google_drive_access_token;
    }

    // Start token refresh timer to automatically refresh session
    private startTokenRefreshTimer(): void {
        // Clear any existing timer first
        this.stopTokenRefreshTimer();

        const checkAndRefreshToken = async () => {
            if (this.isTokenExpired()) {
                console.log("Auth token is expired or close to expiry, refreshing...");
                const success = await this.refreshSession();
                if (success) {
                    console.log("Session refreshed successfully");
                } else {
                    console.error("Failed to refresh session, user may need to re-login");
                    eventEmitter.emit(EVENT_TYPES.SESSION_EXPIRED, null);
                }
            }
        };

        // Check token every 5 minutes
        this.tokenRefreshTimer = window.setInterval(checkAndRefreshToken, 5 * 60 * 1000);

        // Initial check
        checkAndRefreshToken();
    }

    // Stop token refresh timer
    private stopTokenRefreshTimer(): void {
        if (this.tokenRefreshTimer) {
            window.clearInterval(this.tokenRefreshTimer);
            this.tokenRefreshTimer = null;
        }
    }

    // Check if user is logged in
    public isLoggedIn(): boolean {
        return !!this.currentUser;
    }

    // Get current user
    public getCurrentUser(): User | null {
        return this.currentUser;
    }

    // Get current session
    public getCurrentSession(): Session | null {
        return this.currentSession;
    }

    // Get user profile
    public getUserProfile(): UserProfile | null {
        return this.userProfile;
    }

    // Update user profile
    public async updateUserProfile(updates: Partial<UserProfile>): Promise<boolean> {
        if (!this.currentUser) return false;

        try {
            const { error } = await this.supabase
                .from('profiles')
                .update(updates)
                .eq('id', this.currentUser.id);

            if (error) throw error;

            // Update local profile data
            this.userProfile = { ...this.userProfile, ...updates } as UserProfile;
            return true;
        } catch (error) {
            console.error('Error updating profile:', error);
            return false;
        }
    }

    // Sign out user
    public async signOut(): Promise<boolean> {
        try {
            // Stop token refresh timer before signing out
            this.stopTokenRefreshTimer();

            const { error } = await this.supabase.auth.signOut();
            if (error) throw error;

            this.currentUser = null;
            this.currentSession = null;
            this.userProfile = null;

            // Notify listeners about sign out
            eventEmitter.emit(EVENT_TYPES.SESSION_CHANGED, null);

            return true;
        } catch (error) {
            console.error('Error signing out:', error);
            return false;
        }
    }

    // Refresh session
    public async refreshSession(): Promise<boolean> {
        try {
            if (!this.currentSession) {
                console.log('No active session to refresh');
                return false;
            }

            const { data, error } = await this.supabase.auth.refreshSession();

            if (error) throw error;

            this.currentSession = data.session;
            this.currentUser = data.user;

            // Update last sign in time
            if (this.userProfile) {
                await this.updateUserProfile({
                    last_sign_in: new Date().toISOString()
                });
            }

            // Notify listeners about refreshed session
            eventEmitter.emit(EVENT_TYPES.SESSION_CHANGED, this.currentUser);

            return true;
        } catch (error) {
            console.error('Error refreshing session:', error);
            return false;
        }
    }

    // Get id token for API calls
    public async getIdToken(): Promise<string | null> {
        // Check if token is expired and refresh if needed
        if (this.isTokenExpired()) {
            const refreshed = await this.refreshSession();
            if (!refreshed) return null;
        }

        if (!this.currentSession) return null;
        return this.currentSession.access_token;
    }

    // Check if token is expired or close to expiry
    public isTokenExpired(): boolean {
        if (!this.currentSession?.expires_at) return true;

        const expiresAt = this.currentSession.expires_at * 1000; // Convert to milliseconds
        const currentTime = Date.now();
        const timeBuffer = 5 * 60 * 1000; // 5 minutes buffer

        return currentTime >= (expiresAt - timeBuffer);
    }
}