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
        // this.initAuthListener();
        // this.restoreSession();
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
            this.currentSession = session;
            this.currentUser = session?.user || null;

            if (this.currentUser) {
                await this.fetchUserProfile();
            } else {
                this.userProfile = null;
            }

            // Notify all listeners about auth state change
            this.authStateListeners.forEach(listener => listener(this.currentUser));

            // Log auth events for debugging
            console.log('Auth event:', event);
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
        } catch (error) {
            console.error('Error restoring session:', error);
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
            provider: this.currentUser.app_metadata?.provider || 'google',
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
            const { error } = await this.supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: `${window.location.origin}/chat`,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent'
                    }
                }
            });
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error:', error);
            alert('Error signing in. Please try again.');
            return false;
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

    // Handle passwordless login (via email)
    public async signInWithEmail(email: string): Promise<boolean> {
        try {
            const { error } = await this.supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: `${window.location.origin}/chat`
                }
            });

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error signing in with email:', error);
            return false;
        }
    }

    // Handle token verification after email link click
    public async verifyOtp(email: string, token: string): Promise<boolean> {
        try {
            const { error } = await this.supabase.auth.verifyOtp({
                email,
                token,
                type: 'magiclink'
            });

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error verifying OTP:', error);
            return false;
        }
    }

    // Security method: Delete account
    public async deleteAccount(): Promise<boolean> {
        if (!this.currentUser) return false;

        try {
            // First delete profile data
            const { error: profileError } = await this.supabase
                .from('profiles')
                .delete()
                .eq('id', this.currentUser.id);

            if (profileError) throw profileError;

            // Then use admin function to delete user
            // This requires a server-side function as client can't delete users
            const { error } = await this.supabase.functions.invoke('delete-user', {
                body: { user_id: this.currentUser.id }
            });

            if (error) throw error;

            // Sign out after deletion
            await this.signOut();
            return true;
        } catch (error) {
            console.error('Error deleting account:', error);
            return false;
        }
    }
}