import { createClient, SupabaseClient, User, Session } from "@supabase/supabase-js";

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
    private authStateListeners: ((user: User | null) => void)[] = [];

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
            console.log('Auth state changed:', event);

            this.currentSession = session;
            this.currentUser = session?.user || null;

            if (this.currentUser) {
                await this.fetchUserProfile();

                // If this is a new sign-in with Google, request Google Drive scope
                if (event === 'SIGNED_IN' &&
                    this.currentUser.app_metadata?.provider === 'google') {
                    await this.requestGoogleDriveAccess();
                }
            } else {
                this.userProfile = null;
            }

            // Notify all listeners about auth state change
            this.authStateListeners.forEach(listener => listener(this.currentUser));
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
            }

            console.log('Session restored:', !!this.currentUser);
        } catch (error) {
            console.error('Error restoring session:', error);
        }
    }

    // Request Google Drive access if not already granted
    private async requestGoogleDriveAccess(): Promise<void> {
        if (!this.currentUser ||
            this.currentUser.app_metadata?.provider !== 'google' ||
            (this.userProfile?.google_drive_access_token &&
                this.userProfile?.google_drive_token_expiry &&
                this.userProfile.google_drive_token_expiry > Date.now())) {
            return;
        }

        try {
            // Re-authenticate with additional scopes if needed
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
            console.log(data)

            if (error) throw error;

            console.log('Requested Google Drive access');
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
            const updates: Partial<UserProfile> = {
                google_drive_access_token: accessToken,
                google_drive_refresh_token: refreshToken,
                google_drive_token_expiry: Date.now() + (expiresIn * 1000)
            };

            const { error } = await this.supabase
                .from('profiles')
                .update(updates)
                .eq('id', this.currentUser.id);

            if (error) throw error;

            // Update local profile data
            this.userProfile = { ...this.userProfile, ...updates } as UserProfile;
            return true;
        } catch (error) {
            console.error('Error storing Google Drive tokens:', error);
            return false;
        }
    }

    // Get Google Drive access token (refreshing if needed)
    public async getGoogleDriveAccessToken(): Promise<string | null> {
        if (!this.userProfile?.google_drive_access_token) return null;

        // Check if token is expired
        if (this.userProfile.google_drive_token_expiry &&
            this.userProfile.google_drive_token_expiry < Date.now() &&
            this.userProfile.google_drive_refresh_token) {

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
            const { error } = await this.supabase.auth.signOut();
            if (error) throw error;

            this.currentUser = null;
            this.currentSession = null;
            this.userProfile = null;

            return true;
        } catch (error) {
            console.error('Error signing out:', error);
            return false;
        }
    }

    // Refresh session
    public async refreshSession(): Promise<boolean> {
        try {
            if (!this.currentSession) return false;

            const { data, error } = await this.supabase.auth.refreshSession();

            if (error) throw error;

            this.currentSession = data.session;
            this.currentUser = data.user;

            return true;
        } catch (error) {
            console.error('Error refreshing session:', error);
            return false;
        }
    }

    // Add auth state listener
    public addAuthStateListener(listener: (user: User | null) => void): void {
        this.authStateListeners.push(listener);

        // Call immediately with current state
        listener(this.currentUser);
    }

    // Remove auth state listener
    public removeAuthStateListener(listener: (user: User | null) => void): void {
        this.authStateListeners = this.authStateListeners.filter(l => l !== listener);
    }

    // Get id token for API calls
    public async getIdToken(): Promise<string | null> {
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